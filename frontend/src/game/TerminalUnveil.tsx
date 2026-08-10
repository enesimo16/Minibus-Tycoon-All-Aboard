"use client";

import { useGameStore } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { getTerminalUpgrade } from "./terminal";
import { useT } from "./i18n";

// Terminal tesisi açılınca ekranın ALTINDA beliren tanıtım kartı.
// Kamera bu sırada binanın etrafında döner (bkz. GameCanvas > TerminalUnveilCam);
// kart kapanınca kamera kontrolü oyuncuya geri verilir.
export function TerminalUnveil() {
  const unveilId = useGameStore((s) => s.terminalUnveil);
  const t = useT();

  if (!unveilId) return null;
  const upgrade = getTerminalUpgrade(unveilId);
  if (!upgrade) return null;

  // Etkiler tesis tanımından okunur (terminal.ts) — burada sabit sayı yok.
  const perks = [
    upgrade.incomePerSecond > 0 && `+₺${(upgrade.incomePerSecond * 60).toFixed(0)}/dk`,
    upgrade.satisfactionPerSecond > 0 && `+${(upgrade.satisfactionPerSecond * 60).toFixed(1)} memnuniyet/dk`,
    upgrade.demandBonus > 0 && `+%${Math.round(upgrade.demandBonus * 100)} yolcu talebi`,
  ].filter(Boolean) as string[];

  return (
    <div className="ff-unveil-layer">
      <div className="ff-unveil-card" style={{ borderBottomColor: upgrade.accent }}>
        <div className="ff-unveil-kicker" style={{ color: upgrade.accent }}>
          {t("terminal.opened")}
        </div>
        <h3 className="ff-display text-lg">{upgrade.name}</h3>
        <p className="ff-unveil-desc">{upgrade.description}</p>

        <div className="ff-unveil-perks">
          {perks.map((perk) => (
            <span key={perk} className="ff-unveil-perk">{perk}</span>
          ))}
        </div>

        <button
          className="ff-button ff-button-primary mt-3 w-full"
          onClick={() => dispatchGameAction("dismissTerminalUnveil")}
        >
          {t("nav.close")}
        </button>
      </div>
    </div>
  );
}
