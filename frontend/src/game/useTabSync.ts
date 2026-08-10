"use client";

import { useEffect } from "react";
import { useGameStore } from "./store";
import { useProgressionStore } from "./progressionStore";
import { pushToast } from "./toastStore";
import { t } from "./i18n";

// Sekme-arası senkron (bkz. ADR-004 + docs/game-design/06-sosyal-link-sekme.md).
// Web Locks API ile "tek lider sekme" seçilir: lider gerçek simülasyonu çalıştırır
// (mevcut GameCanvas/Bus mantığı), diğer sekmeler salt-veriyi yansıtan izleyicidir.
//
// Girdi yönlendirme: izleyici sekmede kullanıcı bir butona basınca ilgili store aksiyonu
// LOKAL çağrılmaz (zaten bir sonraki yayında ezilirdi) — dispatchGameAction ile lidere
// "bunu yap" mesajı gönderilir, lider kendi state'inde uygular, bir sonraki yayında herkese
// yansır. Bu yüzden HUD bileşenleri store aksiyonlarını DOĞRUDAN değil dispatchGameAction
// üzerinden çağırmalı (bkz. DecisionHud/InteractionHud/ManagementHud).
//
// Dosya adı bilerek "TabSync.tsx" bileşeninden farklı (küçük harfle başlıyor + use-önekli):
// Windows'un büyük/küçük harf duyarsız dosya sistemi TabSync.tsx ile tabSync.ts'i aynı
// dosya sanıyordu (derleme hatası verdi) — bkz. bu düzeltmenin git geçmişi.

const LEADER_LOCK_NAME = "fullfilled-leader";
const CHANNEL_NAME = "fullfilled-sync";
const BROADCAST_INTERVAL_MS = 150;

let sharedChannel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!sharedChannel) sharedChannel = new BroadcastChannel(CHANNEL_NAME);
  return sharedChannel;
}

/** Lider seçimini başlatır. Sekme kapanana kadar kilidi tutar. */
export function useLeaderElection() {
  const setLeader = useGameStore((s) => s.setLeader);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("locks" in navigator)) {
      // Eski tarayıcı: Web Locks yok, her sekme kendi lideri sayılır (tek sekme varsayımı).
      setLeader(true);
      return;
    }

    let cancelled = false;
    let releaseHeld: (() => void) | null = null;

    navigator.locks.request(LEADER_LOCK_NAME, () => {
      return new Promise<void>((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }
        setLeader(true);
        releaseHeld = resolve; // sekme kapanana kadar çözülmez, kilidi tutmaya devam eder
      });
    });

    return () => {
      cancelled = true;
      releaseHeld?.();
      setLeader(false);
    };
  }, [setLeader]);
}

/** Lider durumu periyodik yayınlar + izleyicilerden gelen girdileri uygular. */
export function useStateBroadcast() {
  const isLeader = useGameStore((s) => s.isLeader);
  const applyBroadcastState = useGameStore((s) => s.applyBroadcastState);

  useEffect(() => {
    const channel = getChannel();
    if (!channel) return;

    if (isLeader) {
      const interval = setInterval(() => {
        channel.postMessage({ type: "state", payload: useGameStore.getState().getBroadcastPayload() });
      }, BROADCAST_INTERVAL_MS);
      channel.onmessage = (e) => {
        if (e.data?.type !== "input") return;
        const action = (useGameStore.getState() as unknown as Record<string, unknown>)[e.data.action];
        if (typeof action === "function") action(...(e.data.args ?? []));
      };
      return () => {
        clearInterval(interval);
        channel.onmessage = null;
      };
    }

    channel.onmessage = (e) => {
      if (e.data?.type === "state") applyBroadcastState(e.data.payload);
    };
    return () => {
      channel.onmessage = null;
    };
  }, [isLeader, applyBroadcastState]);
}

/**
 * HUD bileşenlerinin kullanıcı etkileşimlerinde çağırması gereken tek giriş noktası.
 * Lider sekmede doğrudan çalıştırır; izleyici sekmede lidere mesaj olarak yollar.
 */
export function dispatchGameAction(action: string, ...args: unknown[]) {
  const unlockId = unlockForAction(action, args);
  const unlock = unlockId ? useProgressionStore.getState().bootstrap?.unlocks[unlockId] : null;
  if (unlock && !unlock.available) {
    const milestone = unlock.missingMilestones[0];
    pushToast({
      tone: "info",
      title: t("progression.locked"),
      message: milestone
        ? t("progression.lockedMilestone", { level: unlock.requiredLevel, milestone: t(`progression.milestone.${milestone}`) })
        : t("progression.lockedLevel", { level: unlock.requiredLevel }),
    });
    return;
  }
  const state = useGameStore.getState() as unknown as Record<string, unknown>;
  if (state.isLeader) {
    const fn = state[action];
    if (typeof fn === "function") fn(...args);
    return;
  }
  getChannel()?.postMessage({ type: "input", action, args });
}

function unlockForAction(action: string, args: unknown[]): string | null {
  if (["buyMotorUpgrade", "buySeatUpgrade", "buySoundUpgrade", "buyCashRegister"].includes(action)) return "upgrades";
  if (["hireDriver", "assignDriverToBus", "assignDriverShift"].includes(action)) return "drivers";
  if (["unlockRoute", "unlockSecondLine"].includes(action)) return "routes";
  if (action === "buyTerminalUpgrade") return "terminal";
  if (action === "buyBus") return "midibus";
  if (action === "buyCatalogBus") return args[0] === "premium" ? "premium" : args[0] === "midibus" ? "midibus" : null;
  if (action === "acceptContract") return "contracts";
  return null;
}
