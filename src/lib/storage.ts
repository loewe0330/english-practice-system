import type { PracticeAttempt, PracticePaper, WrongBookItem } from "./types.ts";

export const storageKeys = {
  currentPaper: "english-practice.current-paper",
  lastAttempt: "english-practice.last-attempt",
  practiceHistory: "english-practice.practice-history",
  wrongBook: "english-practice.wrong-book",
  dataOverride: "english-practice.data-override",
} as const;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJson<T>(key: string, fallback: T): T {
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

export function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("english-practice-storage"));
}

export function removeJson(key: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
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

export function getPracticeHistory() {
  return readJson<PracticeAttempt[]>(storageKeys.practiceHistory, []);
}

export function savePracticeHistory(history: PracticeAttempt[]) {
  writeJson(storageKeys.practiceHistory, history);
}

export function appendPracticeHistory(attempt: PracticeAttempt) {
  const history = getPracticeHistory();
  savePracticeHistory([attempt, ...history]);
}

export function deletePracticeHistoryItem(attemptId: string) {
  savePracticeHistory(getPracticeHistory().filter((attempt) => attempt.id !== attemptId));
}

export function clearPracticeHistory() {
  savePracticeHistory([]);
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
      (existingItem) =>
        existingItem.sourceItemId === item.sourceItemId ||
        existingItem.questionId === item.questionId,
    );

    if (existingIndex >= 0) {
      const currentCount =
        mergedItems[existingIndex].wrongCount ?? mergedItems[existingIndex].errorCount ?? 1;
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        ...item,
        id: mergedItems[existingIndex].id,
        firstWrongAt: mergedItems[existingIndex].firstWrongAt,
        studentAnswer: item.studentAnswer,
        errorType: item.errorType,
        errorCount: currentCount + 1,
        wrongCount: currentCount + 1,
        lastWrongAt: item.lastWrongAt,
        mastered: false,
      };
    } else {
      mergedItems.unshift({
        ...item,
        errorCount: item.errorCount ?? item.wrongCount ?? 1,
        wrongCount: item.wrongCount ?? item.errorCount ?? 1,
        mastered: item.mastered ?? false,
      });
    }
  });

  saveWrongBook(mergedItems);
}

export function markWrongBookItem(itemId: string, mastered: boolean) {
  saveWrongBook(
    getWrongBook().map((item) => (item.id === itemId ? { ...item, mastered } : item)),
  );
}

export function deleteWrongBookItem(itemId: string) {
  saveWrongBook(getWrongBook().filter((item) => item.id !== itemId));
}

export function clearWrongBook() {
  saveWrongBook([]);
}
