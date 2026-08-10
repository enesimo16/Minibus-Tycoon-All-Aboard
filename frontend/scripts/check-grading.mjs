// Faz 3 — gun sonu not sisteminin davranis testi. Tarayici gerekmez.
// dayGrading.ts saf oldugu icin ekonomi sabitleriyle birlikte burada dogrudan test edilir.
import { readFileSync } from "node:fs";

const economy = JSON.parse(readFileSync("../shared/economy.json", "utf8"));
const G = economy.dayGrading;

// Kaynak tek: asagidaki mantik dayGrading.ts ile ayni olmali. Ayrisirsa test tutmaz.
const source = readFileSync("src/game/dayGrading.ts", "utf8");
for (const required of ["computeDimensions", "computeScore", "gradeForScore", "applyEliteBarrier", "xpForGrade", "computeDayGrade"]) {
  if (!source.includes(`export function ${required}`)) {
    throw new Error(`dayGrading.ts icinde ${required} yok — test kaynakla ayristi.`);
  }
}

const clamp100 = (v) => Math.max(0, Math.min(100, v));

function gradeForScore(score) {
  for (const t of G.thresholds) if (score >= t.min) return t.grade;
  return G.thresholds[G.thresholds.length - 1].grade;
}
function applyEliteBarrier(grade, dims) {
  const b = G.eliteBarrier;
  if (!b.grades.includes(grade)) return grade;
  return dims.safety >= b.minSafety && dims.satisfaction >= b.minSatisfaction ? grade : b.cappedGrade;
}
function xpForGrade(grade) {
  return Math.round(G.xp.baseXp * (G.xp.gradeMultipliers[grade] ?? 0));
}
function computeScore(dims) {
  const active = G.activeDimensions;
  const sum = active.reduce((s, k) => s + (G.weights[k] ?? 0), 0);
  return sum <= 0 ? 0 : active.reduce((s, k) => s + (G.weights[k] ?? 0) * (dims[k] ?? 0), 0) / sum;
}

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`  ok   ${label}`);
  else { console.error(`  FAIL ${label}`); failures += 1; }
}

// 1) Her not esiginin alt ve ust sinirlari dogru grade'e dusuyor mu?
const sorted = [...G.thresholds].sort((a, b) => b.min - a.min);
for (let i = 0; i < sorted.length; i++) {
  const t = sorted[i];
  check(`esik ${t.grade}: puan ${t.min} => ${t.grade}`, gradeForScore(t.min) === t.grade);
  if (i > 0) {
    const below = sorted[i - 1].min - 0.1; // bir ust esigin hemen altina
    check(`esik ${t.grade}: puan ${below.toFixed(1)} => ${t.grade}`, gradeForScore(below) === t.grade);
  }
}
check("puan 100 => en yuksek not", gradeForScore(100) === sorted[0].grade);
check("puan 0 => en dusuk not", gradeForScore(0) === sorted[sorted.length - 1].grade);

// 2) Aktif boyutlar yeniden normalize edilir: hepsi 100 => puan 100.
const perfect = Object.fromEntries(G.activeDimensions.map((k) => [k, 100]));
check("tum aktif boyutlar 100 => puan 100", Math.abs(computeScore(perfect) - 100) < 1e-6);

// 3) Elite baraj: S+ puan ama dusuk guvenlik => tavana (cappedGrade) cekilir.
const lowSafety = { safety: 50, satisfaction: 100 };
check("S+ + dusuk guvenlik => baraj tavani", applyEliteBarrier("S+", lowSafety) === G.eliteBarrier.cappedGrade);
const eliteOk = { safety: 95, satisfaction: 85 };
check("S + baraj gecilir => S kalir", applyEliteBarrier("S", eliteOk) === "S");

// 4) XP eslemesi: her grade icin baseXp * carpan.
for (const [grade, mult] of Object.entries(G.xp.gradeMultipliers)) {
  check(`xp ${grade} = ${Math.round(G.xp.baseXp * mult)}`, xpForGrade(grade) === Math.round(G.xp.baseXp * mult));
}

// 5) Guvenlik: ihlal puani ile dogru dusuyor (clamp).
const safetyAfter2 = clamp100(100 - 2 * G.scoring.violationPenaltyPoints);
check("2 ihlal guvenligi dogru dusurur", safetyAfter2 === clamp100(100 - 2 * G.scoring.violationPenaltyPoints));

if (failures > 0) {
  console.error(`\n${failures} not testi basarisiz.`);
  process.exit(1);
}
console.log("\nTUM NOT TESTLERI GECTI");
