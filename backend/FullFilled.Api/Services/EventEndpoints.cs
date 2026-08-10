using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Services;

// Faz 7 — canlı şehir event yönetmeni. Günlük olay tamamen sunucuda (playerId, gameDay)
// çiftinden deterministik üretilir; istemci ne kadar erken/çok isterse aynı sonucu alır,
// böylece "oyuncu başlamadan hazırlık sinyali görür" bitiş kriteri (Gün Başlat ekranı bu
// uca gündüz açılmadan önce sorar) taklit edilemeden karşılanır.
public static class EventEndpoints
{
    public static void MapEventEndpoints(this WebApplication app)
    {
        app.MapGet("/api/events/{playerId}/today", GetTodayEventAsync).WithName("GetTodayCityEvent");
    }

    private static async Task<IResult> GetTodayEventAsync(string playerId, int gameDay, FullFilledDbContext db, ProgressionService service, HttpContext context)
    {
        var save = await db.GameSaves.FindAsync([playerId], context.RequestAborted);
        if (save is null) return Results.NotFound();
        var token = context.Request.Headers["X-FullFilled-Auth"].ToString();
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(save.AuthTokenHash) || !PasswordHasher.Verify(token, save.AuthTokenHash))
            return Results.Json(new { message = "Oturum geçersiz. Tekrar giriş yap." }, statusCode: 401);
        if (gameDay < 1) return Results.BadRequest(new { message = "Geçersiz oyun günü." });

        var progression = await service.EnsureAsync(playerId, context.RequestAborted);
        var (primary, affectedRouteId, secondary) = EconomyConstants.GenerateDailyEvent(playerId, gameDay, progression.Level);

        return Results.Ok(new DailyEventDto(
            ToDto(primary),
            affectedRouteId,
            secondary is null ? null : ToDto(secondary),
            EconomyConstants.CityEvents.CounterEffectRatio));
    }

    private static CityEventTemplateDto ToDto(DailyEventTemplateConfig template) =>
        new(template.Id, template.Severity, template.DemandDelta, template.RiskDelta, template.FareDelta, template.SatisfactionDrift, template.CounterCost);
}
