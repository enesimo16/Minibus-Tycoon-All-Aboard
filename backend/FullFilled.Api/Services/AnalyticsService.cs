using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using FullFilled.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Services;

public sealed class AnalyticsService(FullFilledDbContext db)
{
    private sealed record ActivitySession(string PlayerId, DateTime StartedAtUtc);
    private static readonly string[] FunnelOrder =
    [
        "account_created", "company_created", "tutorial_step", "first_drive", "first_stop_completed",
        "first_upgrade", "first_contract_started", "first_contract_completed", "first_driver_hired",
        "first_bus_bought", "first_route_unlocked",
    ];
    private static readonly string[] CriticalEventTypes =
    [
        "js_error", "licence_penalty", "game_reset", "day_started", "day_completed",
        "upgrade_purchased", "driver_hired", "fleet_bus_purchased", "catalog_bus_purchased",
        "route_unlocked", "terminal_upgrade_purchased", "event_viewed", "event_prepared",
        "contract_completed", "contract_failed",
    ];

    public async Task<AnalyticsOverviewResponse> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var since30 = now.AddDays(-30);
        var sessions = await db.GameSessions.AsNoTracking()
            .Where(item => item.StartedAtUtc >= since30)
            .ToListAsync(cancellationToken);
        var events = await db.GameplayEvents.AsNoTracking()
            .Where(item => item.CreatedAtUtc >= since30)
            .ToListAsync(cancellationToken);
        var progressions = await db.PlayerProgression.AsNoTracking().ToListAsync(cancellationToken);
        var saves = await db.GameSaves.AsNoTracking().ToListAsync(cancellationToken);
        var companyCount = await db.Companies.AsNoTracking().CountAsync(cancellationToken);

        var durations = sessions
            .Select(item => EffectiveDuration(item, now))
            .Where(value => value >= 0)
            .OrderBy(value => value)
            .ToList();
        var sessionMetrics = new SessionMetrics(
            durations.Count,
            durations.Count == 0 ? 0 : (int)Math.Round(durations.Average()),
            Percentile(durations, 0.5),
            Percentile(durations, 0.9));

        var allCohortSessions = await db.GameSessions.AsNoTracking()
            .Where(item => item.StartedAtUtc >= now.AddDays(-90))
            .Select(item => new ActivitySession(item.PlayerId, item.StartedAtUtc))
            .ToListAsync(cancellationToken);
        var retention = new RetentionMetrics(
            CalculateRetention(progressions, allCohortSessions, now, 1),
            CalculateRetention(progressions, allCohortSessions, now, 7),
            CalculateRetention(progressions, allCohortSessions, now, 30));

        var funnel = FunnelOrder
            .Select(type => new NamedCount(type, events.Where(item => item.Type == type).Select(item => item.PlayerId).Distinct().Count()))
            .ToList();
        var levels = progressions
            .GroupBy(item => item.Level)
            .OrderBy(group => group.Key)
            .Select(group => new LevelCount(group.Key, group.Count()))
            .ToList();
        var currency = events
            .Where(item => item.Category == "economy" && item.Amount.HasValue)
            .GroupBy(item => new { item.Type, Source = item.Source ?? "unknown" })
            .OrderByDescending(group => group.Sum(item => item.Amount ?? 0))
            .Select(group => new CurrencyMetric(group.Key.Type, group.Key.Source, group.Sum(item => item.Amount ?? 0), group.Count()))
            .ToList();
        var fpsValues = events.Where(item => item.Type == "fps_sample" && item.NumericValue.HasValue).Select(item => item.NumericValue!.Value).ToList();
        var fpsBuckets = new List<NamedCount>
        {
            new("0-29", fpsValues.Count(value => value < 30)),
            new("30-44", fpsValues.Count(value => value >= 30 && value < 45)),
            new("45-59", fpsValues.Count(value => value >= 45 && value < 60)),
            new("60+", fpsValues.Count(value => value >= 60)),
        };
        var criticalEvents = CriticalEventTypes
            .Select(type => new CriticalEventMetric(
                type,
                events.Count(item => item.Type == type),
                events.Where(item => item.Type == type).Select(item => item.PlayerId).Distinct().Count()))
            .Where(item => item.Events > 0)
            .ToList();
        var playerState = new PlayerStateMetrics(
            saves.Count,
            companyCount,
            AverageOrZero(saves.Select(item => (decimal)item.Satisfaction)),
            AverageOrZero(saves.Select(item => item.Money)),
            AverageOrZero(saves.Select(item => (decimal)item.GameDay)),
            saves.Count(HasAssignedDriver),
            saves.Sum(item => CountJsonArray(item.OwnedBusIdsJson) + CountJsonArray(item.OwnedBusesJson)),
            saves.Sum(item => CountJsonArray(item.UnlockedRoutesJson)),
            saves.Sum(item => CountJsonArray(item.TerminalUpgradesJson)),
            saves.Count(item => item.LicencePoints > 0),
            saves.Count(item => item.VehicleLockSecondsLeft > 0));

