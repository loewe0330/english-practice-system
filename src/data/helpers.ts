import type {
  GrammarPoint,
  KnowledgePhrase,
  KnowledgeSentence,
  KnowledgeWord,
  Unit,
} from "@/lib/types";

export const PRIMARY_G4B = {
  gradeId: "primary-g4b",
  stage: "primary" as const,
  grade: 4,
  semester: "second" as const,
  displayName: "四年级下",
};

type WordTuple = [english: string, chinese: string, partOfSpeech: string, isRequired?: boolean];
type PhraseTuple = [english: string, chinese: string, isRequired?: boolean];
type SentenceTuple = [english: string, chinese: string, isRequired?: boolean];
type GrammarTuple = [title: string, explanation: string, examples?: string[]];

function pad(index: number) {
  return String(index + 1).padStart(3, "0");
}

export function createWords(unitId: string, bookId: string, rows: WordTuple[]): KnowledgeWord[] {
  return rows.map(([english, chinese, partOfSpeech, isRequired = true], index) => ({
    id: `${unitId}-word-${pad(index)}`,
    ...PRIMARY_G4B,
    bookId,
    unitId,
    english,
    chinese,
    partOfSpeech,
    sortOrder: index + 1,
    isRequired,
  }));
}

export function createPhrases(unitId: string, bookId: string, rows: PhraseTuple[]): KnowledgePhrase[] {
  return rows.map(([english, chinese, isRequired = true], index) => ({
    id: `${unitId}-phrase-${pad(index)}`,
    ...PRIMARY_G4B,
    bookId,
    unitId,
    english,
    chinese,
    sortOrder: index + 1,
    isRequired,
  }));
}

export function createSentences(
  unitId: string,
  bookId: string,
  rows: SentenceTuple[],
): KnowledgeSentence[] {
  return rows.map(([english, chinese, isRequired = true], index) => ({
    id: `${unitId}-sentence-${pad(index)}`,
    ...PRIMARY_G4B,
    bookId,
    unitId,
    english,
    chinese,
    sortOrder: index + 1,
    isRequired,
  }));
}

export function createGrammar(unitId: string, bookId: string, rows: GrammarTuple[]): GrammarPoint[] {
  return rows.map(([title, explanation, examples = []], index) => ({
    id: `${unitId}-grammar-${pad(index)}`,
    ...PRIMARY_G4B,
    bookId,
    unitId,
    title,
    explanation,
    examples,
    sortOrder: index + 1,
  }));
}

interface CreateUnitInput {
  id: string;
  bookId: string;
  unitNo: number;
  title: string;
  order?: number;
  words: WordTuple[];
  phrases: PhraseTuple[];
  sentences: SentenceTuple[];
  grammarPoints: GrammarTuple[];
}

export function createUnit(input: CreateUnitInput): Unit {
  const displayName = `Unit${input.unitNo}`;

  return {
    id: input.id,
    ...PRIMARY_G4B,
    bookId: input.bookId,
    unitNo: input.unitNo,
    displayName,
    name: `Unit ${input.unitNo}`,
    title: input.title,
    order: input.order ?? input.unitNo,
    words: createWords(input.id, input.bookId, input.words),
    phrases: createPhrases(input.id, input.bookId, input.phrases),
    sentences: createSentences(input.id, input.bookId, input.sentences),
    grammarPoints: createGrammar(input.id, input.bookId, input.grammarPoints),
  };
}
