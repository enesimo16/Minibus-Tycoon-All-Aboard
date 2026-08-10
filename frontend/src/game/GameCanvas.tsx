"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { memo, Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { sampleFrame } from "../game/telemetry";
import { ECONOMY } from "./economy";
import {
  autoPilotSpeedKmh,
  isForwardColliderBlocked,
  nextLaneOffset,
  nextSpeedKmh,
  nextSteerAngle,
  recenterLaneOffsetForTurn,
  shouldYieldAtCrossing,
  trafficSpeedCapKmh,
  wrapProgress,
} from "./driving";
import { useGameStore } from "./store";
import {
  ROUTE_DEFINITIONS,
  STOP_PAUSE_SECONDS,
  getRouteGeometry,
  getRouteLength,
  getStopCount,
  nearestRouteProgress,
  nextStopIndexAfter,
  routePoint,
  stopProgress,
} from "./route";
import { clampMoveToRoad } from "./cityRoads";
import { getTerminalUpgrade } from "./terminal";
import { ROAD_SURFACE_Y } from "./content/groundAlign";
import { SceneProp } from "./content/SceneProp";
import { CityModel } from "./content/CityModel";
import { MvpWorld } from "./content/MvpWorld";
import { PassengerMoodBubble } from "./content/PassengerMoodBubble";
import { SkyLife } from "./content/SkyLife";
import { BusModel, BusPlaceholder } from "./content/BusModel";
import { TrafficVehicleModel, TrafficVehiclePlaceholder } from "./content/VehicleModel";
import { useEditorStore } from "./editor/editorStore";
import { Editor } from "./editor/Editor";
import { useUiStore } from "./uiStore";
import { useSettingsStore } from "./settingsStore";
import {
  CITY_TRAFFIC_VEHICLES,
  sampleTrafficPath,
  type TrafficVehicleSpec,
} from "./traffic";

// ---------------------------------------------------------------------------
// Aşama 1 iskeleti: elips hat üzerinde turlayan placeholder dolmuş.
// Kemal'in modelleri gelince sadece geometry/material değişir; mimari dokunulmaz.
// DUR/GEÇ: docs/game-design/03-surus-mekanigi.md
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Module-level pre-computations — mount sırasında değil, yalnızca bir kez hesaplanır.
// ---------------------------------------------------------------------------
const MPS_TO_KMH = 3.6;
const BUS_PROGRESS_BROADCAST_INTERVAL = 0.1;
const STOP_QUEUE_UPDATE_INTERVAL_SECONDS = 0.5;
const SIMULATION_UPDATE_INTERVAL_SECONDS = 0.25;
const INTERACTION_UPDATE_INTERVAL_SECONDS = 0.1;
const STOP_APPROACH_BRAKE_DISTANCE_METERS = 18;
const STOP_DOCK_SPEED_KMH = 5;
const liveBusProgress = { current: 0 };
const ROAM_TURN_RATE_RAD_PER_SEC = ECONOMY.driving.roamTurnRateRadPerSec;
/** Bu hızda direksiyon tam etkili olur; altında dönüş oransal olarak zayıflar. */
const ROAM_FULL_TURN_KMH = ECONOMY.driving.roamFullTurnKmh;
const ROAM_BOUNDS_METERS = ECONOMY.driving.roamBoundsMeters;
/** Bu hızın altındaki dolmuş "park etmiş" sayılır; trafik onun için kavşak tutmaz. */
const BUS_RESERVATION_MIN_KMH = ECONOMY.driving.busReservationMinKmh;
const TRAFFIC_STUCK_LIMIT_SECONDS = ECONOMY.driving.trafficStuckLimitSeconds;
const TRAFFIC_STOPPED_SPEED = ECONOMY.driving.trafficStoppedSpeed;
const TRAFFIC_CREEP_RATIO = ECONOMY.driving.trafficCreepRatio;
/** Yola sürtünce korunan hız oranı — sert duruş yerine yumuşak kayma. */
const ROAM_BLOCKED_SPEED_RETENTION = ECONOMY.driving.roamBlockedSpeedRetention;
const MODEL_FORWARD = new THREE.Vector3(0, 0, -1);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
// Trafik mesafeleri tek kaynaktan (shared/economy.json -> driving).
const MIN_TRAFFIC_GAP = ECONOMY.driving.followGapMeters;
const SLOW_TRAFFIC_GAP = ECONOMY.driving.slowGapMeters;
const TRAFFIC_BLOCK_WIDTH = ECONOMY.driving.laneBlockWidthMeters;
const CITY_VEHICLE_COLLIDER_RADIUS = 0.82;
const BUS_COLLIDER_RADIUS = 1.18;
const VEHICLE_COLLIDER_DISTANCE = CITY_VEHICLE_COLLIDER_RADIUS * 2;
const BUS_COLLIDER_DISTANCE =
  CITY_VEHICLE_COLLIDER_RADIUS + BUS_COLLIDER_RADIUS;
const INTERSECTION_RESERVATION_DISTANCE = 2.65;
const liveCityTraffic = new Map<
  string,
  {
    pathId: string;
    progress: number;
    x: number;
    z: number;
    forwardX: number;
    forwardZ: number;
    speed: number;
  }
>();
const liveBusPose = {
  x: 0,
  z: 0,
  forwardX: 0,
  forwardZ: -1,
  /** Anlık hız (km/h). Trafik, DURAN dolmuş için kavşak rezervasyonu yapmaz. */
  speedKmh: 0,
  ready: false,
};
// ---------------------------------------------------------------------------
// Sekme liderlik mantığı — yalnızca lider simülasyonu çalıştırır.
// ---------------------------------------------------------------------------
function Bus() {
  const isLeader = useGameStore((s) => s.isLeader);
  return isLeader ? <LeaderBus /> : <FollowerBus />;
}

