namespace FullFilled.Api.Models;

public class PlayerAchievement
{
    public string PlayerId { get; set; } = string.Empty;
    public string AchievementId { get; set; } = string.Empty;
    public int Progress { get; set; }
    public DateTime? UnlockedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
