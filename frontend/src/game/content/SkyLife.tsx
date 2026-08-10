"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../store";
import { ECONOMY } from "../economy";

type CloudSpec = {
  position: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
  drift?: [number, number];
};

type MoonCraterSpec = {
  direction: [number, number, number];
  size: number;
  color: string;
};

const CELESTIAL_ORBIT_RADIUS = 104;
const CELESTIAL_ORBIT_TILT = 0.72;
const TWO_PI = Math.PI * 2;
const MINUTES_PER_DAY = 1440;

// ---------------------------------------------------------------------------
// Yumuşak gökyüzü saati
//
// `store.gameTimeMinutes` simülasyon zamanlayıcısıyla saniyede 4 kez, 0,5 oyun
// dakikalık SIÇRAMALARLA ilerler. Gökyüzü rengi ve ışıklar bu değeri doğrudan
// okuduğunda geçişler kademeli görünüyordu. Bu saat her KARE kendi başına akar,
// store değerine yalnızca yumuşakça yakınsar (büyük sıçramada — yükleme, gün
// değişimi, sekme senkronu — anında hizalanır).
// ---------------------------------------------------------------------------
const skyClock = { minutes: -1 };
/** Store ile arayı kapatma hızı (saniyede oran). */
const SKY_CLOCK_CATCHUP = 2;
/** Bu kadar oyun dakikasından büyük fark "sıçrama" sayılır ve anında hizalanır. */
const SKY_CLOCK_SNAP_MINUTES = 30;

/** Kare başına BİR KEZ çağrılır (CelestialRig). Diğer bileşenler `visualGameMinutes()` okur. */
function advanceSkyClock(delta: number): number {
  const target = useGameStore.getState().gameTimeMinutes;
  if (skyClock.minutes < 0) {
    skyClock.minutes = target;
    return target;
  }

  const perSecond = ECONOMY.time.gameMinutesPerRealSecond;
  let minutes = (skyClock.minutes + perSecond * delta) % MINUTES_PER_DAY;

  // Gün sarmasını dikkate alarak en kısa yönden farkı bul.
  let diff = target - minutes;
  if (diff > MINUTES_PER_DAY / 2) diff -= MINUTES_PER_DAY;
  if (diff < -MINUTES_PER_DAY / 2) diff += MINUTES_PER_DAY;

  minutes = Math.abs(diff) > SKY_CLOCK_SNAP_MINUTES
    ? target
    : (minutes + diff * Math.min(1, delta * SKY_CLOCK_CATCHUP) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  skyClock.minutes = minutes;
  return minutes;
}

function visualGameMinutes(): number {
  return skyClock.minutes < 0 ? useGameStore.getState().gameTimeMinutes : skyClock.minutes;
}

// PERF: kare basina tahsis edilmemesi gereken sabitler ve gecici (scratch) nesneler.
// CelestialCycle useFrame'i 60 Hz calisiyor; bunlar orada eskiden her karede
// `new` ile uretiliyordu (saniyede ~300 THREE nesnesi + GC baskisi).
const SUNSET_TINT = new THREE.Color("#F6B184");
const SKY_TINT_DAY = new THREE.Color("#DDF4FF");
const GROUND_TINT_DAY = new THREE.Color("#B58A5D");
const SCRATCH_SUN_POSITION = new THREE.Vector3();
const SCRATCH_MOON_POSITION = new THREE.Vector3();

// Tum bulut parcalari icin TEK geometri + 4 paylasimli materyal (bkz. LowPolyCloud).
const CLOUD_GEOMETRY = new THREE.IcosahedronGeometry(1, 1);
const CLOUD_MATERIALS = ["#FAF9F4", "#FFFFFF", "#F7F6F1", "#EFEFEB"].map(
  (color) => new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }),
);
const MOON_CRATERS: MoonCraterSpec[] = [
  { direction: [-0.38, 0.22, 0.9], size: 0.52, color: "#AEB7C7" },
  { direction: [0.28, 0.48, 0.83], size: 0.34, color: "#B8C0CE" },
  { direction: [0.46, -0.3, 0.84], size: 0.44, color: "#A5AFBF" },
  { direction: [-0.12, -0.58, 0.81], size: 0.28, color: "#BAC2CF" },
  { direction: [-0.72, -0.2, 0.66], size: 0.31, color: "#A9B3C3" },
  { direction: [0.76, 0.14, 0.63], size: 0.25, color: "#B4BDCB" },
  { direction: [-0.52, 0.68, 0.52], size: 0.22, color: "#A7B0C0" },
  { direction: [0.18, -0.82, 0.54], size: 0.2, color: "#B1BAC9" },
  { direction: [0.04, 0.9, 0.44], size: 0.18, color: "#A8B2C2" },
];

