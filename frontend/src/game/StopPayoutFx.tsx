"use client";

import { useGameStore } from "./store";
import { useT } from "./i18n";

// Durakta tahsilat yapılınca yukarı süzülüp kaybolan "+₺X" kartı — tycoon oyunlarındaki
// kasa hissi. Kaynak sinyal: store > stopPayout (finishBoarding her serviste id'yi artırır).
//
// Gizlenme işi tamamen CSS animasyonuna bırakıldı (`forwards` ile opacity 0'da kalır):
// setState'li bir zamanlayıcı her tahsilatta ekstra render zinciri doğuruyordu.
export function StopPayoutFx() {
  const payout = useGameStore((s) => s.stopPayout);
  const t = useT();

  if (!payout) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[38%] z-30 flex justify-center">
      {/* key: aynı durakta arka arkaya tahsilat olursa animasyon baştan oynasın. */}
      <div key={payout.id} className="ff-payout-burst">
        <div className="ff-payout-amount">+₺{Math.round(payout.amount)}</div>
        <div className="ff-payout-detail">
          {payout.alighted > 0 && <span>{t("stopPayout.alighted", { count: payout.alighted })}</span>}
          {payout.alighted > 0 && payout.boarded > 0 && <span className="opacity-40"> · </span>}
          {payout.boarded > 0 && <span>{t("stopPayout.boarded", { count: payout.boarded })}</span>}
        </div>
      </div>
    </div>
  );
}
