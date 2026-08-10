"use client";

import { useGameStore, type UpgradeKind } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { ECONOMY } from "./economy";
import { useT } from "./i18n";

// Yükseltme alınınca ekranın ortasında açılan kutlama kartı.
// Amaç: satın almanın "tık" hissini bir olaya çevirmek — hangi parça takıldı,
// kaçıncı aşamadayız ve dolmuşun güncel durumu ne.
// Kaynak sinyal: store > upgradeCelebration (buyMotor/Seat/Sound/CashRegister).

const KIND_LABEL: Record<UpgradeKind, string> = {
  motor: "upgrade.motor",
  seat: "upgrade.seat",
  sound: "upgrade.sound",
  cashRegister: "upgrade.cashRegister",
};

const KIND_ICON: Record<UpgradeKind, string> = {
  motor: "⚙",
  seat: "🪑",
  sound: "🔊",
  cashRegister: "🧾",
};

export function UpgradeCelebrationCard() {
  const celebration = useGameStore((s) => s.upgradeCelebration);
  const upgrades = useGameStore((s) => s.upgrades);
  const t = useT();

  if (!celebration) return null;

  const { motorCosts, seatCosts, soundCosts } = ECONOMY.upgrades;

  return (
    <div
      className="fixed inset-0 z-[107] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("upgrade.installed")}
      onClick={() => dispatchGameAction("dismissUpgradeCelebration")}
    >
      {/* key: arka arkaya alınan yükseltmelerde giriş animasyonu baştan oynasın. */}
      <div key={celebration.id} className="ff-upgrade-card" onClick={(e) => e.stopPropagation()}>
        <div className="ff-upgrade-kicker">{t("upgrade.installed")}</div>

        <div className="ff-upgrade-hero">
          <span className="ff-upgrade-hero-icon">{KIND_ICON[celebration.kind]}</span>
          <div className="min-w-0">
            <div className="ff-upgrade-hero-name">{t(KIND_LABEL[celebration.kind])}</div>
            <div className="ff-upgrade-hero-stage">
              {t("upgrade.stage", { level: celebration.level, max: celebration.maxLevel })}
            </div>
          </div>
        </div>

        {/* Aşama noktaları: kaçıncı seviyede olduğumuz tek bakışta görünsün. */}
        <div className="ff-upgrade-pips" aria-hidden="true">
          {Array.from({ length: celebration.maxLevel }, (_, index) => (
            <span key={index} data-filled={index < celebration.level} />
          ))}
        </div>

        <div className="ff-upgrade-state-title">{t("upgrade.busState")}</div>
        <div className="ff-upgrade-state">
          <StateRow
            label={t("upgrade.motor")}
            value={`${upgrades.motorLevel}/${motorCosts.length}`}
            extra={`×${celebration.speedMultiplier.toFixed(2)} ${t("upgrade.speed")}`}
            highlight={celebration.kind === "motor"}
          />
          <StateRow
            label={t("upgrade.seat")}
            value={`${upgrades.seatLevel}/${seatCosts.length}`}
            extra={`${celebration.seatCapacity} ${t("upgrade.capacity")}`}
            highlight={celebration.kind === "seat"}
          />
          <StateRow
            label={t("upgrade.sound")}
            value={`${upgrades.soundLevel}/${soundCosts.length}`}
            highlight={celebration.kind === "sound"}
          />
          <StateRow
            label={t("upgrade.cashRegister")}
            value={upgrades.hasCashRegister ? "✓" : "—"}
            highlight={celebration.kind === "cashRegister"}
          />
        </div>

        <button
          className="ff-button ff-button-primary mt-4 w-full"
          onClick={() => dispatchGameAction("dismissUpgradeCelebration")}
        >
          {t("nav.close")}
        </button>
      </div>
    </div>
  );
}

function StateRow({
  label,
  value,
  extra,
  highlight,
}: {
  label: string;
  value: string;
  extra?: string;
  highlight: boolean;
}) {
  return (
    <div className="ff-upgrade-state-row" data-highlight={highlight}>
      <span className="ff-upgrade-state-label">{label}</span>
      <span className="ff-upgrade-state-value tabular-nums">{value}</span>
      {extra && <span className="ff-upgrade-state-extra">{extra}</span>}
    </div>
  );
}
