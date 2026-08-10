// Yolcu replik havuzu. Degerler i18n ANAHTARIDIR — metinler tr.ts/en.ts'te durur,
// boylece her replik iki dilde de vardir (npm run check:i18n bunu dogrular).
// Ayni replik ust uste cikmasin diye son gosterilenler kucuk bir halkada tutulur.

export type PassengerLineCategory =
  | "overflow"
  | "student"
  | "change"
  | "offroute"
  | "dropoffStop"
  | "dropoffRoadside";

export const PASSENGER_LINES: Record<PassengerLineCategory, readonly string[]> = {
  overflow: ["pline.overflow.1", "pline.overflow.2", "pline.overflow.3", "pline.overflow.4", "pline.overflow.5"],
  student: ["pline.student.1", "pline.student.2", "pline.student.3", "pline.student.4", "pline.student.5"],
  change: ["pline.change.1", "pline.change.2", "pline.change.3", "pline.change.4", "pline.change.5"],
  offroute: ["pline.offroute.1", "pline.offroute.2", "pline.offroute.3", "pline.offroute.4", "pline.offroute.5"],
  dropoffStop: [
    "pline.dropoffStop.1",
    "pline.dropoffStop.2",
    "pline.dropoffStop.3",
    "pline.dropoffStop.4",
    "pline.dropoffStop.5",
  ],
  dropoffRoadside: [
    "pline.dropoffRoadside.1",
    "pline.dropoffRoadside.2",
    "pline.dropoffRoadside.3",
    "pline.dropoffRoadside.4",
    "pline.dropoffRoadside.5",
  ],
};

/** Son gosterilen replikler — bu kadarı tekrar edilmez. */
const RECENT_MEMORY = 4;
const recentKeys: string[] = [];

export function pickPassengerLine(category: PassengerLineCategory): string {
  const pool = PASSENGER_LINES[category];
  const fresh = pool.filter((key) => !recentKeys.includes(key));
  // Havuz hafizadan kucukse taze secenek kalmayabilir; o zaman tum havuza doneriz.
  const candidates = fresh.length > 0 ? fresh : pool;
  const key = candidates[Math.floor(Math.random() * candidates.length)];

  recentKeys.push(key);
  if (recentKeys.length > RECENT_MEMORY) recentKeys.shift();
  return key;
}
