"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";
import { getRouteGeometry, stopProgress } from "../route";
import { useGameStore } from "../store";
import { useUiStore } from "../uiStore";
import { CharacterModel, CHARACTER_VARIANT_COUNT } from "./CharacterModel";
import { TerminalDistrict } from "./TerminalDistrict";
import { CityTrain } from "./CityTrain";

const PREFABS_PATH = "/models/city/Fullfilled_Prefabs.glb";

type Point3 = [number, number, number];

type BusStop = {
  id: string;
  position: Point3;
  rotationY: number;
  type: "shelter" | "sign_only";
};

const MAX_VISIBLE_PASSENGERS_PER_STOP = 2;
const PASSENGER_SLOTS = Array.from(
  { length: MAX_VISIBLE_PASSENGERS_PER_STOP },
  (_, slotIndex) => {
    return [
      (slotIndex - 0.5) * 0.52,
      0.02,
      0.05,
    ] as Point3;
  },
);

// Aktif hattin duraklari — hat degisince yeniden hesaplanir (bkz. useActiveStops).
function buildRouteStops(routeId: string) {
  return getRouteGeometry(routeId).stops.map((routeStop) => {
    const modelStop: BusStop = {
      id: routeStop.id,
      position: [
        routeStop.modelPosition?.[0] ?? routeStop.position[0],
        0.02,
        routeStop.modelPosition?.[1] ?? routeStop.position[1],
      ] as Point3,
      rotationY: routeStop.rotationY ?? 0,
      type: "shelter" as const,
    };
    return { routeStop, modelStop };
  });
}

type PedestrianLoop = {
  centerX: number;
  centerZ: number;
  halfX: number;
  halfZ: number;
};

const PEDESTRIAN_LOOPS: readonly PedestrianLoop[] = [
  { centerX: -16.32, centerZ: 16.32, halfX: 4.75, halfZ: 4.75 },
  { centerX: 16.32, centerZ: 16.32, halfX: 4.75, halfZ: 4.75 },
  { centerX: -28.35, centerZ: 16.32, halfX: 4.75, halfZ: 4.75 },
  { centerX: 28.35, centerZ: 16.32, halfX: 4.75, halfZ: 4.75 },
  { centerX: -16.32, centerZ: -16.32, halfX: 4.75, halfZ: 4.75 },
  { centerX: 16.32, centerZ: -16.32, halfX: 4.75, halfZ: 4.75 },
  { centerX: -28.35, centerZ: -28.35, halfX: 4.75, halfZ: 4.75 },
  { centerX: 28.35, centerZ: -28.35, halfX: 4.75, halfZ: 4.75 },
  { centerX: -4.3, centerZ: 28.35, halfX: 4.75, halfZ: 4.75 },
  { centerX: 4.3, centerZ: -28.35, halfX: 4.75, halfZ: 4.75 },
] as const;

// PERF: yayalar artık iskeletli + ANİMASYONLU modeller (her biri kendi
// AnimationMixer'ını çalıştırır). 14 taneden 8'e indirildi; şehir hâlâ canlı
// görünüyor ama kare başına iskelet güncellemesi neredeyse yarıya iniyor.
const AMBIENT_PEDESTRIANS = Array.from({ length: 8 }, (_, index) => ({
  id: `city-pedestrian-${index}`,
  loop: PEDESTRIAN_LOOPS[index % PEDESTRIAN_LOOPS.length],
  phase: (index * 0.173) % 1,
  speed: 0.015 + (index % 4) * 0.0025,
  variant: (index * 3 + 1) % CHARACTER_VARIANT_COUNT,
  direction: index % 3 === 0 ? -1 : 1,
}));

export const MvpWorld = memo(function MvpWorld() {
  const prefabs = useGLTF(PREFABS_PATH);

  const sign = useMemo(
    () => prefabs.scene.getObjectByName("SPW_PROP_bussign"),
    [prefabs.scene],
  );

  return (
    <>
      <StaticPassengers />
      <StopMoneyBeacons />
      <ActiveBusStops sign={sign} />
      <AmbientPedestrians />
      <TerminalDistrict />
      {/* Şehri çevreleyen ray halkasında tur atan tren — hattı kesmez. */}
      <CityTrain />
    </>
  );
});

// ---------------------------------------------------------------------------
// Durak para işareti — YouTube Playables/tycoon oyunlarındaki "toplanacak para"
// dili: bekleyen yolcusu olan durağın önünde parlayan bir zemin alanı ve üstünde
// dönen bir nakit deste durur. Dolmuş yanaşıp kapıyı açınca para "toplanır"
// (aşağı çekilip söner), tahsilatın kendisi ekranda +₺ olarak patlar
// (bkz. StopPayoutFx). Bkz. docs/game-design/03-surus-mekanigi.md
// ---------------------------------------------------------------------------

