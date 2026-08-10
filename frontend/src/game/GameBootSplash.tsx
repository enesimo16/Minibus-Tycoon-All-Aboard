"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useT } from "./i18n";

// Acilis ekrani zamanlamasi. Amac: harita/varlik yuklenirken bos gri sahne yerine
// "Oyun hazirlaniyor" gostermek; ama takilip kalmamak.
/** Yukleme bittikten sonra sahnenin ilk karesini cizmesi icin birakilan pay. */
const SETTLE_DELAY_MS = 450;
/** Yukleyici hic tetiklenmezse (her sey cache'te) yine de kapanma suresi. */
const NO_LOAD_FALLBACK_MS = 1800;
/** Guvenlik tavani: yukleme takilsa bile oyuncu kilitli kalmaz. */
const MAX_VISIBLE_MS = 15000;

/**
 * Her girişte, 3B varliklar yuklenene kadar gosterilen acilis perdesi.
 * `useProgress` drei'nin THREE.DefaultLoadingManager'a bagli zustand store'u —
 * Canvas DISINDA da okunabilir, bu yuzden burada mount edilebiliyor.
 */
export function GameBootSplash() {
  const t = useT();
  const active = useProgress((state) => state.active);
  const progress = useProgress((state) => state.progress);
  const [visible, setVisible] = useState(true);
  // LoadingManager tamamlandığında progress 100'de kaldığı için ayrıca latch state gerekmez.
  const started = active || progress > 0;

  // Yukleme bitince kisa bir pay birakip perdeyi kaldir.
  useEffect(() => {
    if (!started || active) return;
    const timer = window.setTimeout(() => setVisible(false), SETTLE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [started, active]);

  // Hicbir varlik yuklenmezse (tam cache) `active` hic true olmaz — yine de kapat.
  useEffect(() => {
    if (started) return;
    const timer = window.setTimeout(() => setVisible(false), NO_LOAD_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [started]);

  // Guvenlik tavani.
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), MAX_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const percent = started ? Math.min(100, Math.round(progress)) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="ff-auth-screen fixed inset-0 z-[100] grid place-items-center p-4 font-sans"
    >
      <div className="ff-login-shell w-full max-w-[390px] px-6 py-7 text-center">
        <div className="ff-display text-lg leading-tight text-ff-ink">{t("boot.preparing")}</div>
        <p className="mt-2 text-[11px] font-bold leading-4 text-ff-muted">{t("boot.hint")}</p>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ff-ink/12">
          <div
            className="h-full rounded-full bg-[#c98a1c] transition-[width] duration-200"
            style={{ width: `${Math.max(6, percent)}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] font-black tabular-nums text-ff-muted">%{percent}</div>
      </div>
    </div>
  );
}
