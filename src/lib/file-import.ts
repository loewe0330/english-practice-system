import JSZip from "jszip";
import { inferImportMetadata, parseKnowledgeText } from "./import-parser.ts";
import { validateDataSet } from "./data-store.ts";
import type {
  ImportBatchResult,
  ImportedFileResult,
  ParseKnowledgeTextOptions,
  ParsedKnowledgeImport,
} from "./import-types.ts";

export type SupportedImportKind = "txt" | "md" | "json" | "docx" | "pdf" | "zip";

const supportedExtensions = new Set(["txt", "md", "json", "docx", "pdf", "zip"]);

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function extensionFromName(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function fileTypeFromName(fileName: string, fallback = "") {
  return extensionFromName(fileName) || fallback || "unknown";
}

export function getSupportedImportKind(fileName: string): SupportedImportKind | null {
  const extension = extensionFromName(fileName);
  return supportedExtensions.has(extension) ? (extension as SupportedImportKind) : null;
}

export function isHiddenArchiveEntry(fileName: string) {
  return fileName
    .split("/")
    .some((part) => !part || part === "__MACOSX" || part === ".DS_Store" || part.startsWith("."));
}

function baseResult(file: Pick<File, "name" | "size" | "type">, status: ImportedFileResult["status"]): ImportedFileResult {
  return {
    id: createId("file"),
    fileName: file.name,
    fileType: fileTypeFromName(file.name, file.type),
    fileSize: file.size,
    status,
    warnings: [],
    selected: true,
  };
}

function unsupportedResult(file: Pick<File, "name" | "size" | "type">): ImportedFileResult {
  return {
    ...baseResult(file, "unsupported"),
    error: "文件类型不支持。",
    selected: false,
  };
}

function failedResult(file: Pick<File, "name" | "size" | "type">, error: string): ImportedFileResult {
  return {
    ...baseResult(file, "failed"),
    error,
    selected: false,
  };
}

export async function readTextFile(file: File): Promise<string> {
  return file.text();
}

export async function readMarkdownFile(file: File): Promise<string> {
  return file.text();
}

export async function readJsonFile(file: File): Promise<unknown> {
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch (error) {
    throw new Error(error instanceof Error ? `JSON 格式不正确：${error.message}` : "JSON 格式不正确。");
  }
}

export async function readDocxFile(file: File): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const text = result.value.trim();

    if (!text) {
      throw new Error("DOCX 中没有可提取文本。");
    }

    return text;
  } catch (error) {
    throw new Error(error instanceof Error ? `DOCX 解析失败：${error.message}` : "DOCX 解析失败。");
  }
}

export async function readPdfFile(file: File): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      disableWorker: true,
    });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ");
      pageTexts.push(pageText);
    }

    const text = pageTexts.join("\n").trim();

    if (!text) {
      throw new Error("该 PDF 可能是扫描件，当前版本暂不支持 OCR，请复制文本或使用文字版 PDF。");
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.message.includes("扫描件")) {
      throw error;
    }

    throw new Error(error instanceof Error ? `PDF 解析失败：${error.message}` : "PDF 解析失败。");
  }
}

function parsedImportFromJson(value: unknown): ParsedKnowledgeImport | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<ParsedKnowledgeImport>;
  if (
    typeof record.gradeId === "string" &&
    typeof record.bookId === "string" &&
    Array.isArray(record.words) &&
    Array.isArray(record.phrases) &&
    Array.isArray(record.sentences)
  ) {
    return record as ParsedKnowledgeImport;
  }

  return null;
}

async function readSupportedRawFile(file: File, kind: SupportedImportKind): Promise<ImportedFileResult> {
  if (kind === "txt") {
    return { ...baseResult(file, "pending"), rawText: await readTextFile(file) };
  }

  if (kind === "md") {
    return { ...baseResult(file, "pending"), rawText: await readMarkdownFile(file) };
  }

  if (kind === "docx") {
    return { ...baseResult(file, "pending"), rawText: await readDocxFile(file) };
  }

  if (kind === "pdf") {
    return { ...baseResult(file, "pending"), rawText: await readPdfFile(file) };
  }

  if (kind === "json") {
    const json = await readJsonFile(file);
    const dataOverrideResult = validateDataSet(json);
    const parsedImport = parsedImportFromJson(json);

    if (dataOverrideResult.ok) {
      return {
        ...baseResult(file, "parsed"),
        dataOverride: dataOverrideResult.data,
        warnings: ["已识别为系统完整数据 JSON，可直接导入覆盖数据。"],
      };
    }

    if (parsedImport) {
      return {
        ...baseResult(file, "parsed"),
        parsedImport,
        warnings: parsedImport.warnings,
      };
    }

    throw new Error("JSON 格式不正确：既不是系统导出的完整数据，也不是单个 parsed import。");
  }

  throw new Error("ZIP 文件需通过 readZipFile 处理。");
}

