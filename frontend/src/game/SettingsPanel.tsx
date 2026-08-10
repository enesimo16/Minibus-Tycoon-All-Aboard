"use client";

import { useEffect, useState, type ReactNode } from "react";
import { resetGame } from "./api";
import { clearLocalPlayerData, getPlayerId } from "./playerId";
import { CameraIcon, RadioIcon, RouteIcon, SettingsIcon, XIcon } from "./GameIcon";
import { useLocaleStore, useT } from "./i18n";
import { useRadioStore } from "./radioStore";
import { useSettingsStore, type GraphicsQuality } from "./settingsStore";
import { useUiStore } from "./uiStore";

export function SettingsHydrator() {
  const hydrate = useSettingsStore((state) => state.hydrate);
  useEffect(() => hydrate(), [hydrate]);
  return null;
}

export function SettingsPanel() {
  const open = useUiStore((state) => state.settingsOpen);
  const close = useUiStore((state) => state.closeSettings);
  const chaseMode = useUiStore((state) => state.chaseMode);
  const toggleChaseMode = useUiStore((state) => state.toggleChaseMode);
  const routeVisible = useUiStore((state) => state.routeOverlayVisible);
  const toggleRoute = useUiStore((state) => state.toggleRouteOverlay);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const volume = useRadioStore((state) => state.volume);
  const muted = useRadioStore((state) => state.muted);
  const setVolume = useRadioStore((state) => state.setVolume);
  const toggleMuted = useRadioStore((state) => state.toggleMuted);
  const quality = useSettingsStore((state) => state.graphicsQuality);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const compactHud = useSettingsStore((state) => state.compactHud);
  const mobileControlMode = useSettingsStore((state) => state.mobileControlMode);
  const setQuality = useSettingsStore((state) => state.setGraphicsQuality);
  const setReducedMotion = useSettingsStore((state) => state.setReducedMotion);
  const setCompactHud = useSettingsStore((state) => state.setCompactHud);
  const setMobileControlMode = useSettingsStore((state) => state.setMobileControlMode);
  const sfxEnabled = useSettingsStore((state) => state.sfxEnabled);
  const sfxVolume = useSettingsStore((state) => state.sfxVolume);
  const setSfxEnabled = useSettingsStore((state) => state.setSfxEnabled);
  const setSfxVolume = useSettingsStore((state) => state.setSfxVolume);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const musicVolume = useSettingsStore((state) => state.musicVolume);
  const setMusicEnabled = useSettingsStore((state) => state.setMusicEnabled);
  const setMusicVolume = useSettingsStore((state) => state.setMusicVolume);
  const reset = useSettingsStore((state) => state.reset);
  const [resetState, setResetState] = useState<"idle" | "confirm" | "working" | "error">("idle");
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  if (!open) return null;

  const qualities: GraphicsQuality[] = ["performance", "balanced", "quality"];

  const resetAllSettings = () => {
    reset();
    setVolume(0.55);
    if (chaseMode) toggleChaseMode();
    if (!routeVisible) toggleRoute();
    setLocale("tr");
  };

  /**
   * Oyunu sıfırdan başlatır: sunucudaki ilerleme silinir (hesap kalır), bu cihazdaki
   * yerel kayıt/profil/tutorial anahtarları temizlenir ve sayfa yeniden yüklenir —
   * böylece şirket kurma akışı baştan çalışır.
   */
  const resetGameProgress = async () => {
    const playerId = getPlayerId();
    if (!playerId) return;
    setResetState("working");
    try {
      await resetGame(playerId);
    } catch {
      setResetState("error");
      return;
    }
    clearLocalPlayerData(playerId);
    window.location.reload();
  };

  return (
    <div className="ff-settings-overlay" role="dialog" aria-modal="true" aria-label={t("settings.title")}>
      <button className="absolute inset-0 cursor-default" onClick={close} aria-label={t("settings.close")} />
      <section className="ff-settings-panel">
        <header className="ff-settings-header">
          <span className="ff-settings-mark"><SettingsIcon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="ff-stop-kicker">{t("settings.game")}</p>
            <h2 className="ff-display text-xl">{t("settings.title")}</h2>
          </div>
          <button onClick={close} className="ff-button h-10 min-h-10 w-10 p-0" aria-label={t("settings.close")}><XIcon className="h-4 w-4" /></button>
        </header>

        <div className="ff-settings-content">
          <SettingsSection title={t("settings.graphics")} icon={<SettingsIcon className="h-4 w-4" />}>
            <div className="ff-segmented-control">
              {qualities.map((value) => (
                <button key={value} type="button" data-active={quality === value} onClick={() => setQuality(value)}>
                  {t(`settings.quality.${value}`)}
                </button>
              ))}
            </div>
            <SettingToggle label={t("settings.reducedMotion")} hint={t("settings.reducedMotionHint")} checked={reducedMotion} onChange={setReducedMotion} />
            <SettingToggle label={t("settings.compactHud")} hint={t("settings.compactHudHint")} checked={compactHud} onChange={setCompactHud} />
          </SettingsSection>

          <SettingsSection title={t("settings.gameplay")} icon={<CameraIcon className="h-4 w-4" />}>
            <SettingToggle label={t("settings.followCamera")} hint={t("settings.followCameraHint")} checked={chaseMode} onChange={() => toggleChaseMode()} />
            <SettingToggle label={t("settings.routeOverlay")} hint={t("settings.routeOverlayHint")} checked={routeVisible} onChange={() => toggleRoute()} icon={<RouteIcon className="h-4 w-4" />} />
            <div className="ff-setting-row ff-mobile-control-setting">
              <div><strong>{t("settings.mobileControls")}</strong><small>{t("settings.mobileControlsHint")}</small></div>
            </div>
            <div className="ff-segmented-control ff-mobile-control-setting">
              <button type="button" data-active={mobileControlMode === "joystick"} onClick={() => setMobileControlMode("joystick")}>{t("settings.controlJoystick")}</button>
              <button type="button" data-active={mobileControlMode === "buttons"} onClick={() => setMobileControlMode("buttons")}>{t("settings.controlButtons")}</button>
            </div>
          </SettingsSection>

          <SettingsSection title={t("settings.audio")} icon={<RadioIcon className="h-4 w-4" />}>
            <div className="ff-setting-row">
              <div><strong>{t("settings.radioVolume")}</strong><small>{t("settings.radioVolumeHint")}</small></div>
              <output>{muted ? 0 : Math.round(volume * 100)}%</output>
            </div>
            <input aria-label={t("settings.radioVolume")} type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} className="ff-settings-range" />
            <SettingToggle label={t("settings.muteRadio")} checked={muted} onChange={() => toggleMuted()} />
          </SettingsSection>

          <SettingsSection title={t("settings.language")} icon={<span className="text-xs font-black">TR</span>}>
            <div className="ff-segmented-control">
              <button type="button" data-active={locale === "tr"} onClick={() => setLocale("tr")}>Türkçe</button>
              <button type="button" data-active={locale === "en"} onClick={() => setLocale("en")}>English</button>
            </div>
          </SettingsSection>

          <SettingsSection title={t("settings.sfx")} icon={<span className="text-xs font-black">♪</span>}>
            <SettingToggle
              label={t("settings.sfxEnabled")}
              hint={t("settings.sfxEnabledHint")}
              checked={sfxEnabled}
              onChange={setSfxEnabled}
            />
            <div className="ff-setting-row">
              <div><strong>{t("settings.sfxVolume")}</strong><small>{t("settings.sfxVolumeHint")}</small></div>
              <output>{sfxEnabled ? Math.round(sfxVolume * 100) : 0}%</output>
            </div>
            <SettingToggle
              label={t("settings.music")}
              hint={t("settings.musicHint")}
              checked={musicEnabled}
              onChange={setMusicEnabled}
            />
            <div className="ff-setting-row">
              <div><strong>{t("settings.musicVolume")}</strong></div>
              <output>{musicEnabled ? Math.round(musicVolume * 100) : 0}%</output>
            </div>
            <input
              aria-label={t("settings.musicVolume")}
              type="range" min="0" max="1" step="0.05"
              value={musicEnabled ? musicVolume : 0}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
              className="ff-settings-range"
            />
            <input
              aria-label={t("settings.sfxVolume")}
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxEnabled ? sfxVolume : 0}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
              className="ff-settings-range"
            />
          </SettingsSection>

          {/* Tehlikeli bölge: geri alınamaz olduğu için iki adımlı onay ister. */}
          <SettingsSection title={t("settings.dangerZone")} icon={<span className="text-xs font-black">!</span>}>
            <p className="ff-settings-danger-hint">{t("settings.resetGameHint")}</p>
            {resetState === "idle" && (
              <button
                type="button"
                className="ff-button ff-button-red w-full text-xs"
                onClick={() => setResetState("confirm")}
              >
                {t("settings.resetGame")}
              </button>
            )}
            {resetState === "confirm" && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="ff-button ff-button-ghost text-xs" onClick={() => setResetState("idle")}>
                  {t("day.cancel")}
                </button>
                <button type="button" className="ff-button ff-button-red text-xs" onClick={resetGameProgress}>
                  {t("settings.resetGameConfirm")}
                </button>
              </div>
            )}
            {resetState === "working" && (
              <p className="ff-settings-danger-hint">{t("settings.resetGameWorking")}</p>
            )}
            {resetState === "error" && (
              <>
                <p className="ff-settings-danger-hint">{t("settings.resetGameError")}</p>
                <button type="button" className="ff-button ff-button-ghost w-full text-xs" onClick={() => setResetState("idle")}>
                  {t("day.cancel")}
                </button>
              </>
            )}
          </SettingsSection>
        </div>

        <footer className="ff-settings-footer">
          <p>{t("settings.saved")}</p>
          <button type="button" className="ff-button ff-button-ghost text-xs" onClick={resetAllSettings}>{t("settings.reset")}</button>
        </footer>
      </section>
    </div>
  );
}

function SettingsSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="ff-settings-section"><h3><span>{icon}</span>{title}</h3><div className="ff-settings-section-body">{children}</div></section>;
}

function SettingToggle({ label, hint, checked, onChange, icon }: { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void; icon?: ReactNode }) {
  return (
    <label className="ff-setting-row">
      <span className="flex items-center gap-2">{icon}<span><strong>{label}</strong>{hint && <small>{hint}</small>}</span></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
