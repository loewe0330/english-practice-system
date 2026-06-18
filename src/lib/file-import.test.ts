import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  getSupportedImportKind,
  isHiddenArchiveEntry,
  parseImportedFiles,
  readZipFile,
} from "./file-import.ts";

const defaults = {
  gradeId: "primary-g4b",
  bookId: "yilin-4b",
  bookName: "译林英语 4B",
  unitNo: 1,
  unitTitle: "Unit1",
};

function createTextFile(name: string, content: string, type = "text/plain") {
  return new File([content], name, { type });
}

test("recognizes supported import extensions", () => {
  assert.equal(getSupportedImportKind("Unit1.txt"), "txt");
  assert.equal(getSupportedImportKind("Unit1.MD"), "md");
  assert.equal(getSupportedImportKind("data.json"), "json");
  assert.equal(getSupportedImportKind("paper.docx"), "docx");
  assert.equal(getSupportedImportKind("paper.pdf"), "pdf");
  assert.equal(getSupportedImportKind("batch.zip"), "zip");
  assert.equal(getSupportedImportKind("image.png"), null);
});

test("filters hidden zip entries", () => {
  assert.equal(isHiddenArchiveEntry("__MACOSX/file.txt"), true);
  assert.equal(isHiddenArchiveEntry(".DS_Store"), true);
  assert.equal(isHiddenArchiveEntry("folder/.hidden.txt"), true);
  assert.equal(isHiddenArchiveEntry("folder/unit1.txt"), false);
});

test("marks unsupported files in parse batch", async () => {
  const batch = await parseImportedFiles([createTextFile("image.png", "x", "image/png")], defaults);

  assert.equal(batch.unsupportedCount, 1);
  assert.equal(batch.files[0].status, "unsupported");
});

test("empty text produces friendly failed result", async () => {
  const batch = await parseImportedFiles([createTextFile("Unit1.txt", "")], defaults);

  assert.equal(batch.failedCount, 1);
  assert.equal(batch.files[0].status, "failed");
  assert.match(batch.files[0].error ?? "", /没有解析出/);
});

test("zip reader ignores hidden files and reports unsupported entries", async () => {
  const zip = new JSZip();
  zip.file("__MACOSX/hidden.txt", "ignored");
  zip.file(".DS_Store", "ignored");
  zip.file("Unit1.txt", "一、四会词&词组\nstrong adj. 强壮的");
  zip.file("image.png", "not supported");
  const file = new File([await zip.generateAsync({ type: "uint8array" })], "batch.zip", { type: "application/zip" });
  const results = await readZipFile(file);

  assert.equal(results.length, 2);
  assert.ok(results.some((result) => result.fileName === "Unit1.txt" && result.rawText?.includes("strong")));
  assert.ok(results.some((result) => result.fileName === "image.png" && result.status === "unsupported"));
});