function LeaderBus() {
  const group = useRef<THREE.Group>(null!);
  const targetBusPosition = useRef(new THREE.Vector3());
  const targetBusDirection = useRef(new THREE.Vector3(0, 0, -1));
  const targetBusQuaternion = useRef(new THREE.Quaternion());
  const busTransformInitialized = useRef(false);
  const progress = useRef(0);
  const pauseLeft = useRef(0);
  const nextStopIndex = useRef(0);
  const stopDoorsOpen = useRef(false);
  const queueGrowthTimer = useRef(0);
  const simulationTimer = useRef(0);
  const interactionTimer = useRef(0);
  const broadcastTimer = useRef(0);
  // Gezinti modu serbest sürüş konumu (hat progress'inden bagimsiz).
  const roamInitialized = useRef(false);
  const roamX = useRef(0);
  const roamZ = useRef(0);
  const roamHeading = useRef(0);
  /** Son görülen gün başlatma jetonu — yeni gün hattın başından başlasın diye. */
  const lastDayStartToken = useRef(-1);
  /** Anlik hiz (km/h). Negatif = geri vites. */
  const speedKmh = useRef(0);
  /** Hat merkezine gore lateral kayma (metre). Sollama bununla yapilir. */
  const laneOffset = useRef(0);
  /** Direksiyon acisi (radyan). Aracin burnu bu kadar doner. */
  const steerAngle = useRef(0);

  const growStopQueues = useGameStore((s) => s.growStopQueues);
  const applySoundSystem = useGameStore((s) => s.applySoundSystem);
  const tickInteraction = useGameStore((s) => s.tickInteraction);
  const tickDetour = useGameStore((s) => s.tickDetour);
  const tickSecondLine = useGameStore((s) => s.tickSecondLine);
  const tickGameTime = useGameStore((s) => s.tickGameTime);
  const tickSpeedRisk = useGameStore((s) => s.tickSpeedRisk);
  const tickRoadsideDelay = useGameStore((s) => s.tickRoadsideDelay);
  const tickPassengerMood = useGameStore((s) => s.tickPassengerMood);
  const tickRoadsidePause = useGameStore((s) => s.tickRoadsidePause);
  const tickOwnedBuses = useGameStore((s) => s.tickOwnedBuses);
  const tickTerminal = useGameStore((s) => s.tickTerminal);
  const resolveArrivalAtStop = useGameStore((s) => s.resolveArrivalAtStop);
  const setBusProgress = useGameStore((s) => s.setBusProgress);
  const setCurrentSpeedKmh = useGameStore((s) => s.setCurrentSpeedKmh);
  const activeRouteId = useGameStore((s) => s.activeRouteId);

  useEffect(() => {
    progress.current = 0;
    pauseLeft.current = 0;
    nextStopIndex.current = 0;
    stopDoorsOpen.current = false;
    queueGrowthTimer.current = 0;
    simulationTimer.current = 0;
    interactionTimer.current = 0;
    speedKmh.current = 0;
    laneOffset.current = 0;
    steerAngle.current = 0;
    busTransformInitialized.current = false;
    liveBusProgress.current = 0;
    setBusProgress(0);
    setCurrentSpeedKmh(0);
  }, [activeRouteId, setBusProgress, setCurrentSpeedKmh]);

  useFrame(({ clock }, delta) => {
    broadcastTimer.current += delta;
    sampleFrame(clock.elapsedTime * 1000);

    queueGrowthTimer.current += delta;
    if (queueGrowthTimer.current >= STOP_QUEUE_UPDATE_INTERVAL_SECONDS) {
      growStopQueues(queueGrowthTimer.current);
      queueGrowthTimer.current = 0;
    }
    interactionTimer.current += delta;
    if (interactionTimer.current >= INTERACTION_UPDATE_INTERVAL_SECONDS) {
      const interactionDelta = interactionTimer.current;
      interactionTimer.current = 0;
      tickInteraction(interactionDelta);
      if (useGameStore.getState().roadsidePauseLeft > 0) {
        tickRoadsidePause(interactionDelta);
      }
      // PERF: 9 saniyelik detour animasyonu 60 Hz muhasebe gerektirmiyor. Kare basina
      // cagrildiginda `attention` her karede yeni nesne uretip TUM abonelere haber
      // veriyordu (saniyede ~9.000 selector cagrisi). 10 Hz gorsel olarak ayni.
      tickDetour(interactionDelta);
    }

    simulationTimer.current += delta;
    if (simulationTimer.current >= SIMULATION_UPDATE_INTERVAL_SECONDS) {
      const simulationDelta = simulationTimer.current;
      simulationTimer.current = 0;
      applySoundSystem(simulationDelta);
      tickSecondLine(simulationDelta);
      tickOwnedBuses(simulationDelta);
      tickTerminal(simulationDelta);
      tickGameTime(simulationDelta);
      tickSpeedRisk(simulationDelta);
      tickRoadsideDelay(simulationDelta);
      tickPassengerMood(simulationDelta);
    }

    const gs = useGameStore.getState();
    // Ehliyet cezası (100 puan) → araç kilitli; el koyma ve askı da aracı durdurur.
    if (gs.policeLevel >= 4 || gs.suspensionMinutesLeft > 0 || gs.vehicleLockSecondsLeft > 0) return;

    const syncBusTransform = () => {
      const [cx, cz] = routePoint(progress.current);
      const [nx, nz] = routePoint(progress.current + 0.005);
      const frameDelta = Math.min(delta, 0.05);
      // Serit ofseti gorsel konuma da uygulanir; carpisma testiyle ayni nokta olmali.
      const dirLength = Math.hypot(nx - cx, nz - cz) || 1;
      const x = cx + (-(nz - cz) / dirLength) * laneOffset.current;
      const z = cz + ((nx - cx) / dirLength) * laneOffset.current;
      targetBusPosition.current.set(x, ROAD_SURFACE_Y, z);
      targetBusDirection.current.set(nx - cx, 0, nz - cz).normalize();
      // Burun direksiyon kadar doner — tek kare yana ziplama yerine donerek suzulme.
      if (steerAngle.current !== 0) {
        targetBusDirection.current.applyAxisAngle(
          WORLD_UP,
          -steerAngle.current * 0.28,
        );
      }
      liveBusPose.x = x;
      liveBusPose.z = z;
      liveBusPose.forwardX = targetBusDirection.current.x;
      liveBusPose.forwardZ = targetBusDirection.current.z;
      liveBusPose.speedKmh = Math.abs(speedKmh.current);
      liveBusPose.ready = true;
      targetBusQuaternion.current.setFromUnitVectors(
        MODEL_FORWARD,
        targetBusDirection.current,
      );

      if (!busTransformInitialized.current) {
        group.current.position.copy(targetBusPosition.current);
        group.current.quaternion.copy(targetBusQuaternion.current);
        busTransformInitialized.current = true;
      } else {
        group.current.position.lerp(
          targetBusPosition.current,
          1 - Math.exp(-24 * frameDelta),
        );
        group.current.quaternion.slerp(
          targetBusQuaternion.current,
          1 - Math.exp(-11 * frameDelta),
        );
      }
      liveBusProgress.current = progress.current;
      if (broadcastTimer.current >= BUS_PROGRESS_BROADCAST_INTERVAL) {
        broadcastTimer.current = 0;
        setBusProgress(progress.current);
      }
    };

    if (gs.roadsidePauseLeft > 0) {
      syncBusTransform();
      return;
    }

    // Hat dışı sefer: dolmuş yol ağının DIŞINA çıkarılmaz. Eski sürümde hattın
    // sağına dik bir "sapak" hesaplanıp araç oraya taşınıyordu; yol ağı bilinmediği
    // için bu binaların/denizin içinden geçen saçma bir rotaya yol açıyordu.
    // Yeni davranış: araç bulunduğu noktada bekler, süre boyunca para birikir
    // (bkz. DetourPayoutOverlay), sonra kaldığı yerden hatta devam eder.
    if (useGameStore.getState().detourActive) {
      syncBusTransform();
      return;
    }

    // Tam ekran rapor açıkken dolmuş sürmeye devam etmez — oyuncu okurken
    // aracın kontrolsüz ilerlemesi (ve durak kaçırması) engellenir.
    if (gs.lapReport || gs.dayReport) {
      syncBusTransform();
      return;
    }

    const beginStopService = () => {
      useGameStore.setState((state) => ({
        driving: { ...state.driving, doorsOpen: true },
        decision: { open: false, secondsLeft: 0, choice: "DUR" },
      }));
      resolveArrivalAtStop(nextStopIndex.current);
      stopDoorsOpen.current = true;
      pauseLeft.current = STOP_PAUSE_SECONDS;
      speedKmh.current = 0;
      nextStopIndex.current = (nextStopIndex.current + 1) % getStopCount();
      useGameStore.setState({ roadsidePendingDelay: 0 });
    };

    if (useGameStore.getState().interaction.type !== null) {
      speedKmh.current = 0;
      setCurrentSpeedKmh(0);
      syncBusTransform();
      return;
    }

    if (pauseLeft.current > 0) {
      pauseLeft.current -= delta;
      speedKmh.current = 0;
      setCurrentSpeedKmh(0);
      if (pauseLeft.current <= 0 && stopDoorsOpen.current) {
        stopDoorsOpen.current = false;
        useGameStore.setState((state) => ({
          driving: { ...state.driving, doorsOpen: false },
        }));
      }
      syncBusTransform();
      return;
    }

    const gameState = useGameStore.getState();
    const driverSpeedMultiplier =
      gameState.driverActive ? (gameState.getActiveDriver()?.speedMultiplier ?? 1) : 1;

    // Aracin ulasabilecegi tavan hiz: motor yukseltmesi x sofor x vardiya plani x GEC bonusu,
    // ve oyuncunun limitleyicisi. Limitleyici SADECE tavani belirler, gazi WASD verir.
    const capabilityKmh =
      ECONOMY.bus.baseSpeedMetersPerSec *
      MPS_TO_KMH *
      gameState.speedMultiplier *
      driverSpeedMultiplier *
      1;
    const targetTopKmh = Math.min(capabilityKmh, gameState.speedLimitKmh);

    // --- Hiz: sofor varsa otomatik, yoksa WASD ivmesi ---
    speedKmh.current = gameState.driverActive
      ? autoPilotSpeedKmh(speedKmh.current, targetTopKmh, delta)
      : nextSpeedKmh({
          currentKmh: speedKmh.current,
          targetTopKmh,
          throttle: gameState.driving.throttle,
          handbrake: gameState.driving.handbrake,
          deltaSeconds: delta,
        });

    // --- Serit kaydirma (sollama): A/D lateral ofseti degistirir, birakinca merkeze doner ---
    const steer = gameState.driverActive ? 0 : gameState.driving.steer;
    steerAngle.current = nextSteerAngle(steerAngle.current, steer, delta);
    // Yana kayma hiza baglidir: dururken direksiyon cevirmek araci tasimaz.
    laneOffset.current = nextLaneOffset(
      laneOffset.current,
      steerAngle.current,
      speedKmh.current,
      delta,
    );

    // --- GEZİNTİ MODU: hat geometrisinden bağımsız serbest sürüş ---
    // Gün başlamamışken dolmuş raya bağlı değildir; WASD ile şehirde istenen yöne
    // gidilir. Güne dönüldüğünde araç bulunduğu noktaya en yakın hat progress'ine
    // oturtulur (bkz. route.ts > nearestRouteProgress), başa ışınlanmaz.
    if (!gameState.dayRun) {
      if (!roamInitialized.current) {
        const [rx, rz] = routePoint(progress.current);
        const [ax, az] = routePoint(progress.current + 0.005);
        roamX.current = rx;
        roamZ.current = rz;
        roamHeading.current = Math.atan2(ax - rx, az - rz);
        roamInitialized.current = true;
      }

      // Direksiyon burnu çevirir; dururken dönüş yok (gerçek araç gibi).
      //
      // steerAngle radyan cinsindendir (tavanı ~0.24) — doğrudan çarpınca dönüş
      // hızı 15°/sn'de kalıyor ve manevra imkânsızlaşıyordu. Önce [-1,1] aralığına
      // normalleştiriyoruz.
      const steerRatio = THREE.MathUtils.clamp(
        steerAngle.current / ECONOMY.driving.maxSteerAngleRad,
        -1,
        1,
      );
      // GERİ viteste direksiyon ters çalışır (aracın burnu diğer yöne kayar) —
      // gerçek araç davranışı: geri manevrada A/D yer değiştirmiş gibi hissettirir.
      const travelSign = speedKmh.current < 0 ? -1 : 1;
      const speedFactor = Math.min(1, Math.abs(speedKmh.current) / ROAM_FULL_TURN_KMH);
      roamHeading.current -=
        steerRatio * ROAM_TURN_RATE_RAD_PER_SEC * speedFactor * travelSign * delta;

      const forwardX = Math.sin(roamHeading.current);
      const forwardZ = Math.cos(roamHeading.current);

      // Şehir trafiğine çarpışma: serbest sürüşte de araçların içinden geçilemez.
      // Yalnızca gidiş yönümüzdeki araçlar bizi durdurur (geri giderken arkadakiler).
      const travelDirX = speedKmh.current < 0 ? -forwardX : forwardX;
      const travelDirZ = speedKmh.current < 0 ? -forwardZ : forwardZ;
      liveCityTraffic.forEach((vehicle) => {
        const dx = vehicle.x - roamX.current;
        const dz = vehicle.z - roamZ.current;
        if (Math.hypot(dx, dz) > BUS_COLLIDER_DISTANCE) return;
        // Önümüzde mi? (gidiş yönüne izdüşüm pozitifse evet)
        if (dx * travelDirX + dz * travelDirZ <= 0) return;
        speedKmh.current = 0;
      });

      const step = (speedKmh.current / MPS_TO_KMH) * delta;
      const bound = ROAM_BOUNDS_METERS;
      // Serbest sürüşte de araç YOLDA kalır: binaların içinden geçilemez.
      // Tam hareket mümkün değilse tek eksende kaydırılır (duvar boyunca sürtme).
      const moved = clampMoveToRoad(
        roamX.current,
        roamZ.current,
        THREE.MathUtils.clamp(roamX.current + forwardX * step, -bound, bound),
        THREE.MathUtils.clamp(roamZ.current + forwardZ * step, -bound, bound),
      );
      roamX.current = moved.x;
      roamZ.current = moved.z;
      // Duvara sürtünce hız kesilir — araç binaya yaslanıp gaz vermeye devam etmez.
      if (moved.blocked) speedKmh.current *= ROAM_BLOCKED_SPEED_RETENTION;

      setCurrentSpeedKmh(Math.round(speedKmh.current));

      targetBusPosition.current.set(roamX.current, ROAD_SURFACE_Y, roamZ.current);
      targetBusDirection.current.set(forwardX, 0, forwardZ).normalize();
      targetBusQuaternion.current.setFromUnitVectors(MODEL_FORWARD, targetBusDirection.current);
      liveBusPose.x = roamX.current;
      liveBusPose.z = roamZ.current;
      liveBusPose.forwardX = forwardX;
      liveBusPose.forwardZ = forwardZ;
      liveBusPose.speedKmh = Math.abs(speedKmh.current);
      liveBusPose.ready = true;

      const frameDelta = Math.min(delta, 0.05);
      if (!busTransformInitialized.current) {
        group.current.position.copy(targetBusPosition.current);
        group.current.quaternion.copy(targetBusQuaternion.current);
        busTransformInitialized.current = true;
      } else {
        group.current.position.lerp(targetBusPosition.current, 1 - Math.exp(-24 * frameDelta));
        group.current.quaternion.slerp(targetBusQuaternion.current, 1 - Math.exp(-11 * frameDelta));
      }
      return;
    }

    // Gezintiden güne dönüş.
    if (roamInitialized.current) {
      // Gün YENİ başladıysa (Gün Başlat → Sür) vardiya hattın BAŞINDAN başlar.
      // Tur ortasından devam etmek yalnızca gün zaten sürerken (gezintiye çıkıp
      // dönmek gibi) geçerlidir.
      const freshDay = gs.dayStartToken !== lastDayStartToken.current;
      lastDayStartToken.current = gs.dayStartToken;

      progress.current = freshDay ? 0 : nearestRouteProgress(roamX.current, roamZ.current);
      liveBusProgress.current = progress.current;
      setBusProgress(progress.current);
      // Sıradaki durak, aracın ÖNÜNDEKİ ilk duraktır. Sabit 0 verilirse araç
      // hattın ortasına oturduğunda aradaki duraklar hiç tetiklenmiyordu.
      nextStopIndex.current = freshDay ? 0 : nextStopIndexAfter(progress.current);
      laneOffset.current = 0;
      busTransformInitialized.current = false;
      roamInitialized.current = false;
    }

    const routeLength = getRouteLength();
    const [centerX, centerZ] = routePoint(progress.current);
    const nearLookAhead = Math.min(0.01, 0.9 / routeLength);
    const farLookAhead = Math.min(0.05, 4 / routeLength);
    const [busAheadX, busAheadZ] = routePoint(progress.current + nearLookAhead);
    const [turnAheadX, turnAheadZ] = routePoint(progress.current + farLookAhead);
    const rawBusDirectionX = busAheadX - centerX;
    const rawBusDirectionZ = busAheadZ - centerZ;
    const busDirectionLength =
      Math.hypot(rawBusDirectionX, rawBusDirectionZ) || 1;
    const busDirectionX = rawBusDirectionX / busDirectionLength;
    const busDirectionZ = rawBusDirectionZ / busDirectionLength;
    const turnDirectionLength =
      Math.hypot(turnAheadX - centerX, turnAheadZ - centerZ) || 1;
    const turnAlignment =
      busDirectionX * ((turnAheadX - centerX) / turnDirectionLength) +
      busDirectionZ * ((turnAheadZ - centerZ) / turnDirectionLength);
    laneOffset.current = recenterLaneOffsetForTurn(
      laneOffset.current,
      turnAlignment,
      delta,
    );
    // Sag normal: yon vektorunun saat yonunde 90 derecesi.
    const normalX = -busDirectionZ;
    const normalZ = busDirectionX;
    const busX = centerX + normalX * laneOffset.current;
    const busZ = centerZ + normalZ * laneOffset.current;

    if (speedKmh.current > 0) {
      // Onundeki araca girme: mesafe kapandikca hiz kirpilir, followGap'te tam durur.
      // Serit degistirince (laneBlockWidth disina cikinca) engel kalkar — sollama boyle olur.
      liveCityTraffic.forEach((vehicle) => {
        const headingAlignment =
          vehicle.forwardX * busDirectionX +
          vehicle.forwardZ * busDirectionZ;
        if (headingAlignment < 0.82) return;
        const dx = vehicle.x - busX;
        const dz = vehicle.z - busZ;
        const distanceAhead = dx * busDirectionX + dz * busDirectionZ;
        const lateralDistance = Math.abs(dx * busDirectionZ - dz * busDirectionX);
        if (
          Math.hypot(dx, dz) < BUS_COLLIDER_DISTANCE &&
          distanceAhead > -0.1
        ) {
          speedKmh.current = 0;
          return;
        }
        const allowedKmh = trafficSpeedCapKmh(distanceAhead, lateralDistance, targetTopKmh);
        if (allowedKmh !== null) speedKmh.current = Math.min(speedKmh.current, allowedKmh);
      });
    }

    setCurrentSpeedKmh(Math.round(speedKmh.current));

    const speed = speedKmh.current / MPS_TO_KMH;
    const stopT = stopProgress(nextStopIndex.current);
    let progressStep = (speed * delta) / routeLength;
    const distanceToStop =
      (stopT - progress.current + 1) % 1;
    const distanceToStopMeters = distanceToStop * routeLength;
    // Otomatik yaklaşma freni SADECE şoför modunda (autopilot) uygulanır — oyuncu WASD ile
    // sürerken durağa yaklaşırken kendi kararıyla (dur/geçme) hızını kendisi belirler.
    if (
      gameState.driverActive &&
      speedKmh.current > STOP_DOCK_SPEED_KMH &&
      distanceToStopMeters <= STOP_APPROACH_BRAKE_DISTANCE_METERS
    ) {
      const approachRatio = Math.max(
        0,
        Math.min(1, distanceToStopMeters / STOP_APPROACH_BRAKE_DISTANCE_METERS),
      );
      const dockingSpeedCap =
        STOP_DOCK_SPEED_KMH +
        (targetTopKmh - STOP_DOCK_SPEED_KMH) * approachRatio;
      speedKmh.current = Math.min(speedKmh.current, dockingSpeedCap);
      progressStep = ((speedKmh.current / MPS_TO_KMH) * delta) / routeLength;
    }

    // Durak varisi yalnizca ileri giderken tetiklenir; her durak otomatik servis edilir.
    const reachedStop =
      progressStep > 0 &&
      distanceToStop > 0 &&
      distanceToStop <= progressStep + 0.00001;

    progress.current = reachedStop
      ? stopT
      : wrapProgress(progress.current + progressStep);
    if (reachedStop) {
      beginStopService();
    }

    syncBusTransform();
  });

  return (
    <group ref={group}>
      <Suspense fallback={<BusPlaceholder />}>
        <BusModel />
      </Suspense>
      {/* Yolcuların ruh hâli — memnuniyetin NEDENİ görünür olsun diye. */}
      <PassengerMoodBubble />
    </group>
  );
}