function makeFileFromZipEntry(fileName: string, data: ArrayBuffer) {
  return new File([data], fileName, { type: mimeTypeForName(fileName) });
}

function mimeTypeForName(fileName: string) {
  const kind = getSupportedImportKind(fileName);
  if (kind === "txt") return "text/plain";
  if (kind === "md") return "text/markdown";
  if (kind === "json") return "application/json";
  if (kind === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (kind === "pdf") return "application/pdf";
  if (kind === "zip") return "application/zip";
  return "application/octet-stream";
}

export async function readZipFile(file: File): Promise<ImportedFileResult[]> {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entries = Object.values(zip.files).filter((entry) => !entry.dir && !isHiddenArchiveEntry(entry.name));

    if (entries.length === 0) {
      return [failedResult(file, "ZIP 内没有可支持文件。")];
    }

    const results: ImportedFileResult[] = [];

    for (const entry of entries) {
      const kind = getSupportedImportKind(entry.name);
      const entryFileBase = {
        name: entry.name,
        type: mimeTypeForName(entry.name),
        size: 0,
      };

      if (!kind || kind === "zip") {
        results.push(unsupportedResult(entryFileBase as File));
        continue;
      }

      try {
        const data = await entry.async("arraybuffer");
        const entryFile = makeFileFromZipEntry(entry.name, data);
        results.push(await readSupportedRawFile(entryFile, kind));
      } catch (error) {
        results.push(failedResult(entryFileBase as File, error instanceof Error ? error.message : "ZIP 内文件解析失败。"));
      }
    }

    if (!results.some((result) => result.status !== "unsupported")) {
      return [failedResult(file, "ZIP 内没有可支持文件。"), ...results];
    }

    return results;
  } catch (error) {
    return [failedResult(file, error instanceof Error ? `ZIP 解析失败：${error.message}` : "ZIP 解析失败。")];
  }
}

function parseRawTextResult(result: ImportedFileResult, defaults: ParseKnowledgeTextOptions): ImportedFileResult {
  if (result.rawText === undefined) {
    return result;
  }

  const metadata = inferImportMetadata(result.rawText, result.fileName, defaults);
  const parsedImport = parseKnowledgeText(result.rawText, metadata);
  const hasCoreContent =
    parsedImport.words.length > 0 || parsedImport.phrases.length > 0 || parsedImport.sentences.length > 0;

  if (!hasCoreContent) {
    return {
      ...result,
      status: "failed",
      error: "parseKnowledgeText 没有解析出任何单词、词组或句子。",
      parsedImport,
      warnings: parsedImport.warnings,
      selected: false,
    };
  }

  return {
    ...result,
    status: "parsed",
    parsedImport,
    warnings: parsedImport.warnings,
    selected: true,
  };
}

async function parseSingleFile(file: File, defaults: ParseKnowledgeTextOptions): Promise<ImportedFileResult[]> {
  const kind = getSupportedImportKind(file.name);

  if (!kind) {
    return [unsupportedResult(file)];
  }

  if (kind === "zip") {
    const zipResults = await readZipFile(file);
    return zipResults.map((result) => parseRawTextResult(result, defaults));
  }

  try {
    const result = await readSupportedRawFile(file, kind);
    return [parseRawTextResult(result, defaults)];
  } catch (error) {
    return [failedResult(file, error instanceof Error ? error.message : "文件解析失败。")];
  }
}

export async function parseImportedFiles(
  files: File[],
  options: ParseKnowledgeTextOptions,
): Promise<ImportBatchResult> {
  const results: ImportedFileResult[] = [];

  for (const file of files) {
    results.push(...await parseSingleFile(file, options));
  }

  return {
    id: createId("batch"),
    files: results,
    successCount: results.filter((result) => result.status === "parsed").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    unsupportedCount: results.filter((result) => result.status === "unsupported").length,
    createdAt: new Date().toISOString(),
  };
}
