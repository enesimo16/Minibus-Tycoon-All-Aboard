"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { memo, Suspense, useRef } from "react";
import type { Group } from "three";
import { getBusCatalogEntry } from "./content/busCatalog";
import { BusModel, BusPlaceholder } from "./content/BusModel";

// Şirket kurma adımı 4: üç başlangıç minibüsü showroom gibi sergilenir —
// seçilen araç döner tabla üzerinde kendi ekseninde yavaşça döner.
// Ağır Three.js sahnesi olduğu için memo'lu ve `useT()` çağırmaz (dil değişimi
// bu canvas'ı yeniden render etmesin — GaragePanel'deki aynı kalıp).

const TURNTABLE_SPEED_RAD_PER_SEC = 0.5;

function Turntable({ modelId }: { modelId: string }) {
  const group = useRef<Group>(null!);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += TURNTABLE_SPEED_RAD_PER_SEC * Math.min(delta, 0.05);
  });
  return (
    <group ref={group} position={[0, -0.45, 0]}>
      <Suspense fallback={<BusPlaceholder />}>
        <BusModel modelId={modelId as never} />
      </Suspense>
      {/* Tabla: aracın havada durmaması için ince bir disk. */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.55, 48]} />
        <meshStandardMaterial color="#2b3138" roughness={0.85} />
      </mesh>
    </group>
  );
}

export const StarterBusShowroom = memo(function StarterBusShowroom({ busId }: { busId: string }) {
  const entry = getBusCatalogEntry(busId);
  if (!entry) return null;

  return (
    <div className="ff-showroom">
      <Canvas camera={{ position: [2.9, 1.6, 2.9], fov: 38 }} shadows={false}>
        <ambientLight intensity={0.7} />
        {/* İki spot: showroom vitrin hissi (bir ana, bir dolgu). */}
        <directionalLight position={[3, 5, 2]} intensity={1.25} />
        <directionalLight position={[-3, 2.5, -2]} intensity={0.5} />
        <Turntable modelId={entry.modelId} />
      </Canvas>
      <div className="ff-showroom-plate">
        <span className="ff-showroom-plate-name">{entry.name}</span>
        <span className="ff-showroom-plate-stats tabular-nums">
          {entry.seats} · ×{entry.speedMultiplier}
        </span>
      </div>
    </div>
  );
});
