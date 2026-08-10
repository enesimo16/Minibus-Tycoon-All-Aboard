"use client";

import { useGameStore } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { ROUTE_DEFINITIONS } from "./route";
import { useT } from "./i18n";

// Günün olayı kartı — her oyun günü saat 12:00'de bir kez açılır (store > tickGameTime).
// Faz 7'nin `cityEvent` altyapısını kullanır; olayı sıfırdan üretmez, yalnızca büyük
// ve okunur bir duyuruya çevirir.
export function DailyEventCard() {
  const open = useGameStore((s) => s.eventCardOpen);
  const cityEvent = useGameStore((s) => s.cityEvent);
  const eventPrepared = useGameStore((s) => s.eventPrepared);
  const activeRouteId = useGameStore((s) => s.activeRouteId);
  const money = useGameStore((s) => s.money);
  const t = useT();

  if (!open || !cityEvent) return null;

  const affectedRoute =
    ROUTE_DEFINITIONS.find((r) => r.id === cityEvent.affectedRouteId)?.name ?? cityEvent.affectedRouteId;
  const affectsYou = cityEvent.affectedRouteId === activeRouteId;
  const counterCost = cityEvent.primary.counterCost + (cityEvent.secondary?.counterCost ?? 0);

  // Olayın sayısal etkileri — oyuncu "ne değişti"yi tahmin etmesin, görsün.
  const templates = [cityEvent.primary, cityEvent.secondary].filter(
    (item): item is NonNullable<typeof item> => item != null,
  );

  return (
    <div
      className="fixed inset-0 z-[109] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("dailyEvent.title")}
    >
      <div className="ff-event-card" data-affects={affectsYou}>
        <div className="ff-event-kicker">{t("dailyEvent.title")}</div>

        <h2 className="ff-display ff-event-name">{t(`event.${cityEvent.primary.id}`)}</h2>
        <div className="ff-event-severity">
          {t(`event.severity.${cityEvent.primary.severity}`)}
        </div>

        <div className="ff-event-route">
          {t("event.affectedRoute", { route: affectedRoute })}
          {affectsYou && <span className="ff-event-affects">{t("dailyEvent.affectsYou")}</span>}
        </div>

        {/* Etkiler: talep / risk / ücret / memnuniyet */}
        <div className="ff-event-effects">
          {templates.map((template) => (
            <div key={template.id} className="ff-event-effect-group">
              <span className="ff-event-effect-name">{t(`event.${template.id}`)}</span>
              <div className="ff-event-chips">
                {template.demandDelta !== 0 && (
                  <Chip value={template.demandDelta} label={t("dailyEvent.demand")} />
                )}
                {template.riskDelta !== 0 && (
                  <Chip value={template.riskDelta} label={t("dailyEvent.risk")} invert />
                )}
                {template.fareDelta !== 0 && (
                  <Chip value={template.fareDelta} label={t("dailyEvent.fare")} />
                )}
                {template.satisfactionDrift !== 0 && (
                  <Chip value={template.satisfactionDrift} label={t("dailyEvent.satisfaction")} />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          {affectsYou && !eventPrepared && (
            <button
              onClick={() => dispatchGameAction("prepareForEvent")}
              disabled={money < counterCost}
              className="ff-button ff-button-primary w-full disabled:opacity-40"
            >
              {t("event.prepareButton", { cost: counterCost })}
            </button>
          )}
          {eventPrepared && <div className="ff-event-prepared">{t("event.preparedBadge")}</div>}
          <button
            onClick={() => dispatchGameAction("dismissEventCard")}
            className="ff-button ff-button-ghost w-full"
          >
            {t("dailyEvent.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tek bir sayısal etki rozeti. `invert`: artışın KÖTÜ olduğu eksenler (risk). */
function Chip({ value, label, invert = false }: { value: number; label: string; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  const percent = Math.round(value * 100);
  return (
    <span className="ff-event-chip" data-good={positive}>
      {percent > 0 ? "+" : ""}
      {percent}% {label}
    </span>
  );
}
