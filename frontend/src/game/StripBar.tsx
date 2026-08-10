"use client";

import { useGameStore, formatGameTime, isNightTime } from "./store";
import { useUiStore } from "./uiStore";
import { ECONOMY } from "./economy";
import { dispatchGameAction } from "./useTabSync";

// Şerit modunda gösterilen kompakt alt çubuk: istatistikler + hız kontrolü + çıkış.
// TopNav gizlenince bu çubuk oyun bilgilerini 44px'e sıkıştırarak gösterir.
export function StripBar() {
  const stripMode = useUiStore((s) => s.stripMode);
  const toggleStripMode = useUiStore((s) => s.toggleStripMode);
  if (!stripMode) return null;

  return <StripBarContent onExit={toggleStripMode} />;
}

function StripBarContent({ onExit }: { onExit: () => void }) {
  const money = useGameStore((s) => s.money);
  const passengers = useGameStore((s) => s.passengersOnBoard);
  const capacity = useGameStore((s) => s.seatCapacity);
  const satisfaction = useGameStore((s) => s.satisfaction);
  const gameTimeMinutes = useGameStore((s) => s.gameTimeMinutes);
  const gameDay = useGameStore((s) => s.gameDay);
  const policeLevel = useGameStore((s) => s.policeLevel);
  const suspensionMinutesLeft = useGameStore((s) => s.suspensionMinutesLeft);
  const currentSpeedKmh = useGameStore((s) => s.currentSpeedKmh);
  const speedLimitKmh = useGameStore((s) => s.speedLimitKmh);
  const driverActive = useGameStore((s) => s.driverActive);
  const speedingRisk = useGameStore((s) => s.policeRisk);
  const stopDropoffPromised = useGameStore((s) => s.stopDropoffPromised);

  const night = isNightTime(gameTimeMinutes);
  const timeStr = formatGameTime(gameTimeMinutes);
  const isOver = currentSpeedKmh > ECONOMY.speed.legalLimitKmh;
  const locked = driverActive || suspensionMinutesLeft > 0 || policeLevel >= 4;

  return (
    <div className="pointer-events-auto absolute inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-10 flex h-11 items-center gap-2 overflow-x-auto rounded-xl ff-panel px-2 font-sans text-xs text-white ff-scroll sm:gap-3 sm:px-3 sm:text-sm">
      <span className="shrink-0 font-bold text-amber-400">🚐</span>

      <span className="shrink-0 tabular-nums font-bold text-amber-400">
        ₺{money.toFixed(0)}
      </span>

      <div className="h-4 w-px shrink-0 bg-white/20" />

      <span className="shrink-0 text-white/70">👥 {passengers}/{capacity}</span>

      <span className="hidden shrink-0 text-white/70 min-[420px]:inline">😊 {Math.round(satisfaction)}%</span>

      <span className="hidden shrink-0 text-white/60 min-[520px]:inline">
        {night ? "🌙" : "☀️"} {timeStr}·G{gameDay}
      </span>

      {policeLevel > 0 && policeLevel < 4 && (
        <span className={`shrink-0 text-xs ${policeLevel >= 3 ? "text-red-400" : "text-yellow-300"}`}>
          {"⚠️".repeat(policeLevel)}
        </span>
      )}

      {stopDropoffPromised && (
        <span className="shrink-0 animate-pulse text-xs text-sky-300">🚏</span>
      )}

      <div className="min-w-2 flex-1" />

      {/* Hız kontrolü */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => dispatchGameAction("decreaseSpeed")}
          disabled={locked || speedLimitKmh <= ECONOMY.speed.limiterMinKmh}
          className="ff-button ff-button-ghost h-7 min-h-7 w-7 p-0 text-xs"
        >
          −
        </button>
        <span
          className={`w-8 text-center text-xs font-bold tabular-nums ${isOver ? "text-amber-400" : "text-white/80"}`}
        >
          {Math.round(Math.abs(currentSpeedKmh))}
        </span>
        <button
          onClick={() => dispatchGameAction("increaseSpeed")}
          disabled={locked || speedLimitKmh >= ECONOMY.speed.limiterMaxKmh}
          className="ff-button ff-button-ghost h-7 min-h-7 w-7 p-0 text-xs"
        >
          +
        </button>
        {isOver && speedingRisk > 5 && (
          <div className="ff-progress h-1.5 w-14">
            <div
              className="h-full rounded-full"
              style={{
                width: `${speedingRisk}%`,
                backgroundColor: speedingRisk > 70 ? "#ef4444" : "#f59e0b",
              }}
            />
          </div>
        )}
      </div>

      <div className="h-4 w-px shrink-0 bg-white/20" />

      <button
        onClick={onExit}
        title="Şerit modundan çık (M)"
        className="ff-button ff-button-ghost h-7 min-h-7 shrink-0 px-2 py-1 text-xs"
      >
        ⤢
      </button>
    </div>
  );
}