function FollowerBus() {
  const group = useRef<THREE.Group>(null!);
  // Pre-allocated — new THREE.Vector3() her frame'de allocation yaratmaz.
  const targetPos = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3(0, 0, -1));
  const targetQuaternion = useRef(new THREE.Quaternion());
  const initialized = useRef(false);
  const visualProgress = useRef(0);

  useFrame((_, delta) => {
    const frameDelta = Math.min(delta, 0.05);
    const targetProgress = useGameStore.getState().busProgress;
    if (!initialized.current) visualProgress.current = targetProgress;
    const progressDifference =
      ((targetProgress - visualProgress.current + 1.5) % 1) - 0.5;
    visualProgress.current =
      (visualProgress.current +
        progressDifference * (1 - Math.exp(-18 * frameDelta)) +
        1) % 1;
    liveBusProgress.current = visualProgress.current;
    const progress = visualProgress.current;
    const [x, z] = routePoint(progress);
    const [nx, nz] = routePoint(progress + 0.005);
    targetPos.current.set(x, ROAD_SURFACE_Y, z);
    direction.current.set(nx - x, 0, nz - z).normalize();
    liveBusPose.x = x;
    liveBusPose.z = z;
    liveBusPose.forwardX = direction.current.x;
    liveBusPose.forwardZ = direction.current.z;
    liveBusPose.ready = true;
    targetQuaternion.current.setFromUnitVectors(MODEL_FORWARD, direction.current);

    if (!initialized.current) {
      group.current.position.copy(targetPos.current);
      group.current.quaternion.copy(targetQuaternion.current);
      initialized.current = true;
      return;
    }

    group.current.position.lerp(
      targetPos.current,
      1 - Math.exp(-18 * frameDelta),
    );
    group.current.quaternion.slerp(
      targetQuaternion.current,
      1 - Math.exp(-11 * frameDelta),
    );
  });

  return (
    <group ref={group}>
      <Suspense fallback={<BusPlaceholder />}>
        <BusModel />
      </Suspense>
    </group>
  );
}

