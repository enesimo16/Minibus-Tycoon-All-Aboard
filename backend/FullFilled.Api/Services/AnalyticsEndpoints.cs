using FullFilled.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Services;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/admin/analytics/overview", async (
            HttpContext context,
            IConfiguration configuration,
            FullFilledDbContext db,
            AnalyticsService analytics) =>
        {
            if (!await AdminAccess.IsAuthorizedAsync(context, configuration, db, context.RequestAborted)) return Unauthorized();
            return Results.Ok(await analytics.GetOverviewAsync(context.RequestAborted));
        }).WithName("GetAnalyticsOverview");

        endpoints.MapGet("/api/admin/analytics/players/{playerId}", async (
            string playerId,
            HttpContext context,
            IConfiguration configuration,
            FullFilledDbContext db,
            AnalyticsService analytics) =>
        {
            if (!await AdminAccess.IsAuthorizedAsync(context, configuration, db, context.RequestAborted)) return Unauthorized();
            var player = await analytics.GetPlayerAsync(playerId, context.RequestAborted);
            return player is null ? Results.NotFound() : Results.Ok(player);
        }).WithName("GetAnalyticsPlayer");

        endpoints.MapGet("/api/admin/analytics/schema", async (
            HttpContext context,
            IConfiguration configuration,
            FullFilledDbContext db) =>
        {
            if (!await AdminAccess.IsAuthorizedAsync(context, configuration, db, context.RequestAborted)) return Unauthorized();
            var versions = await db.Database.SqlQueryRaw<SchemaVersionRow>(
                    "SELECT Version, Name, AppliedAtUtc FROM SchemaMigrations ORDER BY Version")
                .ToListAsync(context.RequestAborted);
            return Results.Ok(new { current = SchemaVersions.CurrentDatabase, versions });
        }).WithName("GetAnalyticsSchema");

        return endpoints;
    }

    private static IResult Unauthorized() => Results.Json(new { message = "Yetkisiz." }, statusCode: 401);

    private sealed class SchemaVersionRow
    {
        public int Version { get; init; }
        public string Name { get; init; } = string.Empty;
        public DateTime AppliedAtUtc { get; init; }
    }
}
