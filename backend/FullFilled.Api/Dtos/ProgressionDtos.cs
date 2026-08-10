namespace FullFilled.Api.Dtos;

public sealed record CreateCompanyRequest(
    string Name,
    string EmblemId,
    string PrimaryColor,
    string SecondaryColor,
    string Strategy,
    string StarterBusId);

public sealed record CompanyDto(
    string Id,
    string Name,
    string EmblemId,
    string PrimaryColor,
    string SecondaryColor,
    string Strategy,
    string StarterBusId,
    int Reputation,
    Dictionary<string, int> Skills);

public sealed record UnlockStatusDto(
    string Id,
    bool Available,
    int RequiredLevel,
    IReadOnlyList<string> MissingMilestones);

public sealed record ProgressionDto(
    int Level,
    int Experience,
    int CurrentLevelExperience,
    int NextLevelExperience,
    int SkillPoints,
    int LastAcknowledgedLevel,
    int MaxLevel);

public sealed record PlayerBootstrapDto(
    CompanyDto? Company,
    ProgressionDto Progression,
    IReadOnlyDictionary<string, UnlockStatusDto> Unlocks,
    IReadOnlyList<string> Achievements);

// Faz 3: gün sonu vardiya sonucu. Sunucu XP'yi grade'den hesaplar; istemci sayısına güvenmez.
public sealed record SubmitShiftRequest(
    string IdempotencyKey,
    int GameDay,
    string Grade,
    decimal Score,
    decimal MoneyEarned,
    string? GoalId,
    string? MetricsJson);

public sealed record SubmitShiftResponse(
    PlayerBootstrapDto Bootstrap,
    int ExperienceAwarded,
    bool Duplicate);

// Faz 4: gün içi bir kontratın kabul/tamamlama/bırakma sonucu. Sunucu XP/itibarı
// familyId + bonusIds + oyuncunun mevcut seviyesinden hesaplar; istemci tutarına güvenmez.
public sealed record ResolveContractRequest(
    string IdempotencyKey,
    string ContractId,
    string FamilyId,
    List<string>? BonusIds,
    string Outcome,
    int GameDay,
    string? MetricsJson);

public sealed record ResolveContractResponse(
    PlayerBootstrapDto Bootstrap,
    int ExperienceAwarded,
    int ReputationAwarded,
    bool Duplicate);

// Faz 7: günlük şehir olayı. Sunucu üretir (istemci tahmin edip taklit edemez); deterministik
// olduğu için aynı gün tekrar istenirse aynı sonucu verir.
public sealed record CityEventTemplateDto(
    string Id,
    string Severity,
    decimal DemandDelta,
    decimal RiskDelta,
    decimal FareDelta,
    decimal SatisfactionDrift,
    decimal CounterCost);

public sealed record DailyEventDto(
    CityEventTemplateDto Primary,
    string AffectedRouteId,
    CityEventTemplateDto? Secondary,
    decimal CounterEffectRatio);