/** Zemin işaretinin durak yerel uzayındaki yeri — yolcuların bindiği nokta. */
const BEACON_LOCAL_POSITION: Point3 = [0, 0.03, -1.15];
/** Nakit destedeki banknotlar: [yükseklik, hafif sapma açısı] — elle dizilmiş deste hissi. */
const CASH_NOTE_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 0.06],
  [0.035, -0.09],
  [0.07, 0.03],
];
const BEACON_BOB_HEIGHT = 0.09;
const BEACON_SPIN_SPEED = 1.9;
const BEACON_BOB_SPEED = 2.6;

function StopMoneyBeacons() {
  const activeStops = useActiveStops();
  const stopsWaiting = useGameStore((s) => s.stopsWaiting);
  const doorsOpen = useGameStore((s) => s.driving.doorsOpen);
  const dayRun = useGameStore((s) => s.dayRun);

  // Gezinti modunda tahsilat yok — toplanacak para da görünmez.
  if (!dayRun) return null;

  return (
    <>
      {activeStops.map(({ modelStop }, stopIndex) => {
        const waiting = Math.ceil(stopsWaiting[stopIndex] ?? 0);
        if (waiting <= 0) return null;
        return (
          <group
            key={`beacon-${modelStop.id}`}
            position={modelStop.position}
            rotation={[0, modelStop.rotationY, 0]}
          >
            <StopMoneyBeacon stopIndex={stopIndex} doorsOpen={doorsOpen} />
          </group>
        );
      })}
    </>
  );
}

function StopMoneyBeacon({
  stopIndex,
  doorsOpen,
}: {
  stopIndex: number;
  doorsOpen: boolean;
}) {
  const cash = useRef<THREE.Group>(null!);
  const pad = useRef<THREE.Group>(null!);
  const life = useRef(0);

  useFrame((_, delta) => {
    if (!cash.current || !pad.current) return;
    const step = Math.min(delta, 0.05);
    life.current += step;

    // Dolmuş durakta ve kapı açıksa para "toplanıyor" demektir: küçülüp yere iner.
    const busProgress = useGameStore.getState().busProgress;
    const distanceToBus = Math.abs(
      ((stopProgress(stopIndex) - busProgress + 1.5) % 1) - 0.5,
    );
    const collecting = distanceToBus < BOARDING_PROGRESS_WINDOW && doorsOpen;

    const targetScale = collecting ? 0 : 1;
    const scale = THREE.MathUtils.lerp(
      cash.current.scale.x,
      targetScale,
      1 - Math.exp(-9 * step),
    );
    cash.current.scale.setScalar(scale);
    pad.current.scale.setScalar(THREE.MathUtils.lerp(pad.current.scale.x, collecting ? 0.6 : 1, 1 - Math.exp(-9 * step)));

    cash.current.rotation.y += BEACON_SPIN_SPEED * step;
    cash.current.position.y =
      0.62 + Math.sin(life.current * BEACON_BOB_SPEED) * BEACON_BOB_HEIGHT;
  });

  return (
    <group position={BEACON_LOCAL_POSITION}>
      {/* Zemin alanı: izometrik kareye oturan eşkenar dörtgen çerçeve + dolgu. */}
      <group ref={pad}>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <ringGeometry args={[0.58, 0.72, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, -0.005, 0]}>
          <circleGeometry args={[0.62, 4]} />
          <meshBasicMaterial color="#f2a93b" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>

      {/* Nakit deste: üst üste üç banknot + ortasında bandrol. */}
      <group ref={cash} position={[0, 0.62, 0]}>
        {CASH_NOTE_OFFSETS.map(([y, tilt], index) => (
          <mesh key={`note-${index}`} position={[0, y, 0]} rotation={[0, tilt, 0]}>
            <boxGeometry args={[0.44, 0.035, 0.23]} />
            <meshStandardMaterial color="#5aa86f" roughness={0.72} metalness={0.05} />
          </mesh>
        ))}
        {/* Bandrol: destenin ortasını saran açık şerit. */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.13, 0.125, 0.245]} />
          <meshStandardMaterial color="#f4efdd" roughness={0.6} metalness={0.03} />
        </mesh>
      </group>
    </group>
  );
}

/** Otobus bu progress yakinligindayken durak "biniliyor" sayilir. */
const BOARDING_PROGRESS_WINDOW = 0.012;
/**
 * Bu progress mesafesinden uzaktaki durakların yolcuları render EDİLMEZ.
 * Animasyonlu iskeletli karakterler pahalıdır; yalnızca yakındakiler canlandırılır.
 */
const VISIBLE_STOP_PROGRESS_RANGE = 0.11;

