import { create } from "zustand";
import { pushToast, type ToastTone } from "./toastStore";

// Salt arayuz durumu (oyun mantigi degil) — hangi panelin acik oldugu gibi.
// Bildirimler burada TUTULMAZ: hepsi toastStore'a delege edilir (tek cikis: ToastHub).

export type FeedbackTone = "positive" | "warning" | "negative" | "info";

const FEEDBACK_TONE_TO_TOAST: Record<FeedbackTone, ToastTone> = {
  positive: "success",
  warning: "warning",
  negative: "danger",
  info: "info",
};

export type ManagementTab = "garage" | "drivers" | "upgrades" | "routes" | "city" | "friends";

interface UiState {
  managementOpen: boolean;
  managementTab: ManagementTab;
  openManagementTab: (tab: ManagementTab) => void;
  toggleManagement: () => void;
  closeManagement: () => void;
  chanceGamesOpen: boolean;
  toggleChanceGames: () => void;
  closeChanceGames: () => void;
  profileOpen: boolean;
  toggleProfile: () => void;
  closeProfile: () => void;
  settingsOpen: boolean;
  toggleSettings: () => void;
  closeSettings: () => void;
  /** Sofor idle geliri VEYA ziyaretci kazanci bildirimi — sol alt toast olarak cikar. */
  showMoneyToast: (amount: number, label: string) => void;
  /** Oyun ici geri bildirim (durak, para ustu, olay) — sol alt toast olarak cikar. */
  showFeedback: (tone: FeedbackTone, title: string, message: string) => void;
  /** Serit (taskbar) modu — bkz. docs/game-design/06-sosyal-link-sekme.md. */
  stripMode: boolean;
  toggleStripMode: () => void;
  /** Ucuncu sahis takip kamerasi — C tusuyla acilir/kapanir. */
  chaseMode: boolean;
  toggleChaseMode: () => void;
  routeOverlayVisible: boolean;
  toggleRouteOverlay: () => void;
  selectedRouteId: string;
  selectRouteOverlay: (routeId: string) => void;
  /** Faz 3: Gün Başlat modalı açık mı. */
  dayStartOpen: boolean;
  openDayStart: () => void;
  closeDayStart: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  managementOpen: false,
  managementTab: "garage",
  openManagementTab: (tab) =>
    set({ managementOpen: true, managementTab: tab, chanceGamesOpen: false, profileOpen: false, settingsOpen: false }),
  toggleManagement: () =>
    set((state) => ({
      managementOpen: !state.managementOpen,
      chanceGamesOpen: false,
      profileOpen: false,
      settingsOpen: false,
    })),
  closeManagement: () => set({ managementOpen: false }),
  chanceGamesOpen: false,
  toggleChanceGames: () =>
    set((s) => ({
      chanceGamesOpen: !s.chanceGamesOpen,
      managementOpen: false,
      profileOpen: false,
      settingsOpen: false,
    })),
  closeChanceGames: () => set({ chanceGamesOpen: false }),
  profileOpen: false,
  toggleProfile: () =>
    set((state) => ({
      profileOpen: !state.profileOpen,
      managementOpen: false,
      chanceGamesOpen: false,
      settingsOpen: false,
    })),
  closeProfile: () => set({ profileOpen: false }),
  settingsOpen: false,
  toggleSettings: () =>
    set((state) => ({
      settingsOpen: !state.settingsOpen,
      managementOpen: false,
      chanceGamesOpen: false,
      profileOpen: false,
    })),
  closeSettings: () => set({ settingsOpen: false }),
  showMoneyToast: (amount, label) =>
    pushToast({
      tone: "money",
      messageKey: "money.earned",
      params: { label, amount: amount.toFixed(2) },
      durationMs: 6000,
    }),
  showFeedback: (tone, title, message) =>
    pushToast({ tone: FEEDBACK_TONE_TO_TOAST[tone], title, message }),
  stripMode: false,
  toggleStripMode: () =>
    set((s) => (s.stripMode ? { stripMode: false } : { stripMode: true, managementOpen: false, chanceGamesOpen: false, profileOpen: false, settingsOpen: false })),
  chaseMode: false,
  toggleChaseMode: () => set((s) => ({ chaseMode: !s.chaseMode })),
  routeOverlayVisible: true,
  toggleRouteOverlay: () => set((s) => ({ routeOverlayVisible: !s.routeOverlayVisible })),
  selectedRouteId: "starter-center",
  selectRouteOverlay: (routeId) => set({ selectedRouteId: routeId, routeOverlayVisible: true }),
  dayStartOpen: false,
  openDayStart: () =>
    set({ dayStartOpen: true, managementOpen: false, chanceGamesOpen: false, profileOpen: false, settingsOpen: false }),
  closeDayStart: () => set({ dayStartOpen: false }),
}));