function AmbientTrafficVehicle({ spec }: { spec: TrafficVehicleSpec }) {
  const groupRef = useRef<THREE.Group>(null!);
  const targetPos = useRef(new THREE.Vector3());
  const targetQuaternion = useRef(new THREE.Quaternion());
  const direction = useRef(new THREE.Vector3(0, 0, -1));
  const currentSample = useRef({ x: 0, z: 0 });
  const nextSample = useRef({ x: 0, z: 0 });
  const collisionSample = useRef({ x: 0, z: 0 });
  const progress = useRef(spec.start);
  const currentSpeed = useRef(spec.speed);
  const initialized = useRef(false);
  /** Kaç saniyedir tamamen duruyoruz — kilitlenmeye karşı emniyet supabı. */
  const stuckSeconds = useRef(0);

  useEffect(() => {
    sampleTrafficPath(spec.path, spec.start, currentSample.current);
    sampleTrafficPath(
      spec.path,
      spec.start + 1.4 / spec.path.length,
      nextSample.current,
    );
    const dx = nextSample.current.x - currentSample.current.x;
    const dz = nextSample.current.z - currentSample.current.z;
    const headingLength = Math.hypot(dx, dz) || 1;
    liveCityTraffic.set(spec.id, {
      pathId: spec.path.id,
      progress: spec.start,
      x: currentSample.current.x,
      z: currentSample.current.z,
      forwardX: dx / headingLength,
      forwardZ: dz / headingLength,
      speed: spec.speed,
    });
    return () => {
      liveCityTraffic.delete(spec.id);
    };
  }, [spec]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const frameDelta = Math.min(delta, 0.05);
    sampleTrafficPath(spec.path, progress.current, currentSample.current);
    sampleTrafficPath(
      spec.path,
      progress.current + 1.4 / spec.path.length,
      nextSample.current,
    );
    direction.current
      .set(
        nextSample.current.x - currentSample.current.x,
        0,
        nextSample.current.z - currentSample.current.z,
      )
      .normalize();

    let followingSpeed = spec.speed;
    let emergencyBlocked = false;
    // Emniyet supabı: bu araç uzun süredir tamamen duruyorsa kavşak rezervasyonlarını
    // yok sayıp sürünerek geçer. Hiçbir mantık hatası aracı sonsuza kadar kilitlemesin.
    const forceCreep = stuckSeconds.current > TRAFFIC_STUCK_LIMIT_SECONDS;
    liveCityTraffic.forEach((other, otherId) => {
      if (otherId === spec.id) return;
      const worldDx = other.x - currentSample.current.x;
      const worldDz = other.z - currentSample.current.z;
      const worldDistance = Math.hypot(worldDx, worldDz);
      const forwardDistance =
        worldDx * direction.current.x + worldDz * direction.current.z;
      const colliderHeadingAlignment =
        other.forwardX * direction.current.x +
        other.forwardZ * direction.current.z;
      const samePath = other.pathId === spec.path.id;
      let distanceAhead: number;
      if (samePath) {
        // Ayni hat: progress farki en dogru ve en ucuz olcum.
        const progressAhead = (other.progress - progress.current + 1) % 1;
        if (progressAhead <= 0 || progressAhead > 0.5) return;
        distanceAhead = progressAhead * spec.path.length;
      } else {
        // Ayni yone giden paylasimli yollar normal takip mesafesini kullanir.
        if (colliderHeadingAlignment > 0.82) {
          distanceAhead = forwardDistance;
        } else if (colliderHeadingAlignment < -0.82) {
          // Karsi seritteki arac geometrik olarak yakindir ama collider'i
          // bizim seridimizi kesmez.
          return;
        } else {
          // Isik yok: kavsaga ayni anda gelenlerden kimligi buyuk olan yol
          // verir. Rezervasyon mesafesi collider temasindan once frenletir.
          if (
            !forceCreep &&
            shouldYieldAtCrossing(
              spec.id,
              otherId,
              worldDistance,
              colliderHeadingAlignment,
              INTERSECTION_RESERVATION_DISTANCE,
              forwardDistance,
            )
          ) {
            followingSpeed = 0;
            emergencyBlocked = true;
          }
          return;
        }
        const lateralDistance = Math.abs(
          worldDx * direction.current.z - worldDz * direction.current.x,
        );
        if (distanceAhead <= 0 || lateralDistance >= TRAFFIC_BLOCK_WIDTH) return;
      }
      if (distanceAhead >= SLOW_TRAFFIC_GAP) return;
      const gapFactor = THREE.MathUtils.clamp(
        (distanceAhead - MIN_TRAFFIC_GAP) /
          (SLOW_TRAFFIC_GAP - MIN_TRAFFIC_GAP),
        0,
        1,
      );
      followingSpeed = Math.min(followingSpeed, spec.speed * gapFactor);
    });
    if (liveBusPose.ready) {
      const headingAlignment =
        liveBusPose.forwardX * direction.current.x +
        liveBusPose.forwardZ * direction.current.z;
      const dx = liveBusPose.x - currentSample.current.x;
      const dz = liveBusPose.z - currentSample.current.z;
      const distanceAhead =
        dx * direction.current.x + dz * direction.current.z;
      const lateralDistance = Math.abs(
        dx * direction.current.z - dz * direction.current.x,
      );
      const distanceToBus = Math.hypot(dx, dz);
      // Dolmuş için de aynı kural: arkamızda kalmışsa kavşakta durup kalmayız.
      // AYRICA: dolmuş DURUYORSA kavşak rezervasyonu yapılmaz. Park etmiş bir araç
      // için sonsuza kadar beklemek, oyuncu durduğunda tüm trafiği kilitliyordu.
      const crossingBus =
        !forceCreep &&
        liveBusPose.speedKmh > BUS_RESERVATION_MIN_KMH &&
        Math.abs(headingAlignment) < 0.82 &&
        distanceAhead > -ECONOMY.driving.crossingClearMarginMeters;
      if (crossingBus && distanceToBus < INTERSECTION_RESERVATION_DISTANCE + 0.25) {
        followingSpeed = 0;
        emergencyBlocked = true;
      }
      if (
        distanceAhead > 0 &&
        distanceAhead < SLOW_TRAFFIC_GAP &&
        lateralDistance < TRAFFIC_BLOCK_WIDTH &&
        headingAlignment > 0.45
      ) {
        const gapFactor = THREE.MathUtils.clamp(
          (distanceAhead - MIN_TRAFFIC_GAP) /
            (SLOW_TRAFFIC_GAP - MIN_TRAFFIC_GAP),
          0,
          1,
        );
        followingSpeed = Math.min(followingSpeed, spec.speed * gapFactor);
      }
    }
    // Sürünme modundayken tam durmak yerine yavaş da olsa ilerlenir; kilit böyle çözülür.
    if (forceCreep) followingSpeed = Math.max(followingSpeed, spec.speed * TRAFFIC_CREEP_RATIO);

    currentSpeed.current = THREE.MathUtils.damp(
      currentSpeed.current,
      followingSpeed,
      emergencyBlocked ? 11 : 2.8,
      frameDelta,
    );

    // Duruyor muyuz? Sayaç yalnızca gerçekten hareketsizken artar.
    stuckSeconds.current =
      currentSpeed.current < TRAFFIC_STOPPED_SPEED
        ? stuckSeconds.current + frameDelta
        : 0;

    const proposedProgress =
      (progress.current +
        currentSpeed.current * frameDelta / spec.path.length) %
      1;
    sampleTrafficPath(spec.path, proposedProgress, collisionSample.current);
    let colliderBlocked = false;
    liveCityTraffic.forEach((other, otherId) => {
      if (colliderBlocked || otherId === spec.id) return;
      const dx = other.x - collisionSample.current.x;
      const dz = other.z - collisionSample.current.z;
      const distance = Math.hypot(dx, dz);
      const headingAlignment =
        other.forwardX * direction.current.x +
        other.forwardZ * direction.current.z;
      const samePath = other.pathId === spec.path.id;

      if (samePath || headingAlignment > 0.82) {
        const distanceAhead =
          dx * direction.current.x + dz * direction.current.z;
        const lateralDistance = Math.abs(
          dx * direction.current.z - dz * direction.current.x,
        );
        if (
          isForwardColliderBlocked(
            distance,
            distanceAhead,
            lateralDistance,
            headingAlignment,
            VEHICLE_COLLIDER_DISTANCE,
            TRAFFIC_BLOCK_WIDTH,
            samePath,
          )
        ) {
          colliderBlocked = true;
        }
        return;
      }

      if (
        shouldYieldAtCrossing(
          spec.id,
          otherId,
          distance,
          headingAlignment,
          INTERSECTION_RESERVATION_DISTANCE,
          dx * direction.current.x + dz * direction.current.z,
        )
      ) {
        colliderBlocked = true;
      }
    });
    if (!colliderBlocked && liveBusPose.ready) {
      const dx = liveBusPose.x - collisionSample.current.x;
      const dz = liveBusPose.z - collisionSample.current.z;
      const distance = Math.hypot(dx, dz);
      const headingAlignment =
        liveBusPose.forwardX * direction.current.x +
        liveBusPose.forwardZ * direction.current.z;
      const crossingBus = Math.abs(headingAlignment) < 0.82;
      const distanceAhead =
        dx * direction.current.x + dz * direction.current.z;
      const lateralDistance = Math.abs(
        dx * direction.current.z - dz * direction.current.x,
      );
      colliderBlocked = crossingBus
        ? distance < INTERSECTION_RESERVATION_DISTANCE + 0.25
        : headingAlignment > 0.82 &&
          distance < BUS_COLLIDER_DISTANCE &&
          distanceAhead > -0.1 &&
          lateralDistance < TRAFFIC_BLOCK_WIDTH;
    }

    if (colliderBlocked) {
      currentSpeed.current = 0;
    } else {
      progress.current = proposedProgress;
    }
    const liveState = liveCityTraffic.get(spec.id);
    if (liveState) liveState.progress = progress.current;

    sampleTrafficPath(spec.path, progress.current, currentSample.current);
    sampleTrafficPath(
      spec.path,
      progress.current + 1.4 / spec.path.length,
      nextSample.current,
    );
    if (liveState) {
      liveState.x = currentSample.current.x;
      liveState.z = currentSample.current.z;
      liveState.speed = currentSpeed.current;
    }
    // Modeller kendi tabanindan hizali oldugu icin grup dogrudan yol yuzeyinde durur.
    targetPos.current.set(
      currentSample.current.x,
      ROAD_SURFACE_Y,
      currentSample.current.z,
    );
    direction.current
      .set(
        nextSample.current.x - currentSample.current.x,
        0,
        nextSample.current.z - currentSample.current.z,
      )
      .normalize();
    if (liveState) {
      liveState.forwardX = direction.current.x;
      liveState.forwardZ = direction.current.z;
    }
    targetQuaternion.current.setFromUnitVectors(
      MODEL_FORWARD,
      direction.current,
    );

    if (!initialized.current) {
      groupRef.current.position.copy(targetPos.current);
      groupRef.current.quaternion.copy(targetQuaternion.current);
      initialized.current = true;
      return;
    }

    groupRef.current.position.lerp(
      targetPos.current,
      1 - Math.exp(-18 * frameDelta),
    );
    groupRef.current.quaternion.slerp(
      targetQuaternion.current,
      1 - Math.exp(-9 * frameDelta),
    );
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={<TrafficVehiclePlaceholder kind={spec.kind} />}>
        <TrafficVehicleModel kind={spec.kind} variant={spec.variant} />
      </Suspense>
    </group>
  );
}

