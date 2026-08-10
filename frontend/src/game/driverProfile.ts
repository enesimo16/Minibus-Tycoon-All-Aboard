import { ECONOMY } from "./economy";
import { gradeForScore } from "./dayGrading";

// Faz 5 — Şoför 2.0. Saf/test edilebilir tahmin fonksiyonları: atama ekranı hangi şoförün
// hangi durumda güçlü/zayıf olduğunu ve tahmini not/riskini oyuncuya ÖNCEDEN gösterir
// (gizli ceza yasak — bkz. faz-plani.md Faz 5 bitiş kriteri).
// Altı özellik: Sürüş (speedMultiplier) ve Ekonomi (efficiency/salaryShare) mevcut alanlardan
// gelir; Dakiklik/Hizmet/Güvenilirlik/Soğukkanlılık `shared/economy.json > drivers` içinde
// yeni alanlar olarak tutulur.

export type ScenarioTag = (typeof ECONOMY.driverScenarioTags)[number];
export type DriverProfile = (typeof ECONOMY.drivers)[number];
export type RiskLevel = "low" | "medium" | "high";

/** Faz 4 kontrat ailesinin örtük senaryo etiketi — hat kimliği Faz 6'ya kadar bu şekilde temsil edilir. */
const CONTRACT_FAMILY_TAG: Record<string, ScenarioTag> = {
  schoolRun: "school",
  industrialShift: "industrial",
  hospitalPriority: "hospital",
  festivalCrowd: "event",
  weatherDuty: "rain",
  expressTrial: "express",
};

export function tagForContractFamily(familyId: string | null | undefined): ScenarioTag | null {
  if (!familyId) return null;
  return CONTRACT_FAMILY_TAG[familyId] ?? null;
}

/** Vardiya başına verim × maaş payından türetilen 0-1 ekonomi skoru (roster içi bağıl). */
export function economyScore(driver: DriverProfile): number {
  const drivers = ECONOMY.drivers;
  const netFactors = drivers.map((d) => d.efficiency * (1 - d.salaryShare));
  const value = driver.efficiency * (1 - driver.salaryShare);
  const min = Math.min(...netFactors);
  const max = Math.max(...netFactors);
  return max > min ? (value - min) / (max - min) : 0.5;
}

export interface AssignmentEstimate {
  score: number;
  grade: string;
  risk: RiskLevel;
  matchedTag: "strong" | "weak" | "neutral";
}

export interface AssignmentContext {
  shiftId: "morning" | "evening" | "night";
  contractFamilyId?: string | null;
  /** Bu vardiyanın bitişindeki toplam çalışma dakikası (yorgunluk için). */
  fatigueMinutesAfterShift: number;
  /** 0-100, önceden bildirilen moral değeri. */
  morale: number;
}

function matchTag(driver: DriverProfile, context: AssignmentContext): "strong" | "weak" | "neutral" {
  const tags: ScenarioTag[] = [];
  const contractTag = tagForContractFamily(context.contractFamilyId);
  if (contractTag) tags.push(contractTag);
  if (context.shiftId === "night") tags.push("night");
  if (tags.some((tag) => (driver.strongTags as string[]).includes(tag))) return "strong";
  if (tags.some((tag) => (driver.weakTags as string[]).includes(tag))) return "weak";
  return "neutral";
}

/** Atama ekranında gösterilen tahmini not/risk. Ödül hesaplamaz — yalnız bilgilendirir. */
export function estimateAssignment(driver: DriverProfile, context: AssignmentContext): AssignmentEstimate {
  const fatigue = ECONOMY.driverFatigue;
  const matched = matchTag(driver, context);
  const tagBonus = matched === "strong" ? 10 : matched === "weak" ? -15 : 0;

  const fatigueRatio = Math.max(
    0,
    Math.min(1, (context.fatigueMinutesAfterShift - fatigue.warningShiftGameMinutes) / (fatigue.maxShiftGameMinutes - fatigue.warningShiftGameMinutes)),
  );
  const moraleRatio = Math.max(0, Math.min(100, context.morale)) / 100;

  const base = driver.punctuality * 20 + driver.service * 20 + driver.reliability * 30 + driver.coolness * 30;
  const fatiguePenalty = fatigueRatio * 20;
  const moralePenalty = (1 - moraleRatio) * 15;

  const score = Math.max(0, Math.min(100, base + tagBonus - fatiguePenalty - moralePenalty));
  const grade = gradeForScore(score);

  const riskScore = (1 - driver.reliability) * 40 + (1 - driver.coolness) * 30 + fatigueRatio * 30;
  const risk: RiskLevel = riskScore < 35 ? "low" : riskScore < 65 ? "medium" : "high";

  return { score: Math.round(score), grade, risk, matchedTag: matched };
}

/** Bir şoförün iki güçlü + bir zayıf senaryosu (bitiş kriteri) — doğrudan veri, hesap yok. */
export function scenarioTags(driver: DriverProfile): { strong: ScenarioTag[]; weak: ScenarioTag[] } {
  return { strong: driver.strongTags as ScenarioTag[], weak: driver.weakTags as ScenarioTag[] };
}
