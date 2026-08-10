import { ECONOMY } from "./economy";
import type { ShiftSlotId } from "./store";

// Faz 2 — Ekonomi 2.0: amortisman hesabı.
// Tasarım kuralı 3: her satın almanın tahmini geri ödeme süresi oyuncuya gösterilir.
// Formül (faz-plani.md): Amortisman vardiyası = fiyat / yatırımın vardiya başına net ek geliri.
// Bir oyun günü üç vardiyadan oluşur (sabah/akşam/gece).

export const MAIN_BUS_ID = "main";
const SHIFTS_PER_DAY = 3;

type Driver = (typeof ECONOMY.drivers)[number];

export function getDriverDailySalary(driver: Driver): number {
  return (driver.dailySalary as number | undefined) ?? driver.hireCost;
}

export function getBusDailyGross(busId: string): number {
  if (busId === MAIN_BUS_ID) return ECONOMY.shifts.mainBusDailyGrossIncome as number;
  return (ECONOMY.extraBuses.dailyGrossIncome as number | undefined) ?? ECONOMY.extraBuses.idleIncomePerSecond * 720;
}

/** Belirli bir şoförle tek vardiyada beklenen net gelir (maaş düşülmüş). */
export function estimateShiftNet(busId: string, shiftId: ShiftSlotId, driverId?: string | null): number {
  if (!driverId) return 0;
  const driver = ECONOMY.drivers.find((d) => d.id === driverId);
  if (!driver) return 0;
  const nightMultiplier = shiftId === "night" ? (ECONOMY.shifts.nightIncomeMultiplier as number) : 1;
  const gross = (getBusDailyGross(busId) / SHIFTS_PER_DAY) * nightMultiplier;
  return Math.max(0, gross * driver.efficiency - getDriverDailySalary(driver));
}

/**
 * Şoför henüz atanmadan amortisman göstermek için roster ortalaması kullanılır.
 * Böylece "hangi şoförü tutarsam" belirsizliği tek, kararlı bir tahmine indirilir.
 */
export function averageDriverNetPerShift(busId: string): number {
  const drivers = ECONOMY.drivers;
  if (drivers.length === 0) return 0;
  const grossPerShift = getBusDailyGross(busId) / SHIFTS_PER_DAY;
  const avgEfficiency = drivers.reduce((sum, d) => sum + d.efficiency, 0) / drivers.length;
  const avgSalary = drivers.reduce((sum, d) => sum + getDriverDailySalary(d), 0) / drivers.length;
  return Math.max(0, grossPerShift * avgEfficiency - avgSalary);
}

/**
 * Bir yatırımın kaç vardiyada kendini ödediği. Vardiya başına net ek gelir sıfır veya
 * negatifse (yatırım kendini ödemiyorsa) null döner — oyuncuya "amorti yok" gösterilir.
 */
export function paybackShifts(cost: number, netPerShift: number): number | null {
  if (netPerShift <= 0) return null;
  return Math.ceil(cost / netPerShift);
}

/** Ek dolmuş satın alımının, ortalama şoförle tahmini amortisman vardiyası. */
export function extraBusPaybackShifts(): number | null {
  const cost = (ECONOMY.extraBuses.purchaseCosts as number[])[0] ?? 0;
  return paybackShifts(cost, averageDriverNetPerShift(""));
}

/**
 * Garaj kataloğundaki (Faz 4) bir aracın tahmini amortisman vardiyası. Bu araçlar oyuncunun
 * SÜRDÜĞÜ aracı değiştirir (ek dolmuş değil), değerleri koltuk artışından gelir: gelir,
 * koltuk sayısıyla kabaca orantılı kabul edilip mevcut araca göre EK net gelir hesaplanır.
 * Kaba bir tahmindir — kural 3 ("her satın almanın geri ödemesi gösterilir") için yeterlidir.
 */
export function catalogBusPaybackShifts(price: number, seats: number, currentSeats: number): number | null {
  if (price <= 0) return null;
  const baselineNetPerShift = averageDriverNetPerShift(MAIN_BUS_ID);
  const seatRatio = seats / Math.max(1, currentSeats);
  const extraNetPerShift = baselineNetPerShift * (seatRatio - 1);
  return paybackShifts(price, extraNetPerShift);
}

/** İkinci hattın (açılış + şoför) toplam yatırımına göre amortisman vardiyası. */
export function secondLinePaybackShifts(): number | null {
  const cost = (ECONOMY.secondLine.openCost as number) + (ECONOMY.secondLine.driverHireCost as number);
  const netPerShift = ((ECONOMY.secondLine.dailyGrossIncome as number) / SHIFTS_PER_DAY) * averageEfficiency();
  return paybackShifts(cost, netPerShift);
}

function averageEfficiency(): number {
  const drivers = ECONOMY.drivers;
  if (drivers.length === 0) return 0;
  return drivers.reduce((sum, d) => sum + d.efficiency, 0) / drivers.length;
}
