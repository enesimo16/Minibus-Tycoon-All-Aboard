namespace FullFilled.Api.Dtos;

// Login akışı: kullanıcı adı yoksa otomatik kayıt, varsa şifre doğrulaması.
// Bkz. docs/game-design/07-hesap-giris.md.

public record LoginRequest(string Username, string Password);

public record LoginResponse(string PlayerId, string Username, bool IsNewAccount, string AuthToken);