const CLOUDS: CloudSpec[] = [
  // Kuzey ufku
  { position: [-58, 9, -12], scale: 1.55, speed: 0.17, phase: 5.8, drift: [4, 2] },
  { position: [-47, 12, -34], scale: 2.05, speed: 0.2, phase: 0.2, drift: [5, 2] },
  { position: [-28, 16, -55], scale: 2.4, speed: 0.16, phase: 0.9, drift: [4, 3] },
  { position: [-4, 20, -66], scale: 2.8, speed: 0.14, phase: 2.1, drift: [5, 3] },
  { position: [23, 15, -54], scale: 2.3, speed: 0.17, phase: 3.2, drift: [4, 2] },
  { position: [46, 12, -35], scale: 1.8, speed: 0.2, phase: 3.8, drift: [5, 2] },
  { position: [60, 10, -10], scale: 1.65, speed: 0.18, phase: 4.3, drift: [4, 3] },
  // Doğu ve batı boşlukları
  { position: [-68, 14, 12], scale: 2.1, speed: 0.18, phase: 5.1, drift: [3, 4] },
  { position: [-63, 10, 39], scale: 1.7, speed: 0.21, phase: 1.3, drift: [4, 5] },
  { position: [-52, 18, 62], scale: 1.8, speed: 0.13, phase: 2.8, drift: [5, 3] },
  { position: [68, 15, 14], scale: 2.2, speed: 0.16, phase: 4.7, drift: [3, 4] },
  { position: [63, 9, 41], scale: 1.6, speed: 0.22, phase: 0.5, drift: [4, 5] },
  { position: [51, 17, 64], scale: 1.85, speed: 0.14, phase: 3.5, drift: [5, 3] },
  // Güney/ön plan: haritanın altındaki boş gökyüzünü doldurur
  { position: [-42, 7, 67], scale: 0.82, speed: 0.19, phase: 5.5, drift: [6, 3] },
  { position: [-22, 9, 72], scale: 0.96, speed: 0.15, phase: 0.7, drift: [5, 4] },
  { position: [-4, 6, 65], scale: 0.7, speed: 0.21, phase: 1.8, drift: [6, 3] },
  { position: [15, 8, 74], scale: 0.88, speed: 0.16, phase: 4.1, drift: [5, 4] },
  { position: [34, 6, 66], scale: 0.74, speed: 0.2, phase: 2.7, drift: [6, 3] },
  { position: [50, 9, 73], scale: 0.92, speed: 0.14, phase: 3.3, drift: [5, 4] },
  // Şehrin üstündeki seyrek ve yüksek katman
  { position: [-38, 23, 24], scale: 1.65, speed: 0.12, phase: 2.4, drift: [4, 5] },
  { position: [0, 24, 8], scale: 1.2, speed: 0.11, phase: 5.9, drift: [5, 4] },
  { position: [39, 21, 27], scale: 1.8, speed: 0.13, phase: 3.9, drift: [4, 5] },
];

