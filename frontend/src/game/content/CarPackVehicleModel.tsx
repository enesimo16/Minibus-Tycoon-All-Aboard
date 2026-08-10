"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const CAR_PACK_PATH = "/models/vehicles/carpack.fbx";
const DESIRED_CAR_LENGTH = 1.62;

export const CAR_PACK_VARIANT_COUNT = 10;

function preservePackMaterial(material: THREE.Material) {
  const cloned = material.clone();
  if (
    cloned instanceof THREE.MeshPhongMaterial ||
    cloned instanceof THREE.MeshStandardMaterial
  ) {
    // FBX'teki gri materyal rengi texture'ı koyulaştırmasın.
    cloned.color.set("#ffffff");
    cloned.vertexColors = false;
    if (cloned.map) {
      cloned.map.colorSpace = THREE.SRGBColorSpace;
      cloned.map.magFilter = THREE.NearestFilter;
      cloned.map.minFilter = THREE.NearestMipmapLinearFilter;
      cloned.map.needsUpdate = true;
    }
    cloned.needsUpdate = true;
  }
  return cloned;
}

export function CarPackVehicleModel({ variant }: { variant: number }) {
  const source = useLoader(FBXLoader, CAR_PACK_PATH);
  const prepared = useMemo(() => {
    const sourceCar =
      source.children[
        ((variant % source.children.length) + source.children.length) %
          source.children.length
      ];
    if (!sourceCar) return null;

    const car = sourceCar.clone(true);
    car.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(car);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const sourceLength = Math.max(size.x, size.z);
    const scale = sourceLength > 0 ? DESIRED_CAR_LENGTH / sourceLength : 1;

    car.position.x -= center.x;
    car.position.y -= bounds.min.y;
    car.position.z -= center.z;
    car.updateMatrixWorld(true);

    car.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
      // Modelin kendi UV dokusu gövde, cam, lastik ve jant renklerini ayırıyor.
      // Tek renk materyal atamak bu ayrımı tamamen yok ediyordu.
      child.material = Array.isArray(child.material)
        ? child.material.map(preservePackMaterial)
        : preservePackMaterial(child.material);
    });

    return { car, scale };
  }, [source, variant]);

  if (!prepared) return null;

  return (
    <group rotation={[0, Math.PI, 0]}>
      <group scale={prepared.scale}>
        <primitive object={prepared.car} />
      </group>
    </group>
  );
}

useLoader.preload(FBXLoader, CAR_PACK_PATH);
