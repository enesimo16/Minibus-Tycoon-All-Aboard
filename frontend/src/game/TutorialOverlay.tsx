"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getPlayerId } from "./playerId";
import { useRadioStore } from "./radioStore";
import { useTutorialStore } from "./tutorialStore";
import { useUiStore, type ManagementTab } from "./uiStore";
import { useGameStore } from "./store";
import { useT } from "./i18n";
import { track } from "./telemetry";

type TutorialScene = ManagementTab | "game" | "chance";

interface TutorialStep {
  id: string;
  titleKey: string;
  bodyKey: string;
  target?: string;
  scene?: TutorialScene;
  /** Tanımlıysa adım tıklamayla değil gerçek oyun aksiyonuyla ilerler (bkz. useAutoAdvance). */
  autoAdvanceOn?: "movement" | "stopServed" | "boarding" | "dayReport";
}

const TARGET_MARGIN_PX = 8;

// Faz 8 — eski tek akışlı 21 adımlık havuz silinmedi, küçük paketlere ayrıldı. "core" yeni
// hesapta zorunludur ve üç adımı gerçek aksiyonla ilerler (autoAdvanceOn); diğer paketler
// bağlama göre açılır (bkz. TutorialTriggers.tsx). "extras" core bitince otomatik teklif edilir.
export const TUTORIAL_PACKAGES: Record<string, readonly TutorialStep[]> = {
  core: [
    { id: "welcome", titleKey: "tutorial.welcome.title", bodyKey: "tutorial.welcome.body" },
    { id: "drive", titleKey: "tutorial.drive.title", bodyKey: "tutorial.drive.body", target: "driving", scene: "game", autoAdvanceOn: "movement" },
    { id: "stops", titleKey: "tutorial.stops.title", bodyKey: "tutorial.stops.body", scene: "game", autoAdvanceOn: "stopServed" },
    { id: "boarding", titleKey: "tutorial.boarding.title", bodyKey: "tutorial.boarding.body", scene: "game", autoAdvanceOn: "boarding" },
    { id: "dayReportIntro", titleKey: "tutorial.dayReportIntro.title", bodyKey: "tutorial.dayReportIntro.body", scene: "game", autoAdvanceOn: "dayReport" },
  ],
  extras: [
    { id: "hud", titleKey: "tutorial.hud.title", bodyKey: "tutorial.hud.body", target: "hud-stats", scene: "game" },
    { id: "speed", titleKey: "tutorial.speed.title", bodyKey: "tutorial.speed.body", target: "speed", scene: "game" },
    { id: "decisions", titleKey: "tutorial.decisions.title", bodyKey: "tutorial.decisions.body", scene: "game" },
    { id: "city", titleKey: "tutorial.city.title", bodyKey: "tutorial.city.body", target: "management-panel", scene: "city" },
    { id: "camera", titleKey: "tutorial.camera.title", bodyKey: "tutorial.camera.body", target: "camera", scene: "game" },
    { id: "radio", titleKey: "tutorial.radio.title", bodyKey: "tutorial.radio.body", target: "radio", scene: "game" },
    { id: "profile", titleKey: "tutorial.profile.title", bodyKey: "tutorial.profile.body", target: "profile", scene: "game" },
    { id: "settings", titleKey: "tutorial.settings.title", bodyKey: "tutorial.settings.body", target: "settings", scene: "game" },
    { id: "finish", titleKey: "tutorial.finish.title", bodyKey: "tutorial.finish.body", scene: "game" },
  ],
  upgrade: [
    { id: "management", titleKey: "tutorial.management.title", bodyKey: "tutorial.management.body", target: "management", scene: "game" },
    { id: "upgrades", titleKey: "tutorial.upgrades.title", bodyKey: "tutorial.upgrades.body", target: "management-panel", scene: "upgrades" },
  ],
  driver: [
    { id: "drivers", titleKey: "tutorial.drivers.title", bodyKey: "tutorial.drivers.body", target: "management-panel", scene: "drivers" },
    { id: "assign", titleKey: "tutorial.assign.title", bodyKey: "tutorial.assign.body", target: "management-panel", scene: "drivers" },
  ],
  contract: [
    { id: "contracts", titleKey: "tutorial.contracts.title", bodyKey: "tutorial.contracts.body", target: "contracts", scene: "game" },
  ],
  secondBus: [
    { id: "garage", titleKey: "tutorial.garage.title", bodyKey: "tutorial.garage.body", target: "management-panel", scene: "garage" },
    { id: "bus", titleKey: "tutorial.bus.title", bodyKey: "tutorial.bus.body", target: "management-panel", scene: "garage" },
  ],
  newRoute: [
    { id: "routes", titleKey: "tutorial.routes.title", bodyKey: "tutorial.routes.body", target: "management-panel", scene: "routes" },
  ],
  cityEvent: [
    { id: "cityEventIntro", titleKey: "tutorial.cityEventIntro.title", bodyKey: "tutorial.cityEventIntro.body", scene: "game" },
  ],
  chance: [
    { id: "chance", titleKey: "tutorial.chance.title", bodyKey: "tutorial.chance.body", target: "chance-panel", scene: "chance" },
  ],
};

