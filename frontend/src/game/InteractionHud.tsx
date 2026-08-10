"use client";

import { useEffect } from "react";
import { useGameStore } from "./store";
import { useUiStore } from "./uiStore";
import { ECONOMY } from "./economy";
import { useT } from "./i18n";
import { dispatchGameAction } from "./useTabSync";
import { UsersIcon } from "./GameIcon";

// Duraktaki üç mikro-etkileşim: doluluk riski, öğrenci indirimi, para üstü.
// Bkz. docs/game-design/03-surus-mekanigi.md — "Doluluk riski" ve "Çeşni olayları".
// Şerit modunda bottom-11 üstüne kompakt yatay satır gösterilir.
export function InteractionHud() {
  const interaction = useGameStore((s) => s.interaction);
  const driverActive = useGameStore((s) => s.driverActive);
  const stripMode = useUiStore((s) => s.stripMode);
  const t = useT();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const type = useGameStore.getState().interaction.type;
      if (type === "overflow") {
        if (e.key === "1") dispatchGameAction("resolveOverflow", true);
        if (e.key === "2") dispatchGameAction("resolveOverflow", false);
      } else if (type === "student") {
        if (e.key === "1") dispatchGameAction("resolveStudent", true);
        if (e.key === "2") dispatchGameAction("resolveStudent", false);
        if (e.key === "3") dispatchGameAction("resolveStudentFree");
      } else if (type === "change") {
        if (e.key === "1") dispatchGameAction("resolveChange", "short");
        if (e.key === "2") dispatchGameAction("resolveChange", "exact");
        if (e.key === "3") dispatchGameAction("resolveChange", "generous");
      } else if (type === "offroute") {
        if (e.key === "1") dispatchGameAction("resolveOffRoute", true);
        if (e.key === "2") dispatchGameAction("resolveOffRoute", false);
      } else if (type === "dropoffStop") {
        if (e.key === "1") dispatchGameAction("resolveDropoffStop", true);
        if (e.key === "2") dispatchGameAction("resolveDropoffStop", false);
      } else if (type === "dropoffRoadside") {
        if (e.key === "1") dispatchGameAction("resolveDropoffRoadside", true);
        if (e.key === "2") dispatchGameAction("resolveDropoffRoadside", false);
        if (e.key === "3") dispatchGameAction("deferRoadsideDropoff");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!interaction.type || driverActive) return null;

  if (stripMode) {
    return <StripInteraction />;
  }

  // Replik havuzdan secilir (store: pickPassengerLine). lineKey yoksa — eski
  // kayittan gelen olay olabilir — ilgili kategorinin ilk repligine duseriz.
  const line = (fallbackKey: string) =>
    t(interaction.lineKey ?? fallbackKey, {
      fare: ECONOMY.fare.student,
      bill: interaction.billAmount ?? 0,
      tip: ECONOMY.dropoff.roadsideTipAmount,
      min: ECONOMY.offRoute.fareMultiplierMin,
      max: ECONOMY.offRoute.fareMultiplierMax,
      seconds: interaction.secondsLeft.toFixed(1),
    });

  return (
    <div className="ff-passenger-hud pointer-events-none absolute inset-x-3 bottom-[max(5.25rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-2 sm:inset-x-0 sm:bottom-16 sm:px-4">
      {interaction.type === "overflow" && (
        <>
          <PromptCard tone="green">{line("pline.overflow.1")}</PromptCard>
          <div className="grid w-full max-w-sm grid-cols-2 gap-2 sm:flex sm:w-auto sm:max-w-none">
            <ActionBtn color="green" onClick={() => dispatchGameAction("resolveOverflow", true)} label="AL" hint="1" />
            <ActionBtn color="red" onClick={() => dispatchGameAction("resolveOverflow", false)} label="ALMA" hint="2" />
          </div>
        </>
      )}

      {interaction.type === "student" && (
        <>
          <PromptCard tone="blue">{line("pline.student.1")}</PromptCard>
          <div className="grid w-full max-w-xl grid-cols-3 gap-2">
            <ActionBtn color="green" onClick={() => dispatchGameAction("resolveStudent", true)} label="KABUL ET" hint="1" />
            <ActionBtn color="red" onClick={() => dispatchGameAction("resolveStudent", false)} label="TAM ÜCRET" hint="2" />
            <ActionBtn color="amber" onClick={() => dispatchGameAction("resolveStudentFree")} label="ÜCRETSİZ" hint="3" />
          </div>
        </>
      )}

      {interaction.type === "change" && (
        <>
          <PromptCard tone="amber">{line("pline.change.1")}</PromptCard>
          {/* Üç tutar da açıkça yazılır: oyuncu ne kadar kazandığını/kaybettiğini görerek seçer. */}
          <div className="grid w-full max-w-xl grid-cols-3 gap-2">
            <ChangeBtn
              tone="red"
              amount={interaction.shortChange ?? 0}
              label={t("change.short")}
              delta={`+₺${Math.round((interaction.correctChange ?? 0) - (interaction.shortChange ?? 0))}`}
              deltaClass=""
              onClick={() => dispatchGameAction("resolveChange", "short")}
              hint="1"
            />
            <ChangeBtn
              tone="white"
              amount={interaction.correctChange ?? 0}
              label={t("change.exact")}
              delta={t("change.exactDelta")}
              deltaClass=""
              onClick={() => dispatchGameAction("resolveChange", "exact")}
              hint="2"
            />
            <ChangeBtn
              tone="green"
              amount={interaction.generousChange ?? 0}
              label={t("change.generous")}
              delta={`−₺${Math.round((interaction.generousChange ?? 0) - (interaction.correctChange ?? 0))}`}
              deltaClass=""
              onClick={() => dispatchGameAction("resolveChange", "generous")}
              hint="3"
            />
          </div>
        </>
      )}

      {interaction.type === "offroute" && (
        <>
          <PromptCard tone="red">{line("pline.offroute.1")}</PromptCard>
          <div className="grid w-full max-w-sm grid-cols-2 gap-2 sm:flex sm:w-auto sm:max-w-none">
            <ActionBtn color="amber" onClick={() => dispatchGameAction("resolveOffRoute", true)} label="KABUL" hint="1" />
            <ActionBtn color="red" onClick={() => dispatchGameAction("resolveOffRoute", false)} label="RET" hint="2" />
          </div>
        </>
      )}

      {interaction.type === "dropoffStop" && (
        <>
          <PromptCard tone="blue">{line("pline.dropoffStop.1")}</PromptCard>
          <div className="grid w-full max-w-sm grid-cols-2 gap-2 sm:flex sm:w-auto sm:max-w-none">
            <ActionBtn color="green" onClick={() => dispatchGameAction("resolveDropoffStop", true)} label="TAMAM" hint="1" />
            <ActionBtn color="red" onClick={() => dispatchGameAction("resolveDropoffStop", false)} label="HAYIR" hint="2" />
          </div>
        </>
      )}

      {interaction.type === "dropoffRoadside" && (
        <>
          <PromptCard tone="green">{line("pline.dropoffRoadside.1")}</PromptCard>
          <div className="grid w-full max-w-xl grid-cols-3 gap-2">
            <ActionBtn color="green" onClick={() => dispatchGameAction("resolveDropoffRoadside", true)} label="DURDUR" hint="1" />
            <ActionBtn color="red" onClick={() => dispatchGameAction("resolveDropoffRoadside", false)} label="HAYIR" hint="2" />
            <ActionBtn color="amber" onClick={() => dispatchGameAction("deferRoadsideDropoff")} label="SONRAKİ DURAK" hint="3" />
          </div>
        </>
      )}
    </div>
  );
}

