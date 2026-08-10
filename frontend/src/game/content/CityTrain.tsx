"use client";

import { useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import cityData from "./mvpCityData.json";
import { ROAD_SURFACE_Y } from "./groundAlign";

// ---------------------------------------------------------------------------
// Şehir treni — şehri çevreleyen KAPALI bir ray döngüsünde sürekli tur atar.
//
// Ray, şehrin dış sınırı ile ZEMİN DÜZLEMİNİN kenarı arasına yerleşir; zeminin
// dışına taşarsa tren boşlukta uçuyormuş gibi görünür. Zemin 140 × 110 birim
// (x: ±70, z: ±55) olduğu için Z payı X'ten dardır.
//
// PERF: ray döşemesi tek bir InstancedMesh'tir. Önceki sürüm her karede ~105
// FBX klonu üretiyordu ve oyunu kilitliyordu.
// ---------------------------------------------------------------------------

const TRACK_MODEL = "/models/train/RailwayTrack_Straight.fbx";
const LOCOMOTIVE_MODEL = "/models/train/Locomotive_Front.fbx";
const WAGON_MODEL = "/models/train/Locomotive_PassengerWagon.fbx";

const CITY_HALF = cityData.grid.halfExtent;
/** Zemin düzlemi sınırları (bkz. GameCanvas > Ground: 140 × 110). */
const GROUND_HALF_X = 70;
const GROUND_HALF_Z = 55;
/** Ray halkası: şehrin dışında ama zeminin içinde. */
const HALF_X = Math.min(CITY_HALF + 8, GROUND_HALF_X - 4);
const HALF_Z = Math.min(CITY_HALF + 5, GROUND_HALF_Z - 4);
/** Köşe yuvarlama payı. */
const CORNER = 9;

const TRAIN_SPEED_MPS = 7.5;
/** Vagonların lokomotife göre geride kalma mesafesi (metre). */
const CAR_SPACING = 4.6;
const WAGON_COUNT = 3;
const LOCOMOTIVE_LENGTH = 4.4;
const WAGON_LENGTH = 4.2;
const TRACK_SEGMENT_LENGTH = 4;
const TRACK_Y = ROAD_SURFACE_Y + 0.02;
const TRAIN_Y = ROAD_SURFACE_Y + 0.16;

/** Kapalı ray halkası — köşeleri yumuşatılmış dikdörtgen. */
function buildTrackCurve(): THREE.CurvePath<THREE.Vector3> {
  const point = (x: number, z: number) => new THREE.Vector3(x, TRAIN_Y, z);
  const curve = new THREE.CurvePath<THREE.Vector3>();

  // Keep every segment in perimeter order. Connecting corner control points
  // with one spline produced diagonal shortcuts through the city.
  curve.add(new THREE.LineCurve3(point(HALF_X - CORNER, HALF_Z), point(-HALF_X + CORNER, HALF_Z)));
  curve.add(new THREE.QuadraticBezierCurve3(
    point(-HALF_X + CORNER, HALF_Z),
    point(-HALF_X, HALF_Z),
    point(-HALF_X, HALF_Z - CORNER),
  ));
  curve.add(new THREE.LineCurve3(point(-HALF_X, HALF_Z - CORNER), point(-HALF_X, -HALF_Z + CORNER)));
  curve.add(new THREE.QuadraticBezierCurve3(
    point(-HALF_X, -HALF_Z + CORNER),
    point(-HALF_X, -HALF_Z),
    point(-HALF_X + CORNER, -HALF_Z),
  ));
  curve.add(new THREE.LineCurve3(point(-HALF_X + CORNER, -HALF_Z), point(HALF_X - CORNER, -HALF_Z)));
  curve.add(new THREE.QuadraticBezierCurve3(
    point(HALF_X - CORNER, -HALF_Z),
    point(HALF_X, -HALF_Z),
    point(HALF_X, -HALF_Z + CORNER),
  ));
  curve.add(new THREE.LineCurve3(point(HALF_X, -HALF_Z + CORNER), point(HALF_X, HALF_Z - CORNER)));
  curve.add(new THREE.QuadraticBezierCurve3(
    point(HALF_X, HALF_Z - CORNER),
    point(HALF_X, HALF_Z),
    point(HALF_X - CORNER, HALF_Z),
  ));

  return curve;
}

const TRACK_CURVE = buildTrackCurve();
const TRACK_LENGTH = TRACK_CURVE.getLength();
const TRACK_SEGMENT_COUNT = Math.max(1, Math.round(TRACK_LENGTH / TRACK_SEGMENT_LENGTH));

/** FBX'ten ilk mesh'in geometrisini + materyalini alır (instancing için). */
function useTrackPiece() {
  const source = useFBX(TRACK_MODEL);
  return useMemo(() => {
    let found: THREE.Mesh | null = null;
    source.traverse((object) => {
      if (found || !(object instanceof THREE.Mesh)) return;
      found = object;
    });
    const mesh = found as THREE.Mesh | null;
    if (!mesh) return null;
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;

    // Parçayı hedef uzunluğa normalize et: paketin birim farkı burada çözülür.
    const cloned = mesh.geometry.clone();
    cloned.computeBoundingBox();
    const box = cloned.boundingBox!;
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.z, 0.001);
    const scale = TRACK_SEGMENT_LENGTH / longest;
    // Uzun eksen X ise Z'ye çevir — bütün parçalar aynı yöne baksın.
    if (size.x > size.z) cloned.rotateY(Math.PI / 2);
    cloned.translate(0, -box.min.y, 0);
    cloned.scale(scale, scale, scale);
    return { geometry: cloned, material };
  }, [source]);
}

