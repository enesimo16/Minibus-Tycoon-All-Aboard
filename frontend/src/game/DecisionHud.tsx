"use client";

import { useEffect } from "react";
import { useGameStore } from "./store";
import { useUiStore } from "./uiStore";
import { dispatchGameAction } from "./useTabSync";

// DUR/GEÇ karar penceresi (bkz. docs/game-design/03-surus-mekanigi.md).
// Şerit modunda bottom-11 (StripBar yüksekliği) üstüne sığacak kompakt versiyon gösterilir.
export function DecisionHud() {
  const open = useGameStore((s) => s.decision.open);
  const secondsLeft = useGameStore((s) => s.decision.secondsLeft);
  const driverActive = useGameStore((s) => s.driverActive);
  const stripMode = useUiStore((s) => s.stripMode);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!useGameStore.getState().decision.open) return;
      if (e.code === "Space") dispatchGameAction("chooseDecision", "DUR");
      if (e.key === "g" || e.key === "G") dispatchGameAction("chooseDecision", "GEC");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open || driverActive) return null;

  if (stripMode) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-11 flex items-center justify-center gap-2 py-1">
        <span className="ff-pill min-h-0 px-2 py-0.5 text-xs font-black">
          {secondsLeft.toFixed(1)}s
        </span>
        <button
          onClick={() => dispatchGameAction("chooseDecision", "DUR")}
          className="ff-button ff-button-green pointer-events-auto min-h-8 px-5 py-1 text-sm"
        >
          DUR
        </button>
        <button
          onClick={() => dispatchGameAction("chooseDecision", "GEC")}
          className="ff-button ff-button-red pointer-events-auto min-h-8 px-5 py-1 text-sm"
        >
          GEÇ
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[max(5.25rem,env(safe-area-inset-bottom))] z-20 flex justify-center gap-2 sm:bottom-16">
      <button
        onClick={() => dispatchGameAction("chooseDecision", "DUR")}
        data-tone="green"
        className="ff-choice-button pointer-events-auto min-h-12 min-w-0 flex-1 px-4 py-2 sm:min-w-36 sm:flex-none"
      >
        <span className="text-base font-black">DUR</span>
        <kbd className="ff-keycap px-1.5">Space</kbd>
      </button>
      <button
        onClick={() => dispatchGameAction("chooseDecision", "GEC")}
        data-tone="red"
        className="ff-choice-button pointer-events-auto min-h-12 min-w-0 flex-1 px-4 py-2 sm:min-w-36 sm:flex-none"
      >
        <span className="text-base font-black">GEÇ</span>
        <kbd className="ff-keycap">G</kbd>
      </button>
      <div className="pointer-events-none absolute -top-8 left-1/2 min-h-0 -translate-x-1/2 rounded-md border border-amber-200/20 bg-[#11171e]/95 px-2.5 py-1 text-xs font-black text-amber-200 shadow-lg">
        {secondsLeft.toFixed(1)}s
      </div>
    </div>
  );
}