function smoothstep(min: number, max: number, value: number) {
  const x = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

function updateSkyTexture(texture: THREE.DataTexture, sunElevation: number) {
  const data = texture.image.data as Uint8Array;
  const width = 2;
  const height = 256;
  const daylight = smoothstep(-0.34, 0.42, sunElevation);
  const twilightRise = smoothstep(-0.58, -0.08, sunElevation);
  const twilightFall = 1 - smoothstep(0.12, 0.58, sunElevation);
  const twilight = twilightRise * twilightFall;

  const horizon = new THREE.Color("#18243B")
    .lerp(new THREE.Color("#E7F6FA"), daylight)
    .lerp(new THREE.Color("#F5B889"), twilight * 0.58);
  const midSky = new THREE.Color("#0B1730")
    .lerp(new THREE.Color("#C8EAF4"), daylight)
    .lerp(new THREE.Color("#A796B4"), twilight * 0.24);
  const topSky = new THREE.Color("#050A18")
    .lerp(new THREE.Color("#8BCDE8"), daylight)
    .lerp(new THREE.Color("#526586"), twilight * 0.12);

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    const color =
      v < 0.28
        ? horizon.clone().lerp(midSky, v / 0.28)
        : midSky.clone().lerp(topSky, (v - 0.28) / 0.72);

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = Math.round(color.r * 255);
      data[index + 1] = Math.round(color.g * 255);
      data[index + 2] = Math.round(color.b * 255);
      data[index + 3] = 255;
    }
  }

  texture.needsUpdate = true;
}

function createSkyTexture() {
  const width = 2;
  const height = 256;
  const data = new Uint8Array(width * height * 4);
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  updateSkyTexture(texture, 0.8);
  texture.needsUpdate = true;
  return texture;
}

function createSunGlowTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size * 2 - 1;
      const ny = (y + 0.5) / size * 2 - 1;
      const radius = Math.sqrt(nx * nx + ny * ny);
      const halo = Math.pow(Math.max(0, 1 - radius), 3.2);
      const core = Math.max(0, Math.min(1, (0.24 - radius) / 0.16));
      const alpha = Math.max(halo * 0.72, core);
      const warmth = Math.max(0, Math.min(1, radius));
      const index = (y * size + x) * 4;

      data[index] = 255;
      data[index + 1] = Math.round(246 - warmth * 50);
      data[index + 2] = Math.round(210 - warmth * 130);
      data[index + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createStarField() {
  const count = 240;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let seed = 9187;

  const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < count; index += 1) {
    const azimuth = random() * TWO_PI;
    const elevation = 0.14 + Math.pow(random(), 0.72) * 1.28;
    const radius = 155 + random() * 38;
    const horizontalRadius = Math.cos(elevation) * radius;
    const offset = index * 3;

    positions[offset] = Math.cos(azimuth) * horizontalRadius;
    positions[offset + 1] = 4 + Math.sin(elevation) * radius;
    positions[offset + 2] = Math.sin(azimuth) * horizontalRadius;

    const tint = random();
    const color =
      tint > 0.86
        ? new THREE.Color("#B9D7FF")
        : tint < 0.12
          ? new THREE.Color("#FFE4BF")
          : new THREE.Color("#F5F7FF");
    const brightness = 0.62 + random() * 0.38;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { positions, colors };
}

function SkyBackground() {
  const texture = useMemo(() => createSkyTexture(), []);
  const lastSkyMinute = useRef(-1);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    // Yumuşak saat (bkz. advanceSkyClock) — eşik küçük tutulur ki geçiş bantlanmasın.
    const gameTimeMinutes = visualGameMinutes();
    if (Math.abs(gameTimeMinutes - lastSkyMinute.current) < 0.04) return;

    lastSkyMinute.current = gameTimeMinutes;
    const angle = gameTimeMinutes / MINUTES_PER_DAY * TWO_PI - Math.PI / 2;
    updateSkyTexture(texture, Math.sin(angle));
  });

  return <primitive attach="background" object={texture} />;
}

