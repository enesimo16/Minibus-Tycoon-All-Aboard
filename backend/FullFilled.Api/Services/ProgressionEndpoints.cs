using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using FullFilled.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace FullFilled.Api.Services;

public static partial class ProgressionEndpoints
{
    private static readonly HashSet<string> Emblems = ["route", "wheel", "city", "star"];
    private static readonly HashSet<string> Strategies = ["service", "operations", "growth"];
    private static readonly HashSet<string> StarterBuses = ["hurda-mavi", "hurda-sari", "hurda-yesil"];
    private static readonly HashSet<string> Skills = ["loyal-passengers", "service-recovery", "preventive-care", "route-prep", "contract-choice", "fleet-planning"];
    private static readonly string[] BlockedWords = ["admin", "moderator", "fuck", "sik", "orospu"];

    public static void MapProgressionEndpoints(this WebApplication app)
    {
        app.MapGet("/api/progression/{playerId}", async (string playerId, FullFilledDbContext db, ProgressionService service, HttpContext context) =>
        {
            var auth = await AuthorizeAsync(playerId, db, context);
            return auth.Result ?? Results.Ok(await service.GetBootstrapAsync(playerId, context.RequestAborted));
        }).WithName("GetProgression");

        app.MapPost("/api/companies/{playerId}", CreateCompanyAsync).WithName("CreateCompany");
        app.MapPost("/api/progression/{playerId}/skills/{skillId}", UpgradeSkillAsync).WithName("UpgradeCompanySkill");
        app.MapPost("/api/progression/{playerId}/skills/reset", ResetSkillsAsync).WithName("ResetCompanySkills");
        app.MapPost("/api/progression/{playerId}/acknowledge-level", AcknowledgeLevelAsync).WithName("AcknowledgeLevel");
        app.MapPost("/api/shifts/{playerId}", SubmitShiftAsync).WithName("SubmitShiftResult");
    }

    // Faz 3: gün sonu vardiya sonucu. XP grade'den sunucuda hesaplanır; idempotency anahtarıyla
    // aynı vardiya iki kez ödül vermez (yenileme/çift sekme güvenli).
    private static async Task<IResult> SubmitShiftAsync(string playerId, SubmitShiftRequest request, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var auth = await AuthorizeAsync(playerId, db, context);
        if (auth.Result is not null) return auth.Result;

        if (string.IsNullOrWhiteSpace(request.IdempotencyKey) || request.IdempotencyKey.Length > 120)
            return Results.BadRequest(new { message = "Geçersiz idempotency anahtarı." });
        if (!EconomyConstants.IsValidGrade(request.Grade))
            return Results.BadRequest(new { message = "Geçersiz not." });

        var existing = await db.ShiftResults
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.PlayerId == playerId && item.IdempotencyKey == request.IdempotencyKey, context.RequestAborted);
        if (existing is not null)
            return Results.Ok(new SubmitShiftResponse(await service.GetBootstrapAsync(playerId, context.RequestAborted), 0, true));

        var now = DateTime.UtcNow;
        var xp = EconomyConstants.ShiftXpForGrade(request.Grade);
        db.ShiftResults.Add(new ShiftResult
        {
            Id = Guid.NewGuid().ToString(),
            PlayerId = playerId,
            IdempotencyKey = request.IdempotencyKey,
            GameDay = request.GameDay,
            Grade = request.Grade,
            Score = Math.Clamp(request.Score, 0m, 100m),
            MoneyEarned = Math.Max(0m, request.MoneyEarned),
            ExperienceEarned = xp,
            MetricsJson = string.IsNullOrWhiteSpace(request.MetricsJson) ? "{}" : request.MetricsJson!,
            CompletedAtUtc = now,
        });

        var progression = await service.EnsureAsync(playerId, context.RequestAborted);
        var previousLevel = progression.Level;
        progression.Experience = Math.Max(0, progression.Experience + xp);
        progression.Level = ProgressionService.CalculateLevel(progression.Experience);
        progression.SkillPoints += EconomyConstants.Progression.SkillPointLevels.Count(level => level > previousLevel && level <= progression.Level);
        progression.UpdatedAtUtc = now;

