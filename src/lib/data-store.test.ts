import assert from "node:assert/strict";
import test from "node:test";
import {
  exportDataJson,
  getDefaultData,
  getEffectiveData,
  importDataJson,
  type StorageLike,
} from "./data-store.ts";

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
