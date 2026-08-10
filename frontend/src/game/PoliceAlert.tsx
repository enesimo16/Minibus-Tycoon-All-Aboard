"use client";

import { useEffect } from "react";
import { ECONOMY } from "./economy";
import { AlertIcon } from "./GameIcon";
import { useT } from "./i18n";
import { useGameStore } from "./store";
import { pushToast } from "./toastStore";
import { dispatchGameAction } from "./useTabSync";

const POLICE_TOAST_DURATION_MS = 5_500;

export function PoliceAlert() {
  const policeAlert = useGameStore((state) => state.policeAlert);
  const policeLevel = useGameStore((state) => state.policeLevel);
  const money = useGameStore((state) => state.money);
  const t = useT();

  useEffect(() => {
    if (!policeAlert || policeAlert.level >= 4) return;
    pushToast({
      tone: policeAlert.level >= 3 ? "danger" : "warning",
      titleKey: "police.title",
      message: policeAlert.message,
      durationMs: POLICE_TOAST_DURATION_MS,
    });
    dispatchGameAction("dismissPoliceAlert");
  }, [policeAlert]);

  if (policeLevel < 4) return null;

  const canAfford = money >= ECONOMY.police.newVehicleCost;
  const missing = Math.max(0, ECONOMY.police.newVehicleCost - money).toFixed(0);

  return (
    <aside className="ff-critical-alert" role="alert" aria-live="assertive">
      <div className="ff-critical-alert-icon"><AlertIcon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="ff-stop-kicker">{t("police.title")}</div>
        <h2 className="ff-display mt-0.5 text-base">{t("police.seized.title")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ff-muted">{t("police.seized.body")}</p>
        <button
          onClick={() => dispatchGameAction("buyNewVehicle")}
          disabled={!canAfford}
          className="ff-button ff-button-primary mt-3 w-full text-xs"
        >
          {canAfford ? t("police.seized.buy") : t("police.seized.missing", { amount: missing })}
        </button>
      </div>
    </aside>
  );
}
