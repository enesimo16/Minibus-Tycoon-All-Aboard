"use client";

import { useState } from "react";
import { acknowledgeLevel, resetCompanySkills, upgradeCompanySkill } from "./api";
import { getPlayerId } from "./playerId";
import { useProgressionStore } from "./progressionStore";
import { useT } from "./i18n";

const SKILLS = [
  ["loyal-passengers", "service"], ["service-recovery", "service"],
  ["preventive-care", "operations"], ["route-prep", "operations"],
  ["contract-choice", "growth"], ["fleet-planning", "growth"],
] as const;

export function CompanyProgressionCard() {
  const t = useT();
  const bootstrap = useProgressionStore((state) => state.bootstrap);
  const setBootstrap = useProgressionStore((state) => state.setBootstrap);
  const [busy, setBusy] = useState<string | null>(null);
  if (!bootstrap?.company) return null;
  const { company, progression } = bootstrap;
  const progress = progression.nextLevelExperience === progression.currentLevelExperience ? 100 : Math.max(0, Math.min(100, ((progression.experience - progression.currentLevelExperience) / (progression.nextLevelExperience - progression.currentLevelExperience)) * 100));

  const run = async (id: string, action: (playerId: string) => ReturnType<typeof resetCompanySkills>) => {
    const playerId = getPlayerId();
    if (!playerId || busy) return;
    setBusy(id);
    try { setBootstrap(await action(playerId)); } finally { setBusy(null); }
  };

  return <section className="ff-progression-card">
    <div className="flex items-start justify-between gap-4">
      <div><small className="font-black uppercase tracking-wider text-[#173042]/45">{t("progression.company")}</small><h3 className="ff-display text-xl">{company.name}</h3><p className="mt-1 text-xs text-[#173042]/55">{t(`company.strategy.${company.strategy}`)} · {t("progression.reputation", { count: company.reputation })}</p></div>
      <div className="ff-progression-level"><small>{t("progression.level")}</small><strong>{progression.level}</strong></div>
    </div>
    <div className="ff-progression-track"><div style={{ width: `${progress}%` }} /></div>
    <div className="ff-progression-summary"><span>{progression.experience} XP</span><span>{t("progression.skillPoints", { count: progression.skillPoints })}</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {SKILLS.map(([id, branch]) => { const level = company.skills[id] ?? 0; return <button key={id} disabled={progression.skillPoints <= 0 || level >= 3 || busy !== null} onClick={() => run(id, (playerId) => upgradeCompanySkill(playerId, id))} className="rounded-xl border border-black/10 bg-[#f8f3e8] p-3 text-left disabled:opacity-55"><span className="block text-[9px] font-black uppercase tracking-wider text-[#173042]/40">{t(`company.strategy.${branch}`)}</span><strong className="mt-1 block text-xs">{t(`progression.skill.${id}`)}</strong><span className="mt-2 block text-[10px] font-black">{t("progression.skillLevel", { level })}</span></button>; })}
    </div>
    <button disabled={busy !== null || Object.keys(company.skills).length === 0} onClick={() => run("reset", resetCompanySkills)} className="mt-3 text-xs font-black underline decoration-black/25 underline-offset-4 disabled:opacity-35">{t("progression.resetSkills")}</button>
  </section>;
}

export function LevelUpModal() {
  const t = useT();
  const bootstrap = useProgressionStore((state) => state.bootstrap);
  const setBootstrap = useProgressionStore((state) => state.setBootstrap);
  const [busy, setBusy] = useState(false);
  if (!bootstrap || bootstrap.progression.level <= bootstrap.progression.lastAcknowledgedLevel) return null;
  const unlocked = Object.values(bootstrap.unlocks).filter((item) => item.requiredLevel > bootstrap.progression.lastAcknowledgedLevel && item.requiredLevel <= bootstrap.progression.level);
  const close = async () => {
    const playerId = getPlayerId(); if (!playerId || busy) return;
    setBusy(true);
    try { setBootstrap(await acknowledgeLevel(playerId)); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-[#0b1f2d]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <section className="w-full max-w-md rounded-[2rem] border border-white/50 bg-[#f8f3e8] p-7 text-center text-[#173042] shadow-2xl">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#173042]/45">{t("progression.levelUp")}</p>
      <div className="ff-display mx-auto my-5 grid h-24 w-24 place-items-center rounded-full bg-[#173042] text-5xl text-[#f4cf8a]">{bootstrap.progression.level}</div>
      <h2 className="ff-display text-2xl">{t("progression.levelUpTitle")}</h2>
      {unlocked.length > 0 && <div className="mt-5 rounded-2xl bg-white/70 p-4 text-left"><small className="font-black uppercase tracking-wider text-[#173042]/45">{t("progression.unlocked")}</small>{unlocked.map((item) => <p key={item.id} className="mt-2 text-sm font-bold">• {t(`progression.unlock.${item.id}`)}</p>)}</div>}
      <button onClick={close} disabled={busy} className="mt-6 w-full rounded-xl bg-[#173042] px-5 py-3 font-black text-white">{t("progression.continue")}</button>
    </section>
  </div>;
}
