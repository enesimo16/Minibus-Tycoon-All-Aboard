"use client";

import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { ECONOMY } from "./economy";
import {
  AlertIcon,
  CameraIcon,
  ClockIcon,
  CoinsIcon,
  DiceIcon,
  RadioIcon,
  RouteIcon,
  SmileIcon,
  StopIcon,
  TargetIcon,
  UsersIcon,
  WrenchIcon,
  XIcon,
} from "./GameIcon";
import { GameLogo } from "./GameLogo";
import { formatGameTime, getTariffInfo, isNightTime, useGameStore } from "./store";
import type { ActiveContract, ContractOffer } from "./contracts";
import { useUiStore } from "./uiStore";
import { dispatchGameAction } from "./useTabSync";
import { useRadioStore } from "./radioStore";
import { useLocaleStore, useT } from "./i18n";
import { useProgressionStore } from "./progressionStore";
import { pushToast } from "./toastStore";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export function TopNav() {
  const stripMode = useUiStore((s) => s.stripMode);
  if (stripMode) return null;

  return (
    <nav className="ff-hud-bar font-sans">
      <Stats />
      {/* Logo normal HUD akışında iki panelin arasındadır; sahnenin geometrik merkezine
          sabitlenmez ve iki taraftaki içerik genişledikçe onlarla birlikte yer değiştirir. */}
      <div className="ff-hud-logo-slot">
        <GameLogo />
      </div>
      <Actions />
      <StatusRail />
    </nav>
  );
}

function Stats() {
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const money = useGameStore((s) => s.money);
  const dailyEarnings = useGameStore((s) => s.dailyEarnings);
  const passengers = useGameStore((s) => s.passengersOnBoard);
  const nextStopDropoffs = useGameStore((s) => s.nextStopDropoffs);
  const capacity = useGameStore((s) => s.seatCapacity);
  const satisfaction = useGameStore((s) => s.satisfaction);
  const gameTimeMinutes = useGameStore((s) => s.gameTimeMinutes);
  const gameDay = useGameStore((s) => s.gameDay);
  const level = useProgressionStore((s) => s.bootstrap?.progression.level ?? 1);

  const night = isNightTime(gameTimeMinutes);
  const timeStr = formatGameTime(gameTimeMinutes);

  return (
    <div className="ff-hud-stats" data-tutorial="hud-stats">
        <StatPill icon={TargetIcon} label={t("hud.day")} value={String(gameDay)} tone="gold" className="ff-stat-day" />
        <StatPill icon={TargetIcon} label={t("progression.level")} value={String(level)} tone="green" className="ff-stat-level" />
        <StatPill icon={ClockIcon} label={night ? t("hud.night") : t("hud.time")} value={timeStr} tone={night ? "blue" : "gold"} className="ff-stat-time" />
        <StatPill icon={CoinsIcon} label={t("hud.cash")} value={formatMoneyCompact(money, locale)} fullValue={`₺${money.toFixed(0)}`} tone="gold" className="ff-stat-cash" />
        <StatPill icon={TargetIcon} label={t("hud.today")} value={formatMoneyCompact(dailyEarnings, locale)} fullValue={`₺${dailyEarnings.toFixed(0)}`} />
        <StatPill icon={UsersIcon} label={t("hud.passengers")} value={`${passengers}/${capacity}`} />
        <StatPill
          icon={StopIcon}
          label={t("hud.nextStop")}
          value={t("hud.gettingOff", { count: nextStopDropoffs })}
          tone="green"
          className="ff-stat-next-stop"
        />
        <StatPill
          icon={SmileIcon}
          label={t("hud.satisfaction")}
          value={`${Math.round(satisfaction)}%`}
          tone={satisfaction < 35 ? "red" : satisfaction > 75 ? "green" : "blue"}
          className="ff-stat-satisfaction"
        />

    </div>
  );
}

