using FullFilled.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Services;

public static class AdminAccess
{
    public static async Task<bool> IsAuthorizedAsync(
        HttpContext context,
        IConfiguration configuration,
        FullFilledDbContext db,
        CancellationToken cancellationToken = default)
    {
        var token = ReadAuthToken(context);
        var configuredUsername = Environment.GetEnvironmentVariable("FULLFILLED_ADMIN_USERNAME")
            ?? configuration["Admin:Username"];
        var normalizedUsername = configuredUsername?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(normalizedUsername)) return false;

        // Yetki yalnızca env'deki kullanıcı adı ile veritabanındaki gerçek, oturum açmış hesap
        // aynıysa verilir. İstemcideki kullanıcı adı veya ayrı bir anahtar bu kontrolü atlayamaz.
        var adminAccount = await db.GameSaves.AsNoTracking()
            .Where(save => save.Username == normalizedUsername)
            .Select(save => new { save.AuthTokenHash })
            .SingleOrDefaultAsync(cancellationToken);

        return adminAccount is not null &&
               !string.IsNullOrWhiteSpace(adminAccount.AuthTokenHash) &&
               PasswordHasher.Verify(token, adminAccount.AuthTokenHash);
    }

    private static string? ReadAuthToken(HttpContext context)
    {
        var headerToken = context.Request.Headers["X-FullFilled-Auth"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(headerToken)) return headerToken;

        var authorization = context.Request.Headers.Authorization.ToString();
        return authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization["Bearer ".Length..].Trim()
            : null;
    }
}
