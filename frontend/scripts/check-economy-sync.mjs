// Hat ve dolmus fiyatlari iki yerde tanimli: frontend (oyun ici gosterim) ve
// backend EconomyConstants.cs (tahsilat otoritesi). Ayrisirlarsa oyuncuya bir
// fiyat gosterilip baska bir tutar kesilir. Bu betik ikisini karsilastirir.
import { readFileSync } from "node:fs";

const routeSource = readFileSync("src/game/route.ts", "utf8");
const busSource = readFileSync("src/game/content/busCatalog.ts", "utf8");
const backendSource = readFileSync("../backend/FullFilled.Api/EconomyConstants.cs", "utf8");

function parseFrontendPrices(source, priceField) {
  const entries = new Map();
  const blocks = source.split(/\n\s*\{\s*\n/).slice(1);
  for (const block of blocks) {
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    const price = block.match(new RegExp(`${priceField}:\\s*([0-9_]+)`))?.[1];
    if (id && price !== undefined) entries.set(id, Number(price.replace(/_/g, "")));
  }
  return entries;
}

function parseBackendPrices(dictionaryName) {
  const start = backendSource.indexOf(`${dictionaryName} = new()`);
  if (start === -1) throw new Error(`${dictionaryName} backend'de bulunamadi`);
  const body = backendSource.slice(start, backendSource.indexOf("};", start));
  const entries = new Map();
  for (const match of body.matchAll(/\["([^"]+)"\]\s*=\s*([0-9_]+)m/g)) {
    entries.set(match[1], Number(match[2].replace(/_/g, "")));
  }
  return entries;
}

let failures = 0;
function compare(label, frontend, backend) {
  for (const [id, price] of frontend) {
    if (!backend.has(id)) {
      console.error(`  FAIL ${label}: "${id}" backend'de yok`);
      failures += 1;
    } else if (backend.get(id) !== price) {
      console.error(`  FAIL ${label}: "${id}" frontend ${price} != backend ${backend.get(id)}`);
      failures += 1;
    }
  }
  for (const id of backend.keys()) {
    if (!frontend.has(id)) {
      console.error(`  FAIL ${label}: "${id}" backend'de var ama frontend'de yok`);
      failures += 1;
    }
  }
  if (failures === 0) console.log(`  ok   ${label}: ${frontend.size} kayit eslesti`);
}

compare("hat acilis bedelleri", parseFrontendPrices(routeSource, "unlockCost"), parseBackendPrices("RouteUnlockCosts"));
compare("dolmus fiyatlari", parseFrontendPrices(busSource, "price"), parseBackendPrices("BusCatalogPrices"));

// Faz 2 — Ekonomi 2.0 butunluk kontrolu: backend EconomyConstants.Validate() ile ayni
// degismezleri CI'da erken yakalar. Bozuk/dengesiz economy.json build'i durdurur.
const economy = JSON.parse(readFileSync("../shared/economy.json", "utf8"));

function requireInvariant(label, condition) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.error(`  FAIL invariant: ${label}`);
    failures += 1;
  }
}

function positiveIncreasing(list) {
  return (
    Array.isArray(list) &&
    list.length > 0 &&
    list.every((v, i) => v > 0 && (i === 0 || v >= list[i - 1]))
  );
}

requireInvariant("upgrades.motorCosts pozitif ve kademeli", positiveIncreasing(economy.upgrades.motorCosts));
requireInvariant("upgrades.seatCosts pozitif ve kademeli", positiveIncreasing(economy.upgrades.seatCosts));
requireInvariant("upgrades.soundCosts pozitif ve kademeli", positiveIncreasing(economy.upgrades.soundCosts));
requireInvariant("extraBuses.purchaseCosts pozitif ve kademeli", positiveIncreasing(economy.extraBuses.purchaseCosts));
requireInvariant("fare.full pozitif", economy.fare.full > 0);
requireInvariant("mainBusDailyGrossIncome pozitif", economy.shifts.mainBusDailyGrossIncome > 0);
requireInvariant(
  "her sofor efficiency 0-1 ve salaryShare [0,1)",
  economy.drivers.every((d) => d.efficiency > 0 && d.efficiency <= 1 && d.salaryShare >= 0 && d.salaryShare < 1),
);
requireInvariant(
  "levelThresholds artan ve maxLevel uzunlugunda",
  economy.progression.levelThresholds.length === economy.progression.maxLevel &&
    economy.progression.levelThresholds[0] === 0 &&
    economy.progression.levelThresholds.every((v, i) => i === 0 || v > economy.progression.levelThresholds[i - 1]),
);

// Amortisman hesaplanabilirlik: ortalama soforle ek dolmus vardiya basina net gelir uretmeli,
// aksi halde oyuncuya gosterilecek "kac vardiyada amorti" degeri olmaz (kaide kirilir).
const drivers = economy.drivers;
const avgEff = drivers.reduce((s, d) => s + d.efficiency, 0) / drivers.length;
const avgSalary = drivers.reduce((s, d) => s + (d.dailySalary ?? d.hireCost), 0) / drivers.length;
const extraBusNetPerShift = (economy.extraBuses.dailyGrossIncome / 3) * avgEff - avgSalary;
requireInvariant("ek dolmus ortalama soforle net gelir uretir (amorti hesaplanabilir)", extraBusNetPerShift > 0);

if (failures > 0) {
  console.error(`\n${failures} fiyat uyusmazligi — frontend ile backend ayrismis.`);
  process.exit(1);
}
console.log("\nEKONOMI SENKRON: frontend ve backend fiyatlari ayni.");
