import { ECONOMY } from "./economy";

// WASD surus fizigi — SAF fonksiyonlar. GameCanvas'in useFrame'i yalnizca bunlari
// cagirir; boylece mantik tarayici olmadan test edilebilir (npm run check:driving).

export interface DrivingTuning {
  accelerationKmhPerSec: number;
  brakeKmhPerSec: number;
  coastKmhPerSec: number;
  handbrakeKmhPerSec: number;
  maxReverseKmh: number;
  laneOffsetMaxMeters: number;
  laneRecenterMetersPerSec: number;
  maxSteerAngleRad: number;
  steerRateRadPerSec: number;
  steerReturnRadPerSec: number;
  steerDriftFactor: number;
  followGapMeters: number;
  slowGapMeters: number;
  laneBlockWidthMeters: number;
}

export const DRIVING_TUNING: DrivingTuning = ECONOMY.driving;

/**
 * Kavşağı boşaltma payı: bu kadar metre geride kalmış bir araç için yol verilmez.
 * Yoksa kavşağın ortasındaki araç arkasındakine fren yapıp orada kilitlenir.
 */
const CROSSING_CLEAR_MARGIN_METERS = ECONOMY.driving.crossingClearMarginMeters;

/** Bir degeri hedefe en fazla `maxStep` kadar yaklastirir (ivme/fren rampasi). */
export function approach(current: number, target: number, maxStep: number): number {
  if (current < target) return Math.min(target, current + maxStep);
  return Math.max(target, current - maxStep);
}

/** Progress'i [0,1) araligina sarar — geri viteste negatife dusmesin. */
export function wrapProgress(value: number): number {
  return ((value % 1) + 1) % 1;
}

export interface SpeedStepInput {
  currentKmh: number;
  /** Aracin ulasabilecegi tavan (motor x sofor x plan x limitleyici). */
  targetTopKmh: number;
  /** W = +1, S = -1, bosta 0. */
  throttle: number;
  handbrake: boolean;
  deltaSeconds: number;
  tuning?: DrivingTuning;
}

/**
 * Oyuncu surusunde bir sonraki hiz. Kurallar:
 * - El freni her seyi ezer ve 0'a getirir.
 * - W tavan hiza dogru ivmelenir, tavani ASLA gecmez.
 * - S once frenler, sifiri gecince geri vitese doner (maxReverseKmh ile sinirli).
 * - Girdi yoksa surtunmeyle 0'a yavaslar.
 */
export function nextSpeedKmh(input: SpeedStepInput): number {
  const tuning = input.tuning ?? DRIVING_TUNING;
  const { currentKmh, targetTopKmh, throttle, handbrake, deltaSeconds } = input;

  if (handbrake) {
    return approach(currentKmh, 0, tuning.handbrakeKmhPerSec * deltaSeconds);
  }
  if (throttle > 0) {
    return approach(currentKmh, targetTopKmh, tuning.accelerationKmhPerSec * deltaSeconds);
  }
  if (throttle < 0) {
    const reverseTarget = -Math.min(tuning.maxReverseKmh, targetTopKmh);
    return approach(currentKmh, reverseTarget, tuning.brakeKmhPerSec * deltaSeconds);
  }
  return approach(currentKmh, 0, tuning.coastKmhPerSec * deltaSeconds);
}

/** Sofor kiralandiginda hiz oyuncu girdisine bakmadan tavana yumusak yaklasir. */
export function autoPilotSpeedKmh(
  currentKmh: number,
  targetTopKmh: number,
  deltaSeconds: number
): number {
  return currentKmh + (targetTopKmh - currentKmh) * (1 - Math.exp(-3 * deltaSeconds));
}

/**
 * Direksiyon acisi. A/D tekerlegi cevirir, birakinca yaylanarak duze doner.
 * Aci dogrudan konum DEGISTIRMEZ — sadece aracin ne kadar dondugunu tutar.
 */
export function nextSteerAngle(
  currentAngle: number,
  steer: number,
  deltaSeconds: number,
  tuning: DrivingTuning = DRIVING_TUNING
): number {
  if (steer === 0) {
    return approach(currentAngle, 0, tuning.steerReturnRadPerSec * deltaSeconds);
  }
  const target = steer * tuning.maxSteerAngleRad;
  return approach(currentAngle, target, tuning.steerRateRadPerSec * deltaSeconds);
}