function NightStars() {
  const stars = useRef<THREE.Points>(null!);
  const material = useRef<THREE.PointsMaterial>(null!);
  const starField = useMemo(() => createStarField(), []);

  useFrame(({ clock }) => {
    const gameTimeMinutes = visualGameMinutes();
    const angle = gameTimeMinutes / MINUTES_PER_DAY * TWO_PI - Math.PI / 2;
    const nightVisibility = smoothstep(0.04, 0.38, -Math.sin(angle));

    material.current.opacity =
      nightVisibility * (0.78 + Math.sin(clock.elapsedTime * 0.55) * 0.08);
    stars.current.rotation.y = gameTimeMinutes / 1440 * TWO_PI * 0.14;
  });

  return (
    <points ref={stars} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[starField.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[starField.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        size={1.25}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function LowPolyCloud({ spec }: { spec: CloudSpec }) {
  const cloud = useRef<THREE.Group>(null!);
  const originX = spec.position[0];
  const originZ = spec.position[2];
  const [driftX, driftZ] = spec.drift ?? [3.2, 1.8];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * spec.speed + spec.phase;
    cloud.current.position.x = originX + Math.sin(t) * driftX;
    cloud.current.position.y = spec.position[1] + Math.sin(t * 0.7) * 0.28;
    cloud.current.position.z = originZ + Math.cos(t * 0.82) * driftZ;
  });

  return (
    // PERF: geometri ve materyaller PAYLASIMLI (modul duzeyinde). Eskiden her bulut
    // kendi 4 geometrisini ve 4 materyalini yaratiyordu → 23 bulut x 4 = 92 ayri
    // geometri + 92 ayri materyal + 92 shader program varyanti. Simdi 1 geometri, 4
    // materyal; GPU tarafinda materyal degisimi (state change) da minimuma iner.
    <group ref={cloud} position={spec.position} scale={spec.scale}>
      <mesh
        position={[-1.25, -0.05, 0]}
        scale={[1.35, 0.72, 0.92]}
        geometry={CLOUD_GEOMETRY}
        material={CLOUD_MATERIALS[0]}
      />
      <mesh
        position={[-0.2, 0.35, 0.05]}
        scale={[1.25, 1, 1]}
        geometry={CLOUD_GEOMETRY}
        material={CLOUD_MATERIALS[1]}
      />
      <mesh
        position={[0.95, 0.05, 0]}
        scale={[1.45, 0.78, 0.94]}
        geometry={CLOUD_GEOMETRY}
        material={CLOUD_MATERIALS[2]}
      />
      <mesh
        position={[0.08, -0.38, 0]}
        scale={[2.1, 0.42, 0.82]}
        geometry={CLOUD_GEOMETRY}
        material={CLOUD_MATERIALS[3]}
      />
    </group>
  );
}

function MoonCrater({ spec }: { spec: MoonCraterSpec }) {
  const direction = useMemo(
    () => new THREE.Vector3(...spec.direction).normalize(),
    [spec.direction],
  );
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        direction,
      ),
    [direction],
  );
  const position = useMemo(
    () => direction.clone().multiplyScalar(3.075),
    [direction],
  );

  return (
    <mesh position={position} quaternion={quaternion} scale={[spec.size, spec.size, 1]}>
      <circleGeometry args={[1, 10]} />
      <meshStandardMaterial
        color={spec.color}
        emissive="#697995"
        emissiveIntensity={0.12}
        roughness={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CelestialCycle() {
  const sun = useRef<THREE.Group>(null!);
  const moon = useRef<THREE.Group>(null!);
  const sunCore = useRef<THREE.Mesh>(null!);
  const moonCore = useRef<THREE.Mesh>(null!);
  const sunLight = useRef<THREE.DirectionalLight>(null!);
  const moonLight = useRef<THREE.DirectionalLight>(null!);
  const ambientLight = useRef<THREE.AmbientLight>(null!);
  const hemisphereLight = useRef<THREE.HemisphereLight>(null!);
  const glowTexture = useMemo(() => createSunGlowTexture(), []);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  useFrame((_, delta) => {
    // Saati kare başına BİR KEZ burada ilerletiyoruz; diğer bileşenler okur.
    const gameTimeMinutes = advanceSkyClock(delta);
    const angle = gameTimeMinutes / MINUTES_PER_DAY * TWO_PI - Math.PI / 2;
    const moonAngle = angle + Math.PI;
    const orbitHeight = CELESTIAL_ORBIT_RADIUS * Math.sin(CELESTIAL_ORBIT_TILT);
    const orbitDepth = CELESTIAL_ORBIT_RADIUS * Math.cos(CELESTIAL_ORBIT_TILT);

    // PERF: bu iki vektor eskiden HER KAREDE `new THREE.Vector3` ile uretiliyordu.
    // Modul seviyesindeki scratch nesnelerine yaziyoruz — kare basina 2 tahsis eksik.
    const sunPosition = SCRATCH_SUN_POSITION.set(
      Math.cos(angle) * CELESTIAL_ORBIT_RADIUS,
      6 + Math.sin(angle) * orbitHeight,
      -Math.sin(angle) * orbitDepth,
    );
    const moonPosition = SCRATCH_MOON_POSITION.set(
      Math.cos(moonAngle) * CELESTIAL_ORBIT_RADIUS,
      6 + Math.sin(moonAngle) * orbitHeight,
      -Math.sin(moonAngle) * orbitDepth,
    );

    sun.current.position.copy(sunPosition);
    moon.current.position.copy(moonPosition);
    sunLight.current.position.copy(sunPosition);
    moonLight.current.position.copy(moonPosition);

    sunCore.current.rotation.y += delta * 0.04;
    sunCore.current.rotation.x += delta * 0.012;
    moonCore.current.rotation.y -= delta * 0.018;

    const sunElevation = Math.sin(angle);
    const daylight = smoothstep(-0.34, 0.42, sunElevation);
    const nightlight = smoothstep(0.12, 0.5, -sunElevation);
    const sunsetWarmth =
      smoothstep(-0.58, -0.08, sunElevation) *
      (1 - smoothstep(0.12, 0.58, sunElevation));

    sunLight.current.intensity = 0.06 + daylight * 0.96;
    // PERF: sabit renkler modul duzeyinde — eskiden her karede 3 `new THREE.Color`.
    sunLight.current.color.set("#FFF0C2").lerp(SUNSET_TINT, sunsetWarmth * 0.48);
    moonLight.current.intensity = nightlight * 0.38;
    ambientLight.current.intensity = 0.18 + daylight * 0.5 + nightlight * 0.06;
    hemisphereLight.current.intensity = 0.16 + daylight * 0.3 + nightlight * 0.08;
    hemisphereLight.current.color.set("#8EA9D1").lerp(SKY_TINT_DAY, daylight);
    hemisphereLight.current.groundColor.set("#18213A").lerp(GROUND_TINT_DAY, daylight);
  });

  return (
    <>
      <ambientLight ref={ambientLight} intensity={0.68} />
      <hemisphereLight ref={hemisphereLight} args={["#DDF4FF", "#B58A5D", 0.46]} />
      <directionalLight ref={sunLight} color="#FFF0C2" intensity={1.02} />
      <directionalLight ref={moonLight} color="#A9C5FF" intensity={0} />

      <group ref={sun} position={[90, 42, -45]}>
        <sprite scale={[32, 32, 1]} renderOrder={-2}>
          <spriteMaterial
            map={glowTexture}
            color="#FFBE55"
            transparent
            opacity={0.62}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <sprite scale={[18, 18, 1]} renderOrder={-1}>
          <spriteMaterial
            map={glowTexture}
            color="#FFF0B0"
            transparent
            opacity={0.94}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <sprite scale={[40, 12, 1]} renderOrder={-3}>
          <spriteMaterial
            map={glowTexture}
            color="#FFB85C"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <mesh ref={sunCore}>
          <icosahedronGeometry args={[3.25, 2]} />
          <meshStandardMaterial
            color="#FFD977"
            emissive="#FFB13B"
            emissiveIntensity={0.86}
            roughness={0.76}
            flatShading
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={moon} position={[-90, -30, 45]}>
        <sprite scale={[38, 38, 1]} renderOrder={-4}>
          <spriteMaterial
            map={glowTexture}
            color="#AFC8FF"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <sprite scale={[20, 20, 1]} renderOrder={-3}>
          <spriteMaterial
            map={glowTexture}
            color="#F4F7FF"
            transparent
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <sprite scale={[11, 11, 1]} renderOrder={-2}>
          <spriteMaterial
            map={glowTexture}
            color="#FFFFFF"
            transparent
            opacity={0.72}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
        <mesh ref={moonCore}>
          <icosahedronGeometry args={[3.05, 2]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#DCE7FF"
            emissiveIntensity={0.68}
            roughness={1}
            flatShading
          />
        </mesh>
        {MOON_CRATERS.map((spec, index) => (
          <MoonCrater key={index} spec={spec} />
        ))}
      </group>
    </>
  );
}

function Airplane() {
  const airplane = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.045 + 0.65;
    const x = Math.cos(t) * 43;
    const z = Math.sin(t) * 5 - 24;
    const y = 13.5 + Math.sin(t * 2) * 0.55;
    const dx = -Math.sin(t) * 43;
    const dz = Math.cos(t) * 5;

    airplane.current.position.set(x, y, z);
    airplane.current.rotation.y = Math.atan2(dx, dz);
    airplane.current.rotation.z = Math.sin(t) * -0.12;
  });

  return (
    <group ref={airplane} scale={0.68}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.34, 3.8, 8]} />
        <meshStandardMaterial color="#F4EBD6" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0, 2.02]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.19, 0.55, 8]} />
        <meshStandardMaterial color="#E8B83E" roughness={0.72} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[4.8, 0.13, 0.78]} />
        <meshStandardMaterial color="#E8B83E" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.04, -1.55]}>
        <boxGeometry args={[1.8, 0.11, 0.48]} />
        <meshStandardMaterial color="#3E8790" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.42, -1.48]}>
        <boxGeometry args={[0.11, 0.78, 0.52]} />
        <meshStandardMaterial color="#3E8790" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.24, 1.05]} scale={[0.34, 0.2, 0.5]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#37616D" roughness={0.45} flatShading />
      </mesh>
      <mesh position={[-1.45, -0.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 8]} />
        <meshStandardMaterial color="#C98E2C" roughness={0.85} />
      </mesh>
      <mesh position={[1.45, -0.2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 8]} />
        <meshStandardMaterial color="#C98E2C" roughness={0.85} />
      </mesh>
      <mesh position={[-1.45, -0.2, -2.6]}>
        <boxGeometry args={[0.055, 0.055, 4]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <mesh position={[1.45, -0.2, -2.6]}>
        <boxGeometry args={[0.055, 0.055, 4]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <mesh position={[-2.38, 0.02, 0.12]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshBasicMaterial color="#EF665F" />
      </mesh>
      <mesh position={[2.38, 0.02, 0.12]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshBasicMaterial color="#59D79A" />
      </mesh>
    </group>
  );
}

export const SkyLife = memo(function SkyLife() {
  return (
    <>
      <SkyBackground />
      <group>
        <NightStars />
        <CelestialCycle />
        {CLOUDS.map((spec, index) => (
          <LowPolyCloud key={index} spec={spec} />
        ))}
        <Airplane />
      </group>
    </>
  );
});
