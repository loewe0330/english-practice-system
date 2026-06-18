"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { mergeParsedImportIntoData, importDataJson, saveDataOverride } from "@/lib/data-store";
import { parseKnowledgeText, validateParsedImport } from "@/lib/import-parser";
import type {
  ParsedImportGrammarPoint,
  ParsedImportPhrase,
  ParsedImportSentence,
  ParsedImportWord,
  ParsedKnowledgeImport,
} from "@/lib/import-types";
import { useEffectiveData } from "@/lib/storage-hooks";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyParsedItem(prefix: string, order: number) {
  return `${prefix}-manual-${Date.now()}-${order}`;
}

export default function ImportPage() {
  const router = useRouter();
  const data = useEffectiveData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMessage, setFileMessage] = useState("");
  const [text, setText] = useState("");
  const [gradeId, setGradeId] = useState("primary-g4b");
  const [bookChoice, setBookChoice] = useState("yilin-4b");
  const [customBookName, setCustomBookName] = useState("");
  const [unitNo, setUnitNo] = useState(1);
  const [replaceExistingUnit, setReplaceExistingUnit] = useState(false);
  const [activeTab, setActiveTab] = useState<PreviewTab>("words");
  const [parsedImport, setParsedImport] = useState<ParsedKnowledgeImport | null>(null);
  const [message, setMessage] = useState("");

  const availableBooks = data.books.filter((book) => book.gradeId === gradeId);
  const selectedBook = data.books.find((book) => book.id === bookChoice);
  const bookName = bookChoice === "custom" ? customBookName.trim() || "自定义教材" : selectedBook?.name ?? "译林英语 4B";
  const bookId = bookChoice === "custom" ? `custom-${slugify(bookName) || "book"}` : bookChoice;

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

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    setSelectedFile(file);
    setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (extension === "txt" || extension === "md") {
      setText(await file.text());
      setFileMessage("已读取文本内容，可点击解析文本。");
      return;
    }

    if (extension === "json") {
      const result = importDataJson(await file.text());
      if (result.ok) {
        setFileMessage("JSON 导入成功，已保存为本地覆盖数据。");
      } else {
        setFileMessage(result.error);
      }
      return;
    }

    setFileMessage("当前浏览器版暂不直接解析此格式，请先复制文本到下方文本框。后续版本将支持自动解析。");
  }

  function handleParse() {
    if (!text.trim()) {
      setMessage("请先粘贴或读取知识清单文本。");
      return;
    }

    const parsed = parseKnowledgeText(text, {
      gradeId,
      bookId,
      bookName,
      unitNo,
      unitTitle: `Unit${unitNo}`,
    });

    setParsedImport(parsed);
    setActiveTab("words");
    setMessage(`解析完成：单词 ${parsed.words.length}，词组 ${parsed.phrases.length}，句子 ${parsed.sentences.length}，语法 ${parsed.grammarPoints.length}。`);
  }

  function updateWord(id: string, patch: Partial<ParsedImportWord>) {
    setParsedImport((current) =>
      current ? { ...current, words: current.words.map((word) => (word.id === id ? { ...word, ...patch } : word)) } : current,
    );
  }

  function updatePhrase(id: string, patch: Partial<ParsedImportPhrase>) {
    setParsedImport((current) =>
      current ? { ...current, phrases: current.phrases.map((phrase) => (phrase.id === id ? { ...phrase, ...patch } : phrase)) } : current,
    );
  }

  function updateSentence(id: string, patch: Partial<ParsedImportSentence>) {
    setParsedImport((current) =>
      current ? { ...current, sentences: current.sentences.map((sentence) => (sentence.id === id ? { ...sentence, ...patch } : sentence)) } : current,
    );
  }

  function updateGrammar(id: string, patch: Partial<ParsedImportGrammarPoint>) {
    setParsedImport((current) =>
      current
        ? { ...current, grammarPoints: current.grammarPoints.map((point) => (point.id === id ? { ...point, ...patch } : point)) }
        : current,
    );
  }

  function deletePreviewRow(type: Exclude<PreviewTab, "phonics" | "writing" | "warnings">, id: string) {
    setParsedImport((current) => {
      if (!current) return current;
      if (type === "words") return { ...current, words: current.words.filter((word) => word.id !== id) };
      if (type === "phrases") return { ...current, phrases: current.phrases.filter((phrase) => phrase.id !== id) };
      if (type === "sentences") return { ...current, sentences: current.sentences.filter((sentence) => sentence.id !== id) };
      return { ...current, grammarPoints: current.grammarPoints.filter((point) => point.id !== id) };
    });
  }

  function addPreviewRow(type: Exclude<PreviewTab, "phonics" | "writing" | "warnings">) {
    setParsedImport((current) => {
      if (!current) return current;
      if (type === "words") {
        const order = current.words.length + 1;
        return {
          ...current,
          words: [...current.words, { id: createEmptyParsedItem("word", order), en: "", zh: "", pos: "", order, required: true }],
        };
      }
      if (type === "phrases") {
        const order = current.phrases.length + 1;
        return {
          ...current,
          phrases: [...current.phrases, { id: createEmptyParsedItem("phrase", order), en: "", zh: "", order, required: true }],
        };
      }
      if (type === "sentences") {
        const order = current.sentences.length + 1;
        return {
          ...current,
          sentences: [...current.sentences, { id: createEmptyParsedItem("sentence", order), en: "", zh: "", order, required: true }],
        };
      }
      const order = current.grammarPoints.length + 1;
      return {
        ...current,
        grammarPoints: [...current.grammarPoints, { id: createEmptyParsedItem("grammar", order), title: "", content: "", examples: [], order }],
      };
    });
  }

  function updateTextList(type: "phonics" | "writing", value: string) {
    setParsedImport((current) => current ? { ...current, [type]: value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) } : current);
  }

  function handleConfirmImport() {
    if (!parsedImport) {
      setMessage("请先解析文本。");
      return;
    }

    const validationWarnings = validateParsedImport(parsedImport);
    if (validationWarnings.length > 0) {
      setParsedImport({ ...parsedImport, warnings: [...parsedImport.warnings, ...validationWarnings] });
      setActiveTab("warnings");
      setMessage("还有需要校对的问题，请先处理警告。");
      return;
    }

    const result = mergeParsedImportIntoData(parsedImport, data, { replaceExistingUnit });
    saveDataOverride(result.data);
    router.push("/data-review?imported=1");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">知识清单导入</p>
        <h1>导入知识清单</h1>
        <p>上传或粘贴知识清单文本，自动解析后先人工校对，再确认合并到本地知识库。</p>
      </section>

      <section className="form-layout">
        <article className="panel wizard-panel">
          <div className="choice-group">
            <h2>1. 上传区</h2>
            <label className="upload-dropzone">
              <span>选择 PDF / DOCX / TXT / MD / JSON / ZIP 文件</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,.json,.zip,application/json,text/plain,text/markdown"
                onChange={(event) => void handleFileChange(event.target.files?.[0])}
              />
            </label>
            {selectedFile ? (
              <div className="file-summary">
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)} · {selectedFile.type || "未知类型"}</span>
              </div>
            ) : null}
            {fileMessage ? <p className="helper-text">{fileMessage}</p> : null}
          </div>

          <div className="choice-group">
            <h2>2. 文本粘贴区</h2>
            <textarea
              className="large-textarea"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              placeholder="把知识清单全文粘贴到这里，例如：一、四会词&词组..."
            />
          </div>

          <div className="choice-group">
            <h2>3. 解析设置</h2>
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
                <span>单元</span>
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
                <span>作为新内容追加</span>
              </label>
            </div>
            <button type="button" className="primary-button" onClick={handleParse}>解析文本</button>
            {message ? <p className="error-text">{message}</p> : null}
          </div>
        </article>

        <aside className="panel summary-panel">
          <h2>解析结果</h2>
          {counts ? (
            <div className="import-counts">
              <span>单词 <strong>{counts.words}</strong></span>
              <span>词组 <strong>{counts.phrases}</strong></span>
              <span>句子 <strong>{counts.sentences}</strong></span>
              <span>语法 <strong>{counts.grammar}</strong></span>
              <span>语音 <strong>{counts.phonics}</strong></span>
              <span>写作 <strong>{counts.writing}</strong></span>
              <span>警告 <strong>{counts.warnings}</strong></span>
            </div>
          ) : (
            <p>解析后会在这里显示数量。</p>
          )}
          <button type="button" className="primary-button full-width" onClick={handleConfirmImport}>
            确认入库
          </button>
        </aside>
      </section>

      {parsedImport ? (
        <section className="panel import-preview-panel">
          <div className="section-title-row">
            <div>
              <h2>4. 解析结果预览</h2>
              <p>{parsedImport.bookName} · Unit{parsedImport.unitNo} · {parsedImport.unitTitle}</p>
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
