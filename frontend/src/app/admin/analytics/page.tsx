"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAnalyticsOverview,
  fetchAnalyticsPlayer,
  type AnalyticsOverview,
  type AnalyticsPlayer,
} from "@/game/api";
import { useAdminAccess } from "@/game/admin";
import { useLocaleStore } from "@/game/i18n";

const copy = {
  tr: {
    eyebrow: "FAZ 0 · CANLI OYUN VERİSİ",
    title: "Operasyon merkezi",
    subtitle: "Oyuncu yolculuğu, ekonomi ve performans tek ekranda.",
    back: "Oyuna dön",
    checking: "Admin oturumu doğrulanıyor…",
    refresh: "Yenile",
    denied: "Bu ekran yalnızca tanımlı admin hesaplarına açıktır.",
    unauthorized: "Bu oturum admin hesabına ait değil veya admin hesabı backend env'inde tanımlı değil.",
    unreachable: "Backend'e ulaşılamıyor. Backend servisinin http://localhost:5000 adresinde çalıştığını kontrol et.",
    dau: "Günlük aktif",
    wau: "Haftalık aktif",
    mau: "Aylık aktif",
    sessions: "Oturum",
    average: "Ort. oturum",
    median: "Medyan oturum",
    p90: "P90 oturum",
    errors: "JS hatası",
    retention: "Geri dönüş",
    funnel: "İlk oyuncu yolculuğu",
    levels: "Level dağılımı",
    economy: "Para akışı",
    performance: "FPS dağılımı",
    liveState: "Canlı oyun durumu",
    critical: "Kritik olaylar (30 gün)",
    stateLabels: ["Oyuncu", "Şirket", "Ort. memnuniyet", "Ort. bakiye", "Ort. gün", "Şoförlü oyuncu", "Araç", "Açık hat", "Terminal tesisi", "Ceza puanlı", "Kilitli araç"],
    players: "oyuncu",
    player: "Oyuncu detayı",
    playerId: "Oyuncu ID",
    search: "Getir",
    noPlayer: "Oyuncu bulunamadı.",
    empty: "Henüz veri yok.",
  },
  en: {
    eyebrow: "PHASE 0 · LIVE GAME DATA",
    title: "Operations center",
    subtitle: "Player journey, economy and performance in one view.",
    back: "Back to game",
    checking: "Verifying the admin session…",
    refresh: "Refresh",
    denied: "This screen is available only to configured admin accounts.",
    unauthorized: "This session is not the configured admin account, or no admin account is configured on the backend.",
    unreachable: "The backend is unreachable. Check that it is running at http://localhost:5000.",
    dau: "Daily active",
    wau: "Weekly active",
    mau: "Monthly active",
    sessions: "Sessions",
    average: "Avg. session",
    median: "Median session",
    p90: "P90 session",
    errors: "JS errors",
    retention: "Retention",
    funnel: "First-player journey",
    levels: "Level distribution",
    economy: "Currency flow",
    performance: "FPS distribution",
    liveState: "Live game state",
    critical: "Critical events (30 days)",
    stateLabels: ["Players", "Companies", "Avg. satisfaction", "Avg. balance", "Avg. day", "Players with drivers", "Vehicles", "Unlocked routes", "Terminal facilities", "Penalty points", "Locked vehicles"],
    players: "players",
    player: "Player detail",
    playerId: "Player ID",
    search: "Load",
    noPlayer: "Player not found.",
    empty: "No data yet.",
  },
} as const;

