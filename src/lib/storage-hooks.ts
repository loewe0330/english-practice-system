"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getDefaultData, validateDataSet } from "./data-store.ts";
import { storageKeys } from "./storage.ts";
import type { KnowledgeDataSet, PracticeAttempt, PracticePaper, WrongBookItem } from "./types.ts";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("english-practice-storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("english-practice-storage", callback);
  };
}

function getRawValue(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) ?? "";
}

function parseJson<T>(rawValue: string, fallback: T): T {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function useStoredJson<T>(key: string, fallback: T): T {
  const rawValue = useSyncExternalStore(
    subscribe,
    () => getRawValue(key),
    () => "",
  );

  return useMemo(() => parseJson(rawValue, fallback), [fallback, rawValue]);
}

export function useCurrentPaper() {
  return useStoredJson<PracticePaper | null>(storageKeys.currentPaper, null);
}

export function useLastAttempt() {
  return useStoredJson<PracticeAttempt | null>(storageKeys.lastAttempt, null);
}

export function useWrongBookItems() {
  return useStoredJson<WrongBookItem[]>(storageKeys.wrongBook, []);
}

export function usePracticeHistory() {
  return useStoredJson<PracticeAttempt[]>(storageKeys.practiceHistory, []);
}

export function useEffectiveData(): KnowledgeDataSet {
  const rawValue = useSyncExternalStore(
    subscribe,
    () => getRawValue(storageKeys.dataOverride),
    () => "",
  );

  return useMemo(() => {
    if (!rawValue) {
      return getDefaultData();
    }

    try {
      const result = validateDataSet(JSON.parse(rawValue) as unknown);
      return result.ok ? result.data : getDefaultData();
    } catch {
      return getDefaultData();
    }
  }, [rawValue]);
}
