import {
  books,
  extensionCategories,
  extensionPhrases,
  extensionWords,
  getBookById,
  getCategoryName,
  getGradeById,
  getUnitById,
  grades,
  units,
} from "../data/index.ts";
import type {
  ExtensionPhrase,
  ExtensionWord,
  KnowledgePhrase,
  KnowledgeSentence,
  KnowledgeWord,
  PracticeContentType,
  PracticePaper,
  PracticeQuestion,
  QuestionType,
  SourceType,
} from "./types.ts";

export type KnowledgeSelection = Exclude<PracticeContentType, "extension">;

export const knowledgeSelectionLabels: Record<KnowledgeSelection, string> = {
  words: "单词",
  phrases: "词组",
  sentences: "句子",
};

export const contentTypeLabels: Record<PracticeContentType, string> = {
  words: "单词",
  phrases: "词组",
  sentences: "句子",
  extension: "拓展词汇",
};

export const sourceTypeLabels: Record<SourceType, string> = {
  knowledge_word: "单词",
  knowledge_phrase: "词组",
  knowledge_sentence: "句子",
  extension_word: "拓展词汇",
  extension_phrase: "拓展词组",
  grammar: "语法点",
};

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sourceLabel({
  gradeId,
  bookId,
  unitId,
  categoryId,
  typeLabel,
}: {
  gradeId?: string;
  bookId?: string;
  unitId?: string;
  categoryId?: string;
  typeLabel: string;
}) {
  const gradeName = getGradeById(gradeId)?.displayName ?? "未分类";
  const bookName = getBookById(bookId)?.name ?? "拓展词汇";
  const unitName = getUnitById(unitId)?.displayName;
  const categoryName = categoryId ? getCategoryName(categoryId) : undefined;

  return [gradeName, bookName, unitName ?? categoryName, typeLabel].filter(Boolean).join(" · ");
}

function wordToQuestion(word: KnowledgeWord): PracticeQuestion {
  return {
    id: `q-${word.id}`,
    gradeId: word.gradeId,
    bookId: word.bookId,
    unitId: word.unitId,
    sourceId: word.id,
    sourceItemId: word.id,
    sourceType: "knowledge_word",
    questionType: "zh_to_en",
    prompt: word.chinese,
    correctAnswer: word.english,
    sourceLabel: sourceLabel({
      gradeId: word.gradeId,
      bookId: word.bookId,
      unitId: word.unitId,
      typeLabel: "单词",
    }),
  };
}

function phraseToQuestion(phrase: KnowledgePhrase): PracticeQuestion {
  return {
    id: `q-${phrase.id}`,
    gradeId: phrase.gradeId,
    bookId: phrase.bookId,
    unitId: phrase.unitId,
    sourceId: phrase.id,
    sourceItemId: phrase.id,
    sourceType: "knowledge_phrase",
    questionType: "zh_to_en",
    prompt: phrase.chinese,
    correctAnswer: phrase.english,
    sourceLabel: sourceLabel({
      gradeId: phrase.gradeId,
      bookId: phrase.bookId,
      unitId: phrase.unitId,
      typeLabel: "词组",
    }),
  };
}

function sentenceToQuestion(sentence: KnowledgeSentence): PracticeQuestion {
  return {
    id: `q-${sentence.id}`,
    gradeId: sentence.gradeId,
    bookId: sentence.bookId,
    unitId: sentence.unitId,
    sourceId: sentence.id,
    sourceItemId: sentence.id,
    sourceType: "knowledge_sentence",
    questionType: "zh_to_en",
    prompt: sentence.chinese,
    correctAnswer: sentence.english,
    sourceLabel: sourceLabel({
      gradeId: sentence.gradeId,
      bookId: sentence.bookId,
      unitId: sentence.unitId,
      typeLabel: "句子",
    }),
  };
}

function extensionWordToQuestion(word: ExtensionWord): PracticeQuestion {
  const gradeId = word.gradeId ?? word.recommendedGradeIds[0];

  return {
    id: `q-${word.id}`,
    gradeId,
    categoryId: word.categoryId,
    sourceId: word.id,
    sourceItemId: word.id,
    sourceType: "extension_word",
    questionType: "zh_to_en",
    prompt: word.chinese,
    correctAnswer: word.english,
    sourceLabel: sourceLabel({
      gradeId,
      categoryId: word.categoryId,
      typeLabel: "拓展词汇",
    }),
  };
}

function extensionPhraseToQuestion(phrase: ExtensionPhrase): PracticeQuestion {
  const gradeId = phrase.gradeId ?? phrase.recommendedGradeIds[0];

  return {
    id: `q-${phrase.id}`,
    gradeId,
    categoryId: phrase.categoryId,
    sourceId: phrase.id,
    sourceItemId: phrase.id,
    sourceType: "extension_phrase",
    questionType: "zh_to_en",
    prompt: phrase.chinese,
    correctAnswer: phrase.english,
    sourceLabel: sourceLabel({
      gradeId,
      categoryId: phrase.categoryId,
      typeLabel: "拓展词汇",
    }),
  };
}

export interface BuildPracticePaperInput {
  gradeId?: string;
  bookIds?: string[];
  unitIds?: string[];
  contentTypes?: PracticeContentType[];
  categoryIds?: string[];
  questionType?: QuestionType;
  sourceMode?: "knowledge" | "extension";
  knowledgeSelections?: KnowledgeSelection[];
}

