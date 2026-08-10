import { ECONOMY } from "./economy";
import type { GoalType } from "./store";

// Faz 4 — Kontrat motoru. Rastgele "üç günlük görev" sistemi kaldırıldı; yerine şablon
// (aile) + seviye bandı + bonus kombinasyonuyla üretilen teklifler geldi. Tüm sayısal
// değerler `shared/economy.json > contracts` içinden gelir (magic number yasak).
// MVP kapsamı: her aile mevcut dört ilerleme tipinden birini kullanır (earn/board/dur/
// offroute) — bunlar zaten sürüş döngüsünde ölçülüyor. "Güvenli sürüş" ve "yüksek
// memnuniyet" aileleri bu dilimde durak servisi/yolcu sayısıyla temsil edilir; gerçek
// violation/satisfaction eşiği Faz 5/7 şoför ve event sistemiyle birlikte gelecek.

type ContractsConfig = typeof ECONOMY.contracts;
export type ContractFamily = ContractsConfig["families"][number];

export interface ContractOffer {
  id: string;
  familyId: string;
  goalType: GoalType;
  target: number;
  reward: number;
  rewardXp: number;
  rewardReputation: number;
  bonusIds: string[];
  minLevel: number;
}

export interface ActiveContract extends ContractOffer {
  progress: number;
  completed: boolean;
  acceptedAtGameDay: number;
}

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function bandForLevel(level: number, cfg: ContractsConfig): ContractsConfig["levelBands"][number] {
  return cfg.levelBands.find((b) => level >= b.minLevel && level <= b.maxLevel) ?? cfg.levelBands[cfg.levelBands.length - 1];
}

/** Aile + seçilen bonus kombinasyonundan tek bir teklif üretir. */
function buildOffer(family: ContractFamily, level: number, cfg: ContractsConfig): ContractOffer {
  const band = bandForLevel(level, cfg);
  const bonusCount = Math.floor(Math.random() * (family.bonusPool.length + 1)); // 0..pool boyu, en fazla 2
  const bonusIds = [...family.bonusPool].sort(() => Math.random() - 0.5).slice(0, Math.min(2, bonusCount));
  const moneyRatio = 1 + bonusIds.reduce((sum, id) => sum + (cfg.bonuses[id as keyof typeof cfg.bonuses]?.moneyRatio ?? 0), 0);
  const xpRatio = 1 + bonusIds.reduce((sum, id) => sum + (cfg.bonuses[id as keyof typeof cfg.bonuses]?.xpRatio ?? 0), 0);

  return {
    id: randomId(),
    familyId: family.id,
    goalType: family.goalType as GoalType,
    target: Math.max(1, Math.round(family.targetBase * band.targetMultiplier)),
    reward: Math.round(family.baseMoney * band.rewardMultiplier * moneyRatio),
    rewardXp: Math.round(family.baseXp * band.rewardMultiplier * xpRatio),
    rewardReputation: family.baseReputation,
    bonusIds,
    minLevel: family.minLevel,
  };
}

/**
 * Seviyeye uygun aileler arasından, son sunulan ailelerin tekrarını (soğuma penceresi)
 * önleyerek `offerCount` teklif üretir. Aynı ailenin farklı bonus kombinasyonu farklı bir
 * tekliftir; bitiş kriteri olan "her seviye bandında en az sekiz kombinasyon" aile × bonus
 * alt kümesi × soğuma havuzu çarpımıyla sağlanır.
 */
export function generateContractOffers(
  level: number,
  recentFamilyIds: string[],
  cfg: ContractsConfig = ECONOMY.contracts,
): ContractOffer[] {
  const eligible = cfg.families.filter((f) => f.minLevel <= level);
  if (eligible.length === 0) return [];

  const cooled = eligible.filter((f) => !recentFamilyIds.includes(f.id));
  const pool = cooled.length >= cfg.offerCount ? cooled : eligible;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const chosen: ContractFamily[] = [];
  for (let i = 0; chosen.length < cfg.offerCount && i < shuffled.length * 2; i++) {
    chosen.push(shuffled[i % shuffled.length]);
  }
  return chosen.slice(0, Math.min(cfg.offerCount, eligible.length)).map((family) => buildOffer(family, level, cfg));
}

/** Bir ilerleme tipine sahip aktif kontratlara artış uygular; hedefe ulaşanları ayrı döner. */
export function advanceContractProgress(
  contracts: ActiveContract[],
  type: GoalType,
  increment: number,
): { contracts: ActiveContract[]; reward: number; justCompleted: ActiveContract[] } {
  let reward = 0;
  const justCompleted: ActiveContract[] = [];
  const updated = contracts.map((c) => {
    if (c.goalType !== type || c.completed) return c;
    const progress = Math.min(c.target, c.progress + increment);
    const done = progress >= c.target;
    if (done) {
      reward += c.reward;
      justCompleted.push({ ...c, progress, completed: true });
    }
    return { ...c, progress, completed: c.completed || done };
  });
  return { contracts: updated, reward, justCompleted };
}

/** "earn" tipi kontratları toplam günlük kazanca göre günceller (syncEarnGoal'ın eşdeğeri). */
export function syncContractEarnProgress(
  contracts: ActiveContract[],
  totalDailyEarnings: number,
): { contracts: ActiveContract[]; reward: number; justCompleted: ActiveContract[] } {
  let reward = 0;
  const justCompleted: ActiveContract[] = [];
  const updated = contracts.map((c) => {
    if (c.goalType !== "earn" || c.completed) return c;
    const progress = Math.min(c.target, totalDailyEarnings);
    const done = progress >= c.target;
    if (done) {
      reward += c.reward;
      justCompleted.push({ ...c, progress, completed: true });
    }
    return { ...c, progress, completed: c.completed || done };
  });
  return { contracts: updated, reward, justCompleted };
}
