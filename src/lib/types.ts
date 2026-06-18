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

export interface GradeLevel {
  id: string;
  stage: "primary" | "junior" | "senior";
  grade: number;
  semester: "first" | "second";
  displayName: string;
  sortOrder: number;
}

export interface Book {
  id: string;
  gradeId: string;
  stage: "primary" | "junior" | "senior";
  grade: number;
  semester: "first" | "second";
  displayName: string;
  name: string;
  publisher: string;
  sortOrder: number;
}

export interface Unit {
  id: string;
  gradeId: string;
  bookId: string;
  unitNo: number;
  displayName: string;
  name: string;
  title: string;
  order: number;
  words: KnowledgeWord[];
  phrases: KnowledgePhrase[];
  sentences: KnowledgeSentence[];
  grammarPoints: GrammarPoint[];
  phonics?: string[];
  writing?: string[];
}

export interface KnowledgeWord {
  id: string;
  gradeId: string;
  bookId: string;
  unitId: string;
  english: string;
  chinese: string;
  partOfSpeech: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface KnowledgePhrase {
  id: string;
  gradeId: string;
  bookId: string;
  unitId: string;
  english: string;
  chinese: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface KnowledgeSentence {
  id: string;
  gradeId: string;
  bookId: string;
  unitId: string;
  english: string;
  chinese: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface GrammarPoint {
  id: string;
  gradeId: string;
  bookId: string;
  unitId: string;
  title: string;
  explanation: string;
  examples: string[];
  sortOrder: number;
}

export interface ExtensionCategory {
  id: string;
  gradeId?: string;
  recommendedGradeIds: string[];
  name: string;
  description: string;
}

export interface ExtensionWord {
  id: string;
  gradeId?: string;
  categoryId: string;
  recommendedGradeIds: string[];
  english: string;
  chinese: string;
  partOfSpeech: string;
  sortOrder: number;
  difficulty: "基础" | "进阶" | "易错";
}

export interface ExtensionPhrase {
  id: string;
  gradeId?: string;
  categoryId: string;
  recommendedGradeIds: string[];
  english: string;
  chinese: string;
  sortOrder: number;
  difficulty: "基础" | "进阶" | "易错";
}

export interface PracticePaper {
  id: string;
  title: string;
  sourceMode: "knowledge" | "extension" | "mixed";
  gradeId?: string;
  bookIds?: string[];
  unitIds?: string[];
  categoryIds?: string[];
  contentTypes?: PracticeContentType[];
  questions: PracticeQuestion[];
  createdAt: string;
}

export type PracticeContentType = "words" | "phrases" | "sentences" | "extension";

export interface PracticeQuestion {
  id: string;
  gradeId?: string;
  bookId?: string;
  unitId?: string;
  categoryId?: string;
  sourceId: string;
  sourceItemId: string;
  sourceType: SourceType;
  questionType: QuestionType;
  prompt: string;
  correctAnswer: string;
  sourceLabel: string;
}

export interface PracticeAttempt {
  id: string;
  paperId: string;
  title?: string;
  createdAt?: string;
  submittedAt: string;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  total: number;
  correct: number;
  blank: number;
  spellingErrors: number;
  punctuationErrors: number;
  wrong: number;
  score: number;
  sourceSummary?: string;
  paper?: PracticePaper;
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
  gradeId?: string;
  bookId?: string;
  unitId?: string;
  categoryId?: string;
  sourceType: SourceType;
  sourceItemId?: string;
  questionType: QuestionType;
  sourceLabel: string;
  prompt: string;
  correctAnswer: string;
  studentAnswer: string;
  errorType: Exclude<ErrorType, "correct">;
  wrongCount?: number;
  errorCount: number;
  firstWrongAt: string;
  lastWrongAt: string;
  mastered?: boolean;
}

export interface KnowledgeDataSet {
  grades: GradeLevel[];
  books: Book[];
  units: Unit[];
  extensionCategories: ExtensionCategory[];
  extensionWords: ExtensionWord[];
  extensionPhrases: ExtensionPhrase[];
}
