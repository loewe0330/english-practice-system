"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { mergeParsedImportIntoData, saveDataOverride } from "@/lib/data-store";
import { parseImportedFiles } from "@/lib/file-import";
import { parseKnowledgeText, validateParsedImport } from "@/lib/import-parser";
import type {
  ImportBatchResult,
  ImportedFileResult,
  ParsedImportGrammarPoint,
  ParsedImportPhrase,
  ParsedImportSentence,
  ParsedImportWord,
  ParsedKnowledgeImport,
} from "@/lib/import-types";
import { useEffectiveData } from "@/lib/storage-hooks";
import type { KnowledgeDataSet } from "@/lib/types";

type PreviewTab = "words" | "phrases" | "sentences" | "grammar" | "phonics" | "writing" | "warnings";

const previewTabs: { value: PreviewTab; label: string }[] = [
  { value: "words", label: "单词" },
  { value: "phrases", label: "词组" },
  { value: "sentences", label: "句子" },
  { value: "grammar", label: "语法" },
  { value: "phonics", label: "语音" },
  { value: "writing", label: "写作" },
  { value: "warnings", label: "警告" },
];

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyParsedItem(prefix: string, order: number) {
  return `${prefix}-manual-${Date.now()}-${order}`;
}

function createBatch(files: ImportedFileResult[]): ImportBatchResult {
  return {
    id: createId("batch"),
    files,
    successCount: files.filter((file) => file.status === "parsed").length,
    failedCount: files.filter((file) => file.status === "failed").length,
    unsupportedCount: files.filter((file) => file.status === "unsupported").length,
    createdAt: new Date().toISOString(),
  };
}

