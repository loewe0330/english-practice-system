import assert from "node:assert/strict";
import test from "node:test";
import {
  cloudRowsToKnowledgeData,
  isSupabaseConfigured,
  knowledgeDataToCloudRows,
  loadAttemptsFromCloud,
  loadCloudData,
  loadWrongBookFromCloud,
  practiceAttemptToCloudRows,
  saveAttemptToCloud,
  saveKnowledgeDataToCloud,
  saveWrongBookItemToCloud,
  wrongBookItemToCloudRow,
  type CloudKnowledgeRows,
} from "./cloud-data-store.ts";
import { getDefaultData } from "./data-store.ts";
import type { PracticeAttempt, WrongBookItem } from "./types.ts";

function withoutSupabaseEnv(run: () => void | Promise<void>) {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Promise.resolve(run()).finally(() => {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousAnonKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
    }
  });
}

test("isSupabaseConfigured returns false without public env", async () => {
  await withoutSupabaseEnv(() => {
    assert.equal(isSupabaseConfigured(), false);
  });
});

test("cloud data store safely degrades without Supabase env", async () => {
  await withoutSupabaseEnv(async () => {
    const data = getDefaultData();
    const wrongItem: WrongBookItem = {
      id: "wrong-1",
      questionId: "question-1",
      sourceType: "knowledge_word",
      questionType: "zh_to_en",
      sourceLabel: "四年级下 · 译林英语 4B · Unit1 · 单词",
      prompt: "强壮的",
      correctAnswer: "strong",
      studentAnswer: "streng",
      errorType: "spelling_error",
      wrongCount: 1,
      errorCount: 1,
      firstWrongAt: "2026-01-01T00:00:00.000Z",
      lastWrongAt: "2026-01-01T00:00:00.000Z",
    };
    const attempt: PracticeAttempt = {
      id: "attempt-1",
      paperId: "paper-1",
      submittedAt: "2026-01-01T00:00:00.000Z",
      total: 1,
      correct: 0,
      blank: 0,
      spellingErrors: 1,
      punctuationErrors: 0,
      wrong: 0,
      score: 0,
      answers: [
        {
          questionId: "question-1",
          studentAnswer: "streng",
          correctAnswer: "strong",
          isCorrect: false,
          errorType: "spelling_error",
          feedback: "拼写接近，注意细节。",
        },
      ],
    };

    const saveDataResult = await saveKnowledgeDataToCloud(data);
    const saveWrongResult = await saveWrongBookItemToCloud(wrongItem);
    const saveAttemptResult = await saveAttemptToCloud(attempt);

    assert.equal(saveDataResult.ok, false);
    assert.equal(saveWrongResult.ok, false);
    assert.equal(saveAttemptResult.ok, false);
    assert.deepEqual(await loadWrongBookFromCloud(), []);
    assert.deepEqual(await loadAttemptsFromCloud(), []);
    assert.equal((await loadCloudData()).grades.length, data.grades.length);
  });
});

test("knowledge data converts to Supabase row shape", () => {
  const data = getDefaultData();
  const rows = knowledgeDataToCloudRows(data);

  assert.equal(rows.grades[0].display_name, data.grades[0].displayName);
  assert.equal(rows.books[0].grade_id, data.books[0].gradeId);
  assert.equal(rows.units[0].unit_no, data.units[0].unitNo);
  assert.equal(rows.knowledgeWords[0].part_of_speech, data.units[0].words[0].partOfSpeech);
  assert.ok(rows.knowledgePhrases.length > 0);
  assert.ok(rows.knowledgeSentences.length > 0);
  assert.ok(rows.grammarPoints.length > 0);
});

