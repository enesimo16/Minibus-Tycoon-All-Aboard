"use client";

import { sendTelemetry } from "./api";
import { useLocaleStore } from "./i18n";
import { getAuthToken, getPlayerId } from "./playerId";
import { useProgressionStore } from "./progressionStore";

export interface QueuedTelemetryEvent {
  eventId: string;
  eventVersion: number;
  type: string;
  dataJson: string;
  clientAtUtc: string;
}

const FLUSH_INTERVAL_MS = 20_000;
const MAX_QUEUE_LENGTH = 200;
const SESSION_STORAGE_KEY = "minibus-tycoon:telemetry-session";
const QUEUE_STORAGE_KEY = "minibus-tycoon:telemetry-queue";

let queue: QueuedTelemetryEvent[] = [];
let flushTimer: number | null = null;
let sending = false;
let started = false;
let sessionEnded = false;

function randomId(prefix: string): string {
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}:${value}`;
}

function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const created = randomId("session");
  sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

function deviceClass(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function loadQueue(): void {
  try {
    const raw = sessionStorage.getItem(QUEUE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    queue = Array.isArray(parsed) ? parsed.slice(-MAX_QUEUE_LENGTH) : [];
  } catch {
    queue = [];
  }
}

function persistQueue(): void {
  try {
    sessionStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Telemetry must never interrupt gameplay when storage is unavailable.
  }
}

export function track(type: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  queue.push({
    eventId: randomId("event"),
    eventVersion: 1,
    type,
    dataJson: JSON.stringify(data ?? {}),
    clientAtUtc: new Date().toISOString(),
  });
  if (queue.length > MAX_QUEUE_LENGTH) queue = queue.slice(-MAX_QUEUE_LENGTH);
  persistQueue();
}

export async function flushTelemetry(): Promise<void> {
  if (sending || queue.length === 0) return;
  const playerId = getPlayerId();
  if (!playerId || !getAuthToken()) return;

  const batch = queue.slice(0, 100);
  sending = true;
  try {
    const result = await sendTelemetry(playerId, {
      sessionId: getSessionId(),
      clientBuild: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
      deviceClass: deviceClass(),
      locale: useLocaleStore.getState().locale,
      playerLevel: useProgressionStore.getState().bootstrap?.progression.level ?? 1,
      companyId: useProgressionStore.getState().bootstrap?.company?.id,
      events: batch,
    });
    if (result.bootstrap) useProgressionStore.getState().setBootstrap(result.bootstrap);
    queue = queue.slice(batch.length);
    persistQueue();
  } catch {
    // Network errors keep the events queued for the next flush.
  } finally {
    sending = false;
  }
}

export function startTelemetry(): () => void {
  if (typeof window === "undefined" || started) return () => {};
  started = true;
  sessionEnded = false;
  loadQueue();
  track("session_started", {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  });

  function onError(event: ErrorEvent) {
    track("js_error", { message: event.message, source: event.filename, line: event.lineno });
  }
  function onRejection(event: PromiseRejectionEvent) {
    track("js_error", { message: String(event.reason), kind: "unhandledrejection" });
  }
  function onVisibility() {
    if (document.visibilityState === "hidden") void flushTelemetry();
  }
  function endSession() {
    if (sessionEnded) return;
    sessionEnded = true;
    track("session_ended");
    void flushTelemetry();
  }

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  window.addEventListener("pagehide", endSession);
  document.addEventListener("visibilitychange", onVisibility);
  flushTimer = window.setInterval(() => void flushTelemetry(), FLUSH_INTERVAL_MS);
  void flushTelemetry();

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    window.removeEventListener("pagehide", endSession);
    document.removeEventListener("visibilitychange", onVisibility);
    if (flushTimer !== null) window.clearInterval(flushTimer);
    flushTimer = null;
    started = false;
  };
}

let frameCount = 0;
let sampleStartedAt = 0;
let lastFpsSample = 0;

export function sampleFrame(nowMs: number): void {
  if (sampleStartedAt === 0) {
    sampleStartedAt = nowMs;
    return;
  }
  frameCount += 1;
  const elapsed = nowMs - sampleStartedAt;
  if (elapsed < 30_000) return;

  lastFpsSample = Math.round((frameCount * 1000) / elapsed);
  track("fps_sample", { fps: lastFpsSample });
  frameCount = 0;
  sampleStartedAt = nowMs;
}

export function getLastFpsSample(): number {
  return lastFpsSample;
}
