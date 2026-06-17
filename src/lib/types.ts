export type SourceType =
  | "knowledge_word"
  | "knowledge_phrase"
  | "knowledge_sentence"
  | "extension_word"
  | "extension_phrase"
  | "grammar";

export type QuestionType = "zh_to_en" | "en_to_zh" | "choice" | "fill_blank";

export type ErrorType =
  | "correct"
  | "blank"
  | "spelling_error"
  | "punctuation_error"
  | "wrong";

export interface Book {
  id: string;
  name: string;
  publisher: string;
  grade: string;
}

export interface Unit {
  id: string;
  bookId: string;
  name: string;
  title: string;
  order: number;
  words: KnowledgeWord[];
  phrases: KnowledgePhrase[];
  sentences: KnowledgeSentence[];
  grammarPoints: GrammarPoint[];
}

export interface KnowledgeWord {
  id: string;
  unitId: string;
  english: string;
  chinese: string;
  partOfSpeech?: string;
}

export interface KnowledgePhrase {
  id: string;
  unitId: string;
  english: string;
  chinese: string;
}

export interface KnowledgeSentence {
  id: string;
  unitId: string;
  english: string;
  chinese: string;
}

export interface GrammarPoint {
  id: string;
  unitId: string;
  title: string;
  explanation: string;
  examples: string[];
}

export interface ExtensionCategory {
  id: string;
  name: string;
  description: string;
}

export interface ExtensionWord {
  id: string;
  categoryId: string;
  english: string;
  chinese: string;
  partOfSpeech: string;
  difficulty: "基础" | "进阶" | "易错";
}

export interface ExtensionPhrase {
  id: string;
  categoryId: string;
  english: string;
  chinese: string;
  difficulty: "基础" | "进阶" | "易错";
}

export interface PracticePaper {
  id: string;
  title: string;
  sourceMode: "knowledge" | "extension";
  bookId?: string;
  unitId?: string;
  categoryIds?: string[];
  questions: PracticeQuestion[];
  createdAt: string;
}

export interface PracticeQuestion {
  id: string;
  sourceId: string;
  sourceType: SourceType;
  questionType: QuestionType;
  prompt: string;
  correctAnswer: string;
  sourceLabel: string;
}

export interface PracticeAttempt {
  id: string;
  paperId: string;
  submittedAt: string;
  total: number;
  correct: number;
  blank: number;
  spellingErrors: number;
  punctuationErrors: number;
  wrong: number;
  score: number;
  answers: PracticeAnswer[];
}

export interface PracticeAnswer {
  questionId: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  errorType: ErrorType;
  feedback: string;
}

export interface WrongBookItem {
  id: string;
  questionId: string;
  sourceType: SourceType;
  questionType: QuestionType;
  sourceLabel: string;
  prompt: string;
  correctAnswer: string;
  studentAnswer: string;
  errorType: Exclude<ErrorType, "correct">;
  errorCount: number;
  firstWrongAt: string;
  lastWrongAt: string;
}
