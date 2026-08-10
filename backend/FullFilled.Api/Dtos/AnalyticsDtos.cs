namespace FullFilled.Api.Dtos;

public record ActivityMetrics(int DailyActiveUsers, int WeeklyActiveUsers, int MonthlyActiveUsers);
public record RetentionMetrics(decimal Day1, decimal Day7, decimal Day30);
public record SessionMetrics(int TotalSessions, int AverageSeconds, int MedianSeconds, int P90Seconds);
public record NamedCount(string Name, int Count);
public record LevelCount(int Level, int Players);
public record CurrencyMetric(string Type, string Source, decimal Amount, int Events);
public record PerformanceMetrics(List<NamedCount> FpsBuckets, int JavascriptErrors);
public record CriticalEventMetric(string Name, int Events, int Players);
public record PlayerStateMetrics(
    int TotalPlayers,
    int Companies,
    decimal AverageSatisfaction,
    decimal AverageMoney,
    decimal AverageGameDay,
    int PlayersWithDrivers,
    int OwnedVehicles,
    int UnlockedRoutes,
    int TerminalUpgrades,
    int PlayersWithLicencePoints,
    int LockedVehicles
);

public record AnalyticsOverviewResponse(
    DateTime GeneratedAtUtc,
    ActivityMetrics Activity,
    RetentionMetrics Retention,
    SessionMetrics Sessions,
    List<NamedCount> Funnel,
    List<LevelCount> LevelDistribution,
    List<CurrencyMetric> Currency,
    PerformanceMetrics Performance,
    PlayerStateMetrics PlayerState,
    List<CriticalEventMetric> CriticalEvents
);

public record PlayerSessionDto(
    string Id,
    string DeviceClass,
    string Locale,
    string ClientBuild,
    DateTime StartedAtUtc,
    DateTime? EndedAtUtc,
    int DurationSeconds
);

public record PlayerEventDto(
    long Id,
    string Type,
    string Category,
    string DataJson,
    DateTime CreatedAtUtc
);

public record AnalyticsPlayerResponse(
    string PlayerId,
    string? Username,
    string? CompanyName,
    int Level,
    int Experience,
    decimal Money,
    int GameDay,
    DateTime LastSavedAtUtc,
    List<PlayerSessionDto> Sessions,
    List<PlayerEventDto> RecentEvents
);
