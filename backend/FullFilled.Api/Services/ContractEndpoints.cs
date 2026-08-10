using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using FullFilled.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Services;

// Faz 4 — kontrat motoru. Rastgele "üç günlük görev" sistemi kaldırıldı; kontrat teklifi
// üretimi ve ilerleme takibi istemcide (contracts.ts) yapılır, ama XP/itibar ödülü burada
// tek otoritedir. `ContractRuns` tablosu (Faz 0) idempotency anahtarıyla çift ödülü engeller.
public static class ContractEndpoints
{
    private static readonly HashSet<string> Outcomes = ["completed", "failed", "abandoned"];

    public static void MapContractEndpoints(this WebApplication app)
    {
        app.MapPost("/api/contracts/{playerId}/resolve", ResolveContractAsync).WithName("ResolveContract");
    }

    private static async Task<IResult> ResolveContractAsync(string playerId, ResolveContractRequest request, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var save = await db.GameSaves.FindAsync([playerId], context.RequestAborted);
        if (save is null) return Results.NotFound();
        var token = context.Request.Headers["X-FullFilled-Auth"].ToString();
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(save.AuthTokenHash) || !PasswordHasher.Verify(token, save.AuthTokenHash))
            return Results.Json(new { message = "Oturum geçersiz. Tekrar giriş yap." }, statusCode: 401);

        if (string.IsNullOrWhiteSpace(request.IdempotencyKey) || request.IdempotencyKey.Length > 120)
            return Results.BadRequest(new { message = "Geçersiz idempotency anahtarı." });
        if (!Outcomes.Contains(request.Outcome))
            return Results.BadRequest(new { message = "Geçersiz kontrat sonucu." });

        var family = EconomyConstants.ContractFamily(request.FamilyId);
        if (family is null) return Results.BadRequest(new { message = "Kontrat şablonu bulunamadı." });
        var bonusIds = (request.BonusIds ?? []).Distinct().ToList();
        if (!EconomyConstants.IsValidContractBonusSelection(family, bonusIds))
            return Results.BadRequest(new { message = "Geçersiz kontrat bonusu." });

        var existing = await db.ContractRuns
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.PlayerId == playerId && item.IdempotencyKey == request.IdempotencyKey, context.RequestAborted);
        if (existing is not null)
            return Results.Ok(new ResolveContractResponse(await service.GetBootstrapAsync(playerId, context.RequestAborted), 0, 0, true));

        var progression = await service.EnsureAsync(playerId, context.RequestAborted);
        var company = await db.Companies.FirstOrDefaultAsync(item => item.PlayerId == playerId, context.RequestAborted);
        var success = request.Outcome == "completed";
        var (xp, reputation) = EconomyConstants.ContractReward(request.FamilyId, bonusIds, progression.Level, success);

        var now = DateTime.UtcNow;
        db.ContractRuns.Add(new ContractRun
        {
            Id = Guid.NewGuid().ToString(),
            PlayerId = playerId,
            ContractId = request.ContractId,
            IdempotencyKey = request.IdempotencyKey,
            Status = request.Outcome,
            ProgressJson = string.IsNullOrWhiteSpace(request.MetricsJson) ? "{}" : request.MetricsJson!,
            StartedAtUtc = now,
            CompletedAtUtc = now,
        });

        var previousLevel = progression.Level;
        if (xp > 0)
        {
            progression.Experience = Math.Max(0, progression.Experience + xp);
            progression.Level = ProgressionService.CalculateLevel(progression.Experience);
            progression.SkillPoints += EconomyConstants.Progression.SkillPointLevels.Count(level => level > previousLevel && level <= progression.Level);
            progression.UpdatedAtUtc = now;
        }
        if (reputation != 0 && company is not null)
        {
            company.Reputation = Math.Max(0, company.Reputation + reputation);
            company.UpdatedAtUtc = now;
        }

        try
        {
            await db.SaveChangesAsync(context.RequestAborted);
        }
        catch (DbUpdateException)
        {
            // Yarış: aynı anahtar başka bir istekte yazıldı. Bellekteki değişikliği geri al, çift ödül verme.
            await db.Entry(progression).ReloadAsync(context.RequestAborted);
            return Results.Ok(new ResolveContractResponse(await service.GetBootstrapAsync(playerId, context.RequestAborted), 0, 0, true));
        }

        return Results.Ok(new ResolveContractResponse(await service.GetBootstrapAsync(playerId, context.RequestAborted), xp, reputation, false));
    }
}
