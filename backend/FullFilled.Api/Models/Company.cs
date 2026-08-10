namespace FullFilled.Api.Models;

public class Company
{
    public string Id { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public string EmblemId { get; set; } = "route";
    public string PrimaryColor { get; set; } = "#153448";
    public string SecondaryColor { get; set; } = "#f4ead5";
    public string Strategy { get; set; } = "service";
    public string StarterBusId { get; set; } = "hurda-mavi";
    public int Reputation { get; set; }
    public string SkillsJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
