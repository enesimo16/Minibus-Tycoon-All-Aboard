namespace FullFilled.Api.Models;

public class GameSession
{
    public string Id { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public string? CompanyId { get; set; }
    public string ClientBuild { get; set; } = "unknown";
    public string DeviceClass { get; set; } = "unknown";
    public string Locale { get; set; } = "tr";
    public int PlayerLevel { get; set; } = 1;
    public DateTime StartedAtUtc { get; set; }
    public DateTime LastSeenAtUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }
    public int DurationSeconds { get; set; }
}
