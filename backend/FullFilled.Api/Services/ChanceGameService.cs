using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FullFilled.Api.Data;
using FullFilled.Api.Dtos;
using FullFilled.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FullFilled.Api.Services;

// Faz 9 — Şans oyunları 2.0. "Korunacak" (faz-plani.md): ayrı merkez, sunucu sonucu, bütçe
// limiti, çark/plaka/piyango dokunulmadı. "Değişecek" burada: kupon gerçek gün/kontrat
// performansına bağlanır, tombala bugünün gerçek şehir olayıyla kutu doldurur, ödüllere
// para-dışı türler eklendi, level kilidi + güvenli rezerv var, büyük kazanç audit'e yazılır.
// Hiçbir ödül türü XP/level/mastery vermez — kısayol yoktur.
public static class ChanceGameService
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> PlayerLocks = new();

    private static readonly JsonSerializerOptions ResponseJsonOptions = new(JsonSerializerDefaults.Web);

    private const int RecentContractRunSampleSize = 5;

    public static Task<IResult> SpinWheelAsync(string playerId, SpinWheelRequest request, FullFilledDbContext db, ProgressionService service) =>
        RunForPlayerAsync(playerId, "wheel", request.ClientRequestId, $"wheel:{request.GameDay}", db, async save =>
        {
            var config = EconomyConstants.ChanceGames;
            var wheel = config.Wheel;
            var chanceGames = NormalizeChanceGames(ParseChanceGames(save.ChanceGamesJson), request.GameDay);

            var limitError = await ValidatePlayAsync(playerId, save.Money, chanceGames, wheel.Stake, chanceGames.WheelSpinsToday, wheel.MaxSpinsPerDay, config, service, db, "Bugun Mahalle Carki hakkin doldu.", $"Cark icin en az {wheel.Stake:N0} TL lazim.");
            if (limitError is not null) return limitError;

            var segment = PickWeighted(wheel.Segments, s => s.Weight);
            var payout = Math.Round(wheel.Stake * segment.Multiplier, 2);
            var net = payout - wheel.Stake;
            save.Money = Math.Max(0, save.Money + net);

            var result = NewResult("wheel", segment.Label, wheel.Stake, payout, net, segment.Multiplier, segment.Tone);
            chanceGames = AddChanceResult(chanceGames with
            {
                DailyLimitUsed = chanceGames.DailyLimitUsed + wheel.Stake,
                WheelSpinsToday = chanceGames.WheelSpinsToday + 1,
            }, result, config.RecentResultLimit);

            save.ChanceGamesJson = JsonSerializer.Serialize(chanceGames);
            save.SavedAtUtc = DateTime.UtcNow;
            await LogLargeWinIfNeededAsync(db, playerId, result, save.Money, config);
            var response = new SpinWheelResponse(save.Money, chanceGames, result);
            return Results.Ok(response);
        });

    public static Task<IResult> PlayPlateAsync(string playerId, PlayPlateRequest request, FullFilledDbContext db, ProgressionService service) =>
        RunForPlayerAsync(playerId, "plate", request.ClientRequestId, $"plate:{request.GameDay}:{request.Guess.Trim().ToLowerInvariant()}", db, async save =>
        {
            var config = EconomyConstants.ChanceGames;
            var plate = config.Plate;
            var chanceGames = NormalizeChanceGames(ParseChanceGames(save.ChanceGamesJson), request.GameDay);
            var guess = request.Guess.Trim().ToLowerInvariant();

            if (guess is not ("tek" or "cift"))
            {
                return Results.BadRequest(new { message = "Plaka tahmini tek veya cift olmali." });
            }

            var limitError = await ValidatePlayAsync(playerId, save.Money, chanceGames, plate.Stake, chanceGames.PlatePlaysToday, plate.MaxPlaysPerDay, config, service, db, "Bugun plaka tahmini hakkin doldu.", $"Plaka oyunu icin en az {plate.Stake:N0} TL lazim.");
            if (limitError is not null) return limitError;

            var digit = RandomNumberGenerator.GetInt32(0, 10);
            var correctChoice = digit % 2 == 0 ? "cift" : "tek";
            var won = guess == correctChoice;
            var payout = won ? Math.Round(plate.Stake * plate.Multiplier, 2) : 0m;
            var net = payout - plate.Stake;
            save.Money = Math.Max(0, save.Money + net);

            var label = won ? $"Plaka {digit}: bildin" : $"Plaka {digit}: kaybettin";
            var result = NewResult("plate", label, plate.Stake, payout, net, won ? plate.Multiplier : 0, won ? "green" : "red");
            chanceGames = AddChanceResult(chanceGames with
            {
                DailyLimitUsed = chanceGames.DailyLimitUsed + plate.Stake,
                PlatePlaysToday = chanceGames.PlatePlaysToday + 1,
            }, result, config.RecentResultLimit);

            save.ChanceGamesJson = JsonSerializer.Serialize(chanceGames);
            save.SavedAtUtc = DateTime.UtcNow;
            await LogLargeWinIfNeededAsync(db, playerId, result, save.Money, config);
            return Results.Ok(new PlayPlateResponse(save.Money, chanceGames, result, digit, correctChoice));
        });

    public static Task<IResult> BuyLotteryTicketAsync(string playerId, BuyLotteryTicketRequest request, FullFilledDbContext db, ProgressionService service) =>
        RunForPlayerAsync(playerId, "lottery", request.ClientRequestId, $"lottery:{request.GameDay}", db, async save =>
        {
            var config = EconomyConstants.ChanceGames;
            var lottery = config.Lottery;
            var chanceGames = NormalizeChanceGames(ParseChanceGames(save.ChanceGamesJson), request.GameDay);

            var limitError = await ValidatePlayAsync(playerId, save.Money, chanceGames, lottery.TicketCost, chanceGames.LotteryTicketsToday, lottery.MaxTicketsPerDay, config, service, db, "Bugun piyango bileti hakkin doldu.", $"Piyango bileti icin en az {lottery.TicketCost:N0} TL lazim.");
            if (limitError is not null) return limitError;

            var prize = PickWeighted(lottery.Prizes, p => p.Weight);
            var payout = prize.Amount;
            var net = payout - lottery.TicketCost;
            save.Money = Math.Max(0, save.Money + net);

            var multiplier = lottery.TicketCost > 0 ? Math.Round(payout / lottery.TicketCost, 2) : 0;
            var result = NewResult("lottery", prize.Label, lottery.TicketCost, payout, net, multiplier, prize.Tone);
            chanceGames = AddChanceResult(chanceGames with
            {
                DailyLimitUsed = chanceGames.DailyLimitUsed + lottery.TicketCost,
                LotteryTicketsToday = chanceGames.LotteryTicketsToday + 1,
            }, result, config.RecentResultLimit);

            save.ChanceGamesJson = JsonSerializer.Serialize(chanceGames);
            save.SavedAtUtc = DateTime.UtcNow;
            await LogLargeWinIfNeededAsync(db, playerId, result, save.Money, config);
            return Results.Ok(new BuyLotteryTicketResponse(save.Money, chanceGames, result));
        });

    public static Task<IResult> PlayMiniAsync(string playerId, PlayMiniChanceRequest request, string gameId, FullFilledDbContext db, ProgressionService service) =>
        RunForPlayerAsync(playerId, gameId, request.ClientRequestId, $"{gameId}:{request.GameDay}", db, async save =>
        {
            var config = EconomyConstants.ChanceGames;
            var chanceGames = NormalizeChanceGames(ParseChanceGames(save.ChanceGamesJson), request.GameDay);
            var game = gameId switch
            {
                "envelope" => (Config: config.Envelope, PlaysToday: chanceGames.EnvelopePlaysToday, MaxReachedMessage: "Bugun zarf hakkin doldu."),
                "coupon" => (Config: config.Coupon, PlaysToday: chanceGames.CouponPlaysToday, MaxReachedMessage: "Bugun kupon hakkin doldu."),
                "tombala" => (Config: config.Tombala, PlaysToday: chanceGames.TombalaPlaysToday, MaxReachedMessage: "Bugun tombala hakkin doldu."),
                _ => throw new InvalidOperationException($"Unknown mini chance game: {gameId}"),
            };

            var limitError = await ValidatePlayAsync(playerId, save.Money, chanceGames, game.Config.Stake, game.PlaysToday, game.Config.MaxPlaysPerDay, config, service, db, game.MaxReachedMessage, $"Oynamak icin en az {game.Config.Stake:N0} TL lazim.");
            if (limitError is not null) return limitError;

            // Faz 9: kupon gerçek gün/kontrat performansına, tombala bugünün gerçek şehir
            // olayına bağlanır. İkisi de yalnızca oyunun oynanabilirlik havuzunu/ağırlıklarını
            // etkiler — hiçbiri XP, level veya mastery vermez.
            var outcomes = game.Config.Outcomes;
            var eventBoxLabel = (string?)null;
            if (gameId == "coupon")
            {
                var performanceFactor = await ComputePerformanceFactorAsync(db, playerId);
                outcomes = ApplyPerformanceBoost(outcomes, performanceFactor, config.PerformanceBoostMaxRatio);
            }
            else if (gameId == "tombala")
            {
                // Faz 9: kutu, bugünün GERÇEK şehir olayıyla dolar — Faz 7'nin aynı
                // deterministik üretecinden (aynı gün her zaman aynı olay).
                var progression = await service.EnsureAsync(playerId);
                var (primaryEvent, _, _) = EconomyConstants.GenerateDailyEvent(playerId, request.GameDay, progression.Level);
                var severityWeight = primaryEvent.Severity switch { "high" => 1.6m, "low" => 0.6m, _ => 1m };
                eventBoxLabel = $"{primaryEvent.Id} kutusu";
                outcomes = outcomes.Select(o => o.EventOnly ? o with { Weight = o.Weight * severityWeight } : o).ToList();
            }

            var outcome = PickWeighted(outcomes, o => o.Weight);
            var payout = outcome.Payout;
            var net = payout - game.Config.Stake;
            save.Money = Math.Max(0, save.Money + net);

            var multiplier = game.Config.Stake > 0 ? Math.Round(payout / game.Config.Stake, 2) : 0;
            var label = outcome.EventOnly && eventBoxLabel is not null ? eventBoxLabel : outcome.Label;
            var result = NewResult(gameId, label, game.Config.Stake, payout, net, multiplier, outcome.Tone, outcome.RewardType, outcome.CosmeticId);

            chanceGames = gameId switch
            {
                "envelope" => chanceGames with { DailyLimitUsed = chanceGames.DailyLimitUsed + game.Config.Stake, EnvelopePlaysToday = chanceGames.EnvelopePlaysToday + 1 },
                "coupon" => chanceGames with { DailyLimitUsed = chanceGames.DailyLimitUsed + game.Config.Stake, CouponPlaysToday = chanceGames.CouponPlaysToday + 1 },
                "tombala" => chanceGames with { DailyLimitUsed = chanceGames.DailyLimitUsed + game.Config.Stake, TombalaPlaysToday = chanceGames.TombalaPlaysToday + 1 },
                _ => chanceGames,
            };
            chanceGames = AddChanceResult(chanceGames, result, config.RecentResultLimit);

            save.ChanceGamesJson = JsonSerializer.Serialize(chanceGames);
            save.SavedAtUtc = DateTime.UtcNow;
            await LogLargeWinIfNeededAsync(db, playerId, result, save.Money, config);
            return Results.Ok(new PlayMiniChanceResponse(save.Money, chanceGames, result));
        });

    /// Son vardiya notu (ShiftResults) + son kontrat sonuçları (ContractRuns) ortalamasından
    /// 0-1 performans skoru. Geçmiş yoksa nötr (0.5) — ne ceza ne bonus.
    private static async Task<decimal> ComputePerformanceFactorAsync(FullFilledDbContext db, string playerId)
    {
        var lastShift = await db.ShiftResults
            .AsNoTracking()
            .Where(s => s.PlayerId == playerId)
            .OrderByDescending(s => s.CompletedAtUtc)
            .FirstOrDefaultAsync();
        var shiftFactor = lastShift is null ? 0.5m : Math.Clamp(lastShift.Score / 100m, 0m, 1m);

        var recentRuns = await db.ContractRuns
            .AsNoTracking()
            .Where(c => c.PlayerId == playerId && c.Status != "active")
            .OrderByDescending(c => c.CompletedAtUtc)
            .Take(RecentContractRunSampleSize)
            .ToListAsync();
        var contractFactor = recentRuns.Count == 0
            ? 0.5m
            : (decimal)recentRuns.Count(c => c.Status == "completed") / recentRuns.Count;

        return (shiftFactor + contractFactor) / 2m;
    }

    /// İyi performans "miss/none" ağırlığını düşürür, olumlu sonuçların ağırlığını yükseltir.
    /// Para-dışı ödüllere dokunmaz — onlar sabit oranda kalır (kısayol değildir).
    private static List<MiniChanceOutcomeConfig> ApplyPerformanceBoost(IReadOnlyList<MiniChanceOutcomeConfig> outcomes, decimal performanceFactor, decimal maxBoostRatio)
    {
        var boost = performanceFactor * maxBoostRatio;
        return outcomes.Select(o =>
        {
            if (o.RewardType != "money") return o;
            var isMiss = o.Payout <= 0;
            var scale = isMiss ? Math.Max(0.1m, 1 - boost) : 1 + boost;
            return o with { Weight = o.Weight * scale };
        }).ToList();
    }

    private static async Task LogLargeWinIfNeededAsync(FullFilledDbContext db, string playerId, ChanceGameResultDto result, decimal balanceAfter, ChanceGamesConfig config)
    {
        if (result.Payout < config.LargeWinThreshold) return;
        var idempotencyKey = $"chance_large_win:{result.Id}";
        if (await db.GameplayEvents.AnyAsync(e => e.PlayerId == playerId && e.IdempotencyKey == idempotencyKey)) return;
        db.GameplayEvents.Add(new GameplayEvent
        {
            PlayerId = playerId,
            IdempotencyKey = idempotencyKey,
            Type = "chance_large_win",
            Category = "economy_audit",
            DataJson = JsonSerializer.Serialize(new { gameId = result.GameId, label = result.Label, payout = result.Payout }),
            Amount = result.Payout,
            Balance = balanceAfter,
            Source = result.GameId,
            ClientBuild = "server",
            DeviceClass = "unknown",
            Locale = "tr",
            ClientAtUtc = result.CreatedAtUtc,
        });
    }

    private static async Task<IResult> RunForPlayerAsync(
        string playerId,
        string gameId,
        string? clientRequestId,
        string requestFingerprint,
        FullFilledDbContext db,
        Func<GameSave, Task<IResult>> play)
    {
        var playerLock = PlayerLocks.GetOrAdd(playerId, _ => new SemaphoreSlim(1, 1));
        await playerLock.WaitAsync();
        try
        {
            var requestId = string.IsNullOrWhiteSpace(clientRequestId) ? null : clientRequestId.Trim();
            var requestHash = Hash($"{playerId}:{gameId}:{requestFingerprint}");

            if (requestId is not null)
            {
                var previous = await db.ChanceGameTransactions.FirstOrDefaultAsync(t => t.PlayerId == playerId && t.ClientRequestId == requestId);
                if (previous is not null)
                {
                    if (previous.RequestHash != requestHash)
                    {
                        return Results.Conflict(new { message = "Bu istek anahtari farkli bir sans oyunu istegi icin kullanilmis." });
                    }

                    return Results.Content(previous.ResponseJson, "application/json");
                }
            }

            var save = await db.GameSaves.FindAsync(playerId);
            if (save is null) return Results.NotFound();

            var result = await play(save);

            if (requestId is not null && IsSuccess(result))
            {
                db.ChanceGameTransactions.Add(new ChanceGameTransaction
                {
                    Id = Guid.NewGuid().ToString("N"),
                    PlayerId = playerId,
                    ClientRequestId = requestId,
                    GameId = gameId,
                    RequestHash = requestHash,
                    ResponseJson = ExtractResponseJson(result),
                    CreatedAtUtc = DateTime.UtcNow,
                });
            }

            await db.SaveChangesAsync();
            return result;
        }
        finally
        {
            playerLock.Release();
        }
    }

    /// Faz 9: seviye kilidi + güvenli rezerv, mevcut gün limiti/hak kontrolüne eklendi.
    private static async Task<IResult?> ValidatePlayAsync(
        string playerId,
        decimal money,
        ChanceGamesDto chanceGames,
        decimal stake,
        int playsToday,
        int maxPlaysPerDay,
        ChanceGamesConfig config,
        ProgressionService service,
        FullFilledDbContext db,
        string maxReachedMessage,
        string insufficientMoneyMessage)
    {
        var requiredLevel = EconomyConstants.Progression.Unlocks.GetValueOrDefault("chanceGames")?.Level ?? 1;
        if (requiredLevel > 1)
        {
            var progression = await service.EnsureAsync(playerId);
            if (progression.Level < requiredLevel)
            {
                return Results.BadRequest(new { message = $"Şans oyunları merkezi seviye {requiredLevel}'de açılır." });
            }
        }

        if (money < stake) return Results.BadRequest(new { message = insufficientMoneyMessage });
        if (money - stake < config.MinimumReserve) return Results.BadRequest(new { message = "Bu oyun kasandaki güvenli rezervin altına düşürür." });
        if (playsToday >= maxPlaysPerDay) return Results.BadRequest(new { message = maxReachedMessage });
        if (chanceGames.DailyLimitUsed + stake > config.DailyBudgetLimit) return Results.BadRequest(new { message = "Gunluk sans oyunu limitin doldu." });
        return null;
    }

    private static bool IsSuccess(IResult result) => result is IStatusCodeHttpResult statusCodeResult
        ? statusCodeResult.StatusCode is null or >= 200 and < 300
        : result is not IValueHttpResult { Value: null };

    private static string ExtractResponseJson(IResult result)
    {
        if (result is IValueHttpResult valueResult)
        {
            return JsonSerializer.Serialize(valueResult.Value, ResponseJsonOptions);
        }

        throw new InvalidOperationException("Chance game response could not be serialized.");
    }

    private static ChanceGameResultDto NewResult(string gameId, string label, decimal stake, decimal payout, decimal net, decimal multiplier, string tone, string rewardType = "money", string? cosmeticId = null) =>
        new(Guid.NewGuid().ToString("N"), gameId, label, stake, payout, net, multiplier, tone, DateTime.UtcNow, rewardType, cosmeticId);

    private static ChanceGamesDto NewChanceGamesState(int day) => new(day, 0m, 0, 0, 0, 0, 0, 0, []);

    private static ChanceGamesDto ParseChanceGames(string? chanceGamesJson)
    {
        if (string.IsNullOrWhiteSpace(chanceGamesJson) || chanceGamesJson == "{}") return NewChanceGamesState(day: 1);
        try
        {
            return JsonSerializer.Deserialize<ChanceGamesDto>(chanceGamesJson) ?? NewChanceGamesState(day: 1);
        }
        catch
        {
            return NewChanceGamesState(day: 1);
        }
    }

    private static ChanceGamesDto NormalizeChanceGames(ChanceGamesDto chanceGames, int day)
    {
        if (chanceGames.Day != day) return NewChanceGamesState(day);
        return chanceGames with
        {
            DailyLimitUsed = Math.Max(0, chanceGames.DailyLimitUsed),
            WheelSpinsToday = Math.Max(0, chanceGames.WheelSpinsToday),
            PlatePlaysToday = Math.Max(0, chanceGames.PlatePlaysToday),
            LotteryTicketsToday = Math.Max(0, chanceGames.LotteryTicketsToday),
            EnvelopePlaysToday = Math.Max(0, chanceGames.EnvelopePlaysToday),
            CouponPlaysToday = Math.Max(0, chanceGames.CouponPlaysToday),
            TombalaPlaysToday = Math.Max(0, chanceGames.TombalaPlaysToday),
            RecentResults = chanceGames.RecentResults ?? [],
        };
    }

    private static ChanceGamesDto AddChanceResult(ChanceGamesDto chanceGames, ChanceGameResultDto result, int recentResultLimit)
    {
        var results = new List<ChanceGameResultDto> { result };
        results.AddRange(chanceGames.RecentResults ?? []);
        return chanceGames with { RecentResults = results.Take(recentResultLimit).ToList() };
    }

    private static T PickWeighted<T>(IReadOnlyList<T> items, Func<T, decimal> weightSelector)
    {
        if (items.Count == 0) throw new InvalidOperationException("Weighted chance list is empty.");
        var totalWeight = items.Sum(item => Math.Max(0, weightSelector(item)));
        if (totalWeight <= 0) return items[0];

        var roll = (decimal)RandomNumberGenerator.GetInt32(0, int.MaxValue) / int.MaxValue * totalWeight;
        foreach (var item in items)
        {
            roll -= Math.Max(0, weightSelector(item));
            if (roll <= 0) return item;
        }

        return items[^1];
    }

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}
