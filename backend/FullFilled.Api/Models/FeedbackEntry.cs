namespace FullFilled.Api.Models;

/// Oyuncunun oyun icinden gonderdigi geri bildirim.
/// Mail yerine bu tablo kullanilir; admin ucundan okunur.
public class FeedbackEntry
{
    public long Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public string? Username { get; set; }
    /// bug | idea | balance
    public string Category { get; set; } = "bug";
    public string Message { get; set; } = string.Empty;
    /// Gonderim anindaki oyun durumu (para, gun, hat, FPS, tarayici).
    public string ContextJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; }
}
