namespace FullFilled.Api.Models;

public class GameplayEvent
{
    public long Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public int EventVersion { get; set; } = 1;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = "gameplay";
    public string DataJson { get; set; } = "{}";
    public string ClientBuild { get; set; } = "unknown";
    public string DeviceClass { get; set; } = "unknown";
    public string Locale { get; set; } = "tr";
    public int PlayerLevel { get; set; } = 1;
    public string? CompanyId { get; set; }
    public decimal? Amount { get; set; }
    public decimal? Balance { get; set; }
    public string? Source { get; set; }
    public string? ItemId { get; set; }
    public double? NumericValue { get; set; }
    public DateTime ClientAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