function normalizeBuildInput(input: BuildPracticePaperInput) {
  const legacyKnowledgeSelections = input.knowledgeSelections ?? [];
  const contentTypes = input.contentTypes ?? [
    ...legacyKnowledgeSelections,
    ...(input.sourceMode === "extension" ? ["extension" as const] : []),
  ];
  const gradeId = input.gradeId ?? grades[0]?.id;
  const unitIds = input.unitIds ?? (input.sourceMode === "knowledge" ? [units[0]?.id].filter(Boolean) : []);
  const bookIds = input.bookIds ?? [
    ...new Set(unitIds.map((unitId) => getUnitById(unitId)?.bookId).filter((bookId): bookId is string => Boolean(bookId))),
  ];
  const categoryIds = input.categoryIds ?? [];

  return {
    gradeId,
    bookIds,
    unitIds,
    contentTypes,
    categoryIds,
    questionType: input.questionType ?? ("zh_to_en" as const),
  };
}

function contentTypeRank(question: PracticeQuestion) {
  if (question.sourceType === "knowledge_word") return 1;
  if (question.sourceType === "knowledge_phrase") return 2;
  if (question.sourceType === "knowledge_sentence") return 3;
  if (question.sourceType === "extension_word") return 4;
  if (question.sourceType === "extension_phrase") return 5;
  return 6;
}

function sortQuestion(a: PracticeQuestion, b: PracticeQuestion) {
  const gradeA = getGradeById(a.gradeId)?.sortOrder ?? 999;
  const gradeB = getGradeById(b.gradeId)?.sortOrder ?? 999;
  const bookA = getBookById(a.bookId)?.sortOrder ?? 999;
  const bookB = getBookById(b.bookId)?.sortOrder ?? 999;
  const unitA = getUnitById(a.unitId)?.unitNo ?? 999;
  const unitB = getUnitById(b.unitId)?.unitNo ?? 999;

  return (
    gradeA - gradeB ||
    bookA - bookB ||
    unitA - unitB ||
    contentTypeRank(a) - contentTypeRank(b) ||
    a.sourceItemId.localeCompare(b.sourceItemId)
  );
}

export function buildPracticePaper(input: BuildPracticePaperInput): PracticePaper {
  const normalized = normalizeBuildInput(input);
  const contentTypes = new Set(normalized.contentTypes);
  const selectedUnits = units.filter(
    (unit) =>
      unit.gradeId === normalized.gradeId &&
      normalized.unitIds.includes(unit.id) &&
      (normalized.bookIds.length === 0 || normalized.bookIds.includes(unit.bookId)),
  );
  const questions: PracticeQuestion[] = [];

  selectedUnits.forEach((unit) => {
    if (contentTypes.has("words")) questions.push(...unit.words.map(wordToQuestion));
    if (contentTypes.has("phrases")) questions.push(...unit.phrases.map(phraseToQuestion));
    if (contentTypes.has("sentences")) questions.push(...unit.sentences.map(sentenceToQuestion));
  });

  if (contentTypes.has("extension")) {
    const selectedCategoryIds = new Set(normalized.categoryIds);
    questions.push(
      ...extensionWords
        .filter(
          (word) =>
            word.recommendedGradeIds.includes(normalized.gradeId) &&
            selectedCategoryIds.has(word.categoryId),
        )
        .map(extensionWordToQuestion),
    );
    questions.push(
      ...extensionPhrases
        .filter(
          (phrase) =>
            phrase.recommendedGradeIds.includes(normalized.gradeId) &&
            selectedCategoryIds.has(phrase.categoryId),
        )
        .map(extensionPhraseToQuestion),
    );
  }

  const sortedQuestions = questions
    .map((question) => ({ ...question, questionType: normalized.questionType }))
    .sort(sortQuestion);

  const hasKnowledge = selectedUnits.length > 0 && normalized.contentTypes.some((type) => type !== "extension");
  const hasExtension = normalized.contentTypes.includes("extension");
  const gradeName = getGradeById(normalized.gradeId)?.displayName ?? "未分类";
  const titleParts = [
    gradeName,
    hasKnowledge ? `${selectedUnits.length} 个单元` : undefined,
    hasExtension ? "拓展词汇" : undefined,
    "中文写英文练习",
  ].filter(Boolean);

  return {
    id: createId("paper"),
    title: titleParts.join(" · "),
    sourceMode: hasKnowledge && hasExtension ? "mixed" : hasExtension ? "extension" : "knowledge",
    gradeId: normalized.gradeId,
    bookIds: normalized.bookIds,
    unitIds: normalized.unitIds,
    categoryIds: normalized.categoryIds,
    contentTypes: normalized.contentTypes,
    questions: sortedQuestions,
    createdAt: new Date().toISOString(),
  };
}

export function formatSourceType(sourceType: SourceType) {
  return sourceTypeLabels[sourceType];
}

export function getSourceDisplay(question: Pick<PracticeQuestion, "sourceLabel" | "gradeId" | "bookId" | "unitId" | "categoryId" | "sourceType">) {
  if (question.sourceLabel) return question.sourceLabel;

  return sourceLabel({
    gradeId: question.gradeId,
    bookId: question.bookId,
    unitId: question.unitId,
    categoryId: question.categoryId,
    typeLabel: formatSourceType(question.sourceType),
  });
}

export function getBookOptionsByGrade(gradeId: string) {
  return books.filter((book) => book.gradeId === gradeId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getUnitOptionsByBooks(gradeId: string, bookIds: string[]) {
  return units.filter((unit) => unit.gradeId === gradeId && bookIds.includes(unit.bookId));
}

export function getCategoryOptionsByGrade(gradeId: string) {
  return extensionCategories.filter((category) => category.recommendedGradeIds.includes(gradeId));
}
