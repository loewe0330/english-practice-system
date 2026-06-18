import assert from "node:assert/strict";
import test from "node:test";
import { getWrongBook, storageKeys, upsertWrongBookItems } from "./storage.ts";
import { buildWrongBookPracticePaper, getWrongCount, selectWrongPracticeItems } from "./wrong-practice.ts";
import type { WrongBookItem } from "./types.ts";

function installMockWindow() {
  const values = new Map<string, string>();

  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    dispatchEvent: () => undefined,
  };

  values.delete(storageKeys.wrongBook);
}

function createWrongItem(overrides: Partial<WrongBookItem> = {}): WrongBookItem {
  return {
    id: "wrong-1",
    questionId: "question-1",
    gradeId: "primary-g4b",
    bookId: "yilin-4b",
    unitId: "yilin-4b-u1",
    sourceType: "knowledge_word",
    sourceItemId: "yilin-4b-u1-word-001",
    questionType: "zh_to_en",
    sourceLabel: "四年级下 · 译林英语 4B · Unit1 · 单词",
    prompt: "强壮的",
    correctAnswer: "strong",
    studentAnswer: "strng",
    errorType: "spelling_error",
    wrongCount: 1,
    errorCount: 1,
    firstWrongAt: "2026-06-18T00:00:00.000Z",
    lastWrongAt: "2026-06-18T00:00:00.000Z",
    mastered: false,
    ...overrides,
  };
}

test("wrong book upsert merges same source item and increments wrongCount", () => {
  installMockWindow();

  upsertWrongBookItems([createWrongItem({ mastered: true })]);
  upsertWrongBookItems([
    createWrongItem({
      id: "wrong-2",
      questionId: "question-2",
      studentAnswer: "stong",
      errorType: "wrong",
      lastWrongAt: "2026-06-18T01:00:00.000Z",
    }),
  ]);

  const items = getWrongBook();
  assert.equal(items.length, 1);
  assert.equal(getWrongCount(items[0]), 2);
  assert.equal(items[0].studentAnswer, "stong");
  assert.equal(items[0].mastered, false);
});

test("wrong practice selects unmastered items and builds practice paper", () => {
  const items = [
    createWrongItem({ id: "wrong-1", mastered: false, wrongCount: 3 }),
    createWrongItem({ id: "wrong-2", questionId: "question-2", sourceItemId: "word-2", mastered: true }),
  ];
  const selectedItems = selectWrongPracticeItems(items, "frequent");
  const paper = buildWrongBookPracticePaper(selectedItems);

  assert.equal(selectedItems.length, 1);
  assert.equal(paper.questions.length, 1);
  assert.equal(paper.questions[0].correctAnswer, "strong");
});
