"use client";

import { create } from "zustand";

export type GraphicsQuality = "performance" | "balanced" | "quality";
export type MobileControlMode = "joystick" | "buttons";

interface GameSettings {
  graphicsQuality: GraphicsQuality;
  reducedMotion: boolean;
  compactHud: boolean;
  mobileControlMode: MobileControlMode;
  /** Buton/oyun ses efektleri (sfx.ts ile sentezlenir). */
  sfxEnabled: boolean;
  sfxVolume: number;
  /** Sentezlenen sakin arka plan muzigi (sfx.ts). */
  musicEnabled: boolean;
  musicVolume: number;
}

interface SettingsState extends GameSettings {
  hydrated: boolean;
  hydrate: () => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setReducedMotion: (enabled: boolean) => void;
  setCompactHud: (enabled: boolean) => void;
  setMobileControlMode: (mode: MobileControlMode) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setSfxVolume: (volume: number) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  reset: () => void;
}

const STORAGE_KEY = "fullfilled:settings";
const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: "balanced",
  reducedMotion: false,
  compactHud: false,
  mobileControlMode: "joystick",
  sfxEnabled: true,
  sfxVolume: 0.35,
  musicEnabled: true,
  musicVolume: 0.18,
};

function applyDocumentSettings(settings: GameSettings) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
  document.documentElement.dataset.compactHud = String(settings.compactHud);
}

function persist(settings: GameSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preferences must never interrupt gameplay.
  }
  applyDocumentSettings(settings);
}

function read(): GameSettings {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<GameSettings>;
    return {
      graphicsQuality:
        parsed.graphicsQuality === "performance" || parsed.graphicsQuality === "quality"
          ? parsed.graphicsQuality
          : "balanced",
      reducedMotion: parsed.reducedMotion === true,
      compactHud: parsed.compactHud === true,
      mobileControlMode: parsed.mobileControlMode === "buttons" ? "buttons" : "joystick",
      sfxEnabled: parsed.sfxEnabled !== false,
      sfxVolume: typeof parsed.sfxVolume === "number" ? Math.min(1, Math.max(0, parsed.sfxVolume)) : 0.35,
      musicEnabled: parsed.musicEnabled !== false,
      musicVolume: typeof parsed.musicVolume === "number" ? Math.min(1, Math.max(0, parsed.musicVolume)) : 0.18,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: () => {
    const settings = read();
    applyDocumentSettings(settings);
    set({ ...settings, hydrated: true });
  },
  setGraphicsQuality: (graphicsQuality) => {
    const next = { ...pickSettings(get()), graphicsQuality };
    persist(next);
    set({ graphicsQuality });
  },
  setReducedMotion: (reducedMotion) => {
    const next = { ...pickSettings(get()), reducedMotion };
    persist(next);
    set({ reducedMotion });
  },
  setCompactHud: (compactHud) => {
    const next = { ...pickSettings(get()), compactHud };
    persist(next);
    set({ compactHud });
  },
  setMobileControlMode: (mobileControlMode) => {
    const next = { ...pickSettings(get()), mobileControlMode };
    persist(next);
    set({ mobileControlMode });
  },
  setSfxEnabled: (sfxEnabled) => {
    const next = { ...pickSettings(get()), sfxEnabled };
    persist(next);
    set({ sfxEnabled });
  },
  setSfxVolume: (sfxVolume) => {
    const next = { ...pickSettings(get()), sfxVolume };
    persist(next);
    set({ sfxVolume });
  },
  setMusicEnabled: (musicEnabled) => {
    const next = { ...pickSettings(get()), musicEnabled };
    persist(next);
    set({ musicEnabled });
  },
  setMusicVolume: (musicVolume) => {
    const next = { ...pickSettings(get()), musicVolume };
    persist(next);
    set({ musicVolume });
  },
  reset: () => {
    persist(DEFAULT_SETTINGS);
    set(DEFAULT_SETTINGS);
  },
}));

function pickSettings(state: SettingsState): GameSettings {
  return {
    graphicsQuality: state.graphicsQuality,
    reducedMotion: state.reducedMotion,
    compactHud: state.compactHud,
    mobileControlMode: state.mobileControlMode,
    sfxEnabled: state.sfxEnabled,
    sfxVolume: state.sfxVolume,
    musicEnabled: state.musicEnabled,
    musicVolume: state.musicVolume,
  };
}