export default function ImportPage() {
  const router = useRouter();
  const data = useEffectiveData();
  const [text, setText] = useState("");
  const [gradeId, setGradeId] = useState("primary-g4b");
  const [bookChoice, setBookChoice] = useState("yilin-4b");
  const [customBookName, setCustomBookName] = useState("");
  const [unitNo, setUnitNo] = useState(1);
  const [replaceExistingUnit, setReplaceExistingUnit] = useState(false);
  const [activeTab, setActiveTab] = useState<PreviewTab>("words");
  const [batch, setBatch] = useState<ImportBatchResult | null>(null);
  const [activeFileId, setActiveFileId] = useState("");
  const [message, setMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const availableBooks = data.books.filter((book) => book.gradeId === gradeId);
  const selectedBook = data.books.find((book) => book.id === bookChoice);
  const bookName = bookChoice === "custom" ? customBookName.trim() || "自定义教材" : selectedBook?.name ?? "译林英语 4B";
  const bookId = bookChoice === "custom" ? `custom-${bookName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "book"}` : bookChoice;
  const activeFile = batch?.files.find((file) => file.id === activeFileId) ?? batch?.files.find((file) => file.parsedImport);
  const parsedImport = activeFile?.parsedImport ?? null;

  const counts = useMemo(() => {
    if (!parsedImport) {
      return null;
    }

    return {
      words: parsedImport.words.length,
      phrases: parsedImport.phrases.length,
      sentences: parsedImport.sentences.length,
      grammar: parsedImport.grammarPoints.length,
      phonics: parsedImport.phonics.length,
      writing: parsedImport.writing.length,
      warnings: parsedImport.warnings.length,
    };
  }, [parsedImport]);

  function defaultOptions() {
    return {
      gradeId,
      bookId,
      bookName,
      unitNo,
      unitTitle: `Unit${unitNo}`,
    };
  }

  function setBatchFiles(files: ImportedFileResult[]) {
    const nextBatch = createBatch(files);
    setBatch(nextBatch);
    setActiveFileId(nextBatch.files.find((file) => file.parsedImport || file.dataOverride)?.id ?? nextBatch.files[0]?.id ?? "");
  }

  async function handleFiles(files: FileList | File[]) {
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    setIsParsing(true);
    setMessage("正在解析文件...");

    try {
      const result = await parseImportedFiles(selectedFiles, defaultOptions());
      setBatch(result);
      setActiveFileId(result.files.find((file) => file.parsedImport || file.dataOverride)?.id ?? result.files[0]?.id ?? "");
      setActiveTab("words");
      setMessage(`解析完成：成功 ${result.successCount}，失败 ${result.failedCount}，不支持 ${result.unsupportedCount}。`);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleParseText() {
    if (!text.trim()) {
      setMessage("请先粘贴知识清单文本。");
      return;
    }

    const parsed = parseKnowledgeText(text, defaultOptions());
    const fileResult: ImportedFileResult = {
      id: createId("paste"),
      fileName: "粘贴文本",
      fileType: "text",
      fileSize: new Blob([text]).size,
      status: parsed.words.length || parsed.phrases.length || parsed.sentences.length ? "parsed" : "failed",
      rawText: text,
      parsedImport: parsed,
      error: parsed.words.length || parsed.phrases.length || parsed.sentences.length
        ? undefined
        : "parseKnowledgeText 没有解析出任何单词、词组或句子。",
      warnings: parsed.warnings,
      selected: true,
    };

    setBatchFiles([fileResult]);
    setActiveTab("words");
    setMessage("文本解析完成。");
  }

  function updateActiveParsed(updater: (parsed: ParsedKnowledgeImport) => ParsedKnowledgeImport) {
    if (!activeFile) return;
    setBatch((current) => {
      if (!current) return current;

      return createBatch(
        current.files.map((file) => {
          if (file.id !== activeFile.id || !file.parsedImport) {
            return file;
          }

          const nextParsedImport = updater(file.parsedImport);
          return { ...file, parsedImport: nextParsedImport, warnings: nextParsedImport.warnings };
        }),
      );
    });
  }

  function updateWord(id: string, patch: Partial<ParsedImportWord>) {
    updateActiveParsed((current) => ({ ...current, words: current.words.map((word) => (word.id === id ? { ...word, ...patch } : word)) }));
  }

  function updatePhrase(id: string, patch: Partial<ParsedImportPhrase>) {
    updateActiveParsed((current) => ({ ...current, phrases: current.phrases.map((phrase) => (phrase.id === id ? { ...phrase, ...patch } : phrase)) }));
  }

  function updateSentence(id: string, patch: Partial<ParsedImportSentence>) {
    updateActiveParsed((current) => ({ ...current, sentences: current.sentences.map((sentence) => (sentence.id === id ? { ...sentence, ...patch } : sentence)) }));
  }

  function updateGrammar(id: string, patch: Partial<ParsedImportGrammarPoint>) {
    updateActiveParsed((current) => ({
      ...current,
      grammarPoints: current.grammarPoints.map((point) => (point.id === id ? { ...point, ...patch } : point)),
    }));
  }

  function deletePreviewRow(type: Exclude<PreviewTab, "phonics" | "writing" | "warnings">, id: string) {
    updateActiveParsed((current) => {
      if (type === "words") return { ...current, words: current.words.filter((word) => word.id !== id) };
      if (type === "phrases") return { ...current, phrases: current.phrases.filter((phrase) => phrase.id !== id) };
      if (type === "sentences") return { ...current, sentences: current.sentences.filter((sentence) => sentence.id !== id) };
      return { ...current, grammarPoints: current.grammarPoints.filter((point) => point.id !== id) };
    });
  }

  function addPreviewRow(type: Exclude<PreviewTab, "phonics" | "writing" | "warnings">) {
    updateActiveParsed((current) => {
      if (type === "words") {
        const order = current.words.length + 1;
        return { ...current, words: [...current.words, { id: createEmptyParsedItem("word", order), en: "", zh: "", pos: "", order, required: true }] };
      }
      if (type === "phrases") {
        const order = current.phrases.length + 1;
        return { ...current, phrases: [...current.phrases, { id: createEmptyParsedItem("phrase", order), en: "", zh: "", order, required: true }] };
      }
      if (type === "sentences") {
        const order = current.sentences.length + 1;
        return { ...current, sentences: [...current.sentences, { id: createEmptyParsedItem("sentence", order), en: "", zh: "", order, required: true }] };
      }
      const order = current.grammarPoints.length + 1;
      return { ...current, grammarPoints: [...current.grammarPoints, { id: createEmptyParsedItem("grammar", order), title: "", content: "", examples: [], order }] };
    });
  }

  function updateTextList(type: "phonics" | "writing", value: string) {
    updateActiveParsed((current) => ({ ...current, [type]: value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) }));
  }

  function toggleFileSelected(fileId: string) {
    setBatch((current) => {
      if (!current) return current;
      return createBatch(current.files.map((file) => (file.id === fileId ? { ...file, selected: !file.selected } : file)));
    });
  }

  function removeFile(fileId: string) {
    if (!batch) return;

    const next = createBatch(batch.files.filter((file) => file.id !== fileId));
    setBatch(next);
    if (activeFileId === fileId) {
      setActiveFileId(next.files[0]?.id ?? "");
    }
  }

  function validateFiles(files: ImportedFileResult[]) {
    const nextFiles = [...(batch?.files ?? [])];
    let hasValidationError = false;

    files.forEach((file) => {
      if (!file.parsedImport) return;
      const validationWarnings = validateParsedImport(file.parsedImport);
      if (validationWarnings.length > 0) {
        hasValidationError = true;
        const index = nextFiles.findIndex((item) => item.id === file.id);
        if (index >= 0) {
          nextFiles[index] = {
            ...nextFiles[index],
            warnings: [...nextFiles[index].warnings, ...validationWarnings],
            parsedImport: {
              ...file.parsedImport,
              warnings: [...file.parsedImport.warnings, ...validationWarnings],
            },
          };
        }
      }
    });

    if (hasValidationError) {
      setBatchFiles(nextFiles);
      setActiveTab("warnings");
      setMessage("还有需要校对的问题，请先处理警告。");
      return false;
    }

    return true;
  }

  function importFiles(files: ImportedFileResult[]) {
    if (files.length === 0) {
      setMessage("没有可导入的成功文件。");
      return;
    }

    if (!validateFiles(files)) {
      return;
    }

    let nextData: KnowledgeDataSet = data;
    let importedCount = 0;
    let skippedCount = 0;

    files.forEach((file) => {
      if (file.dataOverride) {
        nextData = file.dataOverride;
        importedCount += 1;
        return;
      }

      if (file.parsedImport) {
        nextData = mergeParsedImportIntoData(file.parsedImport, nextData, { replaceExistingUnit }).data;
        importedCount += 1;
        return;
      }

      skippedCount += 1;
    });

    saveDataOverride(nextData);
    setMessage(`导入完成：成功 ${importedCount}，跳过 ${skippedCount}。`);
    router.push("/data-review?imported=1");
  }

  const successfulFiles = batch?.files.filter((file) => file.status === "parsed") ?? [];
  const selectedSuccessfulFiles = successfulFiles.filter((file) => file.selected);

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">知识清单导入</p>
        <h1>导入知识清单</h1>
        <p>支持 TXT、MD、JSON、DOCX、文字版 PDF 和 ZIP 批量解析；解析后先人工校对，再确认入库。</p>
      </section>

      <section className="form-layout">
        <article className="panel wizard-panel">
          <div className="choice-group">
            <h2>1. 文件选择区</h2>
            <label className="upload-dropzone">
              <span>选择 PDF / DOCX / TXT / MD / JSON / ZIP 文件，可多选</span>
              <input
                multiple
                type="file"
                accept=".pdf,.docx,.txt,.md,.json,.zip,application/json,text/plain,text/markdown,application/pdf,application/zip"
                onChange={(event) => void handleFiles(event.target.files ?? [])}
              />
            </label>
            <p className="helper-text">PDF 仅支持可复制文本的文字版 PDF；扫描版 PDF 当前不做 OCR。</p>
          </div>

          <div className="choice-group">
            <h2>2. 文本粘贴区</h2>
            <textarea
              className="large-textarea"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              placeholder="也可以把知识清单全文粘贴到这里，例如：一、四会词&词组..."
            />
          </div>

          <div className="choice-group">
            <h2>3. 默认解析设置</h2>
            <div className="admin-form-grid">
              <label>
                <span>年级</span>
                <select value={gradeId} onChange={(event) => setGradeId(event.target.value)}>
                  {data.grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>{grade.displayName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>教材</span>
                <select value={bookChoice} onChange={(event) => setBookChoice(event.target.value)}>
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>{book.name}</option>
                  ))}
                  <option value="custom">自定义</option>
                </select>
              </label>
              {bookChoice === "custom" ? (
                <label>
                  <span>自定义教材名</span>
                  <input value={customBookName} onChange={(event) => setCustomBookName(event.target.value)} />
                </label>
              ) : null}
              <label>
                <span>默认单元</span>
                <select value={unitNo} onChange={(event) => setUnitNo(Number(event.target.value))}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>Unit{value}</option>
                  ))}
                </select>
              </label>
              <label className="checkbox-row plain-checkbox">
                <input
                  type="checkbox"
                  checked={replaceExistingUnit}
                  onChange={(event) => setReplaceExistingUnit(event.target.checked)}
                />
                <span>覆盖已有单元</span>
              </label>
              <label className="checkbox-row plain-checkbox">
                <input type="checkbox" checked={!replaceExistingUnit} readOnly />
                <span>默认追加并去重</span>
              </label>
            </div>
            <button type="button" className="primary-button" onClick={() => void handleParseText()}>
              解析粘贴文本
            </button>
            {message ? <p className="error-text">{message}</p> : null}
          </div>
        </article>

        <aside className="panel summary-panel">
          <h2>批量导入</h2>
          {batch ? (
            <div className="import-counts">
              <span>成功 <strong>{batch.successCount}</strong></span>
              <span>失败 <strong>{batch.failedCount}</strong></span>
              <span>不支持 <strong>{batch.unsupportedCount}</strong></span>
              <span>选中 <strong>{selectedSuccessfulFiles.length}</strong></span>
            </div>
          ) : (
            <p>选择文件或解析文本后，会在这里显示批次汇总。</p>
          )}
          {counts ? (
            <div className="import-counts compact-counts">
              <span>单词 <strong>{counts.words}</strong></span>
              <span>词组 <strong>{counts.phrases}</strong></span>
              <span>句子 <strong>{counts.sentences}</strong></span>
              <span>语法 <strong>{counts.grammar}</strong></span>
            </div>
          ) : null}
          <div className="stack-actions">
            <button type="button" className="primary-button full-width" disabled={!activeFile?.parsedImport && !activeFile?.dataOverride} onClick={() => activeFile && importFiles([activeFile])}>
              确认当前文件入库
            </button>
            <button type="button" className="secondary-button full-width" disabled={successfulFiles.length === 0} onClick={() => importFiles(successfulFiles)}>
              确认全部成功文件入库
            </button>
            <button type="button" className="secondary-button full-width" disabled={selectedSuccessfulFiles.length === 0} onClick={() => importFiles(selectedSuccessfulFiles)}>
              仅导入选中文件
            </button>
            <button type="button" className="secondary-button full-width" disabled={!batch || isParsing} onClick={() => { setBatch(null); setActiveFileId(""); setMessage("已清空批次。"); }}>
              清空批次
            </button>
          </div>
        </aside>
      </section>

      {batch ? (
        <section className="panel import-preview-panel">
          <div className="section-title-row">
            <div>
              <h2>4. 多文件解析结果</h2>
              <p>点击查看 / 编辑后，可在下方校对该文件的解析内容。</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>选择</th>
                  <th>文件名</th>
                  <th>大小</th>
                  <th>类型</th>
                  <th>教材</th>
                  <th>单元</th>
                  <th>单词</th>
                  <th>词组</th>
                  <th>句子</th>
                  <th>语法</th>
                  <th>状态</th>
                  <th>错误信息</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {batch.files.map((file) => (
                  <tr key={file.id} className={file.id === activeFileId ? "selected-row" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(file.selected)}
                        disabled={file.status !== "parsed"}
                        onChange={() => toggleFileSelected(file.id)}
                      />
                    </td>
                    <td>{file.fileName}</td>
                    <td>{formatFileSize(file.fileSize)}</td>
                    <td>{file.fileType}</td>
                    <td>{file.parsedImport?.bookName ?? (file.dataOverride ? "完整数据 JSON" : "-")}</td>
                    <td>{file.parsedImport ? `Unit${file.parsedImport.unitNo}` : "-"}</td>
                    <td>{file.parsedImport?.words.length ?? "-"}</td>
                    <td>{file.parsedImport?.phrases.length ?? "-"}</td>
                    <td>{file.parsedImport?.sentences.length ?? "-"}</td>
                    <td>{file.parsedImport?.grammarPoints.length ?? "-"}</td>
                    <td>{file.status}</td>
                    <td>{file.error ?? file.warnings[0] ?? "-"}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="secondary-button" onClick={() => setActiveFileId(file.id)}>查看 / 编辑</button>
                        <button type="button" className="secondary-button danger-button" onClick={() => removeFile(file.id)}>移除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {parsedImport ? (
        <section className="panel import-preview-panel">
          <div className="section-title-row">
            <div>
              <h2>5. 当前文件预览编辑</h2>
              <p>{activeFile?.fileName} · {parsedImport.bookName} · Unit{parsedImport.unitNo} · {parsedImport.unitTitle}</p>
            </div>
          </div>

          <div className="filter-row">
            {previewTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={activeTab === tab.value ? "active" : ""}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "words" ? (
            <EditableWordTable words={parsedImport.words} onUpdate={updateWord} onDelete={(id) => deletePreviewRow("words", id)} onAdd={() => addPreviewRow("words")} />
          ) : null}
          {activeTab === "phrases" ? (
            <EditablePhraseTable phrases={parsedImport.phrases} onUpdate={updatePhrase} onDelete={(id) => deletePreviewRow("phrases", id)} onAdd={() => addPreviewRow("phrases")} />
          ) : null}
          {activeTab === "sentences" ? (
            <EditableSentenceTable sentences={parsedImport.sentences} onUpdate={updateSentence} onDelete={(id) => deletePreviewRow("sentences", id)} onAdd={() => addPreviewRow("sentences")} />
          ) : null}
          {activeTab === "grammar" ? (
            <EditableGrammarTable points={parsedImport.grammarPoints} onUpdate={updateGrammar} onDelete={(id) => deletePreviewRow("grammar", id)} onAdd={() => addPreviewRow("grammar")} />
          ) : null}
          {activeTab === "phonics" ? (
            <TextListEditor title="语音知识" value={parsedImport.phonics.join("\n")} onChange={(value) => updateTextList("phonics", value)} />
          ) : null}
          {activeTab === "writing" ? (
            <TextListEditor title="写作 / 佳作赏析" value={parsedImport.writing.join("\n")} onChange={(value) => updateTextList("writing", value)} />
          ) : null}
          {activeTab === "warnings" ? (
            <div className="warning-list">
              {parsedImport.warnings.length === 0 ? <p className="helper-text">暂无警告。</p> : null}
              {parsedImport.warnings.map((warning, index) => (
                <span key={`${warning}-${index}`} className="warning-badge">{warning}</span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function EditableWordTable({
  words,
  onUpdate,
  onDelete,
  onAdd,
}: {
  words: ParsedImportWord[];
  onUpdate: (id: string, patch: Partial<ParsedImportWord>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <EditableTableShell onAdd={onAdd}>
      <thead>
        <tr>
          <th>英文</th>
          <th>中文</th>
          <th>词性</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {words.map((word) => (
          <tr key={word.id}>
            <td><input value={word.en} onChange={(event) => onUpdate(word.id, { en: event.target.value })} /></td>
            <td><input value={word.zh} onChange={(event) => onUpdate(word.id, { zh: event.target.value })} /></td>
            <td><input value={word.pos} onChange={(event) => onUpdate(word.id, { pos: event.target.value })} /></td>
            <td><button type="button" className="secondary-button danger-button" onClick={() => onDelete(word.id)}>删除</button></td>
          </tr>
        ))}
      </tbody>
    </EditableTableShell>
  );
}

function EditablePhraseTable({
  phrases,
  onUpdate,
  onDelete,
  onAdd,
}: {
  phrases: ParsedImportPhrase[];
  onUpdate: (id: string, patch: Partial<ParsedImportPhrase>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <EditableTableShell onAdd={onAdd}>
      <thead>
        <tr>
          <th>英文</th>
          <th>中文</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {phrases.map((phrase) => (
          <tr key={phrase.id}>
            <td><input value={phrase.en} onChange={(event) => onUpdate(phrase.id, { en: event.target.value })} /></td>
            <td><input value={phrase.zh} onChange={(event) => onUpdate(phrase.id, { zh: event.target.value })} /></td>
            <td><button type="button" className="secondary-button danger-button" onClick={() => onDelete(phrase.id)}>删除</button></td>
          </tr>
        ))}
      </tbody>
    </EditableTableShell>
  );
}

function EditableSentenceTable({
  sentences,
  onUpdate,
  onDelete,
  onAdd,
}: {
  sentences: ParsedImportSentence[];
  onUpdate: (id: string, patch: Partial<ParsedImportSentence>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <EditableTableShell onAdd={onAdd}>
      <thead>
        <tr>
          <th>英文</th>
          <th>中文</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {sentences.map((sentence) => (
          <tr key={sentence.id}>
            <td><input value={sentence.en} onChange={(event) => onUpdate(sentence.id, { en: event.target.value })} /></td>
            <td><input value={sentence.zh} onChange={(event) => onUpdate(sentence.id, { zh: event.target.value })} /></td>
            <td><button type="button" className="secondary-button danger-button" onClick={() => onDelete(sentence.id)}>删除</button></td>
          </tr>
        ))}
      </tbody>
    </EditableTableShell>
  );
}

function EditableGrammarTable({
  points,
  onUpdate,
  onDelete,
  onAdd,
}: {
  points: ParsedImportGrammarPoint[];
  onUpdate: (id: string, patch: Partial<ParsedImportGrammarPoint>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <EditableTableShell onAdd={onAdd}>
      <thead>
        <tr>
          <th>标题</th>
          <th>内容</th>
          <th>例句</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.id}>
            <td><input value={point.title} onChange={(event) => onUpdate(point.id, { title: event.target.value })} /></td>
            <td><textarea value={point.content} onChange={(event) => onUpdate(point.id, { content: event.target.value })} /></td>
            <td><textarea value={point.examples.join("\n")} onChange={(event) => onUpdate(point.id, { examples: event.target.value.split(/\r?\n/).filter(Boolean) })} /></td>
            <td><button type="button" className="secondary-button danger-button" onClick={() => onDelete(point.id)}>删除</button></td>
          </tr>
        ))}
      </tbody>
    </EditableTableShell>
  );
}

function EditableTableShell({ children, onAdd }: { children: ReactNode; onAdd: () => void }) {
  return (
    <div className="editable-table-block">
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={onAdd}>新增一行</button>
      </div>
      <div className="table-wrap editable-table-wrap">
        <table>{children}</table>
      </div>
    </div>
  );
}

function TextListEditor({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="json-import">
      <span>{title}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={8} />
    </label>
  );
}
