namespace FullFilled.Api.Models;

public class PlayerProgression
{
    public string PlayerId { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public int Experience { get; set; }
    public int SkillPoints { get; set; }
    public int LastAcknowledgedLevel { get; set; } = 1;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