        try
        {
            await db.SaveChangesAsync(context.RequestAborted);
        }
        catch (DbUpdateException)
        {
            // Yarış: aynı anahtar başka bir istekte yazıldı. Bellekteki XP'yi geri al, çift ödül verme.
            await db.Entry(progression).ReloadAsync(context.RequestAborted);
            return Results.Ok(new SubmitShiftResponse(await service.GetBootstrapAsync(playerId, context.RequestAborted), 0, true));
        }

        return Results.Ok(new SubmitShiftResponse(await service.GetBootstrapAsync(playerId, context.RequestAborted), xp, false));
    }

    private static async Task<IResult> CreateCompanyAsync(string playerId, CreateCompanyRequest request, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var auth = await AuthorizeAsync(playerId, db, context);
        if (auth.Result is not null) return auth.Result;
        var existing = await db.Companies.FirstOrDefaultAsync(item => item.PlayerId == playerId);
        if (existing is not null) return Results.Ok(await service.GetBootstrapAsync(playerId, context.RequestAborted));

        var name = Regex.Replace((request.Name ?? string.Empty).Trim(), @"\s+", " ");
        var normalizedName = name.ToLowerInvariant();
        if (name.Length is < 3 or > 28 || !CompanyNamePattern().IsMatch(name) || BlockedWords.Any(normalizedName.Contains))
            return Results.BadRequest(new { message = "Şirket adı 3-28 karakter olmalı ve uygun karakterler içermeli." });
        if (await db.Companies.AnyAsync(item => item.NormalizedName == normalizedName))
            return Results.Conflict(new { message = "Bu şirket adı daha önce alınmış." });
        if (!Emblems.Contains(request.EmblemId) || !Strategies.Contains(request.Strategy) || !StarterBuses.Contains(request.StarterBusId))
            return Results.BadRequest(new { message = "Şirket seçimi geçersiz." });
        var primaryColor = request.PrimaryColor ?? string.Empty;
        var secondaryColor = request.SecondaryColor ?? string.Empty;
        if (!ColorPattern().IsMatch(primaryColor) || !ColorPattern().IsMatch(secondaryColor))
            return Results.BadRequest(new { message = "Şirket renkleri geçersiz." });

        var now = DateTime.UtcNow;
        var company = new Company
        {
            Id = Guid.NewGuid().ToString(), PlayerId = playerId, Name = name, NormalizedName = normalizedName,
            EmblemId = request.EmblemId, PrimaryColor = primaryColor, SecondaryColor = secondaryColor,
            Strategy = request.Strategy, StarterBusId = request.StarterBusId, CreatedAtUtc = now, UpdatedAtUtc = now,
        };
        db.Companies.Add(company);
        auth.Save!.OwnedBusIdsJson = JsonSerializer.Serialize(new[] { request.StarterBusId });
        auth.Save.ActiveBusId = request.StarterBusId;
        await service.AwardMilestonesAsync(playerId, ["company_created"], now, context.RequestAborted);
        // Funnel olayi oyuncu basina tekildir (UNIQUE PlayerId+IdempotencyKey). Kayit zaten
        // varsa tekrar eklemek istegin TAMAMINI 500 ile dusururdu — sirket kurmak analitik
        // kaydina bagimli olmamali, bu yuzden once varliga bakilir.
        var companyEventKey = $"company_created:{playerId}";
        if (!await db.GameplayEvents.AnyAsync(
                item => item.PlayerId == playerId && item.IdempotencyKey == companyEventKey,
                context.RequestAborted))
        {
            db.GameplayEvents.Add(new GameplayEvent
            {
                PlayerId = playerId, CompanyId = company.Id, IdempotencyKey = companyEventKey,
                Type = "company_created", Category = "funnel", DataJson = JsonSerializer.Serialize(new { strategy = request.Strategy, starterBusId = request.StarterBusId }),
                ClientBuild = "server", DeviceClass = "unknown", Locale = "tr", PlayerLevel = 1, ClientAtUtc = now, CreatedAtUtc = now,
            });
        }
        await db.SaveChangesAsync(context.RequestAborted);
        return Results.Created($"/api/progression/{playerId}", await service.GetBootstrapAsync(playerId, context.RequestAborted));
    }

    private static async Task<IResult> UpgradeSkillAsync(string playerId, string skillId, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var auth = await AuthorizeAsync(playerId, db, context);
        if (auth.Result is not null) return auth.Result;
        if (!Skills.Contains(skillId)) return Results.BadRequest(new { message = "Yetenek bulunamadı." });
        var company = await db.Companies.FirstOrDefaultAsync(item => item.PlayerId == playerId);
        if (company is null) return Results.BadRequest(new { message = "Önce şirketini kurmalısın." });
        var progression = await service.EnsureAsync(playerId, context.RequestAborted);
        var skills = ProgressionService.ParseSkills(company.SkillsJson);
        var current = skills.GetValueOrDefault(skillId);
        if (current >= 3) return Results.BadRequest(new { message = "Bu yetenek zaten en üst seviyede." });
        if (progression.SkillPoints <= 0) return Results.BadRequest(new { message = "Kullanılabilir yetenek puanın yok." });
        skills[skillId] = current + 1;
        progression.SkillPoints--;
        progression.UpdatedAtUtc = company.UpdatedAtUtc = DateTime.UtcNow;
        company.SkillsJson = JsonSerializer.Serialize(skills);
        await db.SaveChangesAsync(context.RequestAborted);
        return Results.Ok(await service.GetBootstrapAsync(playerId, context.RequestAborted));
    }

    private static async Task<IResult> ResetSkillsAsync(string playerId, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var auth = await AuthorizeAsync(playerId, db, context);
        if (auth.Result is not null) return auth.Result;
        var company = await db.Companies.FirstOrDefaultAsync(item => item.PlayerId == playerId);
        if (company is null) return Results.BadRequest(new { message = "Önce şirketini kurmalısın." });
        var progression = await service.EnsureAsync(playerId, context.RequestAborted);
        progression.SkillPoints += ProgressionService.ParseSkills(company.SkillsJson).Values.Sum();
        company.SkillsJson = "{}";
        progression.UpdatedAtUtc = company.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(context.RequestAborted);
        return Results.Ok(await service.GetBootstrapAsync(playerId, context.RequestAborted));
    }

    private static async Task<IResult> AcknowledgeLevelAsync(string playerId, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var auth = await AuthorizeAsync(playerId, db, context);
        if (auth.Result is not null) return auth.Result;
        var progression = await service.EnsureAsync(playerId, context.RequestAborted);
        progression.LastAcknowledgedLevel = progression.Level;
        progression.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(context.RequestAborted);
        return Results.Ok(await service.GetBootstrapAsync(playerId, context.RequestAborted));
    }

    private static async Task<(GameSave? Save, IResult? Result)> AuthorizeAsync(string playerId, FullFilledDbContext db, HttpContext context)
    {
        var save = await db.GameSaves.FindAsync(playerId);
        if (save is null) return (null, Results.NotFound());
        var token = context.Request.Headers["X-FullFilled-Auth"].ToString();
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(save.AuthTokenHash) || !PasswordHasher.Verify(token, save.AuthTokenHash))
            return (null, Results.Json(new { message = "Oturum geçersiz. Tekrar giriş yap." }, statusCode: 401));
        return (save, null);
    }

    [GeneratedRegex(@"^[\p{L}\p{N} '\-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex CompanyNamePattern();
    [GeneratedRegex("^#[0-9a-fA-F]{6}$", RegexOptions.CultureInvariant)]
    private static partial Regex ColorPattern();
}
