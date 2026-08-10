"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGameStore } from "../store";
import { getBusCatalogEntry, type BusModelId } from "./busCatalog";

export type BusTier = 1 | 2 | 3;

interface BusModelConfig {
  path: string;
  desiredLength: number;
  maxLaneWidth: number;
  rotationY: number;
}

// Source buses face +X. The route controller treats -Z as forward, therefore
// the source model needs a -90 degree correction (the old +90 made it reverse).
const BUS_MODEL_CONFIGS: Record<BusModelId, BusModelConfig> = {
  classic: {
    path: "/models/vehicles/bus1.glb",
    desiredLength: 2.05,
    maxLaneWidth: 0.96,
    rotationY: -Math.PI / 2,
  },
  "starter-02": {
    path: "/models/vehicles/starter/starter-bus-02.glb",
    desiredLength: 2.15,
    maxLaneWidth: 0.98,
    rotationY: -Math.PI / 2,
  },
  "starter-03": {
    path: "/models/vehicles/starter/starter-bus-03.glb",
    desiredLength: 2.2,
    maxLaneWidth: 0.98,
    rotationY: -Math.PI / 2,
  },
  midibus: {
    path: "/models/vehicles/bus2.glb",
    desiredLength: 2.35,
    maxLaneWidth: 1.02,
    rotationY: -Math.PI / 2,
  },
  premium: {
    path: "/models/vehicles/bus3.glb",
    desiredLength: 2.75,
    maxLaneWidth: 1.06,
    rotationY: -Math.PI / 2,
  },
};

const TIER_MODEL_IDS: Record<BusTier, BusModelId> = {
  1: "classic",
  2: "midibus",
  3: "premium",
};

function busScaleForConfig(config: BusModelConfig, size: THREE.Vector3): number {
  const sourceLength = Math.max(size.x, size.z);
  const sourceWidth = Math.max(0.001, Math.min(size.x, size.z));
  const lengthScale = config.desiredLength / sourceLength;
  const widthScale = config.maxLaneWidth / sourceWidth;
  return Math.min(lengthScale, widthScale);
}

/**
 * Dolmus modeli. Garaj onizlemesi dogrudan model kimligini verir; oyun dunyasi
 * her zaman aktif katalog aracini korur. Yukseltmeler aracin istatistiklerini
 * degistirir, modelini baska bir araca donusturmez.
 */
export function BusModel({ tier: tierOverride, modelId: modelIdOverride }: { tier?: BusTier; modelId?: BusModelId } = {}) {
  const activeBusId = useGameStore((s) => s.activeBusId);
  const catalogEntry = getBusCatalogEntry(activeBusId);
  const catalogTier = catalogEntry?.tier ?? 1;
  const tier = tierOverride ?? catalogTier;
  const modelId = modelIdOverride ?? (tierOverride ? TIER_MODEL_IDS[tier] : catalogEntry?.modelId ?? TIER_MODEL_IDS[tier]);
  const config = BUS_MODEL_CONFIGS[modelId];
  const { scene } = useGLTF(config.path);
  const model = useMemo(() => scene.clone(true), [scene]);
  const bounds = useMemo(() => new THREE.Box3().setFromObject(model), [model]);
  const size = useMemo(() => bounds.getSize(new THREE.Vector3()), [bounds]);
  const center = useMemo(() => bounds.getCenter(new THREE.Vector3()), [bounds]);
  const scale = busScaleForConfig(config, size);

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
    });
  }, [model]);

  return (
    <group rotation={[0, config.rotationY, 0]} scale={scale}>
      <primitive object={model} position={[-center.x, -bounds.min.y, -center.z]} />
    </group>
  );
}

export function BusPlaceholder() {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.9, 0.9, 1.8]} />
      <meshStandardMaterial color="#f2b705" roughness={0.8} />
    </mesh>
  );
}

// PERF: bu cagrilar MODUL yuklenir yuklenmez calisir — yani daha GIRIS EKRANINDAyken
// 5 aracin tamami indiriliyordu. Oyuncu ayni anda tek arac suruyor; kalanlar garajda
// onizlenince zaten `useGLTF` ile tembel yuklenir. Yalnizca varsayilan baslangic
// aracini onden yukluyoruz ki ilk sahne beklemesin.
useGLTF.preload("/models/vehicles/bus1.glb");
