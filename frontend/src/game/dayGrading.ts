import { ECONOMY } from "./economy";

// Faz 3 — Gerçek vardiya, oyun günü ve not sistemi.
// Saf/test edilebilir not motoru. Kanonik ağırlık, eşik ve XP değerleri
// `shared/economy.json > dayGrading` içindedir (magic number yasak).
// İstemci burada notu gösterir; backend aynı grade→XP eşlemesiyle ödülü doğrular.

export interface DayStats {
  /** Gün içi ihlal puanı (hızlı yakalanma, hatalı para üstü, kırılan söz vb.). */
  violations: number;
  /** Gün sonu memnuniyet, 0-100. */
  satisfaction: number;
  /** Gün içi toplam biniş. */
  boardings: number;
  stopsServed: number;
  stopsMissed: number;
  /** Gün içi net kazanç (ücret + bahşiş). */
  netEarned: number;
  /** Gün içinde sonuçlanan kontratların başarı yüzdesi (0-100); hiç kontrat yoksa 0. */
  contractCompletionPct: number;
}

export interface DimensionBreakdown {
  key: string;
  value: number;
  weight: number;
}

export interface DayGradeResult {
  score: number;
  grade: string;
  xp: number;
  breakdown: DimensionBreakdown[];
}

type GradingConfig = typeof ECONOMY.dayGrading;

const clamp100 = (value: number): number => Math.max(0, Math.min(100, value));

/** Her boyutun 0-100 puanı. Aktif olmayan boyutlar da hesaplanır ama ağırlık almaz. */
export function computeDimensions(stats: DayStats, cfg: GradingConfig = ECONOMY.dayGrading): Record<string, number> {
  const s = cfg.scoring;
  const totalStops = stats.stopsServed + stats.stopsMissed;
  return {
    safety: clamp100(100 - stats.violations * s.violationPenaltyPoints),
    timing: clamp100((stats.boardings / s.targetBoardingsPerShift) * 100),
    satisfaction: clamp100(stats.satisfaction),
    stopService: totalStops > 0 ? clamp100((stats.stopsServed / totalStops) * 100) : 100,
    netResult: clamp100((stats.netEarned / s.targetNetPerShift) * 100),
    contractGoals: clamp100(stats.contractCompletionPct),
  };
}

/** Ağırlıklı toplam puan; sadece aktif boyutlar üzerinden yeniden normalize edilir. */
export function computeScore(dimensions: Record<string, number>, cfg: GradingConfig = ECONOMY.dayGrading): number {
  const active = cfg.activeDimensions as string[];
  const weights = cfg.weights as Record<string, number>;
  const weightSum = active.reduce((sum, key) => sum + (weights[key] ?? 0), 0);
  if (weightSum <= 0) return 0;
  const weighted = active.reduce((sum, key) => sum + (weights[key] ?? 0) * (dimensions[key] ?? 0), 0);
  return weighted / weightSum;
}

/** Puana karşılık gelen ham not (baraj uygulanmadan). Eşikler azalan sırada taranır. */
export function gradeForScore(score: number, cfg: GradingConfig = ECONOMY.dayGrading): string {
  for (const threshold of cfg.thresholds) {
    if (score >= threshold.min) return threshold.grade;
  }
  return cfg.thresholds[cfg.thresholds.length - 1].grade;
}

/** S/S+ barajı: güvenlik veya memnuniyet minimumu tutmuyorsa not tavana çekilir. */
export function applyEliteBarrier(grade: string, dimensions: Record<string, number>, cfg: GradingConfig = ECONOMY.dayGrading): string {
  const barrier = cfg.eliteBarrier;
  const gated = (barrier.grades as string[]).includes(grade);
  if (!gated) return grade;
  const passesSafety = (dimensions.safety ?? 0) >= barrier.minSafety;
  const passesSatisfaction = (dimensions.satisfaction ?? 0) >= barrier.minSatisfaction;
  return passesSafety && passesSatisfaction ? grade : barrier.cappedGrade;
}

/** Not → XP. Backend bu eşlemeyi otoritedir; istemci aynısını önizleme için kullanır. */
export function xpForGrade(grade: string, cfg: GradingConfig = ECONOMY.dayGrading): number {
  const multiplier = (cfg.xp.gradeMultipliers as Record<string, number>)[grade] ?? 0;
  return Math.round(cfg.xp.baseXp * multiplier);
}

export function computeDayGrade(stats: DayStats, cfg: GradingConfig = ECONOMY.dayGrading): DayGradeResult {
  const dimensions = computeDimensions(stats, cfg);
  const score = computeScore(dimensions, cfg);
  const grade = applyEliteBarrier(gradeForScore(score, cfg), dimensions, cfg);
  const weights = cfg.weights as Record<string, number>;
  const breakdown = (cfg.activeDimensions as string[]).map((key) => ({
    key,
    value: Math.round(dimensions[key] ?? 0),
    weight: weights[key] ?? 0,
  }));
  return { score: Math.round(score * 10) / 10, grade, xp: xpForGrade(grade, cfg), breakdown };
}
