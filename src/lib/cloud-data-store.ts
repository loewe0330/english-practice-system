import { getDefaultData } from "./data-store.ts";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/client.ts";
import type {
  Book,
  ErrorType,
  ExtensionPhrase,
  ExtensionWord,
  GradeLevel,
  GrammarPoint,
  KnowledgeDataSet,
  KnowledgePhrase,
  KnowledgeSentence,
  KnowledgeWord,
  PracticeAnswer,
  PracticeAttempt,
  QuestionType,
  SourceType,
  Unit,
  WrongBookItem,
} from "./types.ts";

type Stage = GradeLevel["stage"];
type Semester = GradeLevel["semester"];

export interface CloudOperationResult {
  ok: boolean;
  message: string;
}

export interface GradeRow {
  id: string;
  stage: string;
  grade: number;
  semester: string;
  display_name: string;
  sort_order: number;
}

export interface BookRow {
  id: string;
  grade_id: string;
  stage: string;
  grade: number;
  semester: string;
  display_name: string;
  name: string;
  publisher: string;
  sort_order: number;
}

export interface UnitRow {
  id: string;
  grade_id: string;
  book_id: string;
  unit_no: number;
  display_name: string;
  name: string;
  title: string;
  sort_order: number;
  phonics: unknown;
  writing: unknown;
}

export interface KnowledgeWordRow {
  id: string;
  grade_id: string;
  book_id: string;
  unit_id: string;
  english: string;
  chinese: string;
  part_of_speech: string;
  is_required: boolean;
  sort_order: number;
}

export interface KnowledgePhraseRow {
  id: string;
  grade_id: string;
  book_id: string;
  unit_id: string;
  english: string;
  chinese: string;
  is_required: boolean;
  sort_order: number;
}

export type KnowledgeSentenceRow = KnowledgePhraseRow;

export interface GrammarPointRow {
  id: string;
  grade_id: string;
  book_id: string;
  unit_id: string;
  title: string;
  explanation: string;
  examples: unknown;
  sort_order: number;
}

export interface ExtensionCategoryRow {
  id: string;
  grade_id?: string | null;
  recommended_grade_ids: unknown;
  name: string;
  description: string;
}

export interface ExtensionWordRow {
  id: string;
  grade_id?: string | null;
  category_id: string;
  recommended_grade_ids: unknown;
  english: string;
  chinese: string;
  part_of_speech: string;
  difficulty: string;
  sort_order: number;
}

export interface ExtensionPhraseRow {
  id: string;
  grade_id?: string | null;
  category_id: string;
  recommended_grade_ids: unknown;
  english: string;
  chinese: string;
  difficulty: string;
  sort_order: number;
}

export interface PracticeAttemptRow {
  id: string;
  paper_id: string;
  title: string;
  created_at?: string | null;
  submitted_at: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  blank_count: number;
  spelling_error_count: number;
  punctuation_error_count: number;
  score: number;
  source_summary: string;
  paper?: unknown;
}

export interface PracticeAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  grade_id?: string | null;
  book_id?: string | null;
  unit_id?: string | null;
  category_id?: string | null;
  source_type?: string | null;
  source_item_id?: string | null;
  question_type?: string | null;
  source_label: string;
  prompt: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  error_type: string;
  feedback: string;
}

export interface WrongBookItemRow {
  id: string;
  question_id: string;
  grade_id?: string | null;
  book_id?: string | null;
  unit_id?: string | null;
  category_id?: string | null;
  source_type: string;
  source_item_id?: string | null;
  question_type: string;
  source_label: string;
  prompt: string;
  correct_answer: string;
  student_answer: string;
  error_type: string;
  wrong_count: number;
  error_count: number;
  first_wrong_at: string;
  last_wrong_at: string;
  mastered: boolean;
}

export interface CloudKnowledgeRows {
  grades: GradeRow[];
  books: BookRow[];
  units: UnitRow[];
  knowledgeWords: KnowledgeWordRow[];
  knowledgePhrases: KnowledgePhraseRow[];
  knowledgeSentences: KnowledgeSentenceRow[];
  grammarPoints: GrammarPointRow[];
  extensionCategories: ExtensionCategoryRow[];
  extensionWords: ExtensionWordRow[];
  extensionPhrases: ExtensionPhraseRow[];
}

