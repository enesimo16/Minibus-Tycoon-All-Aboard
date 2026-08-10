"use client";

import { ECONOMY } from "./economy";
import { useT } from "./i18n";
import { useGameStore } from "./store";
import { dispatchGameAction } from "./useTabSync";

const GAUGE_MAX_KMH = ECONOMY.speed.limiterMaxKmh;

export function SpeedLimiterWidget() {
  const t = useT();
  const currentSpeedKmh = useGameStore((s) => s.currentSpeedKmh);
  const speedLimitKmh = useGameStore((s) => s.speedLimitKmh);
  const doorsOpen = useGameStore((s) => s.driving.doorsOpen);
  const driverActive = useGameStore((s) => s.driverActive);
  const policeLevel = useGameStore((s) => s.policeLevel);
  const suspensionMinutesLeft = useGameStore((s) => s.suspensionMinutesLeft);

  const locked = driverActive || policeLevel >= 4 || suspensionMinutesLeft > 0;
  const displaySpeed = Math.round(Math.abs(currentSpeedKmh));
  const reversing = currentSpeedKmh < -0.5;
  const overLegalLimit = displaySpeed > ECONOMY.speed.legalLimitKmh;
  const ratio = Math.max(0, Math.min(1, displaySpeed / GAUGE_MAX_KMH));
  const needleRotation = -135 + ratio * 270;
  const gaugeColor = overLegalLimit ? "#ffffff" : "#b8babd";

  return (
    <aside
      data-tutorial="speed"
      className="ff-bottom-dock ff-speed-dock pointer-events-auto absolute bottom-[max(0.8rem,env(safe-area-inset-bottom))] left-3 z-10 w-[9.75rem] overflow-hidden p-2.5 font-sans"
      aria-label="Araç hız göstergesi"
    >
      <div className="relative mx-auto h-[7.65rem] w-[7.65rem]">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <filter id="ff-speed-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 18 88 A 46 46 0 1 1 102 88"
            pathLength="100"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 18 88 A 46 46 0 1 1 102 88"
            pathLength="100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - ratio * 100}
            filter="url(#ff-speed-glow)"
            className="transition-[stroke-dashoffset,stroke] duration-150"
          />

          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1="60"
              y1="15"
              x2="60"
              y2={tick === 0 || tick === 1 ? "22" : "20"}
              stroke="rgba(255,255,255,0.68)"
              strokeWidth={tick === 0 || tick === 1 ? "2.3" : "1.5"}
              strokeLinecap="round"
              transform={`rotate(${-135 + tick * 270} 60 60)`}
            />
          ))}

          <g
            transform={`rotate(${needleRotation} 60 60)`}
            className="transition-transform duration-100"
          >
            <line
              x1="60"
              y1="64"
              x2="60"
              y2="29"
              stroke="#f7f9f8"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <circle cx="60" cy="60" r="6" fill="#f7f9f8" />
          <circle cx="60" cy="60" r="2.5" fill="#1a232c" />
        </svg>

        <div className="absolute inset-x-0 bottom-[1.05rem] text-center leading-none">
          <div
            className="ff-display text-[1.72rem] tabular-nums"
            style={{ color: gaugeColor }}
          >
            {displaySpeed}
          </div>
          <div className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-white/45">
            {reversing ? t("drive.reverse") : "km/h"}
          </div>
        </div>
      </div>

      <div className="-mt-1 flex items-center justify-between rounded-xl border border-white/9 bg-white/[0.045] p-1.5">
        <LimiterButton direction="decrease" locked={locked} limit={speedLimitKmh} />
        <div className="text-center leading-none">
          <div className="text-[7px] font-black uppercase tracking-[0.17em] text-white/35">
            {t("drive.limiter")}
          </div>
          <div className="ff-display mt-1 text-sm tabular-nums text-white/88">
            {speedLimitKmh}
          </div>
        </div>
        <LimiterButton direction="increase" locked={locked} limit={speedLimitKmh} />
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1 text-[8px] font-black uppercase tracking-[0.12em]">
        <span className="text-white/38">{t("drive.doors")}</span>
        <span className={doorsOpen ? "text-emerald-200" : "text-white/48"}>
          {doorsOpen ? t("drive.doorsOpen") : t("drive.doorsClosed")}
        </span>
      </div>

      {locked && (
        <div className="mt-1.5 rounded-lg bg-cyan-300/8 px-2 py-1 text-center text-[8px] font-black uppercase tracking-[0.12em] text-cyan-100/58">
          {t("drive.autoPilot")}
        </div>
      )}
    </aside>
  );
}

function LimiterButton({
  direction,
  locked,
  limit,
}: {
  direction: "increase" | "decrease";
  locked: boolean;
  limit: number;
}) {
  const t = useT();
  const increase = direction === "increase";
  const disabled =
    locked ||
    (increase
      ? limit >= ECONOMY.speed.limiterMaxKmh
      : limit <= ECONOMY.speed.limiterMinKmh);

  return (
    <button
      type="button"
      onClick={() =>
        dispatchGameAction(increase ? "increaseSpeed" : "decreaseSpeed")
      }
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.055] text-sm font-black text-white/75 transition hover:border-cyan-200/35 hover:bg-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-25"
      title={increase ? t("drive.limiterUp") : t("drive.limiterDown")}
    >
      {increase ? "+" : "−"}
    </button>
  );
}
