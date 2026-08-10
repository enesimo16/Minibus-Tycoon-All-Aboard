"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "./uiStore";
import { useGameStore, type DayGoalId } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { ROUTE_DEFINITIONS, getRouteGeometry } from "./route";
import { ECONOMY } from "./economy";
import { getRouteConfig, recommendDriverForRoute, recommendedVehicleTier, masteryLevelForXp } from "./routeProfile";
import { useT } from "./i18n";
import { streakFareMultiplier, useProfileStore } from "./profileStore";

const GOALS: DayGoalId[] = ["earnings", "satisfaction", "safety"];

// Faz 3: Gün Başlat — hat + manuel/şoför + ana hedef seçimi, sonra vardiya başlar.
export function DayStartModal() {
  const t = useT();
  const open = useUiStore((s) => s.dayStartOpen);
  const closeDayStart = useUiStore((s) => s.closeDayStart);
  const unlockedRouteIds = useGameStore((s) => s.unlockedRouteIds);
  const activeRouteId = useGameStore((s) => s.activeRouteId);
  const hiredDriverId = useGameStore((s) => s.hiredDriverId);
  const routeMastery = useGameStore((s) => s.routeMastery);
  const cityEvent = useGameStore((s) => s.cityEvent);
  const eventPrepared = useGameStore((s) => s.eventPrepared);
  const fetchCityEvent = useGameStore((s) => s.fetchCityEvent);
  const money = useGameStore((s) => s.money);

  const [routeId, setRouteId] = useState(activeRouteId);
  const [manual, setManual] = useState(true);
  const [goalId, setGoalId] = useState<DayGoalId>("earnings");

  useEffect(() => {
    if (open && !cityEvent) fetchCityEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const currentStreak = Math.max(1, useProfileStore.getState().stats?.currentStreak ?? 1);
  const streakBonusPercent = Math.round((streakFareMultiplier(currentStreak) - 1) * 100);

  const routes = ROUTE_DEFINITIONS.filter((r) => unlockedRouteIds.includes(r.id));
  const canDriverMode = hiredDriverId !== null;
  const selectedRouteConfig = getRouteConfig(routeId);
  const recommendation = recommendDriverForRoute(routeId);
  const vehicleTier = recommendedVehicleTier(routeId);
  const masteryLevel = masteryLevelForXp(routeMastery[routeId]?.xp ?? 0);

  const start = () => {
    dispatchGameAction("startDay", { routeId, manual, goalId });
    closeDayStart();
  };

  return (
    <div className="fixed inset-0 z-[105] grid place-items-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("day.startTitle")}>
      <div className="ff-panel-strong w-full max-w-md p-5">
        <h2 className="ff-display text-xl">{t("day.previewTitle")}</h2>
        <p className="mt-1 text-xs text-white/50">{t("day.startSubtitle")}</p>

        {/* Gunluk seri: kacirinca kaybedilen somut kazanc. Gun basi ekraninda
            gosterilir cunku oyuncunun "bugun oynadim" karari tam burada verilir. */}
        <div className="ff-streak-banner mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2">
          <span className="text-xs font-black">
            {t("streak.days", { days: currentStreak })}
          </span>
          <span className="text-[11px] font-black tabular-nums">
            {streakBonusPercent > 0
              ? t("streak.bonusActive", { percent: streakBonusPercent })
              : t("streak.bonusNext")}
          </span>
        </div>

        {/* Hat seçimi */}
        <div className="mt-4">
          <div className="ff-section-title mb-1.5">{t("day.selectRoute")}</div>
          <div className="grid gap-1.5">
            {routes.map((r) => (
              <button
                key={r.id}
                onClick={() => setRouteId(r.id)}
                data-active={routeId === r.id}
                className="ff-day-option flex items-center justify-between px-3 py-2 text-sm"
              >
                <span>{r.name}</span>
                {routeId === r.id && <span className="text-amber-600">✓</span>}
              </button>
            ))}
          </div>
          {/* Faz 6: hat kimliği — profil/talep/risk + uygun şoför-araç gerekçesi. */}
          <div className="mt-2 rounded-lg bg-white/5 p-2.5 text-[11px]">
            <div className="flex items-center justify-between text-white/60">
              <span>{t(`route.profile.${selectedRouteConfig.profile}`)}</span>
              <span>{t("route.masteryLevel", { level: masteryLevel, max: ECONOMY.routeMastery.maxLevel })}</span>
            </div>
            {/* Turun uzunluğu: oyuncu "kaç durak sürüyorum" bilgisini sürmeden önce görür. */}
            <div className="mt-1 font-bold text-white/75">
              {t("day.stopCount", { count: getRouteGeometry(routeId).stops.length })}
            </div>
            <div className="mt-1 text-amber-200">
              {t("route.recommendedDriver", { name: recommendation.driver.name, trait: t(`route.trait.${recommendation.trait}`) })}
            </div>
            <div className="mt-0.5 text-white/45">{t(`route.vehicleTier.${vehicleTier}`)}</div>
          </div>
        </div>

        {/* Faz 7: bugünün şehir olayı — hazırlık sinyali başlamadan önce görünür. */}
        {cityEvent && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-200">
                ⚠ {t(`event.${cityEvent.primary.id}`)} · {t(`event.severity.${cityEvent.primary.severity}`)}
              </span>
              {eventPrepared && <span className="text-emerald-300">{t("event.preparedBadge")}</span>}
            </div>
            <div className="mt-1 text-white/60">
              {t("event.affectedRoute", { route: ROUTE_DEFINITIONS.find((r) => r.id === cityEvent.affectedRouteId)?.name ?? cityEvent.affectedRouteId })}
              {cityEvent.affectedRouteId === routeId && <span className="ml-1 text-red-300">{t("event.affectsSelected")}</span>}
            </div>
            {cityEvent.secondary && (
              <div className="mt-0.5 text-white/60">+ {t(`event.${cityEvent.secondary.id}`)} · {t(`event.severity.${cityEvent.secondary.severity}`)}</div>
            )}
            {!eventPrepared && (
              <button
                onClick={() => dispatchGameAction("prepareForEvent")}
                disabled={money < cityEvent.primary.counterCost + (cityEvent.secondary?.counterCost ?? 0)}
                className="ff-button ff-button-primary mt-2 h-8 min-h-8 w-full text-xs disabled:opacity-40"
              >
                {t("event.prepareButton", { cost: cityEvent.primary.counterCost + (cityEvent.secondary?.counterCost ?? 0) })}
              </button>
            )}
          </div>
        )}

        {/* Sürüş modu */}
        <div className="mt-4">
          <div className="ff-section-title mb-1.5">{t("day.driveMode")}</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setManual(true)}
              data-active={manual}
              className="ff-day-option px-3 py-2 text-sm"
            >
              {t("day.manual")}
            </button>
            <button
              onClick={() => canDriverMode && setManual(false)}
              disabled={!canDriverMode}
              data-active={!manual}
              className="ff-day-option px-3 py-2 text-sm disabled:opacity-40"
            >
              {t("day.driver")}
            </button>
          </div>
          {!canDriverMode && <p className="mt-1 text-[11px] text-white/40">{t("day.driverLocked")}</p>}
        </div>

        {/* Ana hedef */}
        <div className="mt-4">
          <div className="ff-section-title mb-1.5">{t("day.mainGoal")}</div>
          <div className="grid grid-cols-3 gap-1.5">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoalId(g)}
                data-active={goalId === g}
                className="ff-day-option px-2 py-2 text-xs"
              >
                {t(`day.goal.${g}`)}
              </button>
            ))}
          </div>
          {/* Hedefin ne olduğu ve tutturulunca ne kazanıldığı açıkça yazılır. */}
          <p className="mt-1.5 text-[11px] leading-snug text-white/55">
            {t(`day.goalHint.${goalId}`, {
              target:
                goalId === "earnings" ? ECONOMY.dayGoals.earnings.targetNet
                : goalId === "satisfaction" ? ECONOMY.dayGoals.satisfaction.targetSatisfaction
                : ECONOMY.dayGoals.safety.maxViolations,
              bonus: Math.round(
                (goalId === "earnings" ? ECONOMY.dayGoals.earnings.moneyBonusRatio
                  : goalId === "satisfaction" ? ECONOMY.dayGoals.satisfaction.moneyBonusRatio
                  : ECONOMY.dayGoals.safety.moneyBonusRatio) * 100,
              ),
            })}
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={closeDayStart} className="ff-button ff-button-ghost flex-1">{t("day.cancel")}</button>
          <button onClick={start} className="ff-button ff-button-primary flex-[2]">{t("day.drive")}</button>
        </div>
      </div>
    </div>
  );
}
