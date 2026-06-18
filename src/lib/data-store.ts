import {
  books,
  extensionCategories,
  extensionPhrases,
  extensionWords,
  grades,
  units,
} from "../data/index.ts";
import { removeJson, storageKeys, writeJson } from "./storage.ts";
import type { KnowledgeDataSet, Unit } from "./types.ts";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined" || !window.localStorage) {
    return undefined;
  }

  return window.localStorage;
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDefaultData(): KnowledgeDataSet {
  return cloneData({
    grades,
    books,
    units,
    extensionCategories,
    extensionWords,
    extensionPhrases,
  });
}

function hasArrayProperty(value: unknown, key: keyof KnowledgeDataSet) {
  return Boolean(value && typeof value === "object" && Array.isArray((value as Record<string, unknown>)[key]));
}

export function validateDataSet(value: unknown): { ok: true; data: KnowledgeDataSet } | { ok: false; error: string } {
  const requiredKeys: (keyof KnowledgeDataSet)[] = [
    "grades",
    "books",
    "units",
    "extensionCategories",
    "extensionWords",
    "extensionPhrases",
  ];

  const missingKey = requiredKeys.find((key) => !hasArrayProperty(value, key));

  if (missingKey) {
    return { ok: false, error: `JSON 缺少数组字段：${missingKey}` };
  }

  const data = value as KnowledgeDataSet;
  const invalidUnit = data.units.find((unit) => !unit.id || !unit.gradeId || !unit.bookId);

  if (invalidUnit) {
    return { ok: false, error: `单元数据缺少 id / gradeId / bookId：${invalidUnit.id || "未知单元"}` };
  }

  const invalidUnitLists = data.units.find(
    (unit: Unit) =>
      !Array.isArray(unit.words) ||
      !Array.isArray(unit.phrases) ||
      !Array.isArray(unit.sentences) ||
      !Array.isArray(unit.grammarPoints),
  );

  if (invalidUnitLists) {
    return { ok: false, error: `单元内容必须包含 words / phrases / sentences / grammarPoints：${invalidUnitLists.id}` };
  }

  return { ok: true, data: cloneData(data) };
}

export function getDataOverride(storage: StorageLike | undefined = getBrowserStorage()) {
  const raw = storage?.getItem(storageKeys.dataOverride);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = validateDataSet(parsed);
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}

export function getEffectiveData(storage: StorageLike | undefined = getBrowserStorage()): KnowledgeDataSet {
  return getDataOverride(storage) ?? getDefaultData();
}

export function saveDataOverride(data: KnowledgeDataSet, storage?: StorageLike) {
  const result = validateDataSet(data);

  if (!result.ok) {
    throw new Error(result.error);
  }

  if (storage) {
    storage.setItem(storageKeys.dataOverride, JSON.stringify(result.data));
    return;
  }

  writeJson(storageKeys.dataOverride, result.data);
}

export function clearDataOverride(storage?: StorageLike) {
  if (storage) {
    storage.removeItem(storageKeys.dataOverride);
    return;
  }

  removeJson(storageKeys.dataOverride);
}

export function exportDataJson(data: KnowledgeDataSet = getEffectiveData()) {
  return JSON.stringify(data, null, 2);
}

export function importDataJson(json: string, storage?: StorageLike) {
  try {
    const parsed = JSON.parse(json) as unknown;
    const result = validateDataSet(parsed);

    if (!result.ok) {
      return result;
    }

    saveDataOverride(result.data, storage);
    return { ok: true as const, data: result.data };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? `JSON 解析失败：${error.message}` : "JSON 解析失败",
    };
  }
}
