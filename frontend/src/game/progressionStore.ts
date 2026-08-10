"use client";

import { create } from "zustand";
import type { PlayerBootstrap } from "./api";

interface ProgressionState {
  bootstrap: PlayerBootstrap | null;
  loading: boolean;
  error: string | null;
  setBootstrap: (bootstrap: PlayerBootstrap) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  canUse: (unlockId: string) => boolean;
}

export const useProgressionStore = create<ProgressionState>((set, get) => ({
  bootstrap: null,
  loading: true,
  error: null,
  setBootstrap: (bootstrap) => set({ bootstrap, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  canUse: (unlockId) => get().bootstrap?.unlocks[unlockId]?.available ?? false,
}));