/**
 * Serit ofseti. Gercek araç gibi: yana kayma HIZLA orantilidir — dururken
 * direksiyon cevirmek araci yana tasimaz, ancak ilerlerken suzulur.
 * Ofset laneOffsetMaxMeters ile sinirlidir, yani arac yoldan cikamaz.
 */
export function nextLaneOffset(
  currentOffset: number,
  steerAngle: number,
  speedKmh: number,
  deltaSeconds: number,
  tuning: DrivingTuning = DRIVING_TUNING
): number {
  // Yana kayma = sin(direksiyon acisi) x bu karede ILERI gidilen mesafe x katsayi.
  // Hiza baglidir: dururken kayma yok, hizli giderken serit degistirmek daha cabuk.
  const forwardMeters = (Math.abs(speedKmh) / 3.6) * deltaSeconds;
  const drift = Math.sin(steerAngle) * forwardMeters * tuning.steerDriftFactor;
  const moved = currentOffset + drift;
  const clamped = Math.min(tuning.laneOffsetMaxMeters, Math.max(-tuning.laneOffsetMaxMeters, moved));
  if (steerAngle !== 0) return clamped;
  // Direksiyon duzken serit merkezine yavasca toparlanir.
  return approach(clamped, 0, tuning.laneRecenterMetersPerSec * deltaSeconds);
}

/**
 * Keskin virajda arac serit icinde yana asili kalmasin diye ofseti merkeze toplar.
 * `directionAlignment` simdiki yol yonu ile 3-4 metre ilerideki yol yonunun dot
 * carpimidir: 1 duz yol, 0 yaklasik 90 derece virajdir.
 */
export function recenterLaneOffsetForTurn(
  currentOffset: number,
  directionAlignment: number,
  deltaSeconds: number,
  tuning: DrivingTuning = DRIVING_TUNING,
): number {
  if (directionAlignment >= 0.94) return currentOffset;
  const turnStrength = Math.min(1, Math.max(0, (0.94 - directionAlignment) / 0.5));
  const recenterRate = tuning.laneRecenterMetersPerSec + turnStrength * 2.8;
  return approach(currentOffset, 0, recenterRate * deltaSeconds);
}

/**
 * Onundeki arac icin izin verilen hiz. followGap'te tam durur, slowGap'te serbest.
 * Yanal mesafe laneBlockWidth'i asarsa engel YOKTUR — sollama tam olarak budur.
 * Engel yoksa null doner (cagiran hizi degistirmez).
 */
export function trafficSpeedCapKmh(
  distanceAhead: number,
  lateralDistance: number,
  targetTopKmh: number,
  tuning: DrivingTuning = DRIVING_TUNING
): number | null {
  if (distanceAhead <= 0) return null;
  if (distanceAhead >= tuning.slowGapMeters) return null;
  if (lateralDistance >= tuning.laneBlockWidthMeters) return null;
  const span = tuning.slowGapMeters - tuning.followGapMeters;
  const factor = Math.min(1, Math.max(0, (distanceAhead - tuning.followGapMeters) / span));
  return targetTopKmh * factor;
}

/**
 * Isiksiz kavsaklarda iki yonun de ayni anda durup kilitlenmesini engeller.
 * Kimligi alfabetik olarak buyuk olan arac yol verir; sonuc her istemcide aynidir.
 */
export function shouldYieldAtCrossing(
  selfId: string,
  otherId: string,
  distance: number,
  headingAlignment: number,
  reservationDistance: number,
  forwardDistance: number,
): boolean {
  return (
    Math.abs(headingAlignment) < 0.82 &&
    distance < reservationDistance &&
    // Kavşağa GİRMEDEN önce yol verilir. Arkada kalan bir araç için fren yapmak,
    // aracın kavşağın tam ortasında durup kilitlenmesine yol açıyordu (diğerleri
    // de içinden geçiyordu) — yol verme yalnızca önümüzdeki/yanımızdaki araç için.
    forwardDistance > -CROSSING_CLEAR_MARGIN_METERS &&
    selfId.localeCompare(otherId) > 0
  );
}

/** Ayni seritteki iki collider'in bir sonraki karede cakisip cakismadigi. */
export function isForwardColliderBlocked(
  distance: number,
  distanceAhead: number,
  lateralDistance: number,
  headingAlignment: number,
  colliderDistance: number,
  laneBlockWidth: number,
  samePath = false,
): boolean {
  return (
    (samePath || headingAlignment > 0.82) &&
    distance < colliderDistance &&
    distanceAhead > -0.1 &&
    lateralDistance < laneBlockWidth
  );
}
