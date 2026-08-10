"use client";

import { useEffect, useState } from "react";
import { fetchCityPublic, tipCity, raidCity, type CityPublic } from "./api";
import { getPlayerId } from "./playerId";
import { getCachedUsername } from "./username";
import { useT } from "./i18n";

// Aşama 5: link=şehir ziyareti (bkz. docs/game-design/06-sosyal-link-sekme.md).
// Bilinçli olarak 2D/basit — host'un 3D mahallesini canlı göstermek gerçek zamanlı bir
// sunucu gerektirir (bkz. ADR-003), biz asenkron son-görülen anlık görüntüyü gösteriyoruz.
export function VisitorCity({ username }: { username: string }) {
  const t = useT();
  const [city, setCity] = useState<CityPublic | null | undefined>(undefined); // undefined: yükleniyor
  // Backend anahtar doner; cumleyi burada kuruyoruz (metin gomme yasak).
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"tip" | "raid" | null>(null);

  useEffect(() => {
    fetchCityPublic(username).then(setCity);
  }, [username]);

  async function doTip() {
    setBusy("tip");
    setMessage(null);
    const result = await tipCity(username, getPlayerId()!, getCachedUsername());
    setBusy(null);
    setMessage(t(result.messageKey, { amount: result.amount.toFixed(2) }));
    if (result.success) setCity((c) => (c ? { ...c, money: c.money + result.amount } : c));
  }

  async function doRaid() {
    setBusy("raid");
    setMessage(null);
    const result = await raidCity(username, getPlayerId()!, getCachedUsername());
    setBusy(null);
    setMessage(t(result.messageKey, { amount: result.amount.toFixed(2) }));
    if (result.success) setCity((c) => (c ? { ...c, money: Math.max(0, c.money - result.amount) } : c));
  }

  return (
    <main className="ff-screen flex h-dvh w-dvw items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-xl ff-panel-strong p-6 text-white">
        {city === undefined && <p className="text-center text-white/60">{t("visit.loading")}</p>}

        {city === null && (
          <>
            <h1 className="mb-2 text-xl font-black text-amber-300">{t("visit.notFoundTitle")}</h1>
            <p className="text-sm text-white/60">
              {t("visit.notFoundBody", { username })}
            </p>
          </>
        )}

        {city && (
          <>
            {/* Adim 1 (link=sehir): paylasilan link bir KIMLIK gostermeli — sirket adi,
                rengi ve seviyesi. Ziyaretci "bir kullanici adi" degil, bir isletme gorur. */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="ff-section-title">{t("visit.label")}</p>
                <h1 className="truncate text-2xl font-black text-amber-300">
                  {city.companyName ?? `/${city.username}`}
                </h1>
                <p className="mt-0.5 truncate text-xs font-bold text-white/45">@{city.username}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-black text-amber-100">
                    {t("visit.level", { level: city.level })}
                  </span>
                  <span className="text-[11px] text-white/45">
                    {t("visit.lastSeen", { date: new Date(city.lastSeenUtc).toLocaleString() })}
                  </span>
                </div>
              </div>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white shadow-inner"
                style={{ backgroundColor: city.primaryColor ?? "#f59e0b" }}
              >
                {(city.companyName ?? city.username).slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className="ff-card rounded-lg px-3 py-2">
                <div className="text-white/50">{t("visit.money")}</div>
                <div className="text-lg font-bold text-amber-400">₺{city.money.toFixed(2)}</div>
              </div>
              <div className="ff-card rounded-lg px-3 py-2">
                <div className="text-white/50">{t("visit.satisfaction")}</div>
                <div className="text-lg font-bold">😊 {city.satisfaction}%</div>
              </div>
            </div>

            {city.hasCheckpoint && (
              <p className="mb-3 rounded-lg bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200">
                {t("visit.checkpoint")}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={doTip}
                disabled={busy !== null}
                className="ff-button ff-button-green flex-1 text-sm"
              >
                {t("visit.tip")}
              </button>
              <button
                onClick={doRaid}
                disabled={busy !== null}
                className="ff-button ff-button-red flex-1 text-sm"
              >
                {t("visit.raid")}
              </button>
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-center text-sm font-bold">{message}</p>
            )}

            <p className="mt-4 text-center text-xs text-white/40">
              {t("visit.snapshotNote", { username: city.username })}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
