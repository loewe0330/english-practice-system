import assert from "node:assert/strict";
import test from "node:test";
import { buildPracticePaper } from "./practice.ts";

test("builds a sorted multi-unit practice paper with source metadata", () => {
  const paper = buildPracticePaper({
    gradeId: "primary-g4b",
    bookIds: ["sm3", "yilin-4b"],
    unitIds: ["sm3-u5", "yilin-4b-u1", "yilin-4b-u3"],
    contentTypes: ["words", "phrases", "sentences", "extension"],
    categoryIds: ["ext-animal"],
    questionType: "zh_to_en",
  });

  assert.ok(paper.questions.length > 30);
  assert.equal(paper.gradeId, "primary-g4b");
  assert.deepEqual(paper.bookIds, ["sm3", "yilin-4b"]);
  assert.deepEqual(paper.unitIds, ["sm3-u5", "yilin-4b-u1", "yilin-4b-u3"]);

  const firstQuestion = paper.questions[0];
  assert.equal(firstQuestion.gradeId, "primary-g4b");
  assert.equal(firstQuestion.bookId, "yilin-4b");
  assert.equal(firstQuestion.unitId, "yilin-4b-u1");
  assert.equal(firstQuestion.sourceType, "knowledge_word");
  assert.equal(firstQuestion.sourceItemId, "yilin-4b-u1-word-001");
  assert.match(firstQuestion.sourceLabel, /四年级下 · 译林英语 4B · Unit1 · 单词/);

  const sourceLabels = paper.questions.map((question) => question.sourceLabel);
  assert.ok(sourceLabels.some((label) => label.includes("SM3 · Unit5 · 句子")));
  assert.ok(sourceLabels.some((label) => label.includes("拓展词汇 · 动物")));
});