function showScene(scene: TutorialScene | undefined) {
  const ui = useUiStore.getState();
  useRadioStore.getState().closePanel();

  if (scene === "garage" || scene === "drivers" || scene === "upgrades" || scene === "routes" || scene === "city") {
    ui.openManagementTab(scene);
    return;
  }

  useUiStore.setState({
    managementOpen: false,
    chanceGamesOpen: scene === "chance",
    profileOpen: false,
    settingsOpen: false,
  });
}

function findVisibleTarget(id: string | undefined): HTMLElement | null {
  if (!id) return null;
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tutorial="${id}"]`);
  return Array.from(candidates).find((element) => element.getClientRects().length > 0) ?? null;
}

/** "core" bitince "extras" otomatik teklif edilir — havuzdaki adımlar kaybolmaz. */
function chainAfterCore(finishedPackage: string | null) {
  if (finishedPackage !== "core") return;
  useTutorialStore.getState().activatePackage("extras", TUTORIAL_PACKAGES.extras.length);
}

export function TutorialOverlay() {
  const t = useT();
  const active = useTutorialStore((state) => state.active);
  const activePackage = useTutorialStore((state) => state.activePackage);
  const stepIndex = useTutorialStore((state) => state.stepIndex);
  const initialize = useTutorialStore((state) => state.initialize);
  const next = useTutorialStore((state) => state.next);
  const previous = useTutorialStore((state) => state.previous);
  const skip = useTutorialStore((state) => state.skip);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // PERF: `busProgress` 10 Hz guncelleniyor ve bu bilesen rehber KAPALIYKEN bile mount.
  // Ham degere abone olmak saniyede 10 render demekti; burada yalnizca "hareket etti mi"
  // bilgisi kullanildigi icin boolean'a abone oluyoruz — omur boyu tek render.
  const busMoved = useGameStore((s) => s.busProgress > 0.001);
  const dayRunStopsServed = useGameStore((s) => s.dayRun?.stopsServed ?? 0);
  const dayRunBoardings = useGameStore((s) => s.dayRun?.boardings ?? 0);
  const dayReportPresent = useGameStore((s) => s.dayReport !== null);

  const steps = (activePackage ? TUTORIAL_PACKAGES[activePackage] : undefined) ?? [];
  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    const playerId = getPlayerId();
    if (playerId) initialize(playerId);
  }, [initialize]);

  const advance = () => {
    const finishing = activePackage && stepIndex >= steps.length - 1 ? activePackage : null;
    next(steps.length);
    chainAfterCore(finishing);
  };

  useEffect(() => {
    if (!active || !step) return;
    track("tutorial_step", { packageId: activePackage, stepId: step.id, step: stepIndex + 1, total: steps.length });
    showScene(step.scene);

    let target: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    let timer = 0;

    const updateTarget = () => {
      target = findVisibleTarget(step.target);
      setTargetRect(target?.getBoundingClientRect() ?? null);
      observer?.disconnect();
      if (target) {
        observer = new ResizeObserver(() => setTargetRect(target?.getBoundingClientRect() ?? null));
        observer.observe(target);
      }
    };

    timer = window.setTimeout(updateTarget, 80);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
      observer?.disconnect();
    };
  }, [active, step, stepIndex, activePackage, steps.length]);

  // Faz 8 — "core" paketindeki üç adım tıklamayla değil gerçek aksiyonla ilerler.
  useEffect(() => {
    if (!active || !step?.autoAdvanceOn) return;
    const satisfied =
      (step.autoAdvanceOn === "movement" && busMoved) ||
      (step.autoAdvanceOn === "stopServed" && dayRunStopsServed > 0) ||
      (step.autoAdvanceOn === "boarding" && dayRunBoardings > 0) ||
      (step.autoAdvanceOn === "dayReport" && dayReportPresent);
    if (satisfied) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, busMoved, dayRunStopsServed, dayRunBoardings, dayReportPresent]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (step?.autoAdvanceOn) return; // aksiyon beklenen adımda klavyeyle atlanamaz
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        advance();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopImmediatePropagation();
        previous();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, previous]);

  const spotlight = useMemo(() => targetRect ? {
    top: Math.max(0, targetRect.top - TARGET_MARGIN_PX),
    left: Math.max(0, targetRect.left - TARGET_MARGIN_PX),
    right: Math.min(window.innerWidth, targetRect.right + TARGET_MARGIN_PX),
    bottom: Math.min(window.innerHeight, targetRect.bottom + TARGET_MARGIN_PX),
  } : null, [targetRect]);

  if (!active || !step) return null;

  const cardPlacement = spotlight && spotlight.right > window.innerWidth * 0.62 && window.innerWidth > 760
    ? "left"
    : spotlight && spotlight.top > window.innerHeight * 0.55
      ? "top"
      : spotlight
        ? "bottom"
        : "center";

  return (
    <div className="ff-tutorial-root" role="dialog" aria-modal="true" aria-label={t("tutorial.label")}>
      <TutorialShade spotlight={spotlight} />
      {spotlight && <div className="ff-tutorial-focus" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.right - spotlight.left, height: spotlight.bottom - spotlight.top }} />}

      <section className="ff-tutorial-card" data-placement={cardPlacement}>
        <div className="ff-tutorial-card-head">
          <span>{t("tutorial.chapter", { current: stepIndex + 1, total: steps.length })}</span>
          <button type="button" onClick={skip}>{t("tutorial.skip")}</button>
        </div>
        <div className="ff-tutorial-progress" aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
        <div className="ff-tutorial-copy">
          <p>{t("tutorial.guide")}</p>
          <h2>{t(step.titleKey)}</h2>
          <div>{t(step.bodyKey)}</div>
        </div>
        <footer>
          <button type="button" className="ff-button" onClick={previous} disabled={stepIndex === 0}>{t("tutorial.back")}</button>
          <span>{step.autoAdvanceOn ? t("tutorial.actionHint") : t("tutorial.keyboardHint")}</span>
          {!step.autoAdvanceOn && (
            <button type="button" className="ff-button ff-button-primary" onClick={advance}>
              {stepIndex === steps.length - 1 ? t("tutorial.startPlaying") : t("tutorial.next")}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function TutorialShade({ spotlight }: { spotlight: { top: number; left: number; right: number; bottom: number } | null }) {
  if (!spotlight) return <div className="ff-tutorial-shade fixed inset-0" />;
  const styles: CSSProperties[] = [
    { top: 0, left: 0, right: 0, height: spotlight.top },
    { top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.bottom - spotlight.top },
    { top: spotlight.top, left: spotlight.right, right: 0, height: spotlight.bottom - spotlight.top },
    { top: spotlight.bottom, left: 0, right: 0, bottom: 0 },
  ];
  return <>{styles.map((style, index) => <div key={index} className="ff-tutorial-shade fixed" style={style} />)}</>;
}
