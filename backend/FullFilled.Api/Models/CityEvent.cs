namespace FullFilled.Api.Models;

// Aşama 5: bir oyuncunun şehrine gelen ziyaretçi olayları (bahşiş, korsan sefer, misilleme).
// Host, kendi şehrine dönünce "Kemal dün 38 yolcunu çaldı" tarzı bir günlük görür.
public class CityEvent
{
    public int Id { get; set; }
    public string HostPlayerId { get; set; } = "";
    public string ActorPlayerId { get; set; } = "";
    public string? ActorUsername { get; set; }
    /// "tip" | "raid" | "raid-caught"
    public string Type { get; set; } = "";
    public decimal Amount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
