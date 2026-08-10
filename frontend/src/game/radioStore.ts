import { create } from "zustand";

export type RadioStatus = "idle" | "loading" | "playing" | "paused" | "error";
export const RADIO_PREFERENCES_KEY = "fullfilled-radio-preferences";

const DEFAULT_RADIO_PREFERENCES = {
  volume: 0.55,
  muted: false,
  selectedStationId: "",
};

function readRadioPreferences() {
  if (typeof window === "undefined") return DEFAULT_RADIO_PREFERENCES;

  try {
    const stored = window.localStorage.getItem(RADIO_PREFERENCES_KEY);
    if (!stored) return DEFAULT_RADIO_PREFERENCES;
    const parsed = JSON.parse(stored) as { volume?: number; muted?: boolean; selectedStationId?: string };
    return {
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(1, parsed.volume))
          : DEFAULT_RADIO_PREFERENCES.volume,
      muted:
        typeof parsed.muted === "boolean"
          ? parsed.muted
          : DEFAULT_RADIO_PREFERENCES.muted,
      selectedStationId: typeof parsed.selectedStationId === "string" ? parsed.selectedStationId : "",
    };
  } catch {
    return DEFAULT_RADIO_PREFERENCES;
  }
}

interface RadioState {
  panelOpen: boolean;
  status: RadioStatus;
  volume: number;
  muted: boolean;
  selectedStationId: string;
  togglePanel: () => void;
  closePanel: () => void;
  setStatus: (status: RadioStatus) => void;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
  selectStation: (stationId: string) => void;
}

const initialRadioPreferences = readRadioPreferences();

export const useRadioStore = create<RadioState>((set) => ({
  panelOpen: false,
  status: "idle",
  volume: initialRadioPreferences.volume,
  muted: initialRadioPreferences.muted,
  selectedStationId: initialRadioPreferences.selectedStationId,
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
  setStatus: (status) => set({ status }),
  setVolume: (volume) =>
    set({
      volume: Math.max(0, Math.min(1, volume)),
      muted: volume <= 0,
    }),
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  selectStation: (selectedStationId) => set({ selectedStationId, status: "idle" }),
}));
