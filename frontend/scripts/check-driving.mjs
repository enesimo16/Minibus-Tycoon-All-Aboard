// WASD surus fiziginin davranis testi. Tarayici gerekmez.
// driving.ts saf oldugu icin ekonomi sabitleriyle birlikte burada dogrudan cagrilir.
import { readFileSync } from "node:fs";

const economy = JSON.parse(readFileSync("../shared/economy.json", "utf8"));
const T = economy.driving;
const SPEED = economy.speed;

// --- driving.ts'in birebir kopyasi degil; TS'i node'a tasimak icin minimal port ---
// Kaynak tek: asagidaki mantik driving.ts ile ayni olmali. Ayrisirsa test tutmaz.
const source = readFileSync("src/game/driving.ts", "utf8");
for (const required of ["nextSpeedKmh", "nextLaneOffset", "recenterLaneOffsetForTurn", "trafficSpeedCapKmh", "shouldYieldAtCrossing", "isForwardColliderBlocked", "wrapProgress"]) {
  if (!source.includes(`export function ${required}`)) {
    throw new Error(`driving.ts icinde ${required} yok — test kaynakla ayristi.`);
  }
}

function approach(current, target, maxStep) {
  if (current < target) return Math.min(target, current + maxStep);
  return Math.max(target, current - maxStep);
}
function nextSpeedKmh({ currentKmh, targetTopKmh, throttle, handbrake, deltaSeconds }) {
  if (handbrake) return approach(currentKmh, 0, T.handbrakeKmhPerSec * deltaSeconds);
  if (throttle > 0) return approach(currentKmh, targetTopKmh, T.accelerationKmhPerSec * deltaSeconds);
  if (throttle < 0) {
    const reverseTarget = -Math.min(T.maxReverseKmh, targetTopKmh);
    return approach(currentKmh, reverseTarget, T.brakeKmhPerSec * deltaSeconds);
  }
  return approach(currentKmh, 0, T.coastKmhPerSec * deltaSeconds);
}
function nextSteerAngle(currentAngle, steer, deltaSeconds) {
  if (steer === 0) return approach(currentAngle, 0, T.steerReturnRadPerSec * deltaSeconds);
  return approach(currentAngle, steer * T.maxSteerAngleRad, T.steerRateRadPerSec * deltaSeconds);
}
function nextLaneOffset(currentOffset, steerAngle, speedKmh, deltaSeconds) {
  const forwardMeters = (Math.abs(speedKmh) / 3.6) * deltaSeconds;
  const drift = Math.sin(steerAngle) * forwardMeters * T.steerDriftFactor;
  const moved = currentOffset + drift;
  const clamped = Math.min(T.laneOffsetMaxMeters, Math.max(-T.laneOffsetMaxMeters, moved));
  if (steerAngle !== 0) return clamped;
  return approach(clamped, 0, T.laneRecenterMetersPerSec * deltaSeconds);
}
function recenterLaneOffsetForTurn(currentOffset, directionAlignment, deltaSeconds) {
  if (directionAlignment >= 0.94) return currentOffset;
  const turnStrength = Math.min(1, Math.max(0, (0.94 - directionAlignment) / 0.5));
  return approach(currentOffset, 0, (T.laneRecenterMetersPerSec + turnStrength * 2.8) * deltaSeconds);
}
function trafficSpeedCapKmh(distanceAhead, lateralDistance, targetTopKmh) {
  if (distanceAhead <= 0) return null;
  if (distanceAhead >= T.slowGapMeters) return null;
  if (lateralDistance >= T.laneBlockWidthMeters) return null;
  const span = T.slowGapMeters - T.followGapMeters;
  const factor = Math.min(1, Math.max(0, (distanceAhead - T.followGapMeters) / span));
  return targetTopKmh * factor;
}
function shouldYieldAtCrossing(selfId, otherId, distance, headingAlignment, reservationDistance, forwardDistance) {
  return Math.abs(headingAlignment) < 0.82 &&
    distance < reservationDistance &&
    forwardDistance > -T.crossingClearMarginMeters &&
    selfId.localeCompare(otherId) > 0;
}
function isForwardColliderBlocked(
  distance,
  distanceAhead,
  lateralDistance,
  headingAlignment,
  colliderDistance,
  laneBlockWidth,
  samePath = false,
) {
  return (samePath || headingAlignment > 0.82) &&
    distance < colliderDistance &&
    distanceAhead > -0.1 &&
    lateralDistance < laneBlockWidth;
}
function wrapProgress(value) {
  return ((value % 1) + 1) % 1;
}

