"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CarPackVehicleModel } from "./CarPackVehicleModel";
import { alignToGround } from "./groundAlign";

export type TrafficVehicleKind = "civilian" | "taxi" | "police";

type VehicleConfig = {
  path: string;
  scale: number;
  forwardRotationY: number;
};

const VEHICLE_CONFIGS: Record<Exclude<TrafficVehicleKind, "civilian">, VehicleConfig> = {
  taxi: {
    path: "/models/vehicles/Fullfilled_Taxi.glb",
    scale: 0.92,
    forwardRotationY: 0,
  },
  police: {
    path: "/models/vehicles/Fullfilled_Police_Car.glb",
    scale: 0.92,
    forwardRotationY: 0,
  },
};

function SpecialTrafficVehicleModel({
  kind,
}: {
  kind: Exclude<TrafficVehicleKind, "civilian">;
}) {
  const config = VEHICLE_CONFIGS[kind];
  const { scene } = useGLTF(config.path);
  const model = useMemo(() => {
    const cloned = scene.clone(true);
    // Tabanini kendi orijinine oturt — sabit y ofseti tahmini yerine olcum.
    alignToGround(cloned);
    return cloned;
  }, [scene]);

  useEffect(() => {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
    });
  }, [model]);

  return (
    <group rotation={[0, config.forwardRotationY, 0]} scale={config.scale}>
      <primitive object={model} />
    </group>
  );
}

export function TrafficVehicleModel({
  kind,
  variant = 0,
}: {
  kind: TrafficVehicleKind;
  variant?: number;
}) {
  if (kind === "civilian") {
    return <CarPackVehicleModel variant={variant} />;
  }

  return <SpecialTrafficVehicleModel kind={kind} />;
}

export function TrafficVehiclePlaceholder({ kind }: { kind: TrafficVehicleKind }) {
  return (
    <group>
      <mesh position={[0, 0.21, 0]}>
        <boxGeometry args={[0.78, 0.42, 1.45]} />
        <meshStandardMaterial
          color={
            kind === "police"
              ? "#f8fafc"
              : kind === "taxi"
                ? "#f5c542"
                : "#7f8da3"
          }
          roughness={0.82}
        />
      </mesh>
      <mesh position={[0, 0.45, -0.08]}>
        <boxGeometry args={[0.58, 0.32, 0.72]} />
        <meshStandardMaterial
          color={kind === "police" ? "#2f6fa8" : "#111827"}
          roughness={0.78}
        />
      </mesh>
      {kind === "police" && (
        <mesh position={[0, 0.65, -0.08]}>
          <boxGeometry args={[0.32, 0.08, 0.12]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload("/models/vehicles/Fullfilled_Taxi.glb");
useGLTF.preload("/models/vehicles/Fullfilled_Police_Car.glb");