test("cloud rows convert back to knowledge data", () => {
  const rows: CloudKnowledgeRows = {
    grades: [
      {
        id: "primary-g4b",
        stage: "primary",
        grade: 4,
        semester: "second",
        display_name: "四年级下",
        sort_order: 402,
      },
    ],
    books: [
      {
        id: "book-1",
        grade_id: "primary-g4b",
        stage: "primary",
        grade: 4,
        semester: "second",
        display_name: "四年级下",
        name: "测试教材",
        publisher: "测试",
        sort_order: 1,
      },
    ],
    units: [
      {
        id: "book-1-u1",
        grade_id: "primary-g4b",
        book_id: "book-1",
        unit_no: 1,
        display_name: "Unit1",
        name: "Unit1",
        title: "Friends",
        sort_order: 1,
        phonics: ["a /eɪ/"],
        writing: ["I have a friend."],
      },
    ],
    knowledgeWords: [
      {
        id: "word-1",
        grade_id: "primary-g4b",
        book_id: "book-1",
        unit_id: "book-1-u1",
        english: "friend",
        chinese: "朋友",
        part_of_speech: "n.",
        is_required: true,
        sort_order: 1,
      },
    ],
    knowledgePhrases: [],
    knowledgeSentences: [],
    grammarPoints: [],
    extensionCategories: [],
    extensionWords: [],
    extensionPhrases: [],
  };

  const data = cloudRowsToKnowledgeData(rows);

  assert.equal(data.grades[0].displayName, "四年级下");
  assert.equal(data.books[0].gradeId, "primary-g4b");
  assert.equal(data.units[0].words[0].english, "friend");
  assert.equal(data.units[0].phonics?.[0], "a /eɪ/");
});

test("practice attempts and wrong book items convert to cloud rows", () => {
  const attempt: PracticeAttempt = {
    id: "attempt-1",
    paperId: "paper-1",
    title: "Unit1 单词",
    createdAt: "2026-01-01T00:00:00.000Z",
    submittedAt: "2026-01-01T00:10:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    wrongCount: 0,
    total: 1,
    correct: 1,
    blank: 0,
    spellingErrors: 0,
    punctuationErrors: 0,
    wrong: 0,
    score: 100,
    sourceSummary: "四年级下 · 译林英语 4B · Unit1",
    paper: {
      id: "paper-1",
      title: "Unit1 单词",
      sourceMode: "knowledge",
      createdAt: "2026-01-01T00:00:00.000Z",
      questions: [
        {
          id: "question-1",
          gradeId: "primary-g4b",
          bookId: "yilin-4b",
          unitId: "yilin-4b-u1",
          sourceId: "yilin-4b-u1",
          sourceItemId: "word-1",
          sourceType: "knowledge_word",
          questionType: "zh_to_en",
          prompt: "强壮的",
          correctAnswer: "strong",
          sourceLabel: "四年级下 · 译林英语 4B · Unit1 · 单词",
        },
      ],
    },
    answers: [
      {
        questionId: "question-1",
        studentAnswer: "strong",
        correctAnswer: "strong",
        isCorrect: true,
        errorType: "correct",
        feedback: "正确",
      },
    ],
  };
  const wrongItem: WrongBookItem = {
    id: "wrong-1",
    questionId: "question-1",
    gradeId: "primary-g4b",
    bookId: "yilin-4b",
    unitId: "yilin-4b-u1",
    sourceType: "knowledge_word",
    sourceItemId: "word-1",
    questionType: "zh_to_en",
    sourceLabel: "四年级下 · 译林英语 4B · Unit1 · 单词",
    prompt: "强壮的",
    correctAnswer: "strong",
    studentAnswer: "streng",
    errorType: "spelling_error",
    wrongCount: 2,
    errorCount: 2,
    firstWrongAt: "2026-01-01T00:00:00.000Z",
    lastWrongAt: "2026-01-02T00:00:00.000Z",
    mastered: false,
  };

  const attemptRows = practiceAttemptToCloudRows(attempt);
  const wrongRow = wrongBookItemToCloudRow(wrongItem);

  assert.equal(attemptRows.attempt.total_questions, 1);
  assert.equal(attemptRows.answers[0].source_type, "knowledge_word");
  assert.equal(wrongRow.wrong_count, 2);
  assert.equal(wrongRow.source_item_id, "word-1");
});
