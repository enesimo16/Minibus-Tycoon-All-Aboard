import { create } from "zustand";

// Faz 8 — parçalı ve bağlamsal tutorial. Eski tek-akışlı 21 adımlık tur, küçük paketlere
// ayrıldı (bkz. TutorialOverlay.tsx > TUTORIAL_PACKAGES). "core" paketi yeni hesapta zorunlu
// ilk turdur (bu, yerel `required` bayrağıyla belirlenir — hesap oluşturma anının kendisi
// backend otoritesi gerektirmez). Paket tamamlanma/atlama durumu ise backend'de oyuncu
// bazında kalıcıdır (bkz. store.ts > getSnapshot/loadSnapshot, GameSnapshot.tutorialStatus).

const REQUIRED_KEY_PREFIX = "minibus-tutorial-required:";

export type TutorialPackageStatus = "completed" | "skipped";

interface TutorialState {
  active: boolean;
  activePackage: string | null;
  stepIndex: number;
  playerId: string | null;
  /** Paket id -> "completed"/"skipped". Sunucudan yüklenir, store.ts kaydederken okunur. */
  packageStatus: Record<string, TutorialPackageStatus>;
  initialize: (playerId: string) => void;
  hydrateFromServer: (status: Record<string, string>) => void;
  /** Zaten tamamlanmış/atlanmış bir paketi veya aktif paket varken yeni paketi görmezden gelir. */
  activatePackage: (id: string, stepCount: number) => void;
  next: (stepCount: number) => void;
  previous: () => void;
  skip: () => void;
  complete: () => void;
}

function requiredKey(playerId: string) {
  return `${REQUIRED_KEY_PREFIX}${playerId}`;
}

export function markTutorialRequired(playerId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(requiredKey(playerId), "1");
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  active: false,
  activePackage: null,
  stepIndex: 0,
  playerId: null,
  packageStatus: {},
  initialize: (playerId) => {
    const required = window.localStorage.getItem(requiredKey(playerId)) === "1";
    set({ playerId });
    if (required && !get().packageStatus.core) {
      window.localStorage.removeItem(requiredKey(playerId));
      set({ active: true, activePackage: "core", stepIndex: 0 });
    }
  },
  hydrateFromServer: (status) => {
    set({ packageStatus: status as Record<string, TutorialPackageStatus> });
  },
  activatePackage: (id, stepCount) => {
    const state = get();
    if (state.active || state.packageStatus[id]) return;
    if (stepCount <= 0) return;
    set({ active: true, activePackage: id, stepIndex: 0 });
  },
  next: (stepCount) => {
    const nextIndex = get().stepIndex + 1;
    if (nextIndex >= stepCount) {
      get().complete();
      return;
    }
    set({ stepIndex: nextIndex });
  },
  previous: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),
  skip: () => {
    const { activePackage } = get();
    set((state) => ({
      active: false,
      activePackage: null,
      stepIndex: 0,
      packageStatus: activePackage ? { ...state.packageStatus, [activePackage]: "skipped" } : state.packageStatus,
    }));
  },
  complete: () => {
    const { activePackage } = get();
    set((state) => ({
      active: false,
      activePackage: null,
      stepIndex: 0,
      packageStatus: activePackage ? { ...state.packageStatus, [activePackage]: "completed" } : state.packageStatus,
    }));
  },
}));
