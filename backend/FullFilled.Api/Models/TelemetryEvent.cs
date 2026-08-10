namespace FullFilled.Api.Models;

/// Oyun ici olay kaydi — denge analizi ve hata takibi icin (bkz. docs/game-design).
/// Istemci 20 saniyede bir toplu gonderir; her satir tek olaydir.
public class TelemetryEvent
{
    public long Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    /// Ornek: session_start, save, money_delta, police_caught, chance_play, tutorial_step, fps_sample, js_error
    public string Type { get; set; } = string.Empty;
    /// Olaya ozel serbest JSON govde. Sema yok — analiz sorgusu tarafinda cozulur.
    public string DataJson { get; set; } = "{}";
    /// Istemcinin kendi saati (guvenilmez, yalnizca sira/aralik analizi icin).
    public DateTime ClientAtUtc { get; set; }
    /// Sunucu saati — otorite budur.
    public DateTime CreatedAtUtc { get; set; }
}