const knowledgeTableNames = [
  "extension_phrases",
  "extension_words",
  "extension_categories",
  "grammar_points",
  "knowledge_sentences",
  "knowledge_phrases",
  "knowledge_words",
  "units",
  "books",
  "grades",
] as const;

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asStage(value: string): Stage {
  return value === "junior" || value === "senior" ? value : "primary";
}

function asSemester(value: string): Semester {
  return value === "first" ? "first" : "second";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asDifficulty(value: string): ExtensionWord["difficulty"] {
  if (value === "进阶" || value === "易错") {
    return value;
  }

  return "基础";
}

function asSourceType(value: string | null | undefined): SourceType {
  const sourceTypes: SourceType[] = [
    "knowledge_word",
    "knowledge_phrase",
    "knowledge_sentence",
    "extension_word",
    "extension_phrase",
    "grammar",
  ];
  return sourceTypes.includes(value as SourceType) ? (value as SourceType) : "knowledge_word";
}

function asQuestionType(value: string | null | undefined): QuestionType {
  const questionTypes: QuestionType[] = ["zh_to_en", "en_to_zh", "choice", "fill_blank"];
  return questionTypes.includes(value as QuestionType) ? (value as QuestionType) : "zh_to_en";
}

function asErrorType(value: string): ErrorType {
  const errorTypes: ErrorType[] = ["correct", "blank", "spelling_error", "punctuation_error", "wrong"];
  return errorTypes.includes(value as ErrorType) ? (value as ErrorType) : "wrong";
}

function asWrongErrorType(value: string): Exclude<ErrorType, "correct"> {
  const errorType = asErrorType(value);
  return errorType === "correct" ? "wrong" : errorType;
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

export function knowledgeDataToCloudRows(data: KnowledgeDataSet): CloudKnowledgeRows {
  const knowledgeWords: KnowledgeWordRow[] = [];
  const knowledgePhrases: KnowledgePhraseRow[] = [];
  const knowledgeSentences: KnowledgeSentenceRow[] = [];
  const grammarPoints: GrammarPointRow[] = [];

  data.units.forEach((unit) => {
    knowledgeWords.push(
      ...unit.words.map((word) => ({
        id: word.id,
        grade_id: word.gradeId,
        book_id: word.bookId,
        unit_id: word.unitId,
        english: word.english,
        chinese: word.chinese,
        part_of_speech: word.partOfSpeech,
        is_required: word.isRequired,
        sort_order: word.sortOrder,
      })),
    );

    knowledgePhrases.push(
      ...unit.phrases.map((phrase) => ({
        id: phrase.id,
        grade_id: phrase.gradeId,
        book_id: phrase.bookId,
        unit_id: phrase.unitId,
        english: phrase.english,
        chinese: phrase.chinese,
        is_required: phrase.isRequired,
        sort_order: phrase.sortOrder,
      })),
    );

    knowledgeSentences.push(
      ...unit.sentences.map((sentence) => ({
        id: sentence.id,
        grade_id: sentence.gradeId,
        book_id: sentence.bookId,
        unit_id: sentence.unitId,
        english: sentence.english,
        chinese: sentence.chinese,
        is_required: sentence.isRequired,
        sort_order: sentence.sortOrder,
      })),
    );

    grammarPoints.push(
      ...unit.grammarPoints.map((point) => ({
        id: point.id,
        grade_id: point.gradeId,
        book_id: point.bookId,
        unit_id: point.unitId,
        title: point.title,
        explanation: point.explanation,
        examples: point.examples,
        sort_order: point.sortOrder,
      })),
    );
  });

  return {
    grades: data.grades.map((grade) => ({
      id: grade.id,
      stage: grade.stage,
      grade: grade.grade,
      semester: grade.semester,
      display_name: grade.displayName,
      sort_order: grade.sortOrder,
    })),
    books: data.books.map((book) => ({
      id: book.id,
      grade_id: book.gradeId,
      stage: book.stage,
      grade: book.grade,
      semester: book.semester,
      display_name: book.displayName,
      name: book.name,
      publisher: book.publisher,
      sort_order: book.sortOrder,
    })),
    units: data.units.map((unit) => ({
      id: unit.id,
      grade_id: unit.gradeId,
      book_id: unit.bookId,
      unit_no: unit.unitNo,
      display_name: unit.displayName,
      name: unit.name,
      title: unit.title,
      sort_order: unit.order,
      phonics: unit.phonics ?? [],
      writing: unit.writing ?? [],
    })),
    knowledgeWords,
    knowledgePhrases,
    knowledgeSentences,
    grammarPoints,
    extensionCategories: data.extensionCategories.map((category) => ({
      id: category.id,
      grade_id: category.gradeId ?? null,
      recommended_grade_ids: category.recommendedGradeIds,
      name: category.name,
      description: category.description,
    })),
    extensionWords: data.extensionWords.map((word) => ({
      id: word.id,
      grade_id: word.gradeId ?? null,
      category_id: word.categoryId,
      recommended_grade_ids: word.recommendedGradeIds,
      english: word.english,
      chinese: word.chinese,
      part_of_speech: word.partOfSpeech,
      difficulty: word.difficulty,
      sort_order: word.sortOrder,
    })),
    extensionPhrases: data.extensionPhrases.map((phrase) => ({
      id: phrase.id,
      grade_id: phrase.gradeId ?? null,
      category_id: phrase.categoryId,
      recommended_grade_ids: phrase.recommendedGradeIds,
      english: phrase.english,
      chinese: phrase.chinese,
      difficulty: phrase.difficulty,
      sort_order: phrase.sortOrder,
    })),
  };
}

export function cloudRowsToKnowledgeData(rows: CloudKnowledgeRows): KnowledgeDataSet {
  const wordsByUnit = new Map<string, KnowledgeWord[]>();
  const phrasesByUnit = new Map<string, KnowledgePhrase[]>();
  const sentencesByUnit = new Map<string, KnowledgeSentence[]>();
  const grammarByUnit = new Map<string, GrammarPoint[]>();

  rows.knowledgeWords.forEach((row) => {
    const items = wordsByUnit.get(row.unit_id) ?? [];
    items.push({
      id: row.id,
      gradeId: row.grade_id,
      bookId: row.book_id,
      unitId: row.unit_id,
      english: row.english,
      chinese: row.chinese,
      partOfSpeech: row.part_of_speech,
      sortOrder: row.sort_order,
      isRequired: row.is_required,
    });
    wordsByUnit.set(row.unit_id, items);
  });

  rows.knowledgePhrases.forEach((row) => {
    const items = phrasesByUnit.get(row.unit_id) ?? [];
    items.push({
      id: row.id,
      gradeId: row.grade_id,
      bookId: row.book_id,
      unitId: row.unit_id,
      english: row.english,
      chinese: row.chinese,
      sortOrder: row.sort_order,
      isRequired: row.is_required,
    });
    phrasesByUnit.set(row.unit_id, items);
  });

  rows.knowledgeSentences.forEach((row) => {
    const items = sentencesByUnit.get(row.unit_id) ?? [];
    items.push({
      id: row.id,
      gradeId: row.grade_id,
      bookId: row.book_id,
      unitId: row.unit_id,
      english: row.english,
      chinese: row.chinese,
      sortOrder: row.sort_order,
      isRequired: row.is_required,
    });
    sentencesByUnit.set(row.unit_id, items);
  });

  rows.grammarPoints.forEach((row) => {
    const items = grammarByUnit.get(row.unit_id) ?? [];
    items.push({
      id: row.id,
      gradeId: row.grade_id,
      bookId: row.book_id,
      unitId: row.unit_id,
      title: row.title,
      explanation: row.explanation,
      examples: asStringArray(row.examples),
      sortOrder: row.sort_order,
    });
    grammarByUnit.set(row.unit_id, items);
  });

  const sortByOrder = <T extends { sortOrder: number }>(items: T[]) =>
    [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    grades: rows.grades
      .map<GradeLevel>((row) => ({
        id: row.id,
        stage: asStage(row.stage),
        grade: row.grade,
        semester: asSemester(row.semester),
        displayName: row.display_name,
        sortOrder: row.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    books: rows.books
      .map<Book>((row) => ({
        id: row.id,
        gradeId: row.grade_id,
        stage: asStage(row.stage),
        grade: row.grade,
        semester: asSemester(row.semester),
        displayName: row.display_name,
        name: row.name,
        publisher: row.publisher,
        sortOrder: row.sort_order,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    units: rows.units
      .map<Unit>((row) => ({
        id: row.id,
        gradeId: row.grade_id,
        bookId: row.book_id,
        unitNo: row.unit_no,
        displayName: row.display_name,
        name: row.name,
        title: row.title,
        order: row.sort_order,
        words: sortByOrder(wordsByUnit.get(row.id) ?? []),
        phrases: sortByOrder(phrasesByUnit.get(row.id) ?? []),
        sentences: sortByOrder(sentencesByUnit.get(row.id) ?? []),
        grammarPoints: sortByOrder(grammarByUnit.get(row.id) ?? []),
        phonics: asStringArray(row.phonics),
        writing: asStringArray(row.writing),
      }))
      .sort((a, b) => a.order - b.order),
    extensionCategories: rows.extensionCategories.map((row) => ({
      id: row.id,
      gradeId: row.grade_id ?? undefined,
      recommendedGradeIds: asStringArray(row.recommended_grade_ids),
      name: row.name,
      description: row.description,
    })),
    extensionWords: rows.extensionWords
      .map<ExtensionWord>((row) => ({
        id: row.id,
        gradeId: row.grade_id ?? undefined,
        categoryId: row.category_id,
        recommendedGradeIds: asStringArray(row.recommended_grade_ids),
        english: row.english,
        chinese: row.chinese,
        partOfSpeech: row.part_of_speech,
        sortOrder: row.sort_order,
        difficulty: asDifficulty(row.difficulty),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    extensionPhrases: rows.extensionPhrases
      .map<ExtensionPhrase>((row) => ({
        id: row.id,
        gradeId: row.grade_id ?? undefined,
        categoryId: row.category_id,
        recommendedGradeIds: asStringArray(row.recommended_grade_ids),
        english: row.english,
        chinese: row.chinese,
        sortOrder: row.sort_order,
        difficulty: asDifficulty(row.difficulty),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function practiceAttemptToCloudRows(attempt: PracticeAttempt) {
  const questionMap = new Map(attempt.paper?.questions.map((question) => [question.id, question]) ?? []);
  const attemptRow: PracticeAttemptRow = {
    id: attempt.id,
    paper_id: attempt.paperId,
    title: attempt.title ?? attempt.paper?.title ?? "未命名练习",
    created_at: attempt.createdAt ?? attempt.paper?.createdAt ?? null,
    submitted_at: attempt.submittedAt,
    total_questions: attempt.totalQuestions ?? attempt.total,
    correct_count: attempt.correctCount ?? attempt.correct,
    wrong_count: attempt.wrongCount ?? attempt.wrong,
    blank_count: attempt.blank,
    spelling_error_count: attempt.spellingErrors,
    punctuation_error_count: attempt.punctuationErrors,
    score: attempt.score,
    source_summary: attempt.sourceSummary ?? "",
    paper: attempt.paper ? cloneData(attempt.paper) : null,
  };

  const answerRows: PracticeAnswerRow[] = attempt.answers.map((answer) => {
    const question = questionMap.get(answer.questionId);

    return {
      id: `${sanitizeId(attempt.id)}-${sanitizeId(answer.questionId)}`,
      attempt_id: attempt.id,
      question_id: answer.questionId,
      grade_id: question?.gradeId ?? null,
      book_id: question?.bookId ?? null,
      unit_id: question?.unitId ?? null,
      category_id: question?.categoryId ?? null,
      source_type: question?.sourceType ?? null,
      source_item_id: question?.sourceItemId ?? null,
      question_type: question?.questionType ?? null,
      source_label: question?.sourceLabel ?? "",
      prompt: question?.prompt ?? "",
      student_answer: answer.studentAnswer,
      correct_answer: answer.correctAnswer,
      is_correct: answer.isCorrect,
      error_type: answer.errorType,
      feedback: answer.feedback,
    };
  });

  return { attempt: attemptRow, answers: answerRows };
}

export function wrongBookItemToCloudRow(item: WrongBookItem): WrongBookItemRow {
  return {
    id: item.id,
    question_id: item.questionId,
    grade_id: item.gradeId ?? null,
    book_id: item.bookId ?? null,
    unit_id: item.unitId ?? null,
    category_id: item.categoryId ?? null,
    source_type: item.sourceType,
    source_item_id: item.sourceItemId ?? null,
    question_type: item.questionType,
    source_label: item.sourceLabel,
    prompt: item.prompt,
    correct_answer: item.correctAnswer,
    student_answer: item.studentAnswer,
    error_type: item.errorType,
    wrong_count: item.wrongCount ?? item.errorCount ?? 1,
    error_count: item.errorCount ?? item.wrongCount ?? 1,
    first_wrong_at: item.firstWrongAt,
    last_wrong_at: item.lastWrongAt,
    mastered: item.mastered ?? false,
  };
}

async function selectAll<T>(tableName: string): Promise<T[]> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from(tableName).select("*");
  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

async function clearTable(tableName: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from(tableName).delete().neq("id", "__no_matching_id__");
  if (error) {
    throw error;
  }
}

async function upsertRows<T extends { id: string }>(tableName: string, rows: T[]) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase || rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(tableName).upsert(rows);
  if (error) {
    throw error;
  }
}

function notConfiguredResult(): CloudOperationResult {
  return { ok: false, message: "Supabase 未配置，当前仍使用本地 localStorage 模式。" };
}

export async function loadCloudData(): Promise<KnowledgeDataSet> {
  if (!isSupabaseConfigured()) {
    return getDefaultData();
  }

  try {
    const rows: CloudKnowledgeRows = {
      grades: await selectAll<GradeRow>("grades"),
      books: await selectAll<BookRow>("books"),
      units: await selectAll<UnitRow>("units"),
      knowledgeWords: await selectAll<KnowledgeWordRow>("knowledge_words"),
      knowledgePhrases: await selectAll<KnowledgePhraseRow>("knowledge_phrases"),
      knowledgeSentences: await selectAll<KnowledgeSentenceRow>("knowledge_sentences"),
      grammarPoints: await selectAll<GrammarPointRow>("grammar_points"),
      extensionCategories: await selectAll<ExtensionCategoryRow>("extension_categories"),
      extensionWords: await selectAll<ExtensionWordRow>("extension_words"),
      extensionPhrases: await selectAll<ExtensionPhraseRow>("extension_phrases"),
    };

    return cloudRowsToKnowledgeData(rows);
  } catch (error) {
    console.error("loadCloudData failed", error);
    return getDefaultData();
  }
}

export async function saveKnowledgeDataToCloud(data: KnowledgeDataSet): Promise<CloudOperationResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredResult();
  }

  try {
    const rows = knowledgeDataToCloudRows(data);

    for (const tableName of knowledgeTableNames) {
      await clearTable(tableName);
    }

    await upsertRows("grades", rows.grades);
    await upsertRows("books", rows.books);
    await upsertRows("units", rows.units);
    await upsertRows("knowledge_words", rows.knowledgeWords);
    await upsertRows("knowledge_phrases", rows.knowledgePhrases);
    await upsertRows("knowledge_sentences", rows.knowledgeSentences);
    await upsertRows("grammar_points", rows.grammarPoints);
    await upsertRows("extension_categories", rows.extensionCategories);
    await upsertRows("extension_words", rows.extensionWords);
    await upsertRows("extension_phrases", rows.extensionPhrases);

    return { ok: true, message: "知识库数据已上传到 Supabase。" };
  } catch (error) {
    console.error("saveKnowledgeDataToCloud failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "上传知识库失败。" };
  }
}

export async function saveAttemptToCloud(attempt: PracticeAttempt): Promise<CloudOperationResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredResult();
  }

  try {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return notConfiguredResult();
    }

    const rows = practiceAttemptToCloudRows(attempt);
    await upsertRows("practice_attempts", [rows.attempt]);

    const { error: deleteError } = await supabase.from("practice_answers").delete().eq("attempt_id", attempt.id);
    if (deleteError) {
      throw deleteError;
    }

    await upsertRows("practice_answers", rows.answers);
    return { ok: true, message: "练习历史已上传到 Supabase。" };
  } catch (error) {
    console.error("saveAttemptToCloud failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "上传练习历史失败。" };
  }
}

export async function saveWrongBookItemToCloud(item: WrongBookItem): Promise<CloudOperationResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredResult();
  }

  try {
    await upsertRows("wrong_book_items", [wrongBookItemToCloudRow(item)]);
    return { ok: true, message: "错题已上传到 Supabase。" };
  } catch (error) {
    console.error("saveWrongBookItemToCloud failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "上传错题失败。" };
  }
}

export async function loadWrongBookFromCloud(): Promise<WrongBookItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const rows = await selectAll<WrongBookItemRow>("wrong_book_items");

    return rows.map((row) => ({
      id: row.id,
      questionId: row.question_id,
      gradeId: row.grade_id ?? undefined,
      bookId: row.book_id ?? undefined,
      unitId: row.unit_id ?? undefined,
      categoryId: row.category_id ?? undefined,
      sourceType: asSourceType(row.source_type),
      sourceItemId: row.source_item_id ?? undefined,
      questionType: asQuestionType(row.question_type),
      sourceLabel: row.source_label,
      prompt: row.prompt,
      correctAnswer: row.correct_answer,
      studentAnswer: row.student_answer,
      errorType: asWrongErrorType(row.error_type),
      wrongCount: row.wrong_count,
      errorCount: row.error_count,
      firstWrongAt: row.first_wrong_at,
      lastWrongAt: row.last_wrong_at,
      mastered: row.mastered,
    }));
  } catch (error) {
    console.error("loadWrongBookFromCloud failed", error);
    return [];
  }
}

export async function loadAttemptsFromCloud(): Promise<PracticeAttempt[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const attempts = await selectAll<PracticeAttemptRow>("practice_attempts");
    const answers = await selectAll<PracticeAnswerRow>("practice_answers");
    const answersByAttempt = new Map<string, PracticeAnswerRow[]>();

    answers.forEach((answer) => {
      const items = answersByAttempt.get(answer.attempt_id) ?? [];
      items.push(answer);
      answersByAttempt.set(answer.attempt_id, items);
    });

    return attempts
      .map<PracticeAttempt>((attempt) => ({
        id: attempt.id,
        paperId: attempt.paper_id,
        title: attempt.title,
        createdAt: attempt.created_at ?? undefined,
        submittedAt: attempt.submitted_at,
        totalQuestions: attempt.total_questions,
        correctCount: attempt.correct_count,
        wrongCount: attempt.wrong_count,
        total: attempt.total_questions,
        correct: attempt.correct_count,
        blank: attempt.blank_count,
        spellingErrors: attempt.spelling_error_count,
        punctuationErrors: attempt.punctuation_error_count,
        wrong: attempt.wrong_count,
        score: attempt.score,
        sourceSummary: attempt.source_summary,
        paper: typeof attempt.paper === "object" && attempt.paper ? (attempt.paper as PracticeAttempt["paper"]) : undefined,
        answers: (answersByAttempt.get(attempt.id) ?? []).map<PracticeAnswer>((answer) => ({
          questionId: answer.question_id,
          studentAnswer: answer.student_answer,
          correctAnswer: answer.correct_answer,
          isCorrect: answer.is_correct,
          errorType: asErrorType(answer.error_type),
          feedback: answer.feedback,
        })),
      }))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  } catch (error) {
    console.error("loadAttemptsFromCloud failed", error);
    return [];
  }
}

export { isSupabaseConfigured };