const AmbientTraffic = memo(function AmbientTraffic() {
  return (
    <>
      {CITY_TRAFFIC_VEHICLES.map((vehicle) => (
        <AmbientTrafficVehicle
          key={vehicle.id}
          spec={vehicle}
        />
      ))}
    </>
  );
});

// ---------------------------------------------------------------------------
// Takip + şerit kamerası — Canvas içinde olmalı (useThree hook).
// Canvas camera prop mount'ta sabitlenir; bu bileşen her frame override eder.
// ---------------------------------------------------------------------------
/**
 * Terminal tesisi açılınca kamerayı devralıp yeni binanın etrafında yavaşça döner.
 * Kart (TerminalUnveil) ekranın altında tesisin ne getirdiğini anlatır.
 * Kamera kontrolü kartı kapatınca (store > dismissTerminalUnveil) geri verilir.
 */
const UNVEIL_ORBIT_RADIUS = 7.5;
const UNVEIL_ORBIT_HEIGHT = 4.6;
const UNVEIL_ORBIT_SPEED = 0.42;

function TerminalUnveilCam() {
  const unveilId = useGameStore((s) => s.terminalUnveil);
  const { camera } = useThree();
  const angle = useRef(0);
  const savedPosition = useRef(new THREE.Vector3());
  const active = useRef(false);

  useFrame((_, delta) => {
    const upgrade = unveilId ? getTerminalUpgrade(unveilId) : null;
    if (!upgrade) {
      // Sinematik bitti: kamerayı bıraktığımız yere geri koy.
      if (active.current) {
        camera.position.copy(savedPosition.current);
        active.current = false;
      }
      return;
    }

    if (!active.current) {
      savedPosition.current.copy(camera.position);
      angle.current = 0;
      active.current = true;
    }

    angle.current += UNVEIL_ORBIT_SPEED * Math.min(delta, 0.05);
    const [tx, tz] = upgrade.position;
    camera.position.set(
      tx + Math.sin(angle.current) * UNVEIL_ORBIT_RADIUS,
      UNVEIL_ORBIT_HEIGHT,
      tz + Math.cos(angle.current) * UNVEIL_ORBIT_RADIUS,
    );
    camera.lookAt(tx, 1.1, tz);
  });

  return null;
}