/** Aktif hattin duraklari; hat degisince (activeRouteId) yeniden hesaplanir. */
function useActiveStops() {
  const activeRouteId = useGameStore((s) => s.activeRouteId);
  return useMemo(() => buildRouteStops(activeRouteId), [activeRouteId]);
}

function useDisplayedStops() {
  const activeRouteId = useGameStore((s) => s.activeRouteId);
  const routeOverlayVisible = useUiStore((s) => s.routeOverlayVisible);
  const selectedRouteId = useUiStore((s) => s.selectedRouteId);
  const displayedRouteId = routeOverlayVisible
    ? selectedRouteId
    : activeRouteId;
  return useMemo(
    () => buildRouteStops(displayedRouteId),
    [displayedRouteId],
  );
}

function StaticPassengers() {
  const activeStops = useActiveStops();
  const stopsWaiting = useGameStore((s) => s.stopsWaiting);
  const doorsOpen = useGameStore((s) => s.driving.doorsOpen);
  const busProgress = useGameStore.getState().busProgress;

  return (
    <>
      {activeStops.flatMap(({ modelStop }, stopIndex) => {
        const waitingCount = Math.ceil(stopsWaiting[stopIndex] ?? 0);
        const visibleCount = Math.min(
          MAX_VISIBLE_PASSENGERS_PER_STOP,
          waitingCount,
        );
        // Otobus durakta ve kapi acikken (sofor varsa otomatik) yolcular
        // dolmusa dogru yurur ve kaybolur — biniş animasyonu yok, sadece hareket.
        const distanceToBus = Math.abs(
          ((stopProgress(stopIndex) - busProgress + 1.5) % 1) - 0.5,
        );
        const boarding = distanceToBus < BOARDING_PROGRESS_WINDOW && doorsOpen;

        // PERF: yolcular artık iskeletli + animasyonlu modeller. 12 durağın hepsini
        // birden canlandırmak gereksiz; oyuncu yalnızca yakındakileri görüyor.
        // Uzak duraklar hiç render edilmez (kuyruk sayısı state'te aynen durur).
        if (distanceToBus > VISIBLE_STOP_PROGRESS_RANGE) return [];

        return PASSENGER_SLOTS.slice(0, visibleCount).map((slot, slotIndex) => {
          // PERF: `waitingCount` BILEREK disarida birakildi. Kuyruk her degistiginde
          // varyant degisiyor, bu da CharacterModel'de tam iskelet + materyal klonuna
          // (cloneSkeleton) yol aciyordu — oyun boyunca tekrarlayan GC sicramalari.
          // Varyant artik durak/slot'a sabit: gorsel cesitlilik ayni, klon yok.
          const modelIndex = (stopIndex * 3 + slotIndex * 7) % CHARACTER_VARIANT_COUNT;
          return (
            <group
              key={`${modelStop.id}-${slotIndex}`}
              position={modelStop.position}
              rotation={[0, modelStop.rotationY, 0]}
            >
              <PassengerClone
                position={slot}
                variant={modelIndex}
                boarding={boarding}
              />
            </group>
          );
        });
      })}
    </>
  );
}

/** Binerken yurunecek hedef: duragin onu (dolmusun durdugu taraf). */
const BOARDING_TARGET = new THREE.Vector3(0, 0.02, -1.15);
const BOARDING_WALK_SPEED = 1.4;

function PassengerClone({
  position,
  variant,
  boarding,
}: {
  position: Point3;
  variant: number;
  boarding: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const home = useMemo(
    () => new THREE.Vector3(position[0], position[1] + 0.02, position[2]),
    [position],
  );

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const step = Math.min(delta, 0.05) * BOARDING_WALK_SPEED;

    if (!boarding) {
      // Durakta bekleme: kendi yerine geri doner ve tam boyuta gelir.
      node.position.lerp(home, 1 - Math.exp(-8 * step));
      const scale = THREE.MathUtils.lerp(node.scale.x, 1, 1 - Math.exp(-8 * step));
      node.scale.setScalar(scale);
      node.visible = true;
      return;
    }

    node.position.lerp(BOARDING_TARGET, 1 - Math.exp(-4 * step));
    const remaining = node.position.distanceTo(BOARDING_TARGET);
    // Dolmusa yaklastikca kucululur; icine girince tamamen kaybolur.
    const scale = THREE.MathUtils.clamp(remaining / 0.9, 0, 1);
    node.scale.setScalar(scale);
    node.visible = scale > 0.05;
  });

  return (
    <group
      ref={group}
      position={[position[0], position[1] + 0.02, position[2]]}
      rotation={[0, 0, 0]}
    >
      <CharacterModel variant={variant} />
    </group>
  );
}

