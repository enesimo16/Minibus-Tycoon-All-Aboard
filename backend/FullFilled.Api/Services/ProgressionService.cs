using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using FullFilled.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FullFilled.Api.Services;

public sealed class ProgressionService(FullFilledDbContext db)
{
    public async Task<PlayerProgression> EnsureAsync(string playerId, CancellationToken cancellationToken = default)
    {
        var progression = await db.PlayerProgression.FindAsync([playerId], cancellationToken);
        if (progression is not null) return progression;

        var now = DateTime.UtcNow;
        progression = new PlayerProgression
        {
            PlayerId = playerId,
            Level = 1,
            LastAcknowledgedLevel = 1,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        db.PlayerProgression.Add(progression);
        return progression;
    }

    public async Task<PlayerBootstrapDto> GetBootstrapAsync(string playerId, CancellationToken cancellationToken = default)
    {
        var progression = await EnsureAsync(playerId, cancellationToken);
        var company = await db.Companies.AsNoTracking().FirstOrDefaultAsync(item => item.PlayerId == playerId, cancellationToken);
        var achievements = await db.PlayerAchievements.AsNoTracking()
            .Where(item => item.PlayerId == playerId && item.UnlockedAtUtc != null)
            .Select(item => item.AchievementId)
            .ToListAsync(cancellationToken);
        return BuildBootstrap(company, progression, achievements);
    }

    public async Task AwardMilestonesAsync(string playerId, IEnumerable<string> eventTypes, DateTime now, CancellationToken cancellationToken = default)
    {
        var rewards = EconomyConstants.Progression.MilestoneXp;
        var requested = eventTypes.Where(rewards.ContainsKey).Distinct(StringComparer.Ordinal).ToList();
        if (requested.Count == 0) return;

        var existing = await db.PlayerAchievements
            .Where(item => item.PlayerId == playerId && requested.Contains(item.AchievementId))
            .Select(item => item.AchievementId)
            .ToHashSetAsync(cancellationToken);
        var newlyUnlocked = requested.Where(item => !existing.Contains(item)).ToList();
        if (newlyUnlocked.Count == 0) return;

        foreach (var achievementId in newlyUnlocked)
        {
            db.PlayerAchievements.Add(new PlayerAchievement
            {
                PlayerId = playerId,
                AchievementId = achievementId,
                Progress = 1,
                UnlockedAtUtc = now,
                UpdatedAtUtc = now,
            });
        }

        var progression = await EnsureAsync(playerId, cancellationToken);
        var previousLevel = progression.Level;
        progression.Experience = Math.Max(0, progression.Experience + newlyUnlocked.Sum(item => rewards[item]));
        progression.Level = CalculateLevel(progression.Experience);
        progression.SkillPoints += EconomyConstants.Progression.SkillPointLevels.Count(level => level > previousLevel && level <= progression.Level);
        progression.UpdatedAtUtc = now;
    }

    public PlayerBootstrapDto BuildBootstrap(Company? company, PlayerProgression progression, IReadOnlyCollection<string> achievements)
    {
        var thresholds = EconomyConstants.Progression.LevelThresholds;
        var levelIndex = Math.Clamp(progression.Level - 1, 0, thresholds.Count - 1);
        var nextIndex = Math.Clamp(progression.Level, 0, thresholds.Count - 1);
        var unlocks = EconomyConstants.Progression.Unlocks.ToDictionary(
            pair => pair.Key,
            pair =>
            {
                var missing = pair.Value.Milestones.Where(item => !achievements.Contains(item)).ToList();
                return new UnlockStatusDto(pair.Key, progression.Level >= pair.Value.Level && missing.Count == 0, pair.Value.Level, missing);
            });

        var companyDto = company is null ? null : new CompanyDto(
            company.Id, company.Name, company.EmblemId, company.PrimaryColor, company.SecondaryColor,
            company.Strategy, company.StarterBusId, company.Reputation, ParseSkills(company.SkillsJson));
        return new PlayerBootstrapDto(
            companyDto,
            new ProgressionDto(
                progression.Level,
                progression.Experience,
                thresholds[levelIndex],
                progression.Level >= EconomyConstants.Progression.MaxLevel ? thresholds[^1] : thresholds[nextIndex],
                progression.SkillPoints,
                progression.LastAcknowledgedLevel,
                EconomyConstants.Progression.MaxLevel),
            unlocks,
            achievements.Order().ToList());
    }

    public static Dictionary<string, int> ParseSkills(string? value)
    {
        try { return JsonSerializer.Deserialize<Dictionary<string, int>>(value ?? "{}") ?? []; }
        catch (JsonException) { return []; }
    }

    public static int CalculateLevel(int experience)
    {
        var thresholds = EconomyConstants.Progression.LevelThresholds;
        var level = 1;
        for (var index = 1; index < thresholds.Count && experience >= thresholds[index]; index++) level = index + 1;
        return Math.Min(level, EconomyConstants.Progression.MaxLevel);
    }
}