function ChaseCam() {
  const chaseMode = useUiStore((s) => s.chaseMode);
  const stripMode = useUiStore((s) => s.stripMode);
  const unveilActive = useGameStore((s) => s.terminalUnveil !== null);
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const desiredForward = useRef(new THREE.Vector3(0, 0, -1));
  const smoothedForward = useRef(new THREE.Vector3(0, 0, -1));
  const desiredLookTarget = useRef(new THREE.Vector3());
  const smoothedLookTarget = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3(0, 46, 50));
  const chaseInitialized = useRef(false);
  const POSITION_DAMPING = 6.5;
  const ROTATION_DAMPING = 8;

  useEffect(() => {
    chaseInitialized.current = false;
    if (chaseMode || stripMode) return;

    camera.position.set(0, 46, 50);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    currentPos.current.copy(camera.position);
  }, [camera, chaseMode, stripMode]);

  useFrame((_, delta) => {
    const active = chaseMode || stripMode;
    // Sinematik açılış sırasında kamera TerminalUnveilCam'in kontrolündedir.
    if (!active || unveilActive) return;
    const frameDelta = Math.min(delta, 0.05);

    // Kamera hattı değil, dolmuşun GERÇEK konumunu izler — gezinti modunda araç
    // hat geometrisinden ayrıldığı için progress tabanlı takip kamerayı geride bırakıyordu.
    const bx = liveBusPose.x;
    const bz = liveBusPose.z;
    const len = Math.hypot(liveBusPose.forwardX, liveBusPose.forwardZ) || 1;
    const nx = liveBusPose.forwardX / len;
    const nz = liveBusPose.forwardZ / len;
    desiredForward.current.set(nx, 0, nz);

    if (!chaseInitialized.current) {
      currentPos.current.copy(camera.position);
      smoothedForward.current.copy(desiredForward.current);
      smoothedLookTarget.current.set(bx, 0.9, bz);
      chaseInitialized.current = true;
    }

    smoothedForward.current
      .lerp(
        desiredForward.current,
        1 - Math.exp(-ROTATION_DAMPING * frameDelta),
      )
      .normalize();

    if (stripMode) {
      // Serit modu cok yatay bir viewport; yakin takip uzak model kirintilarini kadraj disinda tutar.
      targetPos.current.set(
        bx - smoothedForward.current.x * 4,
        16,
        bz - smoothedForward.current.z * 4,
      );
    } else {
      // Normal takip: arkadan
      targetPos.current.set(
        bx - smoothedForward.current.x * 12,
        6,
        bz - smoothedForward.current.z * 12,
      );
    }

    desiredLookTarget.current.set(
      bx + smoothedForward.current.x * 1.8,
      0.9,
      bz + smoothedForward.current.z * 1.8,
    );
    smoothedLookTarget.current.lerp(
      desiredLookTarget.current,
      1 - Math.exp(-ROTATION_DAMPING * frameDelta),
    );
    currentPos.current.lerp(
      targetPos.current,
      1 - Math.exp(-POSITION_DAMPING * frameDelta),
    );
    camera.position.copy(currentPos.current);
    camera.lookAt(smoothedLookTarget.current);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Statik sahne elemanları — memo ile gereksiz re-render engellenir.
// ---------------------------------------------------------------------------
const Ground = memo(function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[140, 110]} />
      <meshStandardMaterial color="#C9BFAE" />
    </mesh>
  );
});