function StatusRail() {
  const t = useT();
  const policeLevel = useGameStore((state) => state.policeLevel);
  const suspensionMinutesLeft = useGameStore((state) => state.suspensionMinutesLeft);
  const stopDropoffPromised = useGameStore((state) => state.stopDropoffPromised);
  const isLeader = useGameStore((state) => state.isLeader);
  const gameTimeMinutes = useGameStore((state) => state.gameTimeMinutes);
  const tariff = getTariffInfo(gameTimeMinutes);
  const hasTariff = tariff.multiplier !== 1;
  const realSuspension = Math.ceil(suspensionMinutesLeft / ECONOMY.time.gameMinutesPerRealSecond);

  if (!hasTariff && policeLevel === 0 && !stopDropoffPromised && isLeader) return null;

  return (
    <div className="ff-status-rail">
      {hasTariff && <TariffSection />}
      {policeLevel > 0 && policeLevel < 4 && (
        <StatusPill tone={policeLevel >= 3 ? "red" : "gold"}>
          <AlertIcon className="h-4 w-4" />
          {policeLevel >= 3
            ? t("hud.suspended", { seconds: realSuspension > 0 ? ` ${realSuspension}s` : "" })
            : t("hud.fines", { count: policeLevel })}
        </StatusPill>
      )}
      {stopDropoffPromised && (
        <StatusPill tone="blue" pulse><StopIcon className="h-4 w-4" />{t("hud.stopRequested")}</StatusPill>
      )}
      {!isLeader && <StatusPill tone="gold">{t("hud.spectator")}</StatusPill>}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  fullValue,
  tone = "default",
  className = "",
}: {
  icon: IconComponent;
  label: string;
  value: string;
  fullValue?: string;
  tone?: "default" | "gold" | "green" | "red" | "blue";
  className?: string;
}) {
  const toneClass = toneColor(tone);
  return (
    <span className={`ff-stat-chip ${className}`} title={fullValue ?? value}>
      <span className={`ff-stat-icon flex h-7 w-7 shrink-0 items-center justify-center ${toneBg(tone)} ${toneClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="ff-stat-label block truncate">{label}</span>
        <span className={`ff-stat-value ff-display block truncate tabular-nums ${toneClass}`}>{value}</span>
      </span>
    </span>
  );
}

function StatusPill({
  children,
  tone,
  pulse = false,
  className = "",
}: {
  children: ReactNode;
  tone: "gold" | "green" | "red" | "blue";
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span data-tone={tone} className={`ff-pill ff-status-pill shrink-0 text-sm font-black ${toneColor(tone)} ${pulse ? "animate-pulse" : ""} ${className}`}>
      {children}
    </span>
  );
}

function TariffSection() {
  const t = useT();
  const gameTimeMinutes = useGameStore((s) => s.gameTimeMinutes);
  const [open, setOpen] = useState(false);

  const tariff = getTariffInfo(gameTimeMinutes);
  const isPeak = tariff.multiplier > 1.0;
  const isNightRate = tariff.multiplier < 1.0;
  const isSpecial = isPeak || isNightRate;

  if (!isSpecial) return null;

  const fullFare = (ECONOMY.fare.full * tariff.multiplier).toFixed(1);
  const studentFare = (ECONOMY.fare.student * tariff.multiplier).toFixed(1);
  const elderlyFare = (ECONOMY.fare.student * tariff.multiplier * 0.9).toFixed(1);

  return (
    <div className="pointer-events-auto relative flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`ff-pill ff-tariff-pill cursor-pointer text-sm font-black transition ${isPeak ? "text-amber-200" : "text-sky-200"}`}
        title={t("hud.tariffDetails")}
      >
        <ClockIcon className="h-4 w-4" />
        {tariff.label} x{tariff.multiplier.toFixed(2)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 top-24 z-50 max-h-[min(420px,calc(100dvh-7rem))] overflow-y-auto rounded-xl ff-panel-strong ff-scroll p-4 text-white shadow-xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:min-w-56">
            <div className="mb-3 ff-section-title">{t("hud.tariffPrices", { label: tariff.label })}</div>
            <FareRow label={t("hud.fullFare")} value={fullFare} tone="gold" />
            <FareRow label={t("hud.studentFare")} value={studentFare} tone="blue" />
            <FareRow label={t("hud.seniorFare")} value={elderlyFare} tone="green" />
            <div className={`mt-3 rounded-md px-3 py-2 text-xs font-bold ${tariff.satDelta < 0 ? "bg-red-500/15 text-red-200" : "bg-emerald-500/15 text-emerald-200"}`}>
              {tariff.satDelta < 0
                ? `Yolcu başına ${Math.abs(tariff.satDelta)} memnuniyet azalır`
                : `Yolcu başına ${tariff.satDelta} memnuniyet artar`}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FareRow({ label, value, tone }: { label: string; value: string; tone: "gold" | "green" | "blue" }) {
  return (
    <div className="flex items-center justify-between gap-5 py-1.5 text-sm">
      <span className="font-semibold text-white/72">{label}</span>
      <span className={`ff-display text-base ${toneColor(tone)}`}>₺{value}</span>
    </div>
  );
}

const CONTRACT_GOAL_ICON: Record<string, IconComponent> = {
  earn: CoinsIcon,
  board: UsersIcon,
  dur: StopIcon,
  offroute: RouteIcon,
};

function ActiveContractRow({ contract, t }: { contract: ActiveContract; t: ReturnType<typeof useT> }) {
  const Icon = CONTRACT_GOAL_ICON[contract.goalType] ?? TargetIcon;
  const pct = Math.min(100, (contract.progress / contract.target) * 100);

  return (
    <div className="rounded-lg bg-white/6 p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-amber-200" />
          <span className={`truncate font-bold ${contract.completed ? "line-through text-white/40" : "text-white"}`}>
            {t(`contract.family.${contract.familyId}`)}
          </span>
        </span>
        <span className="shrink-0 ff-display text-sm text-amber-200">+₺{contract.reward}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${contract.completed ? "bg-emerald-300" : "bg-amber-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs font-semibold text-white/45">
        <span>{contract.goalType === "earn" ? `₺${contract.progress.toFixed(0)} / ₺${contract.target}` : `${contract.progress} / ${contract.target}`}</span>
        {!contract.completed && (
          <button onClick={() => dispatchGameAction("abandonContract", contract.id)} className="text-white/40 underline-offset-2 hover:text-white/70 hover:underline">
            {t("contract.abandon")}
          </button>
        )}
      </div>
    </div>
  );
}

function ContractOfferRow({ offer, disabled, t }: { offer: ContractOffer; disabled: boolean; t: ReturnType<typeof useT> }) {
  const Icon = CONTRACT_GOAL_ICON[offer.goalType] ?? TargetIcon;
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-white/60" />
          <span className="truncate font-bold text-white">{t(`contract.family.${offer.familyId}`)}</span>
        </span>
        <span className="shrink-0 ff-display text-sm text-emerald-300">+₺{offer.reward}</span>
      </div>
      <div className="mt-1 text-xs font-semibold text-white/45">
        {offer.goalType === "earn" ? `₺${offer.target} ${t("contract.goal.earn")}` : `${offer.target} ${t(`contract.goal.${offer.goalType}`)}`}
        {offer.bonusIds.length > 0 && ` · ${offer.bonusIds.map((id) => t(`contract.bonus.${id}`)).join(", ")}`}
      </div>
      <button
        onClick={() => dispatchGameAction("acceptContract", offer.id)}
        disabled={disabled}
        className="ff-button ff-button-primary mt-2 h-8 min-h-8 w-full text-xs disabled:opacity-40"
      >
        {t("contract.accept")}
      </button>
    </div>
  );
}

function ContractsDropdown({ onClose }: { onClose: () => void }) {
  const t = useT();
  const activeContracts = useGameStore((s) => s.activeContracts);
  const contractOffers = useGameStore((s) => s.contractOffers);
  const refreshContractOffers = useGameStore((s) => s.refreshContractOffers);
  const gameDay = useGameStore((s) => s.gameDay);
  const maxActive = ECONOMY.contracts.maxActive;

  useEffect(() => {
    if (contractOffers.length === 0 && activeContracts.length === 0) refreshContractOffers();
    // Sadece panel açıldığında bir kez kontrol edilir; teklif havuzu boşsa doldurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-3 top-[124px] z-50 max-h-[min(560px,calc(100dvh-9rem))] w-[min(21rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl ff-panel-strong ff-scroll p-4 text-white shadow-2xl sm:right-4 sm:top-[152px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="ff-display text-base text-white">{t("nav.contracts")}</div>
            <div className="text-xs font-semibold text-white/50">{t("day.dayNumber", { day: gameDay })} · {activeContracts.length}/{maxActive} {t("contract.activeLabel")}</div>
          </div>
          <button onClick={onClose} className="ff-button ff-button-ghost h-8 min-h-8 w-8 p-0" title={t("nav.close")}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {activeContracts.length > 0 && (
          <div className="mb-3 space-y-2.5">
            <div className="ff-section-title">{t("contract.active")}</div>
            {activeContracts.map((c) => <ActiveContractRow key={c.id} contract={c} t={t} />)}
          </div>
        )}
        <div className="space-y-2.5">
          <div className="ff-section-title">{t("contract.offers")}</div>
          {contractOffers.length === 0 && <p className="text-xs text-white/40">{t("contract.noOffers")}</p>}
          {contractOffers.map((o) => <ContractOfferRow key={o.id} offer={o} disabled={activeContracts.length >= maxActive} t={t} />)}
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-white/32">{t("contract.resetNote")}</p>
      </div>
    </>
  );
}

function Actions() {
  const t = useT();
  const managementOpen = useUiStore((s) => s.managementOpen);
  const chaseMode = useUiStore((s) => s.chaseMode);
  const toggleChaseMode = useUiStore((s) => s.toggleChaseMode);
  const chanceGamesOpen = useUiStore((s) => s.chanceGamesOpen);
  const toggleChanceGames = useUiStore((s) => s.toggleChanceGames);
  const radioOpen = useRadioStore((s) => s.panelOpen);
  const radioStatus = useRadioStore((s) => s.status);
  const toggleRadio = useRadioStore((s) => s.togglePanel);
  const activeContracts = useGameStore((s) => s.activeContracts);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const completedCount = activeContracts.filter((c) => c.completed).length;
  const allDone = activeContracts.length > 0 && completedCount === activeContracts.length;
  const dayInProgress = useGameStore((s) => s.dayRun !== null);
  const openDayStart = useUiStore((s) => s.openDayStart);

  const handleDayButton = () => {
    if (dayInProgress) dispatchGameAction("endDay");
    else openDayStart();
  };

  const handleToggleChanceGames = () => {
    const unlock = useProgressionStore.getState().bootstrap?.unlocks.chanceGames;
    if (unlock && !unlock.available) {
      pushToast({
        tone: "info",
        title: t("progression.locked"),
        message: t("progression.lockedLevel", { level: unlock.requiredLevel }),
      });
      return;
    }
    useRadioStore.getState().closePanel();
    toggleChanceGames();
  };

  const handleToggleRadio = () => {
    useUiStore.getState().closeChanceGames();
    useUiStore.getState().closeManagement();
    useUiStore.getState().closeProfile();
    useUiStore.getState().closeSettings();
    toggleRadio();
  };

  return (
    <div className="ff-command-dock relative min-w-0 overflow-visible">
      <div className="ff-command-row flex min-w-0 flex-1 items-center justify-end gap-1.5">
      <button
        onClick={handleDayButton}
        title={dayInProgress ? t("day.endButton") : t("day.startButton")}
        aria-label={dayInProgress ? t("day.endButton") : t("day.startButton")}
        data-active={dayInProgress}
        className={`ff-nav-button ff-button h-12 min-h-12 shrink-0 gap-2 px-3.5 ${dayInProgress ? "ff-button-green" : "ff-button-primary"}`}
      >
        <span className="text-xs font-bold">{dayInProgress ? t("day.endButton") : t("day.startButton")}</span>
      </button>

      <button
        data-tutorial="management"
        onClick={() => {
          useRadioStore.getState().closePanel();
          useUiStore.getState().toggleManagement();
          setGoalsOpen(false);
        }}
        title={t("nav.managementMenu")}
        aria-label={t("nav.managementMenu")}
        aria-expanded={managementOpen}
        data-active={managementOpen}
        className="ff-nav-button ff-button h-12 min-h-12 shrink-0 gap-2 px-3.5"
      >
        <WrenchIcon className="h-[18px] w-[18px]" />
        <span className="ff-management-label text-xs">{t("nav.management")}</span>
      </button>

      <button
        data-tutorial="contracts"
        onClick={() => {
          setGoalsOpen((open) => !open);
        }}
        title={t("nav.contracts")}
        aria-label={t("nav.contracts")}
        className="ff-nav-button ff-button relative h-12 min-h-12 w-12 shrink-0 p-0 2xl:w-auto 2xl:px-4"
      >
        <TargetIcon className="h-[18px] w-[18px]" />
        <span className="hidden 2xl:inline">{t("nav.contracts")}</span>
        <span className={`absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-ff-ink px-1 text-[9px] font-black text-ff-paper ${allDone ? "ring-2 ring-white/55" : ""}`}>
          {completedCount}/{activeContracts.length}
        </span>
      </button>
      <IconButton tutorialId="chance" active={chanceGamesOpen} onClick={handleToggleChanceGames} title={t("nav.chance")}>
        <DiceIcon className="h-5 w-5" />
      </IconButton>
      <IconButton tutorialId="camera" active={chaseMode} onClick={toggleChaseMode} title={t("nav.camera")}>
        <CameraIcon className="h-5 w-5" />
      </IconButton>
      <IconButton
        tutorialId="radio"
        active={radioOpen || radioStatus === "playing"}
        onClick={handleToggleRadio}
        title={radioStatus === "playing" ? t("nav.radioLive") : t("nav.radio")}
      >
        <span className="relative">
          <RadioIcon className="h-5 w-5" />
          {radioStatus === "playing" && (
            <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-ff-ink shadow-[0_0_0_2px_var(--ff-paper)]" />
          )}
        </span>
      </IconButton>
      </div>
      {goalsOpen && <ContractsDropdown onClose={() => setGoalsOpen(false)} />}
    </div>
  );
}

function IconButton({
  active,
  onClick,
  title,
  children,
  iconOnly = false,
  tutorialId,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: ReactNode;
  iconOnly?: boolean;
  tutorialId?: string;
}) {
  return (
    <button
      data-tutorial={tutorialId}
      onClick={onClick}
      title={title}
      aria-label={title}
      data-active={active}
      className="ff-nav-button ff-button h-12 min-h-12 w-12 shrink-0 p-0 2xl:w-auto 2xl:px-4"
    >
      {children}
      {!iconOnly && <span className="hidden text-xs 2xl:inline">{title}</span>}
    </button>
  );
}

function toneColor(tone: "default" | "gold" | "green" | "red" | "blue") {
  return `ff-tone-${tone}`;
}

function toneBg(tone: "default" | "gold" | "green" | "red" | "blue") {
  return `ff-tone-bg-${tone}`;
}

function formatMoneyCompact(value: number, locale: "tr" | "en") {
  if (Math.abs(value) < 10000) return `₺${value.toFixed(0)}`;
  return `₺${new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}
