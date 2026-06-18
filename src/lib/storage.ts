import type { PracticeAttempt, PracticePaper, WrongBookItem } from "./types.ts";

export const storageKeys = {
  currentPaper: "english-practice.current-paper",
  lastAttempt: "english-practice.last-attempt",
  wrongBook: "english-practice.wrong-book",
} as const;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("english-practice-storage"));
}

export function getCurrentPaper() {
  return readJson<PracticePaper | null>(storageKeys.currentPaper, null);
}

export function saveCurrentPaper(paper: PracticePaper) {
  writeJson(storageKeys.currentPaper, paper);
}

export function getLastAttempt() {
  return readJson<PracticeAttempt | null>(storageKeys.lastAttempt, null);
}

export function saveLastAttempt(attempt: PracticeAttempt) {
  writeJson(storageKeys.lastAttempt, attempt);
}

export function getWrongBook() {
  return readJson<WrongBookItem[]>(storageKeys.wrongBook, []);
}

export function saveWrongBook(items: WrongBookItem[]) {
  writeJson(storageKeys.wrongBook, items);
}

export function upsertWrongBookItems(newItems: WrongBookItem[]) {
  const existingItems = getWrongBook();
  const mergedItems = [...existingItems];

  newItems.forEach((item) => {
    const existingIndex = mergedItems.findIndex(
      (existingItem) => existingItem.questionId === item.questionId,
    );

    if (existingIndex >= 0) {
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        studentAnswer: item.studentAnswer,
        errorType: item.errorType,
        errorCount: mergedItems[existingIndex].errorCount + 1,
        lastWrongAt: item.lastWrongAt,
      };
    } else {
      mergedItems.unshift(item);
    }
  });

  saveWrongBook(mergedItems);
}
