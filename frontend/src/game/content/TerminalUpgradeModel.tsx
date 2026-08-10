"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { TerminalUpgradeId } from "../terminal";

type TerminalModelConfig = {
  path: string;
  footprint: readonly [number, number];
  maxHeight: number;
  rotationY?: number;
};

const TERMINAL_MODEL_CONFIGS: Partial<
  Record<TerminalUpgradeId, TerminalModelConfig>
> = {
  teaHouse: {
    path: "/models/terminal-upgrades/tea-house.glb",
    footprint: [2.15, 1.45],
    maxHeight: 1.65,
  },
  toilet: {
    path: "/models/terminal-upgrades/toilet.glb",
    footprint: [2.05, 1.4],
    maxHeight: 1.55,
  },
  park: {
    path: "/models/terminal-upgrades/park.glb",
    footprint: [2.55, 1.85],
    maxHeight: 1.65,
  },
  billboard: {
    path: "/models/terminal-upgrades/billboard.glb",
    footprint: [2.1, 1.25],
    maxHeight: 2.25,
  },
  charging: {
    path: "/models/terminal-upgrades/charging-station.glb",
    footprint: [2.2, 1.5],
    maxHeight: 1.75,
  },
};

/** Henüz ekonomiye bağlanmamış ama import edilmiş gelecek terminal varlıkları. */
export const FUTURE_TERMINAL_MODEL_PATHS = {
  market: "/models/terminal-upgrades/market.glb",
  repairStation: "/models/terminal-upgrades/repair-station.glb",
} as const;

export function hasTerminalUpgradeModel(id: TerminalUpgradeId): boolean {
  return Boolean(TERMINAL_MODEL_CONFIGS[id]);
}

export function TerminalUpgradeModel({ id }: { id: TerminalUpgradeId }) {
  const config = TERMINAL_MODEL_CONFIGS[id];

  if (!config) return null;

  return <LoadedTerminalUpgradeModel config={config} />;
}

function LoadedTerminalUpgradeModel({
  config,
}: {
  config: TerminalModelConfig;
}) {
  const { scene } = useGLTF(config.path);
  const model = useMemo(() => scene.clone(true), [scene]);
  const bounds = useMemo(() => new THREE.Box3().setFromObject(model), [model]);
  const size = useMemo(() => bounds.getSize(new THREE.Vector3()), [bounds]);
  const center = useMemo(() => bounds.getCenter(new THREE.Vector3()), [bounds]);
  const scale = useMemo(
    () =>
      Math.min(
        config.footprint[0] / Math.max(size.x, 0.001),
        config.footprint[1] / Math.max(size.z, 0.001),
        config.maxHeight / Math.max(size.y, 0.001),
      ),
    [config, size],
  );

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
    });
  }, [model]);

  return (
    <group rotation={[0, config.rotationY ?? 0, 0]} scale={scale}>
      <primitive object={model} position={[-center.x, -bounds.min.y, -center.z]} />
    </group>
  );
}

// PERF: burada eskiden TUM terminal yukseltmeleri (+ henuz satin alinmamis market ve
// tamirhane) modul yuklenirken onden indiriliyordu. Oyuncunun sahip OLMADIGI binalar
// icin bu bos yere indirme demek; `useGLTF` zaten bina sahneye girince yukluyor.
// Modeller kucultuldugu icin (9 MB -> ~1 MB) talep aninda yukleme fark edilmiyor.
