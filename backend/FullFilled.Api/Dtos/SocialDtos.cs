namespace FullFilled.Api.Dtos;

// Aşama 5: link=şehir, misafir yolcu, korsan sefer (bkz. docs/game-design/06-sosyal-link-sekme.md).

public record CityPublicDto(
    string Username,
    decimal Money,
    int Satisfaction,
    bool HasDriver,
    bool HasCheckpoint,
    DateTime LastSeenUtc,
    // Firma kimligi + seviye herkese acik sehir sayfasinda rozet olarak gosterilir;
    // firma/ilerleme kaydi henuz olusmamis oyuncular icin null/varsayilan doner.
    string? CompanyName,
    string? EmblemId,
    string? PrimaryColor,
    int Level,
    int Experience
);

public record VisitorRequest(string ActorPlayerId, string? ActorUsername);

// Metin GÖMÜLMEZ: backend yalnızca bir i18n ANAHTARI döndürür, cümleyi frontend
// `t(messageKey, { amount })` ile kurar. Böylece TR/EN tek sözlükten yönetilir ve
// sunucu kaynak dosyasındaki kodlama sorunları oyuncuya hiç yansımaz.
public record RaidResultDto(bool Success, bool Caught, decimal Amount, string MessageKey);

public record TipResultDto(bool Success, decimal Amount, string MessageKey);

public record CityEventDto(string Type, string? ActorUsername, decimal Amount, DateTime CreatedAtUtc);

// Arkadas listesi: tek yonlu takip. Kart gorunumu icin firma kimligi + seviye birlikte doner.
public record FriendDto(
    string Username,
    string? CompanyName,
    string? EmblemId,
    string? PrimaryColor,
    int Level,
    int Satisfaction,
    DateTime LastSeenUtc
);

public record AddFriendRequest(string Username);
