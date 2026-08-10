"use client";

import { getRouteGeometry } from "./route";
import { useGameStore } from "./store";
import { useUiStore } from "./uiStore";
import { useT } from "./i18n";

const APPROACH_VISIBLE_METERS = 42;
const AT_STOP_EPSILON_METERS = 0.3;

export function StopApproachHud() {
  const t = useT();
  const activeRouteId = useGameStore((state) => state.activeRouteId);
  const busProgress = useGameStore((state) => state.busProgress);
  const waiting = useGameStore((state) => state.stopsWaiting);
  const passengersOnBoard = useGameStore((state) => state.passengersOnBoard);
  const nextStopDropoffs = useGameStore((state) => state.nextStopDropoffs);
  const doorsOpen = useGameStore((state) => state.driving.doorsOpen);
  const interactionType = useGameStore((state) => state.interaction.type);
  const stripMode = useUiStore((state) => state.stripMode);
  const dayRun = useGameStore((state) => state.dayRun);

  if (stripMode || interactionType) return null;

  // Gezinti modunda durak servisi yok: durak paneli yerine mod rozeti gösterilir.
  if (!dayRun) {
    return (
      <aside className="ff-stop-hud ff-roam-hud" aria-live="polite">
        <div className="min-w-0 flex-1">
          <div className="ff-stop-kicker">{t("roam.badge")}</div>
          <div className="ff-display mt-0.5 truncate text-sm">{t("roam.hint")}</div>
        </div>
      </aside>
    );
  }

  const geometry = getRouteGeometry(activeRouteId);
  let stopIndex = -1;
  let distanceMeters = Number.POSITIVE_INFINITY;

  geometry.stopProgress.forEach((progress, index) => {
    const forwardDistance = (progress - busProgress + 1) % 1;
    const candidateDistance = forwardDistance * geometry.length;
    const atCurrentStop =
      doorsOpen &&
      Math.abs(((progress - busProgress + 1.5) % 1) - 0.5) * geometry.length <=
        AT_STOP_EPSILON_METERS;

    if (atCurrentStop) {
      stopIndex = index;
      distanceMeters = 0;
      return;
    }

    if (
      !doorsOpen &&
      candidateDistance > AT_STOP_EPSILON_METERS &&
      candidateDistance < distanceMeters
    ) {
      stopIndex = index;
      distanceMeters = candidateDistance;
    }
  });

  if (stopIndex < 0 || distanceMeters > APPROACH_VISIBLE_METERS) return null;

  const waitingCount = Math.floor(waiting[stopIndex] ?? 0);
  const dropoffCount = Math.min(passengersOnBoard, nextStopDropoffs);
  const progressRatio = doorsOpen
    ? 1
    : Math.max(0, Math.min(1, 1 - distanceMeters / APPROACH_VISIBLE_METERS));

  return (
    <aside className="ff-stop-hud" aria-live="polite" aria-label="Durak servisi">
      <div className="ff-stop-badge">
        <span>{String(stopIndex + 1).padStart(2, "0")}</span>
        <small>/{geometry.stopCount}</small>
      </div>

      <div className="min-w-0 flex-1">
        <div className="ff-stop-kicker">{geometry.definition.name}</div>
        <div className="ff-display mt-0.5 truncate text-sm">
          {doorsOpen ? t("stop.servicing") : t("stop.approaching")}
        </div>
        <div className="ff-stop-meta">
          <span>{t("stop.waiting", { count: waitingCount })}</span>
          <span>{t("stop.dropoffs", { count: dropoffCount })}</span>
          <span>{t("stop.onboard", { count: passengersOnBoard })}</span>
        </div>
      </div>

      <div className="ff-stop-distance">
        {doorsOpen ? <span>{t("stop.service")}</span> : <><strong>{Math.max(1, Math.ceil(distanceMeters))}</strong><small>{t("stop.meters")}</small></>}
      </div>

      <div className="ff-stop-progress" aria-hidden="true">
        <span style={{ width: `${progressRatio * 100}%` }} />
      </div>
    </aside>
  );
}
