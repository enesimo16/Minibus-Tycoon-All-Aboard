namespace FullFilled.Api.Models;

public class ShiftResult
{
    public string Id { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public int GameDay { get; set; }
    public string Grade { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal MoneyEarned { get; set; }
    public int ExperienceEarned { get; set; }
    public string MetricsJson { get; set; } = "{}";
    public DateTime CompletedAtUtc { get; set; }
}
