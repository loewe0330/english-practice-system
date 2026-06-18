import {
  books,
  extensionCategories,
  extensionPhrases,
  extensionWords,
  grades,
  units,
} from "../data/index.ts";
import { removeJson, storageKeys, writeJson } from "./storage.ts";
import type {
  MergeParsedImportOptions,
  MergeParsedImportResult,
  ParsedKnowledgeImport,
} from "./import-types.ts";
import type { Book, GradeLevel, KnowledgeDataSet, Unit } from "./types.ts";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferGradeFromId(gradeId: string): GradeLevel {
  return {
    id: gradeId,
    stage: "primary",
    grade: 4,
    semester: "second",
    displayName: gradeId === "primary-g4b" ? "四年级下" : gradeId,
    sortOrder: gradeId === "primary-g4b" ? 402 : 999,
  };
}

function createBookFromParsed(parsedImport: ParsedKnowledgeImport, grade: GradeLevel, sortOrder: number): Book {
  return {
    id: parsedImport.bookId,
    gradeId: grade.id,
    stage: grade.stage,
    grade: grade.grade,
    semester: grade.semester,
    displayName: grade.displayName,
    name: parsedImport.bookName || parsedImport.bookId,
    publisher: "本地导入",
    sortOrder,
  };
}

function normalizeUnitId(parsedImport: ParsedKnowledgeImport) {
  return parsedImport.unitId || `${slugify(parsedImport.bookId)}-u${parsedImport.unitNo}`;
}

function parsedToUnit(parsedImport: ParsedKnowledgeImport): Unit {
  const unitId = normalizeUnitId(parsedImport);

  return {
    id: unitId,
    gradeId: parsedImport.gradeId,
    bookId: parsedImport.bookId,
    unitNo: parsedImport.unitNo,
    displayName: `Unit${parsedImport.unitNo}`,
    name: `Unit${parsedImport.unitNo}`,
    title: parsedImport.unitTitle || `Unit${parsedImport.unitNo}`,
    order: parsedImport.unitNo,
    words: parsedImport.words.map((word, index) => ({
      id: `${unitId}-word-import-${String(index + 1).padStart(3, "0")}`,
      gradeId: parsedImport.gradeId,
      bookId: parsedImport.bookId,
      unitId,
      english: word.en,
      chinese: word.zh,
      partOfSpeech: word.pos,
      sortOrder: word.order || index + 1,
      isRequired: word.required,
    })),
    phrases: parsedImport.phrases.map((phrase, index) => ({
      id: `${unitId}-phrase-import-${String(index + 1).padStart(3, "0")}`,
      gradeId: parsedImport.gradeId,
      bookId: parsedImport.bookId,
      unitId,
      english: phrase.en,
      chinese: phrase.zh,
      sortOrder: phrase.order || index + 1,
      isRequired: phrase.required,
    })),
    sentences: parsedImport.sentences.map((sentence, index) => ({
      id: `${unitId}-sentence-import-${String(index + 1).padStart(3, "0")}`,
      gradeId: parsedImport.gradeId,
      bookId: parsedImport.bookId,
      unitId,
      english: sentence.en,
      chinese: sentence.zh,
      sortOrder: sentence.order || index + 1,
      isRequired: sentence.required,
    })),
    grammarPoints: parsedImport.grammarPoints.map((point, index) => ({
      id: `${unitId}-grammar-import-${String(index + 1).padStart(3, "0")}`,
      gradeId: parsedImport.gradeId,
      bookId: parsedImport.bookId,
      unitId,
      title: point.title,
      explanation: point.content,
      examples: point.examples,
      sortOrder: point.order || index + 1,
    })),
    phonics: parsedImport.phonics,
    writing: parsedImport.writing,
  };
}

function appendUnique<T extends { english?: string; chinese?: string; title?: string; explanation?: string; sortOrder: number }>(
  existingItems: T[],
  importedItems: T[],
) {
  const seen = new Set(
    existingItems.map((item) =>
      `${item.english ?? item.title ?? ""}::${item.chinese ?? item.explanation ?? ""}`.trim().toLowerCase(),
    ),
  );
  const nextItems = [...existingItems];

  importedItems.forEach((item) => {
    const key = `${item.english ?? item.title ?? ""}::${item.chinese ?? item.explanation ?? ""}`.trim().toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    nextItems.push({
      ...item,
      sortOrder: Math.max(0, ...nextItems.map((existingItem) => existingItem.sortOrder)) + 1,
    });
  });

  return nextItems;
}

function mergeUnit(existingUnit: Unit, importedUnit: Unit, replaceExistingUnit: boolean): Unit {
  if (replaceExistingUnit) {
    return importedUnit;
  }

  return {
    ...existingUnit,
    title: importedUnit.title || existingUnit.title,
    words: appendUnique(existingUnit.words, importedUnit.words),
    phrases: appendUnique(existingUnit.phrases, importedUnit.phrases),
    sentences: appendUnique(existingUnit.sentences, importedUnit.sentences),
    grammarPoints: appendUnique(existingUnit.grammarPoints, importedUnit.grammarPoints),
    phonics: [...new Set([...(existingUnit.phonics ?? []), ...(importedUnit.phonics ?? [])])],
    writing: [...new Set([...(existingUnit.writing ?? []), ...(importedUnit.writing ?? [])])],
  };
}

export function mergeParsedImportIntoData(
  parsedImport: ParsedKnowledgeImport,
  currentData: KnowledgeDataSet,
  options: MergeParsedImportOptions = {},
): MergeParsedImportResult {
  const data = cloneData(currentData);
  const unitId = normalizeUnitId(parsedImport);
  let createdGrade = false;
  let createdBook = false;
  let createdUnit = false;
  let replacedUnit = false;

  let grade = data.grades.find((item) => item.id === parsedImport.gradeId);
  if (!grade) {
    grade = inferGradeFromId(parsedImport.gradeId);
    data.grades.push(grade);
    createdGrade = true;
  }

  if (!data.books.some((book) => book.id === parsedImport.bookId)) {
    data.books.push(createBookFromParsed(parsedImport, grade, Math.max(0, ...data.books.map((book) => book.sortOrder)) + 1));
    createdBook = true;
  }

  const importedUnit = parsedToUnit({ ...parsedImport, unitId });
  const existingUnitIndex = data.units.findIndex((unit) => unit.id === unitId);

  if (existingUnitIndex < 0) {
    data.units.push(importedUnit);
    createdUnit = true;
  } else {
    data.units[existingUnitIndex] = mergeUnit(
      data.units[existingUnitIndex],
      importedUnit,
      Boolean(options.replaceExistingUnit),
    );
    replacedUnit = Boolean(options.replaceExistingUnit);
  }

  data.units.sort((a, b) => {
    const bookOrderA = data.books.find((book) => book.id === a.bookId)?.sortOrder ?? 999;
    const bookOrderB = data.books.find((book) => book.id === b.bookId)?.sortOrder ?? 999;
    return bookOrderA - bookOrderB || a.unitNo - b.unitNo;
  });

  return {
    data,
    unitId,
    createdGrade,
    createdBook,
    createdUnit,
    replacedUnit,
  };
}
