"use client";

import { useGameStore } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { ROUTE_DEFINITIONS, getStopCount } from "./route";
import { formatGameTime } from "./store";
import { useT } from "./i18n";

// Hat raporu — hattın son durağı servis edilince açılır (bkz. store > maybeCompleteLap).
// Turun operasyonel özeti: kâr/zarar, hat dışı, limit üstü yolcu, cezalar.
// Notlu/XP'li değerlendirme burada değil, gün sonu raporundadır (DayEndReport).
export function LapReport() {
  const t = useT();
  const report = useGameStore((s) => s.lapReport);

  if (!report) return null;

  const routeName =
    ROUTE_DEFINITIONS.find((r) => r.id === report.routeId)?.name ?? report.routeId;
  const profit = report.net >= 0;
  const durationMinutes = Math.max(0, report.endedAtGameMinutes - report.startedAtGameMinutes);

  return (
    <div
      className="fixed inset-0 z-[106] grid place-items-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm ff-scroll"
      role="dialog"
      aria-modal="true"
      aria-label={t("lap.title")}
    >
      <div className="ff-panel-strong my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto p-5 ff-scroll">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="ff-display text-xl">{t("lap.title")}</h2>
            <p className="mt-0.5 text-xs text-white/50">
              {t("lap.subtitle", { route: routeName, lap: report.lapIndex })}
            </p>
          </div>
          <span className="ff-lap-stops shrink-0 tabular-nums">
            {report.stopsServed}/{getStopCount()}
          </span>
        </div>

        {/* Turun tek cümlelik sonucu: kâr mı zarar mı. */}
        <div className="ff-lap-net mt-4" data-profit={profit}>
          <span className="ff-lap-net-label">{profit ? t("lap.profit") : t("lap.loss")}</span>
          <span className="ff-lap-net-value tabular-nums">
            {profit ? "+" : "−"}₺{Math.abs(Math.round(report.net))}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <LapRow label={t("lap.gross")} value={`₺${Math.round(report.grossEarned)}`} />
          <LapRow label={t("lap.expenses")} value={`₺${Math.round(report.expenses)}`} tone={report.expenses > 0 ? "bad" : "muted"} />
          <LapRow label={t("lap.boardings")} value={String(report.boardings)} />
          <LapRow label={t("lap.stopsMissed")} value={String(report.stopsMissed)} tone={report.stopsMissed > 0 ? "bad" : "muted"} />
          <LapRow label={t("lap.offRoute")} value={String(report.offRouteTrips)} tone={report.offRouteTrips > 0 ? "warn" : "muted"} />
          <LapRow label={t("lap.overflow")} value={String(report.overflowAccepted)} tone={report.overflowAccepted > 0 ? "warn" : "muted"} />
          <LapRow
            label={t("lap.fines")}
            value={report.policeFines > 0 ? `${report.policeFines} · ₺${Math.round(report.policeFineAmount)}` : "0"}
            tone={report.policeFines > 0 ? "bad" : "muted"}
          />
          <LapRow label={t("lap.violations")} value={String(report.violations)} tone={report.violations > 0 ? "bad" : "muted"} />
        </div>

        <p className="mt-3 text-[11px] text-white/40">
          {t("lap.duration", { minutes: Math.round(durationMinutes), clock: formatGameTime(report.endedAtGameMinutes) })}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => dispatchGameAction("returnToRoam")}
            className="ff-button ff-button-ghost flex-1"
          >
            {t("lap.toRoam")}
          </button>
          <button
            onClick={() => dispatchGameAction("startNextLap")}
            className="ff-button ff-button-primary flex-[2]"
          >
            {t("lap.driveAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LapRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "warn" | "bad";
}) {
  return (
    <div className="ff-lap-row" data-tone={tone}>
      <span className="ff-lap-row-label">{label}</span>
      <span className="ff-lap-row-value tabular-nums">{value}</span>
    </div>
  );
}
