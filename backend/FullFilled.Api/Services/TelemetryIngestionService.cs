using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using FullFilled.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace FullFilled.Api.Services;

public sealed class TelemetryIngestionService(FullFilledDbContext db, ProgressionService progressionService)
{
    private const int MaxEventsPerRequest = 100;
    private const int MaxDataLength = 4000;
    private const int MaxContextLength = 80;
    private static readonly Regex EventTypePattern = new("^[a-z0-9_]{2,64}$", RegexOptions.Compiled);
    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "passwordHash", "token", "authToken", "authorization", "cookie", "secret", "ip", "ipAddress",
    };

    public async Task<TelemetryBatchResponse> IngestAsync(
        GameSave save,
        TelemetryBatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var sessionId = NormalizeSessionId(request.SessionId);
        var clientBuild = CleanContext(request.ClientBuild, "unknown");
        var deviceClass = NormalizeDeviceClass(request.DeviceClass);
        var locale = request.Locale is "en" ? "en" : "tr";
        var progression = await db.PlayerProgression.FindAsync([save.PlayerId], cancellationToken);
        var level = Math.Max(1, progression?.Level ?? request.PlayerLevel ?? 1);
        var companyId = await ResolveCompanyIdAsync(save.PlayerId, request.CompanyId, cancellationToken);

        if (sessionId is not null)
        {
            await UpsertSessionAsync(sessionId, save.PlayerId, companyId, clientBuild, deviceClass, locale, level, now, cancellationToken);
        }

        var candidates = request.Events
            .Where(item => EventTypePattern.IsMatch(item.Type ?? string.Empty))
            .Take(MaxEventsPerRequest)
            .Select(item => CreateEvent(save.PlayerId, sessionId, companyId, clientBuild, deviceClass, locale, level, item, now))
            .ToList();

        if (candidates.Count == 0) return new TelemetryBatchResponse(0, 0, sessionId, await progressionService.GetBootstrapAsync(save.PlayerId, cancellationToken));

        var keys = candidates.Select(item => item.IdempotencyKey).Distinct().ToList();
        var existingKeys = await db.GameplayEvents
            .Where(item => item.PlayerId == save.PlayerId && keys.Contains(item.IdempotencyKey))
            .Select(item => item.IdempotencyKey)
            .ToHashSetAsync(cancellationToken);
        var accepted = candidates
            .GroupBy(item => item.IdempotencyKey)
            .Select(group => group.First())
            .Where(item => !existingKeys.Contains(item.IdempotencyKey))
            .ToList();

        if (accepted.Count > 0)
        {
            db.GameplayEvents.AddRange(accepted);
            await progressionService.AwardMilestonesAsync(save.PlayerId, accepted.Select(item => item.Type), now, cancellationToken);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                // Two tabs can flush the same persisted queue at the same moment. The unique
                // index is authoritative; detach the failed batch and retry only truly missing rows.
                foreach (var entry in db.ChangeTracker.Entries().Where(entry => entry.State == EntityState.Added))
                {
                    entry.State = EntityState.Detached;
                }
                var existingAfterRace = await db.GameplayEvents
                    .Where(item => item.PlayerId == save.PlayerId && keys.Contains(item.IdempotencyKey))
                    .Select(item => item.IdempotencyKey)
                    .ToHashSetAsync(cancellationToken);
                accepted = accepted.Where(item => !existingAfterRace.Contains(item.IdempotencyKey)).ToList();
                if (accepted.Count > 0)
                {
                    db.GameplayEvents.AddRange(accepted);
                    await progressionService.AwardMilestonesAsync(save.PlayerId, accepted.Select(item => item.Type), now, cancellationToken);
                    await db.SaveChangesAsync(cancellationToken);
                }
            }
        }

        if (sessionId is not null && accepted.Any(item => item.Type == "session_ended"))
        {
            var session = await db.GameSessions.FindAsync([sessionId], cancellationToken);
            if (session is not null)
            {
                session.EndedAtUtc = now;
                session.LastSeenAtUtc = now;
                session.DurationSeconds = Math.Max(0, (int)(now - session.StartedAtUtc).TotalSeconds);
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        return new TelemetryBatchResponse(
            accepted.Count,
            candidates.Count - accepted.Count,
            sessionId,
            await progressionService.GetBootstrapAsync(save.PlayerId, cancellationToken));
    }

    private async Task UpsertSessionAsync(
        string sessionId,
        string playerId,
        string? companyId,
        string clientBuild,
        string deviceClass,
        string locale,
        int level,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var session = await db.GameSessions.FindAsync([sessionId], cancellationToken);
        if (session is null)
        {
            db.GameSessions.Add(new GameSession
            {
                Id = sessionId,
                PlayerId = playerId,
                CompanyId = companyId,
                ClientBuild = clientBuild,
                DeviceClass = deviceClass,
                Locale = locale,
                PlayerLevel = level,
                StartedAtUtc = now,
                LastSeenAtUtc = now,
            });
            return;
        }

        if (session.PlayerId != playerId) return;
        session.LastSeenAtUtc = now;
        session.DurationSeconds = Math.Max(session.DurationSeconds, (int)(now - session.StartedAtUtc).TotalSeconds);
        session.PlayerLevel = level;
        session.CompanyId = companyId;
    }

    private async Task<string?> ResolveCompanyIdAsync(string playerId, string? requestedCompanyId, CancellationToken cancellationToken)
    {
        var company = await db.Companies.AsNoTracking().FirstOrDefaultAsync(item => item.PlayerId == playerId, cancellationToken);
        if (company is null) return null;
        return string.IsNullOrWhiteSpace(requestedCompanyId) || company.Id == requestedCompanyId ? company.Id : null;
    }

    private static GameplayEvent CreateEvent(
        string playerId,
        string? sessionId,
        string? companyId,
        string clientBuild,
        string deviceClass,
        string locale,
        int level,
        TelemetryEventDto dto,
        DateTime now)
    {
        var data = SanitizeData(dto.DataJson);
        var clientAtUtc = dto.ClientAtUtc == default || dto.ClientAtUtc < now.AddDays(-7) || dto.ClientAtUtc > now.AddMinutes(10)
            ? now
            : dto.ClientAtUtc.ToUniversalTime();
        var idempotencyKey = NormalizeEventId(dto.EventId) ?? CreateDeterministicEventId(playerId, dto.Type, clientAtUtc, data);
        var node = JsonNode.Parse(data) as JsonObject;

        return new GameplayEvent
        {
            PlayerId = playerId,
            SessionId = sessionId,
            IdempotencyKey = idempotencyKey,
            EventVersion = Math.Clamp(dto.EventVersion, 1, 10),
            Type = dto.Type,
            Category = CategoryFor(dto.Type),
            DataJson = data,
            ClientBuild = clientBuild,
            DeviceClass = deviceClass,
            Locale = locale,
            PlayerLevel = level,
            CompanyId = companyId,
            Amount = ReadDecimal(node, "amount"),
            Balance = ReadDecimal(node, "balance"),
            Source = ReadText(node, "source"),
            ItemId = ReadText(node, "itemId"),
            NumericValue = ReadDouble(node, dto.Type == "fps_sample" ? "fps" : "value"),
            ClientAtUtc = clientAtUtc,
            CreatedAtUtc = now,
        };
    }

    private static string SanitizeData(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "{}";
        try
        {
            var node = JsonNode.Parse(raw);
            RemoveSensitiveData(node);
            var serialized = node?.ToJsonString(new JsonSerializerOptions { WriteIndented = false }) ?? "{}";
            if (serialized.Length <= MaxDataLength) return serialized;
            return JsonSerializer.Serialize(new { truncated = true, originalLength = serialized.Length });
        }
        catch (JsonException)
        {
            return "{}";
        }
    }

    private static void RemoveSensitiveData(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            foreach (var property in obj.ToList())
            {
                if (SensitiveKeys.Contains(property.Key)) obj.Remove(property.Key);
                else RemoveSensitiveData(property.Value);
            }
        }
        else if (node is JsonArray array)
        {
            foreach (var child in array) RemoveSensitiveData(child);
        }
    }

    private static string CategoryFor(string type) => type switch
    {
        "account_created" or "company_created" or "tutorial_step" or "first_drive" or
        "first_stop_completed" or "first_upgrade" or "first_contract_started" or
        "first_contract_completed" or "first_driver_hired" or "first_bus_bought" or
        "first_route_unlocked" or "session_started" or "session_ended" => "funnel",
        "currency_earned" or "currency_spent" => "economy",
        "fps_sample" => "performance",
        "js_error" => "error",
        _ => "gameplay",
    };

    private static string? NormalizeSessionId(string? value) => NormalizeIdentifier(value, 64);
    private static string? NormalizeEventId(string? value) => NormalizeIdentifier(value, 96);

    private static string? NormalizeIdentifier(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.Length > maxLength) return null;
        return trimmed.All(character => char.IsLetterOrDigit(character) || character is '-' or '_' or ':') ? trimmed : null;
    }

    private static string CleanContext(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? fallback : trimmed[..Math.Min(trimmed.Length, MaxContextLength)];
    }

    private static string NormalizeDeviceClass(string? value) => value is "mobile" or "tablet" or "desktop" ? value : "unknown";

    private static string CreateDeterministicEventId(string playerId, string type, DateTime clientAtUtc, string data)
    {
        var input = Encoding.UTF8.GetBytes($"{playerId}|{type}|{clientAtUtc:O}|{data}");
        return $"legacy:{Convert.ToHexString(SHA256.HashData(input)).ToLowerInvariant()}";
    }

    private static decimal? ReadDecimal(JsonObject? node, string key)
        => node?[key] is JsonValue value && value.TryGetValue<decimal>(out var result) ? result : null;

    private static double? ReadDouble(JsonObject? node, string key)
        => node?[key] is JsonValue value && value.TryGetValue<double>(out var result) ? result : null;

    private static string? ReadText(JsonObject? node, string key)
    {
        if (node?[key] is not JsonValue value || !value.TryGetValue<string>(out var result) || string.IsNullOrWhiteSpace(result)) return null;
        return result[..Math.Min(result.Length, MaxContextLength)];
    }
}