        return new AnalyticsOverviewResponse(
            now,
            new ActivityMetrics(
                ActivePlayers(sessions, now.AddDays(-1)),
                ActivePlayers(sessions, now.AddDays(-7)),
                ActivePlayers(sessions, now.AddDays(-30))),
            retention,
            sessionMetrics,
            funnel,
            levels,
            currency,
            new PerformanceMetrics(fpsBuckets, events.Count(item => item.Type == "js_error")),
            playerState,
            criticalEvents);
    }

    public async Task<AnalyticsPlayerResponse?> GetPlayerAsync(string playerId, CancellationToken cancellationToken = default)
    {
        var save = await db.GameSaves.AsNoTracking().FirstOrDefaultAsync(item => item.PlayerId == playerId, cancellationToken);
        if (save is null) return null;
        var progression = await db.PlayerProgression.AsNoTracking().FirstOrDefaultAsync(item => item.PlayerId == playerId, cancellationToken);
        var company = await db.Companies.AsNoTracking().FirstOrDefaultAsync(item => item.PlayerId == playerId, cancellationToken);
        var sessions = await db.GameSessions.AsNoTracking()
            .Where(item => item.PlayerId == playerId)
            .OrderByDescending(item => item.StartedAtUtc)
            .Take(20)
            .Select(item => new PlayerSessionDto(item.Id, item.DeviceClass, item.Locale, item.ClientBuild,
                item.StartedAtUtc, item.EndedAtUtc, item.DurationSeconds))
            .ToListAsync(cancellationToken);
        var events = await db.GameplayEvents.AsNoTracking()
            .Where(item => item.PlayerId == playerId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .Take(100)
            .Select(item => new PlayerEventDto(item.Id, item.Type, item.Category, item.DataJson, item.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new AnalyticsPlayerResponse(
            save.PlayerId,
            save.Username,
            company?.Name,
            progression?.Level ?? 1,
            progression?.Experience ?? 0,
            save.Money,
            save.GameDay,
            save.SavedAtUtc,
            sessions,
            events);
    }

    private static int ActivePlayers(IEnumerable<GameSession> sessions, DateTime since)
        => sessions.Where(item => item.LastSeenAtUtc >= since).Select(item => item.PlayerId).Distinct().Count();

    private static int EffectiveDuration(GameSession session, DateTime now)
    {
        var end = session.EndedAtUtc ?? session.LastSeenAtUtc;
        if (end > now) end = now;
        return Math.Max(session.DurationSeconds, Math.Max(0, (int)(end - session.StartedAtUtc).TotalSeconds));
    }

    private static int Percentile(IReadOnlyList<int> sorted, double percentile)
    {
        if (sorted.Count == 0) return 0;
        var index = (int)Math.Ceiling(percentile * sorted.Count) - 1;
        return sorted[Math.Clamp(index, 0, sorted.Count - 1)];
    }

    private static decimal AverageOrZero(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        return list.Count == 0 ? 0 : Math.Round(list.Average(), 1);
    }

    private static int CountJsonArray(string json)
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(json)?.Count ?? 0;
        }
        catch (System.Text.Json.JsonException)
        {
            return 0;
        }
    }

    private static bool HasAssignedDriver(GameSave save)
    {
        if (!string.IsNullOrWhiteSpace(save.HiredDriverId)) return true;
        try
        {
            var assignments = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string?>>>(save.DriverAssignmentsJson);
            return assignments?.Values.Any(shifts => shifts.Values.Any(driverId => !string.IsNullOrWhiteSpace(driverId))) == true;
        }
        catch (System.Text.Json.JsonException)
        {
            return false;
        }
    }

    private static decimal CalculateRetention(
        IEnumerable<PlayerProgression> progressions,
        IEnumerable<ActivitySession> sessions,
        DateTime now,
        int day)
    {
        var eligible = progressions.Where(item => item.CreatedAtUtc.Date <= now.Date.AddDays(-day)).ToList();
        if (eligible.Count == 0) return 0;
        var sessionList = sessions.ToList();
        var retained = eligible.Count(player => sessionList.Any(session =>
            session.PlayerId == player.PlayerId && session.StartedAtUtc.Date == player.CreatedAtUtc.Date.AddDays(day)));
        return Math.Round(retained * 100m / eligible.Count, 1);
    }
}