function RouteDebugOverlay() {
  const routeOverlayVisible = useUiStore((s) => s.routeOverlayVisible);
  const selectedRouteId = useUiStore((s) => s.selectedRouteId);
  const dayRun = useGameStore((s) => s.dayRun);
  const dayStartOpen = useUiStore((s) => s.dayStartOpen);
  const route = ROUTE_DEFINITIONS.find((candidate) => candidate.id === selectedRouteId) ?? ROUTE_DEFINITIONS[0];
  const geometry = getRouteGeometry(route.id);

  // Hat çizgisi yalnızca vardiyada (veya hat önizlemesi açıkken) görünür.
  // Gezinti modunda şehir çizgisiz ve serbesttir.
  if (!dayRun && !dayStartOpen) return null;
  if (!routeOverlayVisible) return null;

  return (
    <group>
      {geometry.points.slice(0, -1).map((point, index) => {
        const next = geometry.points[index + 1];
        const dx = next[0] - point[0];
        const dz = next[1] - point[1];
        const length = Math.hypot(dx, dz);
        if (length <= 0.01) return null;

        return (
          <mesh
            key={`active-route-line-${index}`}
            position={[point[0] + dx / 2, 0.055, point[1] + dz / 2]}
            rotation={[0, Math.atan2(dx, dz), 0]}
          >
            <boxGeometry args={[0.34, 0.025, length]} />
            <meshBasicMaterial color="#18C9FF" transparent opacity={0.86} depthWrite={false} />
          </mesh>
        );
      })}

      {geometry.stops.map((stop) => {
        const [x, z] = stop.position;
        return (
          <mesh key={`active-stop-${stop.id}`} position={[x, 0.2, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.45, 0.7, 24]} />
            <meshBasicMaterial color="#F5C84B" transparent opacity={0.9} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

const Neighborhood = memo(function Neighborhood() {
  const props = useEditorStore((s) => s.props);
  return (
    <>
      {props.map((def) => (
        <SceneProp key={def.id} def={def} />
      ))}
    </>
  );
});

// ---------------------------------------------------------------------------
// Ana Canvas
// ---------------------------------------------------------------------------
export default function GameCanvas() {
  const editorActive = useEditorStore((s) => s.active);
  const dragging = useEditorStore((s) => s.dragging);
  const select = useEditorStore((s) => s.select);
  const stripMode = useUiStore((s) => s.stripMode);
  const chaseMode = useUiStore((s) => s.chaseMode);
  const unveilActive = useGameStore((s) => s.terminalUnveil !== null);
  const graphicsQuality = useSettingsStore((state) => state.graphicsQuality);
  const pixelRatio: [number, number] = graphicsQuality === "performance"
    ? [0.7, 1]
    : graphicsQuality === "quality"
      ? [1, 1.5]
      : [0.85, 1.25];

  return (
    <Canvas
      shadows={false}
      camera={{ position: [0, 46, 50], fov: 50, near: 0.5, far: 320 }}
      // dpr: 1.25x cap keeps the city readable without overloading high-DPI screens.
      dpr={pixelRatio}
      style={
        stripMode
          ? {
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "120px",
              width: "100dvw",
            }
          : undefined
      }
      // Adaptive performance: frame rate düşerse otomatik olarak çözünürlük azaltır.
      performance={{ min: 0.5 }}
      gl={{
        antialias: false,
        // Çift GPU'lu cihazlarda (MacBook, gaming laptop) güçlü GPU seçilir.
        powerPreference: "high-performance",
        // Gereksiz buffer okuması yok — oyun ekrana sadece yazar.
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      onPointerMissed={() => editorActive && select(null)}
    >
      <color attach="background" args={["#8BCDE8"]} />
      <SkyLife />

      <Suspense fallback={<Ground />}>
        <CityModel />
      </Suspense>
      <RouteDebugOverlay />
      <Suspense fallback={null}>
        <MvpWorld />
      </Suspense>
      <Bus />
      <AmbientTraffic />
      {editorActive ? <Neighborhood /> : null}
      <Editor />
      <ChaseCam />
      <TerminalUnveilCam />

      {/* PERF: `enabled={false}` OrbitControls'u DURDURMAZ — mount kaldigi surece kendi
          useFrame'ini calistirip her karede controls.update() cagirir. Takip kamerasi
          veya serit modundayken tamamen sokuyoruz. */}
      {!stripMode && !chaseMode && !unveilActive ? (
        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minDistance={18}
          maxDistance={72}
          enabled={!dragging}
        />
      ) : null}
    </Canvas>
  );
}