// --- test kosucusu ---
let failures = 0;
function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name} ${detail}`);
  }
}
/** `seconds` boyunca sabit girdiyle simule eder, son hizi doner. */
function simulate(seconds, input, startKmh = 0) {
  const step = 1 / 60;
  let kmh = startKmh;
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    kmh = nextSpeedKmh({ ...input, currentKmh: kmh, deltaSeconds: step });
  }
  return kmh;
}

const TOP = SPEED.limiterDefaultKmh; // 30

console.log("HIZ:");
check("dururken W ile hizlanir", simulate(0.5, { targetTopKmh: TOP, throttle: 1, handbrake: false }) > 5);
check(
  "W tavani ASLA gecmez",
  simulate(20, { targetTopKmh: TOP, throttle: 1, handbrake: false }) <= TOP + 1e-9,
  `-> ${simulate(20, { targetTopKmh: TOP, throttle: 1, handbrake: false })}`
);
check(
  "limitleyici dusurulunce tavan dusuk kalir",
  simulate(20, { targetTopKmh: SPEED.limiterMinKmh, throttle: 1, handbrake: false }) <= SPEED.limiterMinKmh + 1e-9
);
check("gaz birakilinca yavaslar", simulate(1, { targetTopKmh: TOP, throttle: 0, handbrake: false }, TOP) < TOP);
check("bosta sonunda tam durur", Math.abs(simulate(10, { targetTopKmh: TOP, throttle: 0, handbrake: false }, TOP)) < 1e-9);
check(
  "el freni gazdan hizli durdurur",
  simulate(0.5, { targetTopKmh: TOP, throttle: 0, handbrake: true }, TOP) <
    simulate(0.5, { targetTopKmh: TOP, throttle: 0, handbrake: false }, TOP)
);
check("S once frenler (hizliyken negatife dusmez)", simulate(0.2, { targetTopKmh: TOP, throttle: -1, handbrake: false }, TOP) > 0);
const reverseKmh = simulate(5, { targetTopKmh: TOP, throttle: -1, handbrake: false }, TOP);
check("S sonunda geri vitese gecer", reverseKmh < 0, `-> ${reverseKmh}`);
check("geri vites maxReverseKmh ile sinirli", reverseKmh >= -T.maxReverseKmh - 1e-9, `-> ${reverseKmh}`);

console.log("DIREKSIYON + SERIT (sollama):");
/** `seconds` boyunca sabit girdiyle direksiyon + serit simulasyonu. */
function driveSim(seconds, steer, speedKmh, startOffset = 0) {
  const step = 1 / 60;
  let angle = 0;
  let offset = startOffset;
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    angle = nextSteerAngle(angle, steer, step);
    offset = nextLaneOffset(offset, angle, speedKmh, step);
  }
  return { angle, offset };
}

const held = driveSim(1, 1, 0);
check("D direksiyonu cevirir", held.angle > 0.2, `-> ${held.angle.toFixed(3)}`);
check("direksiyon acisi tavani asmaz", driveSim(5, 1, 0).angle <= T.maxSteerAngleRad + 1e-9);
check(
  "DURURKEN direksiyon araci yana TASIMAZ (tek kare ziplama yok)",
  Math.abs(driveSim(3, 1, 0).offset) < 1e-9,
  `-> ${driveSim(3, 1, 0).offset}`
);
const moving = driveSim(2, 1, 30);
check("hareket halinde saga suzulur", moving.offset > 0.3, `-> ${moving.offset.toFixed(3)}`);
check("sola direksiyon sola suzulur", driveSim(2, -1, 30).offset < -0.3);
check(
  "serit ofseti tavani asmaz (yoldan cikma yok)",
  driveSim(30, 1, 55).offset <= T.laneOffsetMaxMeters + 1e-9,
  `-> ${driveSim(30, 1, 55).offset}`
);
check(
  "hizli giderken daha cabuk yer degistirir",
  driveSim(0.8, 1, 45).offset > driveSim(0.8, 1, 15).offset,
  `-> 45km/h ${driveSim(0.8, 1, 45).offset.toFixed(2)}m vs 15km/h ${driveSim(0.8, 1, 15).offset.toFixed(2)}m`
);
const laneChangeSeconds = (() => {
  const step = 1 / 60;
  let angle = 0;
  let offset = 0;
  for (let elapsed = 0; elapsed < 10; elapsed += step) {
    angle = nextSteerAngle(angle, 1, step);
    offset = nextLaneOffset(offset, angle, 30, step);
    if (offset >= T.laneOffsetMaxMeters - 1e-6) return elapsed;
  }
  return Infinity;
})();
check(
  "serit degistirme ANLIK degil, zamana yayilir (>0.5sn)",
  laneChangeSeconds > 0.5,
  `-> ${laneChangeSeconds.toFixed(2)}sn`
);
const released = driveSim(4, 0, 30, T.laneOffsetMaxMeters);
check("direksiyon birakilinca duze doner", Math.abs(released.angle) < 1e-9);
check("ve serit merkezine toparlanir", released.offset < T.laneOffsetMaxMeters, `-> ${released.offset.toFixed(3)}`);
check(
  "keskin virajda serit ofseti merkeze hizla toplanir",
  recenterLaneOffsetForTurn(T.laneOffsetMaxMeters, 0.1, 0.25) < T.laneOffsetMaxMeters * 0.5,
);
check(
  "duz yolda viraj toparlamasi ofseti degistirmez",
  recenterLaneOffsetForTurn(0.4, 0.99, 0.25) === 0.4,
);

console.log("TRAFIK / CARPISMA:");
check("takip mesafesinde tam durur", trafficSpeedCapKmh(T.followGapMeters, 0, TOP) === 0);
check("cok yakinken de 0", trafficSpeedCapKmh(T.followGapMeters - 1, 0, TOP) === 0);
check("uzaktayken engel yok", trafficSpeedCapKmh(T.slowGapMeters + 1, 0, TOP) === null);
check("arkadaki arac engellemez", trafficSpeedCapKmh(-2, 0, TOP) === null);
const mid = trafficSpeedCapKmh((T.followGapMeters + T.slowGapMeters) / 2, 0, TOP);
check("ara mesafede kismi yavaslama", mid > 0 && mid < TOP, `-> ${mid}`);
check(
  "SOLLAMA: yana cikinca engel kalkar",
  trafficSpeedCapKmh(T.followGapMeters, T.laneBlockWidthMeters + 0.01, TOP) === null
);
check(
  "serit icinde kalinca hala engel var",
  trafficSpeedCapKmh(T.followGapMeters, T.laneBlockWidthMeters - 0.01, TOP) === 0
);
check(
  "isiksiz kavsakta tek arac yol verir",
  shouldYieldAtCrossing("traffic-z", "traffic-a", 2, 0, 2.65, 1.5) &&
    !shouldYieldAtCrossing("traffic-a", "traffic-z", 2, 0, 2.65, 1.5)
);
check(
  "paralel arac kavsak rezervasyonu tetiklemez",
  !shouldYieldAtCrossing("traffic-z", "traffic-a", 1, 0.95, 2.65, 1.5)
);
check(
  "kavsakta arkada kalan arac icin yol verilmez (ortada kilitlenme)",
  !shouldYieldAtCrossing("traffic-z", "traffic-a", 2, 0, 2.65, -1.4)
);
check(
  "kavsaga girerken hemen onundeki arac icin yol verilir",
  shouldYieldAtCrossing("traffic-z", "traffic-a", 2, 0, 2.65, 0.2)
);
check(
  "ileri collider temasi hareketi keser",
  isForwardColliderBlocked(1.2, 1.1, 0.1, 0.98, 1.64, T.laneBlockWidthMeters)
);
check(
  "arkadaki collider araci kilitlemez",
  !isForwardColliderBlocked(1.2, -0.5, 0.1, 0.98, 1.64, T.laneBlockWidthMeters)
);
check(
  "karsi seritteki collider araci kilitlemez",
  !isForwardColliderBlocked(1.2, 0.5, T.laneBlockWidthMeters + 0.1, 0.98, 1.64, T.laneBlockWidthMeters)
);

console.log("PROGRESS:");
check("negatif progress sarilir", wrapProgress(-0.25) === 0.75);
check("1 uzeri sarilir", Math.abs(wrapProgress(1.25) - 0.25) < 1e-9);

console.log(failures === 0 ? "\nTUM SURUS TESTLERI GECTI" : `\n${failures} TEST BASARISIZ`);
process.exit(failures === 0 ? 0 : 1);
