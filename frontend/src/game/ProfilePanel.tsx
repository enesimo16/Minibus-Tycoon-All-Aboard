"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CompanyProgressionCard } from "./ProgressionUi";
import { CompanyEmblem } from "./CompanyEmblem";
import { logout as revokeSession } from "./api";
import { clearAdminAccessCache, useAdminAccess } from "./admin";
import { ClockIcon, CoinsIcon, RouteIcon, StopIcon, UsersIcon, XIcon } from "./GameIcon";
import { useLocaleStore, useT } from "./i18n";
import { clearAuthSession, getPlayerId } from "./playerId";
import { useProfileStore } from "./profileStore";
import { useGameStore } from "./store";
import { useUiStore } from "./uiStore";
import { setCachedUsername } from "./username";
import { useTutorialStore } from "./tutorialStore";
import { useProgressionStore } from "./progressionStore";

const PLAYTIME_TICK_SECONDS = 10;

export function ProfileTracker() {
  const username = useGameStore((state) => state.username);
  const hydrate = useProfileStore((state) => state.hydrate);
  const tickPlaytime = useProfileStore((state) => state.tickPlaytime);

  useEffect(() => {
    const playerId = getPlayerId();
    if (!playerId) return;
    hydrate(playerId, username ?? "guest");
  }, [hydrate, username]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") tickPlaytime(PLAYTIME_TICK_SECONDS);
    }, PLAYTIME_TICK_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [tickPlaytime]);

  return null;
}

export function ProfilePanel() {
  const open = useUiStore((state) => state.profileOpen);
  const close = useUiStore((state) => state.closeProfile);
  const stats = useProfileStore((state) => state.stats);
  const bootstrap = useProgressionStore((state) => state.bootstrap);
  const money = useGameStore((state) => state.money);
  const satisfaction = useGameStore((state) => state.satisfaction);
  const gameDay = useGameStore((state) => state.gameDay);
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const [loggingOut, setLoggingOut] = useState(false);
  const adminAccess = useAdminAccess();
  const localeTag = locale === "tr" ? "tr-TR" : "en-US";

  const restartTutorial = () => {
    close();
    // Kullanıcı açıkça yeniden başlatmak istiyor — "tamamlandı" durumunu görmezden gel.
    useTutorialStore.setState({ active: true, activePackage: "core", stepIndex: 0 });
  };

  const handleLogout = async () => {
    const playerId = getPlayerId();
    if (!playerId || loggingOut) return;
    setLoggingOut(true);
    try {
      await revokeSession(playerId);
    } catch {
      // Sunucu ulaşılamasa bile cihazdaki oturum mutlaka kapatılabilmeli.
    } finally {
      clearAuthSession();
      clearAdminAccessCache();
      setCachedUsername(null);
      window.location.replace("/");
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  if (!open || !stats) return null;

  const cards = [
    { icon: ClockIcon, label: t("profile.playtime"), value: formatDuration(stats.totalPlaySeconds, t) },
    { icon: CoinsIcon, label: t("profile.totalEarnings"), value: formatMoney(stats.totalEarnings, localeTag) },
    { icon: UsersIcon, label: t("profile.passengers"), value: formatNumber(stats.totalPassengers, localeTag) },
    { icon: StopIcon, label: t("profile.stops"), value: formatNumber(stats.totalStops, localeTag) },
    { icon: RouteIcon, label: t("profile.trips"), value: formatNumber(stats.totalTrips, localeTag) },
  ];

  return (
    <div className="ff-profile-overlay" role="dialog" aria-modal="true" aria-label={t("profile.title")}>
      <button className="absolute inset-0 cursor-default" onClick={close} aria-label={t("profile.close")} />
      <section className="ff-profile-panel">
        <header className="ff-profile-header">
          <div className="ff-profile-avatar">
            {bootstrap?.company ? (
              <CompanyEmblem
                emblemId={bootstrap.company.emblemId}
                primary={bootstrap.company.primaryColor}
                secondary={bootstrap.company.secondaryColor}
                className="h-full w-full"
              />
            ) : stats.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="ff-stop-kicker">{t("profile.title")}</div>
            <h2 className="ff-display truncate text-2xl">@{stats.username}</h2>
            <p className="text-xs text-ff-muted">{t("profile.joined", { date: formatDate(stats.joinedAtUtc, localeTag) })}</p>
          </div>
          {bootstrap && (
            <div className="ff-profile-level" aria-label={`${t("progression.level")} ${bootstrap.progression.level}`}>
              <small>{t("progression.level")}</small>
              <strong>{bootstrap.progression.level}</strong>
            </div>
          )}
          <button onClick={close} className="ff-button h-10 min-h-10 w-10 p-0" aria-label={t("profile.close")}><XIcon className="h-4 w-4" /></button>
        </header>

        <div className="ff-profile-streak">
          <div><span>{stats.currentStreak}</span><small>{t("profile.currentStreak")}</small></div>
          <div><span>{stats.bestStreak}</span><small>{t("profile.bestStreak")}</small></div>
          <div><span>{gameDay}</span><small>{t("profile.gameDay")}</small></div>
        </div>
        <CompanyProgressionCard />

        <div className="ff-profile-grid">
          {cards.map(({ icon: Icon, label, value }) => (
            <article key={label} className="ff-profile-stat">
              <Icon className="h-4 w-4" />
              <small>{label}</small>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <footer className="ff-profile-footer">
          <span>{t("profile.balance")} <strong>{formatMoney(money, localeTag)}</strong></span>
          <span>{t("profile.satisfaction")} <strong>%{Math.round(satisfaction)}</strong></span>
        </footer>
        <div className="ff-profile-actions">
          {adminAccess === "allowed" && (
            <Link href="/admin/analytics" className="ff-button" onClick={close}>
              {t("profile.analytics")}
            </Link>
          )}
          <button type="button" className="ff-button" onClick={restartTutorial}>
            {t("profile.restartTutorial")}
          </button>
          <button type="button" className="ff-button ff-profile-logout" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? t("profile.loggingOut") : t("profile.logout")}
          </button>
        </div>
      </section>
    </div>
  );
}

function formatMoney(value: number, locale: string) {
  return `₺${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)}`;
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatDuration(seconds: number, t: ReturnType<typeof useT>) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return t("profile.duration", { hours, minutes });
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}
