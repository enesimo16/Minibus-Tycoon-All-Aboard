"use client";

import { create } from "zustand";
import { ECONOMY } from "./economy";

const STORAGE_PREFIX = "fullfilled:profile:";

/**
 * Ardisik gun serisinin ucret carpani. Seri SADECE sayilmakla kalmaz, gercek gelir
 * getirir — "bugun oynamazsam kaybederim" hissi bundan dogar.
 * 1. gun x1.00, her ek gun +%3, tavan +%30 (11. gun).
 */
export function streakFareMultiplier(currentStreak: number): number {
  const perDay = ECONOMY.streak.bonusPerDay as number;
  const max = ECONOMY.streak.maxBonus as number;
  const days = Math.max(1, currentStreak) - 1;
  return 1 + Math.min(max, days * perDay);
}

/** Seri kirilmadan once kac gun bosluga izin verilir (1 = ertesi gun oynanmali). */
export function streakGraceDays(): number {
  return ECONOMY.streak.graceDays as number;
}

export interface ProfileStats {
  playerId: string;
  username: string;
  joinedAtUtc: string;
  totalPlaySeconds: number;
  totalEarnings: number;
  totalPassengers: number;
  totalStops: number;
  totalTrips: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
}

interface ProfileState {
  hydrated: boolean;
  stats: ProfileStats | null;
  hydrate: (playerId: string, username: string) => void;
  tickPlaytime: (seconds: number) => void;
  recordStop: (earnings: number, passengers: number, completedTrip: boolean) => void;
  recordEarnings: (amount: number) => void;
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDifference(from: string, to: string): number {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function persist(stats: ProfileStats) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${stats.playerId}`, JSON.stringify(stats));
  } catch {
    // Profile persistence must never interrupt gameplay.
  }
}

function read(playerId: string): ProfileStats | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${playerId}`);
    return raw ? (JSON.parse(raw) as ProfileStats) : null;
  } catch {
    return null;
  }
}

export const useProfileStore = create<ProfileState>((set) => ({
  hydrated: false,
  stats: null,
  hydrate: (playerId, username) => {
    const today = localDateKey();
    const stored = read(playerId);
    const base: ProfileStats = stored ?? {
      playerId,
      username,
      joinedAtUtc: new Date().toISOString(),
      totalPlaySeconds: 0,
      totalEarnings: 0,
      totalPassengers: 0,
      totalStops: 0,
      totalTrips: 0,
      currentStreak: 1,
      bestStreak: 1,
      lastPlayedDate: today,
    };

    let currentStreak = Math.max(1, base.currentStreak);
    if (base.lastPlayedDate !== today) {
      currentStreak = dayDifference(base.lastPlayedDate, today) <= streakGraceDays()
        ? currentStreak + 1
        : 1;
    }

    const stats = {
      ...base,
      username,
      currentStreak,
      bestStreak: Math.max(base.bestStreak, currentStreak),
      lastPlayedDate: today,
    };
    persist(stats);
    set({ hydrated: true, stats });
  },
  tickPlaytime: (seconds) =>
    set((state) => {
      if (!state.stats || seconds <= 0) return state;
      const stats = {
        ...state.stats,
        totalPlaySeconds: state.stats.totalPlaySeconds + seconds,
      };
      persist(stats);
      return { stats };
    }),
  recordStop: (earnings, passengers, completedTrip) =>
    set((state) => {
      if (!state.stats) return state;
      const stats = {
        ...state.stats,
        totalEarnings: state.stats.totalEarnings + Math.max(0, earnings),
        totalPassengers: state.stats.totalPassengers + Math.max(0, passengers),
        totalStops: state.stats.totalStops + 1,
        totalTrips: state.stats.totalTrips + (completedTrip ? 1 : 0),
      };
      persist(stats);
      return { stats };
    }),
  recordEarnings: (amount) =>
    set((state) => {
      if (!state.stats || amount <= 0) return state;
      const stats = {
        ...state.stats,
        totalEarnings: state.stats.totalEarnings + amount,
      };
      persist(stats);
      return { stats };
    }),
}));
