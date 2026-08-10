namespace FullFilled.Api.Dtos;

public sealed class TelemetryEventDto
{
    public string? EventId { get; init; }
    public int EventVersion { get; init; } = 1;
    public string Type { get; init; } = string.Empty;
    public string? DataJson { get; init; }
    public DateTime ClientAtUtc { get; init; }
}

public sealed class TelemetryBatchRequest
{
    public string? SessionId { get; init; }
    public string? ClientBuild { get; init; }
    public string? DeviceClass { get; init; }
    public string? Locale { get; init; }
    public int? PlayerLevel { get; init; }
    public string? CompanyId { get; init; }
    public List<TelemetryEventDto> Events { get; init; } = [];
}

public record TelemetryBatchResponse(int Accepted, int Duplicates, string? SessionId, PlayerBootstrapDto? Bootstrap);

public record FeedbackRequest(string Category, string Message, string? ContextJson);

public record FeedbackEntryDto(
    long Id,
    string PlayerId,
    string? Username,
    string Category,
    string Message,
    string ContextJson,
    DateTime CreatedAtUtc
);