// Şerit modunda tek satır: mesaj + kompakt butonlar
function StripInteraction() {
  const interaction = useGameStore((s) => s.interaction);

  type Config = {
    msg: string;
    btn1: { label: string; action: () => void; color: "green" | "red" | "amber" };
    btn2?: { label: string; action: () => void; color: "green" | "red" | "amber" };
    extraBtns?: { label: string; action: () => void }[];
  };

  let cfg: Config | null = null;

  if (interaction.type === "overflow") {
    cfg = {
      msg: "1 kişilik yer var mı?",
      btn1: { label: "AL", action: () => dispatchGameAction("resolveOverflow", true), color: "green" },
      btn2: { label: "ALMA", action: () => dispatchGameAction("resolveOverflow", false), color: "red" },
    };
  } else if (interaction.type === "student") {
    cfg = {
      msg: `Öğrenci indirimi? ₺${ECONOMY.fare.student}`,
      btn1: { label: "KABUL", action: () => dispatchGameAction("resolveStudent", true), color: "green" },
      btn2: { label: "TAM", action: () => dispatchGameAction("resolveStudent", false), color: "red" },
    };
  } else if (interaction.type === "change") {
    cfg = {
      msg: `₺${interaction.billAmount} verdi · üstü? (${interaction.secondsLeft.toFixed(1)}s)`,
      btn1: {
        label: `₺${Math.round(interaction.shortChange ?? 0)}`,
        action: () => dispatchGameAction("resolveChange", "short"),
        color: "red",
      },
      btn2: {
        label: `₺${Math.round(interaction.correctChange ?? 0)}`,
        action: () => dispatchGameAction("resolveChange", "exact"),
        color: "green",
      },
      extraBtns: [
        {
          label: `₺${Math.round(interaction.generousChange ?? 0)}`,
          action: () => dispatchGameAction("resolveChange", "generous"),
        },
      ],
    };
  } else if (interaction.type === "offroute") {
    cfg = {
      msg: `Hat dışı ${ECONOMY.offRoute.fareMultiplierMin}-${ECONOMY.offRoute.fareMultiplierMax}x? (${interaction.secondsLeft.toFixed(1)}s)`,
      btn1: { label: "KABUL", action: () => dispatchGameAction("resolveOffRoute", true), color: "amber" },
      btn2: { label: "RET", action: () => dispatchGameAction("resolveOffRoute", false), color: "red" },
    };
  } else if (interaction.type === "dropoffStop") {
    cfg = {
      msg: `Durakta inecek (${interaction.secondsLeft.toFixed(1)}s)`,
      btn1: { label: "TAMAM", action: () => dispatchGameAction("resolveDropoffStop", true), color: "green" },
      btn2: { label: "HAYIR", action: () => dispatchGameAction("resolveDropoffStop", false), color: "red" },
    };
  } else if (interaction.type === "dropoffRoadside") {
    cfg = {
      msg: `Müsait yerde iniş +₺${ECONOMY.dropoff.roadsideTipAmount} (${interaction.secondsLeft.toFixed(1)}s)`,
      btn1: { label: "DURDUR", action: () => dispatchGameAction("resolveDropoffRoadside", true), color: "green" },
      btn2: { label: "HAYIR", action: () => dispatchGameAction("resolveDropoffRoadside", false), color: "red" },
    };
  }

  if (!cfg) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-11 flex items-center justify-center gap-2 py-1">
      <span className="max-w-[200px] truncate rounded-full bg-black/65 px-3 py-0.5 text-xs text-white">
        {cfg.msg}
      </span>
      <StripBtn color={cfg.btn1.color} onClick={cfg.btn1.action} label={cfg.btn1.label} />
      {cfg.btn2 && <StripBtn color={cfg.btn2.color} onClick={cfg.btn2.action} label={cfg.btn2.label} />}
      {cfg.extraBtns?.map((b) => (
        <StripBtn key={b.label} color="amber" onClick={b.action} label={b.label} />
      ))}
    </div>
  );
}

