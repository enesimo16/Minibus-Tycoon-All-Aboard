"use client";

import { useEffect } from "react";
import { AlertIcon, InfoIcon, SmileIcon, UsersIcon } from "./GameIcon";
import { useT } from "./i18n";
import { useToastStore, type Toast, type ToastTone } from "./toastStore";
import { useGameStore } from "./store";

const TONE_STYLES: Record<ToastTone, string> = {
  success: "ff-night-notification",
  warning: "ff-night-notification",
  danger: "ff-night-notification",
  info: "ff-night-notification",
  money: "ff-night-notification",
};

const TONE_ICONS: Record<ToastTone, typeof InfoIcon> = {
  success: SmileIcon,
  warning: UsersIcon,
  danger: AlertIcon,
  info: InfoIcon,
  money: SmileIcon,
};

/** Oyundaki tüm geçici bildirimlerin tek, sağ-alt çıkış noktası. */
export function ToastHub() {
  const toasts = useToastStore((state) => state.toasts);
  const criticalAlertOpen = useGameStore((state) => state.policeLevel >= 4);

  return (
    <div data-critical={criticalAlertOpen} className="ff-toast-stack pointer-events-none absolute z-40 flex w-[min(21rem,calc(100vw-1.5rem))] flex-col items-stretch gap-2">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const t = useT();
  const dismiss = useToastStore((state) => state.dismiss);

  // Giris animasyonu SAF CSS'tir (.ff-feedback-toast). requestAnimationFrame ile
  // yapilmaz: sekme arka plandayken rAF calismaz, bildirim gorunmeden kaybolurdu.
  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.id, toast.durationMs]);

  const Icon = TONE_ICONS[toast.tone];
  const title = toast.titleKey ? t(toast.titleKey, toast.params) : toast.title;
  const message = toast.messageKey ? t(toast.messageKey, toast.params) : toast.message;

  return (
    <button
      type="button"
      onClick={() => dismiss(toast.id)}
      title={t("toast.dismiss")}
      className={`ff-feedback-toast pointer-events-auto grid grid-cols-[34px_1fr] gap-2.5 rounded-xl border px-3 py-2.5 text-left ${
        TONE_STYLES[toast.tone]
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/7 text-white/75">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        {title && (
          <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-white/55">{title}</span>
        )}
        {message && (
          <span className="mt-0.5 block text-sm font-bold leading-snug text-white/90">
            {message}
          </span>
        )}
      </span>
    </button>
  );
}
