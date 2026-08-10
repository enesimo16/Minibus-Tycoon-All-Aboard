"use client";

import { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const CITY_MODEL_PATH = "/models/city/Fullfilled_City_FINAL_DRACO.glb";
const DRACO_DECODER_PATH = "/draco/";
const CITY_HALF_EXTENT = 48.111;
const OUTER_CULL_MARGIN = 2.5;
const MAX_VISIBLE_COORD = CITY_HALF_EXTENT + OUTER_CULL_MARGIN;
const TERMINAL_HALF_WIDTH = 8.9;
const TERMINAL_HALF_DEPTH = 5.25;
const CENTRAL_STOP_CLEARINGS = [
  [-5.4, 6.9],
  [-0.6, 6.9],
  [4.2, 6.9],
  [-4, -6.9],
  [3.2, -6.9],
  [-5.4, 12.35],
  [-0.6, 12.35],
  [4.2, 12.35],
  [-4, -12.35],
  [3.2, -12.35],
] as const;

const meshBounds = new THREE.Box3();
const meshCenter = new THREE.Vector3();
const meshSize = new THREE.Vector3();
const cityClipPlanes = [
  new THREE.Plane(new THREE.Vector3(1, 0, 0), MAX_VISIBLE_COORD),
  new THREE.Plane(new THREE.Vector3(-1, 0, 0), MAX_VISIBLE_COORD),
  new THREE.Plane(new THREE.Vector3(0, 0, 1), MAX_VISIBLE_COORD),
  new THREE.Plane(new THREE.Vector3(0, 0, -1), MAX_VISIBLE_COORD),
];
const BUILDING_PALETTE = [
  new THREE.Vector3(0.78, 0.76, 0.70),
  new THREE.Vector3(0.36, 0.20, 0.62),
  new THREE.Vector3(0.46, 0.27, 0.58),
  new THREE.Vector3(0.055, 0.48, 0.46),
  new THREE.Vector3(0.78, 0.76, 0.70),
  new THREE.Vector3(0.72, 0.16, 0.12),
  new THREE.Vector3(0.62, 0.30, 0.20),
  new THREE.Vector3(0.055, 0.065, 0.085),
];

function isOutsidePlayableCity(object: THREE.Object3D) {
  meshBounds.setFromObject(object);
  if (meshBounds.isEmpty()) return false;
  meshBounds.getCenter(meshCenter);
  return Math.abs(meshCenter.x) > MAX_VISIBLE_COORD || Math.abs(meshCenter.z) > MAX_VISIBLE_COORD;
}

function softenMaterial(material: THREE.Material, tint: THREE.Vector3, preserveRed = false) {
  material.clippingPlanes = cityClipPlanes;
  material.clipShadows = false;
  if (material.name === "FF_BaseSlab_M") {
    material.polygonOffset = true;
    material.polygonOffsetFactor = 1;
    material.polygonOffsetUnits = 1;
  }
  material.customProgramCacheKey = () =>
    `city-palette-${tint.x.toFixed(3)}-${tint.y.toFixed(3)}-${tint.z.toFixed(3)}-${preserveRed}`;
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float redDominance = diffuseColor.r - max(diffuseColor.g, diffuseColor.b);
      float redMask = ${preserveRed ? "0.0" : "smoothstep(0.08, 0.28, redDominance)"};
      vec3 buildingPalette = vec3(${tint.x.toFixed(3)}, ${tint.y.toFixed(3)}, ${tint.z.toFixed(3)});
      vec3 tintedBuilding = buildingPalette * (0.45 + diffuseColor.r * 0.55);
      diffuseColor.rgb = mix(diffuseColor.rgb, tintedBuilding, redMask);`
    );
  };
  if ("color" in material && material.color instanceof THREE.Color) {
    if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
      material.roughness = Math.max(material.roughness, 0.82);
      material.metalness = Math.min(material.metalness, 0.08);
      material.envMapIntensity = 0.35;
      if (material.emissiveIntensity !== undefined) material.emissiveIntensity = Math.min(material.emissiveIntensity, 0.2);
    }
    material.needsUpdate = true;
  }
}

function isCentralTerminalClutter(object: THREE.Object3D) {
  meshBounds.setFromObject(object);
  if (meshBounds.isEmpty()) return false;
  meshBounds.getCenter(meshCenter);
  meshBounds.getSize(meshSize);

  const insideTerminal =
    Math.abs(meshCenter.x) < TERMINAL_HALF_WIDTH &&
    Math.abs(meshCenter.z) < TERMINAL_HALF_DEPTH;
  if (!insideTerminal) return false;

  // Keep city-wide ground/road meshes. Only remove small, local props that were
  // baked into the old terminal square.
  const localObject = meshSize.x < 5.2 && meshSize.z < 5.2 && meshSize.y < 4.2;
  const structuralName =
    /road|base|ground|sidewalk|curb|asphalt|lane|marking|terrain/i.test(object.name);
  return localObject && !structuralName;
}

function isOldCentralStopClutter(object: THREE.Object3D) {
  meshBounds.setFromObject(object);
  if (meshBounds.isEmpty()) return false;
  meshBounds.getCenter(meshCenter);
  meshBounds.getSize(meshSize);

  const insideStopClearing = CENTRAL_STOP_CLEARINGS.some(
    ([x, z]) =>
      Math.abs(meshCenter.x - x) < 1.75 &&
      Math.abs(meshCenter.z - z) < 1.25,
  );
  if (!insideStopClearing) return false;

  const localObject = meshSize.x < 4 && meshSize.z < 3 && meshSize.y < 4.5;
  const structuralName =
    /road|base|ground|sidewalk|curb|asphalt|lane|marking|terrain/i.test(object.name);
  return localObject && !structuralName;
}

function applySpatialPalette(mesh: THREE.Mesh, preserveRed: boolean) {
  const geometry = mesh.geometry;
  const index = geometry.index;
  const position = geometry.getAttribute("position");
  const baseMaterial = mesh.material;
  if (!index || !position || Array.isArray(baseMaterial)) return false;

  mesh.updateWorldMatrix(true, false);
  const triangleCenter = new THREE.Vector3();
  const buckets = Array.from({ length: BUILDING_PALETTE.length }, () => [] as number[]);
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    triangleCenter
      .set(
        (position.getX(a) + position.getX(b) + position.getX(c)) / 3,
        (position.getY(a) + position.getY(b) + position.getY(c)) / 3,
        (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3
      )
      .applyMatrix4(mesh.matrixWorld);
    const cellX = Math.floor((triangleCenter.x + 52) / 10);
    const cellZ = Math.floor((triangleCenter.z + 52) / 10);
    const cellHash = (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663)) >>> 0;
    const isHelipadParcel = cellX === 3 && cellZ === 4;
    const paletteIndex = isHelipadParcel ? 5 : cellHash % BUILDING_PALETTE.length;
    buckets[paletteIndex].push(a, b, c);
  }

  const reordered = new Uint32Array(index.count);
  const paletteMaterials = BUILDING_PALETTE.map((tint) => {
    const material = baseMaterial.clone();
    softenMaterial(material, tint, preserveRed);
    return material;
  });
  const groupedGeometry = geometry.clone();
  groupedGeometry.clearGroups();
  let offset = 0;
  buckets.forEach((bucket, materialIndex) => {
    reordered.set(bucket, offset);
    if (bucket.length > 0) groupedGeometry.addGroup(offset, bucket.length, materialIndex);
    offset += bucket.length;
  });
  groupedGeometry.setIndex(new THREE.BufferAttribute(reordered, 1));
  mesh.geometry = groupedGeometry;
  mesh.material = paletteMaterials;
  return true;
}

export function CityModel() {
  const gltf = useLoader(GLTFLoader, CITY_MODEL_PATH, (loader) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    loader.setDRACOLoader(dracoLoader);
  });

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        object.visible = false;
        object.intensity = 0;
        return;
      }

      const objectName = object.name.toLowerCase();
      if (objectName.startsWith("prp_trafficlight")) {
        object.visible = false;
        return;
      }

      if (
        objectName.includes("city_vehicles") ||
        objectName.includes("vehicle") ||
        objectName.includes("taxi") ||
        objectName.includes("police") ||
        objectName.includes("car") ||
        objectName.startsWith("veh_") ||
        objectName.startsWith("bus1.")
      ) {
        object.visible = false;
        return;
      }

      if (!(object instanceof THREE.Mesh)) return;
      if (isOutsidePlayableCity(object)) {
        object.visible = false;
        return;
      }
      if (isCentralTerminalClutter(object)) {
        object.visible = false;
        return;
      }
      if (isOldCentralStopClutter(object)) {
        object.visible = false;
        return;
      }
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = true;
      // Materyaller çoğu zaman model içinde paylaşılır. Mesh başına klonlayıp
      // konumdan türetilen palet rengi veriyoruz; böylece bir binayı boyarken
      // şehirdeki diğer binalar aynı renge zorlanmıyor.
      const preserveRed = /helipad|hospital|heliport|roof_h/i.test(object.name);
      if (applySpatialPalette(object, preserveRed)) return;
      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) => material.clone());
        object.material.forEach((material: THREE.Material, index: number) =>
          softenMaterial(material, BUILDING_PALETTE[index % BUILDING_PALETTE.length], preserveRed)
        );
      } else {
        object.material = object.material.clone();
        softenMaterial(object.material, BUILDING_PALETTE[0], preserveRed);
      }
    });

  }, [gltf.scene]);

  return <primitive object={gltf.scene} />;
}
