import type { KnowledgeDataSet } from "./types.ts";

export interface ParsedImportWord {
  id: string;
  en: string;
  zh: string;
  pos: string;
  order: number;
  required: boolean;
}

export interface ParsedImportPhrase {
  id: string;
  en: string;
  zh: string;
  order: number;
  required: boolean;
}

export interface ParsedImportSentence {
  id: string;
  en: string;
  zh: string;
  order: number;
  required: boolean;
}

export interface ParsedImportGrammarPoint {
  id: string;
  title: string;
  content: string;
  examples: string[];
  order: number;
}

export interface ParsedKnowledgeImport {
  gradeId: string;
  bookId: string;
  bookName: string;
  unitId: string;
  unitTitle: string;
  unitNo: number;
  words: ParsedImportWord[];
  phrases: ParsedImportPhrase[];
  sentences: ParsedImportSentence[];
  grammarPoints: ParsedImportGrammarPoint[];
  phonics: string[];
  writing: string[];
  warnings: string[];
}

export interface ParseKnowledgeTextOptions {
  gradeId: string;
  bookId: string;
  bookName: string;
  unitNo: number;
  unitTitle?: string;
}

export interface MergeParsedImportOptions {
  replaceExistingUnit?: boolean;
}

export interface MergeParsedImportResult {
  data: KnowledgeDataSet;
  unitId: string;
  createdGrade: boolean;
  createdBook: boolean;
  createdUnit: boolean;
  replacedUnit: boolean;
}
