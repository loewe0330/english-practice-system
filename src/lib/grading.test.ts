import assert from "node:assert/strict";
import test from "node:test";
import { gradeAnswer, normalizeAnswer } from "./grading.ts";

test("normalizes case, spaces, final punctuation, and curly quotes", () => {
  assert.equal(normalizeAnswer("  Let’s   have a fruit party！ "), "let's have a fruit party");
});

test("grades blank, correct, punctuation, spelling, and wrong answers", () => {
  assert.deepEqual(gradeAnswer("", "strong").errorType, "blank");
  assert.deepEqual(gradeAnswer("Strong", "strong").errorType, "correct");
  assert.deepEqual(gradeAnswer("strong!", "strong").errorType, "punctuation_error");
  assert.deepEqual(gradeAnswer("frendship", "friendship").errorType, "spelling_error");
  assert.deepEqual(gradeAnswer("forest", "friendship").errorType, "wrong");
});
