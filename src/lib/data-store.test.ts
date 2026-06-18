import assert from "node:assert/strict";
import test from "node:test";
import {
  exportDataJson,
  getDefaultData,
  getEffectiveData,
  importDataJson,
  mergeParsedImportIntoData,
  type StorageLike,
} from "./data-store.ts";
import type { ParsedKnowledgeImport } from "./import-types.ts";

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("data override import and export round trip", () => {
  const storage = createMemoryStorage();
  const data = getDefaultData();
  const firstUnit = data.units[0];
  firstUnit.words[0] = { ...firstUnit.words[0], english: "changed-word" };

  const result = importDataJson(exportDataJson(data), storage);

  assert.equal(result.ok, true);
  assert.equal(getEffectiveData(storage).units[0].words[0].english, "changed-word");
});

test("data override rejects invalid JSON shape", () => {
  const storage = createMemoryStorage();
  const result = importDataJson(JSON.stringify({ units: [] }), storage);

  assert.equal(result.ok, false);
  assert.match(result.error, /grades/);
});

function createParsedImport(overrides: Partial<ParsedKnowledgeImport> = {}): ParsedKnowledgeImport {
  return {
    gradeId: "primary-g4b",
    bookId: "yilin-4b",
    bookName: "译林英语 4B",
    unitId: "yilin-4b-u2",
    unitTitle: "Unit2",
    unitNo: 2,
    words: [
      { id: "word-1", en: "new", zh: "新的", pos: "adj.", order: 1, required: true },
    ],
    phrases: [
      { id: "phrase-1", en: "try again", zh: "再试一次", order: 1, required: true },
    ],
    sentences: [
      { id: "sentence-1", en: "Try again.", zh: "再试一次。", order: 1, required: true },
    ],
    grammarPoints: [
      { id: "grammar-1", title: "祈使句", content: "用动词原形开头。", examples: ["Try again."], order: 1 },
    ],
    phonics: ["a /eɪ/"],
    writing: ["I can try again."],
    warnings: [],
    ...overrides,
  };
}

test("merge parsed import creates a new unit", () => {
  const data = getDefaultData();
  const result = mergeParsedImportIntoData(createParsedImport(), data);
  const importedUnit = result.data.units.find((unit) => unit.id === "yilin-4b-u2");

  assert.equal(result.createdUnit, true);
  assert.equal(importedUnit?.words[0].english, "new");
  assert.equal(importedUnit?.phonics?.[0], "a /eɪ/");
});

test("merge parsed import appends unique items to existing unit", () => {
  const data = getDefaultData();
  const existingUnit = data.units.find((unit) => unit.id === "yilin-4b-u1");
  assert.ok(existingUnit);
  const originalWordCount = existingUnit.words.length;
  const parsed = createParsedImport({
    unitId: "yilin-4b-u1",
    unitNo: 1,
    words: [
      { id: "duplicate-word", en: existingUnit.words[0].english, zh: existingUnit.words[0].chinese, pos: "adj.", order: 1, required: true },
      { id: "fresh-word", en: "fresh", zh: "新鲜的", pos: "adj.", order: 2, required: true },
    ],
  });
  const result = mergeParsedImportIntoData(parsed, data, { replaceExistingUnit: false });
  const mergedUnit = result.data.units.find((unit) => unit.id === "yilin-4b-u1");

  assert.equal(result.createdUnit, false);
  assert.equal(mergedUnit?.words.length, originalWordCount + 1);
  assert.ok(mergedUnit?.words.some((word) => word.english === "fresh"));
});

test("merge parsed import replaces existing unit when requested", () => {
  const data = getDefaultData();
  const parsed = createParsedImport({
    unitId: "yilin-4b-u1",
    unitNo: 1,
    words: [
      { id: "only-word", en: "only", zh: "唯一的", pos: "adj.", order: 1, required: true },
    ],
    phrases: [],
    sentences: [],
    grammarPoints: [],
  });
  const result = mergeParsedImportIntoData(parsed, data, { replaceExistingUnit: true });
  const mergedUnit = result.data.units.find((unit) => unit.id === "yilin-4b-u1");

  assert.equal(result.replacedUnit, true);
  assert.equal(mergedUnit?.words.length, 1);
  assert.equal(mergedUnit?.words[0].english, "only");
});
