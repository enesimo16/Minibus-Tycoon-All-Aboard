"use client";

import { create } from "zustand";
import type { TranslationParams } from "./i18n";

export type ToastTone = "info" | "success" | "warning" | "danger" | "money";

export interface Toast {
  id: number;
  tone: ToastTone;
  /** i18n anahtari (tercih edilen) */
  titleKey?: string;
  messageKey?: string;
  /** Ham metin — henuz i18n'e tasinmamis cagrilar icin (bkz. store.ts showFeedback). */
  title?: string;
  message?: string;
  params?: TranslationParams;
  durationMs: number;
}

export type ToastInput = Omit<Toast, "id" | "durationMs"> & { durationMs?: number };

/** Ayni anda gorunen en fazla bildirim; fazlasi en eskiden dusurulur. */
const MAX_VISIBLE_TOASTS = 4;
const DEFAULT_DURATION_MS = 4200;

interface ToastState {
  toasts: Toast[];
  push: (input: ToastInput) => void;
  dismiss: (id: number) => void;
  clear: () => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (input) =>
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-(MAX_VISIBLE_TOASTS - 1)),
        { ...input, id: nextToastId++, durationMs: input.durationMs ?? DEFAULT_DURATION_MS },
      ],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** React disindan da cagrilabilir (store.ts, AutoSave vb.). */
export function pushToast(input: ToastInput): void {
  useToastStore.getState().push(input);
}
