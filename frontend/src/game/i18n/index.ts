"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { tr } from "./tr";
import { en } from "./en";

export type Locale = "tr" | "en";
export type TranslationKey = keyof typeof tr;
export type TranslationParams = Record<string, string | number>;

const DICTIONARIES: Record<Locale, Record<string, string>> = { tr, en };
const STORAGE_KEY = "fullfilled-locale";
const DEFAULT_LOCALE: Locale = "tr";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// SSR ve ilk hydration'da daima DEFAULT_LOCALE; kayitli tercih LocaleHydrator ile
// mount sonrasi uygulanir (sunucu/istemci HTML uyusmazligini onler).
export const useLocaleStore = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, locale);
    set({ locale });
  },
}));

export function setLocale(locale: Locale): void {
  useLocaleStore.getState().setLocale(locale);
}

export function getLocale(): Locale {
  return useLocaleStore.getState().locale;
}

function applyParams(text: string, params?: TranslationParams): string {
  if (!params) return text;
  let output = text;
  for (const [name, value] of Object.entries(params)) {
    output = output.split(`{${name}}`).join(String(value));
  }
  return output;
}

export function translate(locale: Locale, key: string, params?: TranslationParams): string {
  const text = DICTIONARIES[locale][key] ?? DICTIONARIES[DEFAULT_LOCALE][key];
  if (text === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] eksik anahtar: ${key}`);
    }
    return key;
  }
  return applyParams(text, params);
}

/** Reaktif ceviri — locale degisince bileseni yeniden render eder. */
export function useT() {
  const locale = useLocaleStore((state) => state.locale);
  return useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale]
  );
}

/** React disi cagrilar icin (store.ts, telemetry vb.) — reaktif degildir. */
export function t(key: string, params?: TranslationParams): string {
  return translate(getLocale(), key, params);
}

/** Kayitli dil tercihini mount sonrasi uygular. GameHome'da bir kez mount edilir. */
export function LocaleHydrator() {
  const setStoreLocale = useLocaleStore((state) => state.setLocale);
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "tr" || stored === "en") setStoreLocale(stored);
  }, [setStoreLocale]);
  return null;
}
