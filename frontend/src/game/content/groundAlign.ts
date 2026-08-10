import * as THREE from "three";

/**
 * Modeli, EN ALT noktasi kendi orijinine gelecek sekilde kaydirir.
 *
 * Neden: arac yuksekligi daha once model basina elle ayarlanmis sabitlerle
 * (0.58 / -0.54 / y-0.6) veriliyordu. Model ya da olcek degisince bu sayilar
 * tutmuyor ve araclar havada kaliyordu. Siniri modelden okuyunca tahmin biter.
 *
 * ONEMLI: hazirlama asamasinda (useMemo icinde, henuz sahneye eklenmeden)
 * cagrilmali. Sahnedeki bir nesneye ref ile uygulanirsa ust gruplarin
 * donusumleri olcume karisir ve duzeltme iki kez uygulanir.
 */
export function alignToGround(object: THREE.Object3D): void {
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (!Number.isFinite(bounds.min.y)) return;
  object.position.y -= bounds.min.y;
  object.updateMatrixWorld(true);
}

/** Yol yuzeyi — duraklar da bu yukseklikte konumlanir (bkz. MvpWorld). */
export const ROAD_SURFACE_Y = 0.02;
