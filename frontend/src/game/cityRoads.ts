import cityData from "./content/mvpCityData.json";

// Serbest sürüşte (gezinti modu) aracın yoldan çıkmasını engelleyen SAF yardımcılar.
// Şehir bir ızgara: dikey yollar `roadAxesX` üzerinde, yatay yollar `roadAxesZ` üzerinde
// uzanır. Bir nokta, herhangi bir yol ekseninin asfalt yarı genişliği içindeyse yoldadır
// (kavşaklar iki koşulun da sağlandığı yerlerdir, ayrıca ele almak gerekmez).
// Kaynak: content/mvpCityData.json > grid ("Asfalt kenari = eksen +/- laneWidth").

const GRID = cityData.grid;
const ROAD_AXES_X: readonly number[] = GRID.roadAxesX;
const ROAD_AXES_Z: readonly number[] = GRID.roadAxesZ;
/** Eksenden asfalt kenarına mesafe. Araç gövdesi biraz taşabilsin diye küçük pay bırakılır. */
const ROAD_HALF_WIDTH = GRID.laneWidth;
const CITY_LIMIT = GRID.halfExtent;

function nearAnyAxis(value: number, axes: readonly number[], halfWidth: number): boolean {
  for (const axis of axes) {
    if (Math.abs(value - axis) <= halfWidth) return true;
  }
  return false;
}

/** Nokta şehir ızgarasındaki bir yolun asfaltı üzerinde mi? */
export function isOnRoad(x: number, z: number, halfWidth: number = ROAD_HALF_WIDTH): boolean {
  if (Math.abs(x) > CITY_LIMIT || Math.abs(z) > CITY_LIMIT) return false;
  // Dikey yol: x bir eksene yakın. Yatay yol: z bir eksene yakın.
  return nearAnyAxis(x, ROAD_AXES_X, halfWidth) || nearAnyAxis(z, ROAD_AXES_Z, halfWidth);
}

export interface RoadMove {
  x: number;
  z: number;
  /** true: hareket engellendi (duvara/binaya sürtüldü) — ses/efekt için kullanılabilir. */
  blocked: boolean;
}

/**
 * Önerilen hareketi yol ağına göre kırpar.
 * Tam hareket mümkün değilse tek eksende kaydırma denenir; böylece araç binaya
 * çarpınca ANİDEN durmaz, yol boyunca sürterek ilerler (duvar kayması).
 */
export function clampMoveToRoad(
  currentX: number,
  currentZ: number,
  nextX: number,
  nextZ: number,
  halfWidth: number = ROAD_HALF_WIDTH,
): RoadMove {
  if (isOnRoad(nextX, nextZ, halfWidth)) return { x: nextX, z: nextZ, blocked: false };
  if (isOnRoad(nextX, currentZ, halfWidth)) return { x: nextX, z: currentZ, blocked: true };
  if (isOnRoad(currentX, nextZ, halfWidth)) return { x: currentX, z: nextZ, blocked: true };
  return { x: currentX, z: currentZ, blocked: true };
}
