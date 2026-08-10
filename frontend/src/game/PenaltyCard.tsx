"use client";

import { useGameStore } from "./store";
import { dispatchGameAction } from "./useTabSync";
import { ECONOMY } from "./economy";
import { useT } from "./i18n";

// Trafik cezası kartı — ihlal yapıldığında ekranda açılır.
// Ne yaptığını, kaç ceza puanı yazıldığını, ne kadar para kestiğini ve
// ehliyetin ne durumda olduğunu tek bakışta gösterir.
// Kaynak sinyal: store > penaltyCard (issueLicencePenalty).
export function PenaltyCard() {
  const card = useGameStore((s) => s.penaltyCard);
  const lockLeft = useGameStore((s) => s.vehicleLockSecondsLeft);
  const t = useT();

  if (!card) return null;

  const max = ECONOMY.licence.maxPoints;
  const fillPercent = Math.min(100, (card.totalPoints / max) * 100);

  return (
    <div
      className="fixed inset-0 z-[108] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("penalty.title")}
    >
      <div key={card.id} className="ff-penalty-card" data-suspended={card.suspended}>
        <div className="ff-penalty-badge">{t("penalty.title")}</div>

        <h3 className="ff-display mt-2 text-lg">{t(`penalty.offence.${card.offence}`)}</h3>
        <p className="ff-penalty-reason">{t(`penalty.reason.${card.offence}`)}</p>

        <div className="ff-penalty-rows">
          <div className="ff-penalty-row">
            <span>{t("penalty.fine")}</span>
            <strong className="tabular-nums">₺{Math.round(card.fine)}</strong>
          </div>
          <div className="ff-penalty-row">
            <span>{t("penalty.points")}</span>
            <strong className="tabular-nums">+{card.points}</strong>
          </div>
        </div>

        {/* Ehliyet durumu: dolu bar = ehliyet gitti. */}
        <div className="ff-penalty-licence">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span>{t("penalty.licence")}</span>
            <span className="tabular-nums">{card.totalPoints} / {max}</span>
          </div>
          <div className="ff-penalty-track">
            <div className="ff-penalty-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        {card.suspended && (
          <p className="ff-penalty-suspended">
            {t("penalty.suspended", { seconds: Math.ceil(lockLeft) })}
          </p>
        )}

        <button
          className="ff-button ff-button-primary mt-4 w-full"
          onClick={() => dispatchGameAction("dismissPenaltyCard")}
        >
          {t("nav.close")}
        </button>
      </div>
    </div>
  );
}
