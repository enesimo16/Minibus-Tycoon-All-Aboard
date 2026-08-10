// tr.ts ve en.ts anahtar kumelerinin birebir esit oldugunu dogrular.
// Sozlukler duz `export const X = { ... } as const;` oldugu icin regex ile okumak yeterli;
// TypeScript derleyicisine ihtiyac yok (CI'da hizli calissin diye).
import { readFileSync } from "node:fs";

function readKeys(path) {
  const source = readFileSync(path, "utf8");
  return new Set([...source.matchAll(/^\s{2}"([^"]+)":/gm)].map((match) => match[1]));
}

const tr = readKeys("src/game/i18n/tr.ts");
const en = readKeys("src/game/i18n/en.ts");

const missingInEn = [...tr].filter((key) => !en.has(key));
const missingInTr = [...en].filter((key) => !tr.has(key));

if (missingInEn.length || missingInTr.length) {
  if (missingInEn.length) console.error("en.ts eksik:", missingInEn.join(", "));
  if (missingInTr.length) console.error("tr.ts eksik:", missingInTr.join(", "));
  process.exit(1);
}

// Replik havuzundaki her anahtar sozlukte gercekten var mi?
// Havuza anahtar eklenip ceviri unutulursa oyunda ham anahtar gorunurdu.
const poolSource = readFileSync("src/game/content/passengerLines.ts", "utf8");
const poolKeys = [...poolSource.matchAll(/"(pline\.[^"]+)"/g)].map((m) => m[1]);
const orphanKeys = poolKeys.filter((key) => !tr.has(key));
if (orphanKeys.length) {
  console.error("passengerLines.ts'te sozlukte olmayan anahtar:", orphanKeys.join(", "));
  process.exit(1);
}

console.log(`i18n OK — ${tr.size} anahtar, iki dilde eksiksiz. Replik havuzu: ${poolKeys.length} anahtar dogrulandi.`);
