"use client";

import { useCallback, useEffect, useState } from "react";
import { addFriend, fetchFriends, removeFriend, type Friend } from "./api";
import { getPlayerId } from "./playerId";
import { getCachedUsername } from "./username";
import { useT } from "./i18n";
import { pushToast } from "./toastStore";

/**
 * Adim 3: arkadas listesi. Bilincli olarak "sadece isim listesi" DEGIL — her satir
 * arkadasin sehrine giden bir kapi (Adim 1'deki /[username] sayfasi). Seviye ve
 * memnuniyet gorunur oldugu icin karsilastirma/sosyal baski dogar; bu, gunluk geri
 * donusun en ucuz motorudur.
 */
export function FriendsPanel() {
  const t = useT();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const myUsername = getCachedUsername();

  const load = useCallback(async () => {
    const playerId = getPlayerId();
    if (!playerId) {
      setLoading(false);
      return;
    }
    setFriends(await fetchFriends(playerId));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function onAdd() {
    const playerId = getPlayerId();
    const name = input.trim();
    if (!playerId || name.length < 3 || busy) return;
    setBusy(true);
    const result = await addFriend(playerId, name);
    setBusy(false);
    if (result.ok) {
      setInput("");
      setFriends((prev) => [...prev, result.friend].sort((a, b) => b.level - a.level));
      pushToast({ tone: "success", message: t("friends.added", { name: result.friend.username }) });
      return;
    }
    pushToast({ tone: "warning", message: t(`friends.error.${result.reason}`) });
  }

  async function onRemove(username: string) {
    const playerId = getPlayerId();
    if (!playerId) return;
    if (await removeFriend(playerId, username)) {
      setFriends((prev) => prev.filter((f) => f.username !== username));
    }
  }

  return (
    <div className="space-y-3">
      {/* Kendi paylasilabilir linkin — davetin baslangic noktasi. */}
      {myUsername && (
        <div className="rounded-lg bg-black/20 p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/45">
            {t("friends.myCity")}
          </div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                .writeText(`${window.location.origin}/${myUsername}`)
                .then(() => pushToast({ tone: "success", message: t("share.copied") }))
                .catch(() => {});
            }}
            className="mt-1 w-full truncate rounded bg-white/10 px-2 py-1.5 text-left text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/20"
          >
            /{myUsername} — {t("friends.copyLink")}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onAdd();
          }}
          placeholder={t("friends.addPlaceholder")}
          className="ff-input flex-1 text-xs font-bold"
        />
        <button
          type="button"
          onClick={() => void onAdd()}
          disabled={busy || input.trim().length < 3}
          className="ff-button px-3 text-xs font-black disabled:opacity-40"
        >
          {t("friends.add")}
        </button>
      </div>

      {loading ? (
        <p className="text-[11px] text-white/45">{t("friends.loading")}</p>
      ) : friends.length === 0 ? (
        <p className="text-[11px] leading-4 text-white/45">{t("friends.empty")}</p>
      ) : (
        <div className="space-y-2">
          {friends.map((f) => (
            <div key={f.username} className="rounded-lg bg-black/20 p-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white"
                  style={{ backgroundColor: f.primaryColor ?? "#153448" }}
                >
                  {(f.companyName ?? f.username).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-black text-white">
                    {f.companyName ?? f.username}
                  </div>
                  <div className="truncate text-[10px] font-bold text-white/45">@{f.username}</div>
                </div>
                <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-black text-amber-100">
                  {t("friends.level", { level: f.level })}
                </span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <a
                  href={`/${f.username}`}
                  className="flex-1 rounded bg-cyan-400/20 px-2 py-1 text-center text-[11px] font-black text-cyan-100 hover:bg-cyan-400/30"
                >
                  {t("friends.visit")}
                </a>
                <button
                  type="button"
                  onClick={() => void onRemove(f.username)}
                  className="rounded bg-white/10 px-2 py-1 text-[11px] font-bold text-white/60 hover:bg-red-400/25"
                >
                  {t("friends.remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
