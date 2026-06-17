import {
  books,
  extensionCategories,
  extensionPhrases,
  extensionWords,
  getCategoryName,
  units,
} from "./mock-data";
import type {
  ExtensionPhrase,
  ExtensionWord,
  KnowledgePhrase,
  KnowledgeSentence,
  KnowledgeWord,
  PracticePaper,
  PracticeQuestion,
  SourceType,
} from "./types";

export type KnowledgeSelection = "words" | "phrases" | "sentences";

export const knowledgeSelectionLabels: Record<KnowledgeSelection, string> = {
  words: "Unit1 单词",
  phrases: "Unit1 词组",
  sentences: "Unit1 句子",
};

export const sourceTypeLabels: Record<SourceType, string> = {
  knowledge_word: "校内单词",
  knowledge_phrase: "校内词组",
  knowledge_sentence: "校内句子",
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

function wordToQuestion(word: KnowledgeWord, index: number): PracticeQuestion {
  return {
    id: `q-${word.id}-${index}`,
    sourceId: word.id,
    sourceType: "knowledge_word",
    questionType: "zh_to_en",
    prompt: word.chinese,
    correctAnswer: word.english,
    sourceLabel: "译林英语 4B Unit1 单词",
  };
}

function phraseToQuestion(phrase: KnowledgePhrase, index: number): PracticeQuestion {
  return {
    id: `q-${phrase.id}-${index}`,
    sourceId: phrase.id,
    sourceType: "knowledge_phrase",
    questionType: "zh_to_en",
    prompt: phrase.chinese,
    correctAnswer: phrase.english,
    sourceLabel: "译林英语 4B Unit1 词组",
  };
}

function sentenceToQuestion(sentence: KnowledgeSentence, index: number): PracticeQuestion {
  return {
    id: `q-${sentence.id}-${index}`,
    sourceId: sentence.id,
    sourceType: "knowledge_sentence",
    questionType: "zh_to_en",
    prompt: sentence.chinese,
    correctAnswer: sentence.english,
    sourceLabel: "译林英语 4B Unit1 句子",
  };
}

function extensionWordToQuestion(word: ExtensionWord, index: number): PracticeQuestion {
  return {
    id: `q-${word.id}-${index}`,
    sourceId: word.id,
    sourceType: "extension_word",
    questionType: "zh_to_en",
    prompt: word.chinese,
    correctAnswer: word.english,
    sourceLabel: `拓展词汇 · ${getCategoryName(word.categoryId)}`,
  };
}

function extensionPhraseToQuestion(phrase: ExtensionPhrase, index: number): PracticeQuestion {
  return {
    id: `q-${phrase.id}-${index}`,
    sourceId: phrase.id,
    sourceType: "extension_phrase",
    questionType: "zh_to_en",
    prompt: phrase.chinese,
    correctAnswer: phrase.english,
    sourceLabel: `拓展词组 · ${getCategoryName(phrase.categoryId)}`,
  };
}

interface BuildPracticePaperInput {
  sourceMode: "knowledge" | "extension";
  knowledgeSelections: KnowledgeSelection[];
  categoryIds: string[];
}

export function buildPracticePaper(input: BuildPracticePaperInput): PracticePaper {
  const unit = units[0];
  const questions: PracticeQuestion[] = [];

  if (input.sourceMode === "knowledge") {
    if (input.knowledgeSelections.includes("words")) {
      questions.push(...unit.words.map(wordToQuestion));
    }

    if (input.knowledgeSelections.includes("phrases")) {
      questions.push(...unit.phrases.map(phraseToQuestion));
    }

    if (input.knowledgeSelections.includes("sentences")) {
      questions.push(...unit.sentences.map(sentenceToQuestion));
    }
  } else {
    const selectedCategoryIds = new Set(input.categoryIds);
    questions.push(
      ...extensionWords.filter((word) => selectedCategoryIds.has(word.categoryId)).map(extensionWordToQuestion),
    );
    questions.push(
      ...extensionPhrases
        .filter((phrase) => selectedCategoryIds.has(phrase.categoryId))
        .map(extensionPhraseToQuestion),
    );
  }

  const title =
    input.sourceMode === "knowledge"
      ? `${books[0].name} ${unit.name} 在线练习`
      : `拓展词汇练习：${extensionCategories
          .filter((category) => input.categoryIds.includes(category.id))
          .map((category) => category.name)
          .join("、")}`;

  return {
    id: createId("paper"),
    title,
    sourceMode: input.sourceMode,
    bookId: input.sourceMode === "knowledge" ? books[0].id : undefined,
    unitId: input.sourceMode === "knowledge" ? unit.id : undefined,
    categoryIds: input.sourceMode === "extension" ? input.categoryIds : undefined,
    questions,
    createdAt: new Date().toISOString(),
  };
}

export function formatSourceType(sourceType: SourceType) {
  return sourceTypeLabels[sourceType];
}
