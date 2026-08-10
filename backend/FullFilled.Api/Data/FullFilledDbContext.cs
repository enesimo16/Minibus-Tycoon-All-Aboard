using FullFilled.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Data;

public class FullFilledDbContext(DbContextOptions<FullFilledDbContext> options) : DbContext(options)
{
    public DbSet<GameSave> GameSaves => Set<GameSave>();
    public DbSet<CityEvent> CityEvents => Set<CityEvent>();
    public DbSet<ChanceGameTransaction> ChanceGameTransactions => Set<ChanceGameTransaction>();
    public DbSet<TelemetryEvent> TelemetryEvents => Set<TelemetryEvent>();
    public DbSet<FeedbackEntry> FeedbackEntries => Set<FeedbackEntry>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<PlayerProgression> PlayerProgression => Set<PlayerProgression>();
    public DbSet<PlayerAchievement> PlayerAchievements => Set<PlayerAchievement>();
    public DbSet<GameSession> GameSessions => Set<GameSession>();
    public DbSet<GameplayEvent> GameplayEvents => Set<GameplayEvent>();
    public DbSet<ContractRun> ContractRuns => Set<ContractRun>();
    public DbSet<ShiftResult> ShiftResults => Set<ShiftResult>();
    public DbSet<Friendship> Friendships => Set<Friendship>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameSave>().HasKey(s => s.PlayerId);
        modelBuilder.Entity<GameSave>().HasIndex(s => s.Username).IsUnique();
        modelBuilder.Entity<CityEvent>().HasIndex(e => new { e.HostPlayerId, e.ActorPlayerId, e.CreatedAtUtc });
        modelBuilder.Entity<ChanceGameTransaction>().HasKey(t => t.Id);
        modelBuilder.Entity<ChanceGameTransaction>().HasIndex(t => new { t.PlayerId, t.ClientRequestId }).IsUnique();
        modelBuilder.Entity<TelemetryEvent>().HasKey(e => e.Id);
        modelBuilder.Entity<TelemetryEvent>().HasIndex(e => new { e.Type, e.CreatedAtUtc });
        modelBuilder.Entity<TelemetryEvent>().HasIndex(e => e.PlayerId);
        modelBuilder.Entity<FeedbackEntry>().HasKey(e => e.Id);
        modelBuilder.Entity<FeedbackEntry>().HasIndex(e => e.CreatedAtUtc);
        modelBuilder.Entity<Company>().HasKey(e => e.Id);
        modelBuilder.Entity<Company>().HasIndex(e => e.PlayerId).IsUnique();
        modelBuilder.Entity<Company>().HasIndex(e => e.NormalizedName).IsUnique();
        modelBuilder.Entity<PlayerProgression>().HasKey(e => e.PlayerId);
        modelBuilder.Entity<PlayerAchievement>().HasKey(e => new { e.PlayerId, e.AchievementId });
        modelBuilder.Entity<GameSession>().HasKey(e => e.Id);
        modelBuilder.Entity<GameSession>().HasIndex(e => new { e.PlayerId, e.StartedAtUtc });
        modelBuilder.Entity<GameSession>().HasIndex(e => e.StartedAtUtc);
        modelBuilder.Entity<GameplayEvent>().HasKey(e => e.Id);
        modelBuilder.Entity<GameplayEvent>().HasIndex(e => new { e.PlayerId, e.IdempotencyKey }).IsUnique();
        modelBuilder.Entity<GameplayEvent>().HasIndex(e => new { e.Type, e.CreatedAtUtc });
        modelBuilder.Entity<GameplayEvent>().HasIndex(e => new { e.PlayerId, e.CreatedAtUtc });
        modelBuilder.Entity<GameplayEvent>().HasIndex(e => e.SessionId);
        modelBuilder.Entity<ContractRun>().HasKey(e => e.Id);
        modelBuilder.Entity<ContractRun>().HasIndex(e => new { e.PlayerId, e.IdempotencyKey }).IsUnique();
        modelBuilder.Entity<ShiftResult>().HasKey(e => e.Id);
        modelBuilder.Entity<ShiftResult>().HasIndex(e => new { e.PlayerId, e.IdempotencyKey }).IsUnique();
        modelBuilder.Entity<ShiftResult>().HasIndex(e => new { e.PlayerId, e.CompletedAtUtc });
        modelBuilder.Entity<Friendship>().HasKey(e => e.Id);
        // Ayni sehri iki kez eklemek 409 dondurur; benzersiz indeks bunu veritabani seviyesinde de garantiler.
        modelBuilder.Entity<Friendship>().HasIndex(e => new { e.PlayerId, e.FriendPlayerId }).IsUnique();
        modelBuilder.Entity<Friendship>().HasIndex(e => e.PlayerId);
    }
}
