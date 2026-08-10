"use client";

import { useGameStore } from "./store";
import { ECONOMY } from "./economy";
import { useT } from "./i18n";

// Hat dışı sefer sırasında ekranın ortasında duran kasa efekti.
// Dolmuş bu sırada yerinde bekler (bkz. GameCanvas > LeaderBus): eskiden araç
// yol ağının dışına taşınıyor ve binaların içinden geçiyordu. Artık hareket yok,
// bunun yerine süre boyunca para birikişi gösterilir.
// Bkz. docs/game-design/05-hat-disi-risk-odul.md
export function DetourPayoutOverlay() {
  const active = useGameStore((s) => s.detourActive);
  const earned = useGameStore((s) => s.detourEarned);
  const secondsLeft = useGameStore((s) => s.detourSecondsLeft);
  const t = useT();

  if (!active) return null;

  const total = ECONOMY.offRoute.detourSeconds;
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / total));

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="ff-detour-card">
        <div className="ff-detour-title">{t("offroute.title")}</div>
        <div className="ff-detour-amount">₺{Math.round(earned)}</div>
        <div className="ff-detour-sub">{t("offroute.subtitle")}</div>
        <div className="ff-detour-track">
          <div className="ff-detour-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="ff-detour-timer">{secondsLeft.toFixed(1)}s</div>
      </div>
    </div>
  );
}
