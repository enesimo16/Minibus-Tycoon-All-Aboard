"use client";

import { useEffect } from "react";
import { playSfx, setMusicEnabled, setMusicVolume, setSfxEnabled, setSfxVolume, stopEngineSound, updateEngineSound } from "./sfx";
import { useGameStore } from "./store";
import { useSettingsStore } from "./settingsStore";

/**
 * Ses efektlerini oyuna bağlar:
 *  1. TÜM butonlara tek bir yakalayıcı (capture) dinleyiciyle tıklama sesi verir —
 *     yüzlerce butona tek tek prop eklemeye gerek kalmaz.
 *  2. Oyun olaylarını (durak tahsilatı, yükseltme, ceza) dinleyip uygun sesi çalar.
 *
 * `data-sfx` özniteliğiyle bir buton kendi sesini seçebilir; `data-sfx="none"` sesi kapatır.
 */
export function SfxBinder() {
  const sfxEnabled = useSettingsStore((s) => s.sfxEnabled);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const musicVolume = useSettingsStore((s) => s.musicVolume);

  useEffect(() => {
    setSfxEnabled(sfxEnabled);
  }, [sfxEnabled]);

  useEffect(() => {
    setSfxVolume(sfxVolume);
  }, [sfxVolume]);

  // 1) Genel buton tıklaması
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      const control = target?.closest?.("button, [role='button'], a[href]") as HTMLElement | null;
      if (!control || control.hasAttribute("disabled")) return;
      const requested = control.dataset.sfx;
      if (requested === "none") return;
      playSfx(requested === "pop" || requested === "confirm" || requested === "error" ? requested : "click");
    }
    // capture: React handler'ları durdursa bile ses çalsın.
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => window.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, []);

  // 2) Oyun olayları — store aboneliğiyle, render'a dokunmadan.
  useEffect(() => {
    const unsubPayout = useGameStore.subscribe((state, previous) => {
      if (state.stopPayout && state.stopPayout.id !== previous.stopPayout?.id) playSfx("cash");
      if (state.upgradeCelebration && state.upgradeCelebration.id !== previous.upgradeCelebration?.id) {
        playSfx("confirm");
      }
      if (state.policeAlert && state.policeAlert !== previous.policeAlert) playSfx("error");
      if (state.lapReport && !previous.lapReport) playSfx("confirm");
      if (state.terminalUnveil && state.terminalUnveil !== previous.terminalUnveil) playSfx("pop");
    });
    return unsubPayout;
  }, []);

  // 3) Arka plan müziği. Tarayıcı otomatik oynatmayı engellediği için ilk
  //    kullanıcı etkileşiminde başlatılır (AudioContext ancak o zaman açılır).
  useEffect(() => {
    setMusicVolume(musicVolume);
    if (!musicEnabled) {
      setMusicEnabled(false);
      return;
    }
    const start = () => {
      setMusicEnabled(true);
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [musicEnabled, musicVolume]);

  // 4) Motor sesi — hız değiştikçe perdesi değişir.
  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      const drivable = state.vehicleLockSecondsLeft <= 0 && state.policeLevel < 4;
      updateEngineSound(state.currentSpeedKmh, drivable);
    });
    return () => {
      unsubscribe();
      stopEngineSound();
    };
  }, []);

  return null;
}
