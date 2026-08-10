"use client";

import { useEffect } from "react";
import { getPlayerId } from "./playerId";
import { useGameStore } from "./store";
import { track } from "./telemetry";

const ECONOMY_FLUSH_MS = 10_000;

function markOnce(playerId: string, event: string, data?: Record<string, unknown>): void {
  const key = `minibus-tycoon:funnel:${playerId}:${event}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  track(event, data);
}

export function FunnelTelemetry() {
  useEffect(() => {
    const playerId = getPlayerId();
    if (!playerId) return;
    let pendingMoneyDelta = 0;
    let latestBalance = useGameStore.getState().money;

    const flushMoney = () => {
      if (Math.abs(pendingMoneyDelta) < 0.01) return;
      track(pendingMoneyDelta > 0 ? "currency_earned" : "currency_spent", {
        amount: Math.abs(Number(pendingMoneyDelta.toFixed(2))),
        balance: Number(latestBalance.toFixed(2)),
        source: "gameplay",
      });
      pendingMoneyDelta = 0;
    };

    const unsubscribe = useGameStore.subscribe((state, previous) => {
      if (state.money !== previous.money) {
        pendingMoneyDelta += state.money - previous.money;
        latestBalance = state.money;
      }
      if (state.currentSpeedKmh > 3 && previous.currentSpeedKmh <= 3) markOnce(playerId, "first_drive");
      if (state.passengersOnBoard > previous.passengersOnBoard) markOnce(playerId, "first_stop_completed");
      if (
        state.upgrades.motorLevel > previous.upgrades.motorLevel ||
        state.upgrades.seatLevel > previous.upgrades.seatLevel ||
        state.upgrades.soundLevel > previous.upgrades.soundLevel ||
        (!previous.upgrades.hasCashRegister && state.upgrades.hasCashRegister)
      ) markOnce(playerId, "first_upgrade", { busId: state.activeBusId });
      if (!previous.hiredDriverId && state.hiredDriverId) markOnce(playerId, "first_driver_hired", { driverId: state.hiredDriverId });
      if (state.ownedBusIds.length > previous.ownedBusIds.length) markOnce(playerId, "first_bus_bought", { busId: state.activeBusId });
      if (state.unlockedRouteIds.length > previous.unlockedRouteIds.length) markOnce(playerId, "first_route_unlocked", { routeId: state.activeRouteId });
    });
    const timer = window.setInterval(flushMoney, ECONOMY_FLUSH_MS);

    return () => {
      flushMoney();
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
