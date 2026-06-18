import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultData } from "./data-store.ts";
import { getDataReviewRows } from "./data-review.ts";

test("data review detects duplicates, Chinese characters in English, and missing sentence punctuation", () => {
  const data = getDefaultData();
  const unit = data.units[0];
  unit.words = [
    { ...unit.words[0], id: "word-a", english: "apple", chinese: "苹果" },
    { ...unit.words[1], id: "word-b", english: "apple", chinese: "苹果" },
    { ...unit.words[2], id: "word-c", english: "好good", chinese: "" },
  ];
  unit.sentences = [
    { ...unit.sentences[0], id: "sentence-a", english: "This is a sentence", chinese: "这是一个句子" },
  ];

  const rows = getDataReviewRows(data);
  const wordA = rows.find((row) => row.id === "word-a");
  const wordC = rows.find((row) => row.id === "word-c");
  const sentenceA = rows.find((row) => row.id === "sentence-a");

  assert.ok(wordA?.issues.some((issue) => issue.code === "duplicate_english"));
  assert.ok(wordA?.issues.some((issue) => issue.code === "duplicate_chinese"));
  assert.ok(wordC?.issues.some((issue) => issue.code === "english_has_chinese"));
  assert.ok(wordC?.issues.some((issue) => issue.code === "empty_chinese"));
  assert.ok(sentenceA?.issues.some((issue) => issue.code === "sentence_missing_punctuation"));
});