function samplePedestrianLoop(
  loop: PedestrianLoop,
  progress: number,
  target: THREE.Vector3,
) {
  const width = loop.halfX * 2;
  const depth = loop.halfZ * 2;
  const perimeter = (width + depth) * 2;
  let distance = (((progress % 1) + 1) % 1) * perimeter;

  if (distance <= width) {
    target.set(
      loop.centerX - loop.halfX + distance,
      0.06,
      loop.centerZ - loop.halfZ,
    );
    return target;
  }
  distance -= width;
  if (distance <= depth) {
    target.set(
      loop.centerX + loop.halfX,
      0.06,
      loop.centerZ - loop.halfZ + distance,
    );
    return target;
  }
  distance -= depth;
  if (distance <= width) {
    target.set(
      loop.centerX + loop.halfX - distance,
      0.06,
      loop.centerZ + loop.halfZ,
    );
    return target;
  }
  distance -= width;
  target.set(
    loop.centerX - loop.halfX,
    0.06,
    loop.centerZ + loop.halfZ - distance,
  );
  return target;
}

function AmbientPedestrians() {
  const groups = useRef<Array<THREE.Group | null>>([]);
  const currentPositions = useMemo(
    () => AMBIENT_PEDESTRIANS.map(() => new THREE.Vector3()),
    [],
  );
  const nextPositions = useMemo(
    () => AMBIENT_PEDESTRIANS.map(() => new THREE.Vector3()),
    [],
  );

  useFrame(({ clock }) => {
    AMBIENT_PEDESTRIANS.forEach((pedestrian, index) => {
      const group = groups.current[index];
      if (!group) return;
      const progress =
        pedestrian.phase +
        clock.elapsedTime * pedestrian.speed * pedestrian.direction;
      const current = samplePedestrianLoop(
        pedestrian.loop,
        progress,
        currentPositions[index],
      );
      const next = samplePedestrianLoop(
        pedestrian.loop,
        progress + 0.004 * pedestrian.direction,
        nextPositions[index],
      );
      group.position.copy(current);
      group.rotation.y = Math.atan2(
        next.x - current.x,
        next.z - current.z,
      );
    });
  });

  return (
    <>
      {AMBIENT_PEDESTRIANS.map((pedestrian, index) => (
        <group
          key={pedestrian.id}
          ref={(group) => {
            groups.current[index] = group;
          }}
        >
          <CharacterModel variant={pedestrian.variant} height={0.54} />
        </group>
      ))}
    </>
  );
}

function ActiveBusStops({ sign }: { sign: THREE.Object3D | undefined }) {
  const activeStops = useDisplayedStops();
  return (
    <>
      {activeStops.map(({ modelStop }) => (
        <BusStopShelter key={modelStop.id} stop={modelStop} sign={sign} />
      ))}
    </>
  );
}

function BusStopShelter({
  stop,
  sign,
}: {
  stop: BusStop;
  sign: THREE.Object3D | undefined;
}) {
  return (
    <group
      position={[stop.position[0], stop.position[1] + 0.03, stop.position[2]]}
      rotation={[0, stop.rotationY, 0]}
    >
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[1.8, 0.11, 0.2]} />
        <meshStandardMaterial color="#263941" roughness={0.76} />
      </mesh>
      <mesh position={[0, 1.2, -0.13]}>
        <boxGeometry args={[1.64, 0.07, 0.045]} />
        <meshStandardMaterial
          color="#38cbd2"
          emissive="#16858f"
          emissiveIntensity={0.42}
        />
      </mesh>

      {([-0.82, 0.82] as const).map((x) => (
        <group key={x}>
          <mesh position={[x, 0.67, 0]}>
            <boxGeometry args={[0.065, 1.18, 0.18]} />
            <meshStandardMaterial color="#384a50" roughness={0.8} />
          </mesh>
          <mesh position={[x, 0.7, -0.01]}>
            <boxGeometry args={[0.025, 0.9, 0.14]} />
            <meshPhysicalMaterial
              color="#a8dce1"
              transparent
              opacity={0.38}
              roughness={0.18}
              metalness={0.05}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.7, 0.12]}>
        <boxGeometry args={[1.62, 1, 0.035]} />
        <meshPhysicalMaterial
          color="#b6e2e6"
          transparent
          opacity={0.3}
          roughness={0.16}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.35, -0.025]}>
        <boxGeometry args={[1.18, 0.12, 0.16]} />
        <meshStandardMaterial color="#59666b" roughness={0.88} />
      </mesh>
      {([-0.48, 0.48] as const).map((x) => (
        <mesh key={x} position={[x, 0.17, -0.02]}>
          <boxGeometry args={[0.08, 0.34, 0.08]} />
          <meshStandardMaterial color="#344148" />
        </mesh>
      ))}

      {sign && (
        <group position={[1.03, 0, -0.02]} scale={0.78}>
          <Clone object={sign} />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(PREFABS_PATH);
