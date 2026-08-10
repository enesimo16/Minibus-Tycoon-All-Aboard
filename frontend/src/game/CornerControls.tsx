"use client";

import { useEffect, useState } from "react";
import { sendFeedback } from "./api";
import { useT, useLocaleStore } from "./i18n";
import { getPlayerId } from "./playerId";
import { useGameStore } from "./store";
import { getLastFpsSample, startTelemetry, track } from "./telemetry";
import { pushToast } from "./toastStore";
import { useUiStore } from "./uiStore";

type FeedbackCategory = "bug" | "idea" | "balance";

/**
 * Sol alt kose kumesi: dil degistirici + geri bildirim.
 * ToastHub'in hemen USTUNDE durur; bildirim yigini buyudukce yer degistirmez.
 * Telemetri dongusunu de burada baslatiriz (tek mount noktasi).
 */
export function CornerControls() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const stripMode = useUiStore((s) => s.stripMode);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => startTelemetry(), []);

  if (stripMode) return null;

  return (
    <div className="ff-corner-root pointer-events-none absolute bottom-3 left-[11rem] z-50 flex flex-col items-start gap-2 sm:bottom-4">
      {formOpen && <FeedbackForm onClose={() => setFormOpen(false)} />}
      <div className="ff-corner-actions pointer-events-auto flex gap-1.5">
        <button
          type="button"
          onClick={() => {
            const next = locale === "tr" ? "en" : "tr";
            setLocale(next);
            track("locale_change", { locale: next });
          }}
          title={t("lang.title")}
          className="ff-utility-button h-10 min-h-10 min-w-12 px-3 text-xs font-black"
        >
          {t("lang.switchTo")}
        </button>
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
          aria-controls="ff-feedback-form"
          title={t("feedback.open")}
          className="ff-utility-button h-10 min-h-10 px-3 text-xs font-black"
        >
          <span className="ff-feedback-label">Geri bildirim</span>
          <span className="ff-feedback-short" aria-hidden="true">?</span>
        </button>
      </div>
    </div>
  );
}

function FeedbackForm({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      pushToast({ tone: "warning", messageKey: "feedback.messageRequired" });
      return;
    }
    const playerId = getPlayerId();
    if (!playerId) {
      pushToast({ tone: "danger", messageKey: "feedback.error" });
      return;
    }

    const game = useGameStore.getState();
    const context = {
      money: game.money,
      gameDay: game.gameDay,
      satisfaction: game.satisfaction,
      policeLevel: game.policeLevel,
      fps: getLastFpsSample(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };

    setSending(true);
    try {
      await sendFeedback(playerId, {
        category,
        message: trimmed,
        contextJson: JSON.stringify(context),
      });
      track("feedback_sent", { category });
      pushToast({ tone: "success", messageKey: "feedback.sent" });
      setMessage("");
      onClose();
    } catch (error) {
      console.warn("FullFilled: feedback request failed", error);
      pushToast({ tone: "danger", messageKey: "feedback.error" });
    } finally {
      setSending(false);
    }
  }

  const categories: readonly FeedbackCategory[] = ["bug", "idea", "balance"];

  return (
    <div id="ff-feedback-form" role="dialog" aria-label={t("feedback.title")} className="ff-feedback-form pointer-events-auto w-[min(21rem,calc(100vw-1.5rem))] rounded-xl ff-panel-strong p-3 text-white shadow-2xl">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.13em] text-white/70">
        {t("feedback.title")}
      </div>
      <div className="mb-2 flex gap-1.5">
        {categories.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={`ff-button min-h-8 flex-1 px-2 py-1 text-xs ${
              category === id ? "ff-button-primary" : "ff-button-ghost"
            }`}
          >
            {t(`feedback.category.${id}`)}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={t("feedback.placeholder")}
        rows={4}
        maxLength={4000}
        className="mb-2 w-full resize-none rounded-lg border border-white/12 bg-black/30 px-2.5 py-2 text-sm outline-none focus:border-white/30"
      />
      <p className="mb-2 text-[10px] leading-snug text-white/40">{t("feedback.contextNote")}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="ff-button ff-button-primary min-h-8 flex-1 py-1 text-xs"
        >
          {sending ? t("feedback.sending") : t("feedback.send")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ff-button ff-button-ghost min-h-8 px-3 py-1 text-xs"
        >
          {t("feedback.cancel")}
        </button>
      </div>
    </div>
  );
}
