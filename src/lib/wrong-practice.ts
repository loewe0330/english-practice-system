import { createId } from "./practice.ts";
import type { PracticePaper, PracticeQuestion, SourceType, WrongBookItem } from "./types.ts";

export type WrongBookFilter =
  | "all"
  | "knowledge"
  | "extension"
  | "word"
  | "phrase"
  | "sentence"
  | "unmastered"
  | "mastered";

export type WrongPracticeMode = "all-unmastered" | "recent" | "frequent";

export const wrongBookFilters: { value: WrongBookFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "knowledge", label: "校内知识清单" },
  { value: "extension", label: "拓展词汇" },
  { value: "word", label: "单词" },
  { value: "phrase", label: "词组" },
  { value: "sentence", label: "句子" },
  { value: "unmastered", label: "未掌握" },
  { value: "mastered", label: "已掌握" },
];

export function getWrongCount(item: WrongBookItem) {
  return item.wrongCount ?? item.errorCount ?? 1;
}

function isExtensionSource(sourceType: SourceType) {
  return sourceType === "extension_word" || sourceType === "extension_phrase";
}

function isKnowledgeSource(sourceType: SourceType) {
  return sourceType === "knowledge_word" || sourceType === "knowledge_phrase" || sourceType === "knowledge_sentence";
}

export function matchesWrongBookFilter(item: WrongBookItem, filter: WrongBookFilter) {
  if (filter === "all") return true;
  if (filter === "knowledge") return isKnowledgeSource(item.sourceType);
  if (filter === "extension") return isExtensionSource(item.sourceType);
  if (filter === "word") return item.sourceType === "knowledge_word" || item.sourceType === "extension_word";
  if (filter === "phrase") return item.sourceType === "knowledge_phrase" || item.sourceType === "extension_phrase";
  if (filter === "sentence") return item.sourceType === "knowledge_sentence";
  if (filter === "mastered") return Boolean(item.mastered);
  return !item.mastered;
}

export function selectWrongPracticeItems(items: WrongBookItem[], mode: WrongPracticeMode) {
  const unmastered = items.filter((item) => !item.mastered);

  if (mode === "recent") {
    return [...unmastered]
      .sort((a, b) => b.lastWrongAt.localeCompare(a.lastWrongAt))
      .slice(0, 20);
  }

  if (mode === "frequent") {
    return unmastered.filter((item) => getWrongCount(item) >= 2);
  }

  return unmastered;
}

export function wrongBookItemToQuestion(item: WrongBookItem, index: number): PracticeQuestion {
  return {
    id: `q-retry-${item.id}-${index + 1}`,
    gradeId: item.gradeId,
    bookId: item.bookId,
    unitId: item.unitId,
    categoryId: item.categoryId,
    sourceId: item.sourceItemId ?? item.questionId,
    sourceItemId: item.sourceItemId ?? item.questionId,
    sourceType: item.sourceType,
    questionType: item.questionType,
    prompt: item.prompt,
    correctAnswer: item.correctAnswer,
    sourceLabel: item.sourceLabel || "未分类",
  };
}

export function buildWrongBookPracticePaper(items: WrongBookItem[], title = "错题再练"): PracticePaper {
  const questions = items.map(wrongBookItemToQuestion);
  const gradeIds = [...new Set(questions.map((question) => question.gradeId).filter((gradeId): gradeId is string => Boolean(gradeId)))];
  const bookIds = [...new Set(questions.map((question) => question.bookId).filter((bookId): bookId is string => Boolean(bookId)))];
  const unitIds = [...new Set(questions.map((question) => question.unitId).filter((unitId): unitId is string => Boolean(unitId)))];
  const categoryIds = [...new Set(questions.map((question) => question.categoryId).filter((categoryId): categoryId is string => Boolean(categoryId)))];

  return {
    id: createId("paper-wrong"),
    title,
    sourceMode: "mixed",
    gradeId: gradeIds[0],
    bookIds,
    unitIds,
    categoryIds,
    contentTypes: ["words", "phrases", "sentences", "extension"],
    questions,
    createdAt: new Date().toISOString(),
  };
}
