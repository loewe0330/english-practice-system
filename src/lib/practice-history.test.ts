import assert from "node:assert/strict";
import test from "node:test";
import { buildPracticePaper } from "./practice.ts";
import { enrichPracticeAttempt, summarizePracticeSources } from "./practice-history.ts";
import type { PracticeAttempt } from "./types.ts";

test("practice history enrichment stores summary and count fields", () => {
  const paper = buildPracticePaper({
    gradeId: "primary-g4b",
    bookIds: ["yilin-4b"],
    unitIds: ["yilin-4b-u1"],
    contentTypes: ["words"],
    questionType: "zh_to_en",
  });
  const attempt: PracticeAttempt = {
    id: "attempt-1",
    paperId: paper.id,
    submittedAt: "2026-06-18T00:00:00.000Z",
    total: paper.questions.length,
    correct: 2,
    blank: 1,
    spellingErrors: 0,
    punctuationErrors: 0,
    wrong: paper.questions.length - 3,
    score: 10,
    answers: [],
  };

  const enriched = enrichPracticeAttempt(attempt, paper);

  assert.equal(enriched.title, paper.title);
  assert.equal(enriched.createdAt, paper.createdAt);
  assert.equal(enriched.totalQuestions, paper.questions.length);
  assert.equal(enriched.correctCount, 2);
  assert.equal(enriched.wrongCount, paper.questions.length - 2);
  assert.equal(enriched.sourceSummary, summarizePracticeSources(paper));
  assert.equal(enriched.paper?.id, paper.id);
});