/** Ray döşemesi — eğri boyunca teğet dizilmiş TEK InstancedMesh (1 draw call). */
function TrackBed() {
  const piece = useTrackPiece();
  const mesh = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    if (!piece || !mesh.current) return;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const next = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const up = new THREE.Vector3(0, 1, 0);

    for (let index = 0; index < TRACK_SEGMENT_COUNT; index += 1) {
      const t = index / TRACK_SEGMENT_COUNT;
      TRACK_CURVE.getPointAt(t, position);
      TRACK_CURVE.getPointAt((t + 1 / TRACK_SEGMENT_COUNT) % 1, next);
      const angle = Math.atan2(next.x - position.x, next.z - position.z);
      quaternion.setFromAxisAngle(up, angle);
      matrix.compose(new THREE.Vector3(position.x, TRACK_Y, position.z), quaternion, scale);
      mesh.current.setMatrixAt(index, matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [piece]);

  if (!piece) return null;

  return (
    <instancedMesh
      ref={mesh}
      args={[piece.geometry, piece.material, TRACK_SEGMENT_COUNT]}
      frustumCulled={false}
    />
  );
}

/** FBX'i hedef UZUNLUĞA göre ölçekler; sonuç memo'lanır (kare başına klon yok). */
function useNormalizedTrainModel(path: string, targetLength: number) {
  const source = useFBX(path);
  return useMemo(() => {
    const model = source.clone(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const longest = Math.max(size.x, size.z, 0.001);
    model.position.set(-center.x, -bounds.min.y, -center.z);
    const rotationY = size.x > size.z ? Math.PI / 2 : 0;
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
    return { model, scale: targetLength / longest, rotationY };
  }, [source, targetLength]);
}

function TrainCar({
  path,
  targetLength,
  trailMeters,
  progress,
}: {
  path: string;
  targetLength: number;
  trailMeters: number;
  progress: { current: number };
}) {
  const group = useRef<THREE.Group>(null!);
  const { model, scale, rotationY } = useNormalizedTrainModel(path, targetLength);
  const position = useRef(new THREE.Vector3());
  const lookAhead = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!group.current) return;
    const offset = trailMeters / TRACK_LENGTH;
    const t = (((progress.current - offset) % 1) + 1) % 1;
    TRACK_CURVE.getPointAt(t, position.current);
    TRACK_CURVE.getPointAt((t + 0.002) % 1, lookAhead.current);
    group.current.position.set(position.current.x, TRAIN_Y, position.current.z);
    group.current.lookAt(lookAhead.current.x, TRAIN_Y, lookAhead.current.z);
  });

  return (
    <group ref={group}>
      <group rotation={[0, rotationY, 0]} scale={scale}>
        <primitive object={model} />
      </group>
    </group>
  );
}

export const CityTrain = memo(function CityTrain() {
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current =
      (progress.current + (TRAIN_SPEED_MPS * Math.min(delta, 0.05)) / TRACK_LENGTH) % 1;
  });

  return (
    <Suspense fallback={null}>
      <TrackBed />
      <TrainCar path={LOCOMOTIVE_MODEL} targetLength={LOCOMOTIVE_LENGTH} trailMeters={0} progress={progress} />
      {Array.from({ length: WAGON_COUNT }, (_, index) => (
        <TrainCar
          key={`wagon-${index}`}
          path={WAGON_MODEL}
          targetLength={WAGON_LENGTH}
          trailMeters={CAR_SPACING * (index + 1)}
          progress={progress}
        />
      ))}
    </Suspense>
  );
});