function StripBtn({
  color,
  onClick,
  label,
}: {
  color: "green" | "red" | "amber";
  onClick: () => void;
  label: string;
}) {
  const bg =
    color === "green" ? "ff-button-green"
    : color === "red" ? "ff-button-red"
    : "ff-button-amber";
  return (
    <button
      onClick={onClick}
      className={`ff-button pointer-events-auto min-h-7 ${bg} px-4 py-1 text-xs`}
    >
      {label}
    </button>
  );
}

/** Para üstü seçeneği: üstte verilecek tutar, altında ne anlama geldiği ve cebe etkisi. */
function ChangeBtn({
  tone,
  amount,
  label,
  delta,
  deltaClass,
  onClick,
  hint,
}: {
  tone: "red" | "white" | "green";
  amount: number;
  label: string;
  delta: string;
  deltaClass: string;
  onClick: () => void;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      data-tone={tone}
      className="ff-choice-button ff-change-button pointer-events-auto min-h-16 min-w-0 px-2"
    >
      <span className="ff-change-amount">₺{Math.round(amount)}</span>
      <span className="ff-change-label">{label}</span>
      <span className={`ff-change-delta ${deltaClass}`}>{delta}</span>
      <kbd className="ff-keycap mx-auto mt-0.5">{hint}</kbd>
    </button>
  );
}

function ActionBtn({
  color,
  onClick,
  label,
  hint,
}: {
  color: "green" | "red" | "amber";
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      data-tone={color}
      className="ff-choice-button pointer-events-auto min-h-12 min-w-0 px-3 py-2 sm:min-w-28 sm:px-5"
    >
      <span className="text-sm font-black sm:text-base">{label}</span>
      <kbd className="ff-keycap">{hint}</kbd>
    </button>
  );
}

function PromptCard({
  tone,
  children,
}: {
  tone: "green" | "red" | "amber" | "blue";
  children: React.ReactNode;
}) {
  return (
    <div data-tone={tone} className="ff-prompt-card pointer-events-none w-full max-w-xl">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/42">
        <UsersIcon className="h-3.5 w-3.5" />
        Yolcu isteği
      </div>
      <div className="mt-1 text-sm font-bold leading-snug text-white/92 sm:text-[15px]">{children}</div>
    </div>
  );
}