export default function AnalyticsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [player, setPlayer] = useState<AnalyticsPlayer | null>(null);
  const adminAccess = useAdminAccess();

  async function loadOverview() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsOverview();
      setOverview(data);
    } catch (reason) {
      setOverview(null);
      setError(reason instanceof Error && reason.message === "Yetkisiz" ? text.unauthorized : text.unreachable);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayer() {
    if (!playerId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setPlayer(await fetchAnalyticsPlayer(playerId.trim()));
    } catch (reason) {
      setError(reason instanceof Error && reason.message === "Yetkisiz" ? text.unauthorized : text.unreachable);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminAccess !== "allowed" || overview || loading) return;
    const timer = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timer);
    // Yetki sonucu başına yalnızca ilk yüklemeyi tetikler; sonraki yenilemeler düğmeden yapılır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAccess]);

  if (adminAccess !== "allowed") {
    return <main className="ff-analytics-page"><section className="ff-analytics-gate"><h1>{text.title}</h1><p>{adminAccess === "loading" ? text.checking : text.denied}</p><Link href="/" className="ff-button">{text.back}</Link></section></main>;
  }

  return (
    <main className="ff-analytics-page">
      <header className="ff-analytics-header">
        <div><p>{text.eyebrow}</p><h1>{text.title}</h1><span>{text.subtitle}</span></div>
        <Link href="/" className="ff-button">{text.back}</Link>
      </header>

      <section className="ff-analytics-toolbar">
        <p>{text.subtitle}</p>
        <button type="button" className="ff-button ff-button-primary" onClick={() => loadOverview()} disabled={loading}>{text.refresh}</button>
      </section>
      {error && <p className="ff-analytics-error" role="alert">{error}</p>}

      {overview ? (
        <>
          <section className="ff-analytics-kpis">
            <Metric label={text.dau} value={overview.activity.dailyActiveUsers} />
            <Metric label={text.wau} value={overview.activity.weeklyActiveUsers} />
            <Metric label={text.mau} value={overview.activity.monthlyActiveUsers} />
            <Metric label={text.sessions} value={overview.sessions.totalSessions} />
            <Metric label={text.average} value={formatSeconds(overview.sessions.averageSeconds)} />
            <Metric label={text.median} value={formatSeconds(overview.sessions.medianSeconds)} />
            <Metric label={text.p90} value={formatSeconds(overview.sessions.p90Seconds)} />
            <Metric label={text.errors} value={overview.performance.javascriptErrors} />
          </section>

          <section className="ff-analytics-grid">
            <DashboardCard title={text.retention}><div className="ff-retention-row"><Metric label="D1" value={`%${overview.retention.day1}`} /><Metric label="D7" value={`%${overview.retention.day7}`} /><Metric label="D30" value={`%${overview.retention.day30}`} /></div></DashboardCard>
            <DashboardCard title={text.performance}><Bars items={overview.performance.fpsBuckets.map((item) => ({ label: item.name, value: item.count }))} empty={text.empty} /></DashboardCard>
            <DashboardCard title={text.funnel} wide><Bars items={overview.funnel.map((item) => ({ label: item.name.replaceAll("_", " "), value: item.count }))} empty={text.empty} /></DashboardCard>
            <DashboardCard title={text.levels}><Bars items={overview.levelDistribution.map((item) => ({ label: `Lv. ${item.level}`, value: item.players }))} empty={text.empty} /></DashboardCard>
            <DashboardCard title={text.economy}><CurrencyTable rows={overview.currency} empty={text.empty} /></DashboardCard>
            <DashboardCard title={text.liveState} wide>
              <div className="ff-analytics-kpis">
                <Metric label={text.stateLabels[0]} value={overview.playerState.totalPlayers} />
                <Metric label={text.stateLabels[1]} value={overview.playerState.companies} />
                <Metric label={text.stateLabels[2]} value={`%${overview.playerState.averageSatisfaction}`} />
                <Metric label={text.stateLabels[3]} value={`₺${overview.playerState.averageMoney.toLocaleString("tr-TR")}`} />
                <Metric label={text.stateLabels[4]} value={overview.playerState.averageGameDay} />
                <Metric label={text.stateLabels[5]} value={overview.playerState.playersWithDrivers} />
                <Metric label={text.stateLabels[6]} value={overview.playerState.ownedVehicles} />
                <Metric label={text.stateLabels[7]} value={overview.playerState.unlockedRoutes} />
                <Metric label={text.stateLabels[8]} value={overview.playerState.terminalUpgrades} />
                <Metric label={text.stateLabels[9]} value={overview.playerState.playersWithLicencePoints} />
                <Metric label={text.stateLabels[10]} value={overview.playerState.lockedVehicles} />
              </div>
            </DashboardCard>
            <DashboardCard title={text.critical} wide><CriticalEvents items={overview.criticalEvents} empty={text.empty} playersLabel={text.players} /></DashboardCard>
          </section>

          <section className="ff-analytics-player">
            <h2>{text.player}</h2>
            <div><input value={playerId} onChange={(event) => setPlayerId(event.target.value)} placeholder={text.playerId} /><button type="button" className="ff-button" onClick={loadPlayer}>{text.search}</button></div>
            {playerId && !player && !loading && <p>{text.noPlayer}</p>}
            {player && <PlayerDetail player={player} />}
          </section>
        </>
      ) : !error && <section className="ff-analytics-gate"><p>{loading ? "…" : text.unauthorized}</p></section>}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="ff-analytics-metric"><small>{label}</small><strong>{value}</strong></article>;
}

function DashboardCard({ title, wide = false, children }: { title: string; wide?: boolean; children: React.ReactNode }) {
  return <article className={`ff-analytics-card${wide ? " ff-analytics-card-wide" : ""}`}><h2>{title}</h2>{children}</article>;
}

function Bars({ items, empty }: { items: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (!items.length) return <p>{empty}</p>;
  return <div className="ff-analytics-bars">{items.map((item) => <div key={item.label}><span>{item.label}</span><i><b style={{ width: `${(item.value / max) * 100}%` }} /></i><strong>{item.value}</strong></div>)}</div>;
}

function CurrencyTable({ rows, empty }: { rows: AnalyticsOverview["currency"]; empty: string }) {
  if (!rows.length) return <p>{empty}</p>;
  return <div className="ff-analytics-table">{rows.map((row) => <div key={`${row.type}:${row.source}`}><span>{row.type.replace("currency_", "")}</span><span>{row.source}</span><strong>₺{row.amount.toLocaleString("tr-TR")}</strong></div>)}</div>;
}

function CriticalEvents({ items, empty, playersLabel }: { items: AnalyticsOverview["criticalEvents"]; empty: string; playersLabel: string }) {
  if (!items.length) return <p>{empty}</p>;
  return <div className="ff-analytics-table">{items.map((item) => <div key={item.name}><span>{item.name.replaceAll("_", " ")}</span><span>{item.players} {playersLabel}</span><strong>{item.events}</strong></div>)}</div>;
}

function PlayerDetail({ player }: { player: AnalyticsPlayer }) {
  return <div className="ff-player-detail"><div><strong>@{player.username ?? "—"}</strong><span>{player.companyName ?? "—"}</span><span>Lv. {player.level} · {player.experience} XP</span><span>₺{player.money.toLocaleString("tr-TR")}</span></div><ol>{player.recentEvents.slice(0, 12).map((event) => <li key={event.id}><time>{new Date(event.createdAtUtc).toLocaleString()}</time><strong>{event.type}</strong><span>{event.category}</span></li>)}</ol></div>;
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}
