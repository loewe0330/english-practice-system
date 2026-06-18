"use client";

import { useMemo, useState } from "react";
import {
  clearDataOverride,
  exportDataJson,
  getDefaultData,
  importDataJson,
  saveDataOverride,
} from "@/lib/data-store";
import {
  isSupabaseConfigured,
  loadAttemptsFromCloud,
  loadCloudData,
  loadWrongBookFromCloud,
  saveAttemptToCloud,
  saveKnowledgeDataToCloud,
  saveWrongBookItemToCloud,
} from "@/lib/cloud-data-store";
import { useEffectiveData } from "@/lib/storage-hooks";
import { getPracticeHistory, getWrongBook, savePracticeHistory, saveWrongBook } from "@/lib/storage";
import type { ExtensionWord, KnowledgeDataSet, KnowledgePhrase, KnowledgeSentence, KnowledgeWord } from "@/lib/types";

type EditableType = "words" | "phrases" | "sentences" | "extensionWords";

const editableTypes: { value: EditableType; label: string }[] = [
  { value: "words", label: "单词" },
  { value: "phrases", label: "词组" },
  { value: "sentences", label: "句子" },
  { value: "extensionWords", label: "拓展词汇" },
];

const emptyForm = {
  english: "",
  chinese: "",
  partOfSpeech: "",
  difficulty: "基础" as ExtensionWord["difficulty"],
};

function cloneData(data: KnowledgeDataSet): KnowledgeDataSet {
  return JSON.parse(JSON.stringify(data)) as KnowledgeDataSet;
}

function nextSortOrder(items: { sortOrder: number }[]) {
  return Math.max(0, ...items.map((item) => item.sortOrder)) + 1;
}

export default function AdminDataPage() {
  const effectiveData = useEffectiveData();
  const [data, setData] = useState<KnowledgeDataSet>(() => cloneData(effectiveData));
  const [type, setType] = useState<EditableType>("words");
  const [unitId, setUnitId] = useState("yilin-4b-u1");
  const [categoryId, setCategoryId] = useState("ext-animal");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [cloudMessage, setCloudMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedUnit = data.units.find((unit) => unit.id === unitId) ?? data.units[0];
  const selectedCategory = data.extensionCategories.find((category) => category.id === categoryId) ?? data.extensionCategories[0];
  const cloudConfigured = isSupabaseConfigured();

  const items = useMemo(() => {
    if (type === "extensionWords") {
      return data.extensionWords.filter((word) => word.categoryId === selectedCategory?.id);
    }

    const unit = data.units.find((item) => item.id === selectedUnit?.id);
    return unit?.[type] ?? [];
  }, [data, selectedCategory?.id, selectedUnit?.id, type]);

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function persist(nextData: KnowledgeDataSet, successMessage: string) {
    saveDataOverride(nextData);
    setData(cloneData(nextData));
    setMessage(successMessage);
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyForm);
  }

  function handleEdit(item: KnowledgeWord | KnowledgePhrase | KnowledgeSentence | ExtensionWord) {
    setEditingId(item.id);
    setForm({
      english: item.english,
      chinese: item.chinese,
      partOfSpeech: "partOfSpeech" in item ? item.partOfSpeech : "",
      difficulty: "difficulty" in item ? item.difficulty : "基础",
    });
  }

  function handleDelete(itemId: string) {
    const nextData = cloneData(data);

    if (type === "extensionWords") {
      nextData.extensionWords = nextData.extensionWords.filter((word) => word.id !== itemId);
    } else {
      nextData.units = nextData.units.map((unit) =>
        unit.id === selectedUnit?.id
          ? { ...unit, [type]: unit[type].filter((item) => item.id !== itemId) }
          : unit,
      );
    }

    persist(nextData, "已删除，并保存到本地覆盖数据。");
    resetForm();
  }

  function handleSave() {
    if (!form.english.trim() || !form.chinese.trim()) {
      setMessage("英文和中文都不能为空。");
      return;
    }

    const nextData = cloneData(data);

    if (type === "extensionWords") {
      if (!selectedCategory) return;

      if (editingId) {
        nextData.extensionWords = nextData.extensionWords.map((word) =>
          word.id === editingId
            ? {
                ...word,
                english: form.english.trim(),
                chinese: form.chinese.trim(),
                partOfSpeech: form.partOfSpeech.trim() || "n.",
                difficulty: form.difficulty,
              }
            : word,
        );
      } else {
        const gradeId = selectedCategory.gradeId ?? selectedCategory.recommendedGradeIds[0] ?? "primary-g4b";
        nextData.extensionWords.push({
          id: `ext-word-local-${Date.now()}`,
          gradeId,
          categoryId: selectedCategory.id,
          recommendedGradeIds: selectedCategory.recommendedGradeIds,
          english: form.english.trim(),
          chinese: form.chinese.trim(),
          partOfSpeech: form.partOfSpeech.trim() || "n.",
          sortOrder: nextSortOrder(nextData.extensionWords.filter((word) => word.categoryId === selectedCategory.id)),
          difficulty: form.difficulty,
        });
      }
    } else {
      if (!selectedUnit) return;

      nextData.units = nextData.units.map((unit) => {
        if (unit.id !== selectedUnit.id) {
          return unit;
        }

        if (editingId) {
          return {
            ...unit,
            [type]: unit[type].map((item) =>
              item.id === editingId
                ? {
                    ...item,
                    english: form.english.trim(),
                    chinese: form.chinese.trim(),
                    ...("partOfSpeech" in item ? { partOfSpeech: form.partOfSpeech.trim() || "n." } : {}),
                  }
                : item,
            ),
          };
        }

        const base = {
          id: `${unit.id}-${type}-local-${Date.now()}`,
          gradeId: unit.gradeId,
          bookId: unit.bookId,
          unitId: unit.id,
          english: form.english.trim(),
          chinese: form.chinese.trim(),
          sortOrder: nextSortOrder(unit[type]),
          isRequired: true,
        };

        if (type === "words") {
          const word: KnowledgeWord = {
            ...base,
            partOfSpeech: form.partOfSpeech.trim() || "n.",
          };
          return { ...unit, words: [...unit.words, word] };
        }

        if (type === "phrases") {
          const phrase: KnowledgePhrase = base;
          return { ...unit, phrases: [...unit.phrases, phrase] };
        }

        const sentence: KnowledgeSentence = base;
        return { ...unit, sentences: [...unit.sentences, sentence] };
      });
    }

    persist(nextData, editingId ? "已编辑，并保存到本地覆盖数据。" : "已新增，并保存到本地覆盖数据。");
    resetForm();
  }

  function handleExport() {
    const blob = new Blob([exportDataJson(data)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "english-practice-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const result = importDataJson(importText);

    if (result.ok) {
      setData(cloneData(result.data));
      setMessage("导入成功，已保存到本地覆盖数据。");
      setImportText("");
    } else {
      setMessage(result.error);
    }
  }

  function handleRestoreDefault() {
    clearDataOverride();
    setData(getDefaultData());
    resetForm();
    setMessage("已恢复默认数据。");
  }

  async function runCloudAction(action: () => Promise<string>) {
    if (!cloudConfigured) {
      setCloudMessage("Supabase 未配置，当前仍使用本地 localStorage 模式。");
      return;
    }

    setIsSyncing(true);
    setCloudMessage("正在同步...");

    try {
      setCloudMessage(await action());
    } catch (error) {
      setCloudMessage(error instanceof Error ? error.message : "云端同步失败。");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleUploadKnowledge() {
    await runCloudAction(async () => {
      const result = await saveKnowledgeDataToCloud(data);
      return result.message;
    });
  }

  async function handlePullKnowledge() {
    await runCloudAction(async () => {
      const cloudData = await loadCloudData();
      saveDataOverride(cloudData);
      setData(cloneData(cloudData));
      resetForm();
      return "已从 Supabase 拉取知识库数据，并保存为本地覆盖数据。";
    });
  }

  async function handleUploadWrongBook() {
    await runCloudAction(async () => {
      const items = getWrongBook();

      if (items.length === 0) {
        return "本地错题本为空，无需上传。";
      }

      const results = await Promise.all(items.map((item) => saveWrongBookItemToCloud(item)));
      const successCount = results.filter((result) => result.ok).length;
      return `错题本上传完成：成功 ${successCount} 条，失败 ${items.length - successCount} 条。`;
    });
  }

  async function handlePullWrongBook() {
    await runCloudAction(async () => {
      const items = await loadWrongBookFromCloud();
      saveWrongBook(items);
      return `已从 Supabase 拉取错题本：${items.length} 条。`;
    });
  }

  async function handleUploadHistory() {
    await runCloudAction(async () => {
      const attempts = getPracticeHistory();

      if (attempts.length === 0) {
        return "本地练习历史为空，无需上传。";
      }

      const results = await Promise.all(attempts.map((attempt) => saveAttemptToCloud(attempt)));
      const successCount = results.filter((result) => result.ok).length;
      return `练习历史上传完成：成功 ${successCount} 条，失败 ${attempts.length - successCount} 条。`;
    });
  }

  async function handlePullHistory() {
    await runCloudAction(async () => {
      const attempts = await loadAttemptsFromCloud();
      savePracticeHistory(attempts);
      return `已从 Supabase 拉取练习历史：${attempts.length} 条。`;
    });
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">本地管理</p>
        <h1>数据管理</h1>
        <p>新增、编辑、删除知识清单条目，并通过 JSON 导入导出本机 localStorage 覆盖数据。</p>
      </section>

      <section className="form-layout">
        <article className="panel wizard-panel">
          <div className="choice-group">
            <h2>选择数据范围</h2>
            <div className="filter-panel three-columns compact-filter">
              <label>
                <span>类型</span>
                <select value={type} onChange={(event) => { setType(event.target.value as EditableType); resetForm(); }}>
                  {editableTypes.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              {type === "extensionWords" ? (
                <label>
                  <span>分类</span>
                  <select value={selectedCategory?.id} onChange={(event) => setCategoryId(event.target.value)}>
                    {data.extensionCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span>单元</span>
                  <select value={selectedUnit?.id} onChange={(event) => setUnitId(event.target.value)}>
                    {data.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {data.books.find((book) => book.id === unit.bookId)?.name} {unit.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="choice-group">
            <h2>{editingId ? "编辑条目" : "新增条目"}</h2>
            <div className="admin-form-grid">
              <label>
                <span>英文</span>
                <input value={form.english} onChange={(event) => updateForm("english", event.target.value)} />
              </label>
              <label>
                <span>中文</span>
                <input value={form.chinese} onChange={(event) => updateForm("chinese", event.target.value)} />
              </label>
              {(type === "words" || type === "extensionWords") ? (
                <label>
                  <span>词性</span>
                  <input value={form.partOfSpeech} onChange={(event) => updateForm("partOfSpeech", event.target.value)} />
                </label>
              ) : null}
              {type === "extensionWords" ? (
                <label>
                  <span>难度</span>
                  <select value={form.difficulty} onChange={(event) => updateForm("difficulty", event.target.value)}>
                    <option value="基础">基础</option>
                    <option value="进阶">进阶</option>
                    <option value="易错">易错</option>
                  </select>
                </label>
              ) : null}
            </div>
            <div className="button-row">
              <button type="button" className="primary-button" onClick={handleSave}>{editingId ? "保存编辑" : "新增"}</button>
              <button type="button" className="secondary-button" onClick={resetForm}>清空表单</button>
            </div>
          </div>

          <div className="choice-group">
            <h2>当前条目</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>英文</th>
                    <th>中文</th>
                    <th>备注</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.english}</td>
                      <td>{item.chinese}</td>
                      <td>
                        {"partOfSpeech" in item ? item.partOfSpeech : ""}
                        {"difficulty" in item ? ` · ${item.difficulty}` : ""}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="secondary-button" onClick={() => handleEdit(item)}>编辑</button>
                          <button type="button" className="secondary-button danger-button" onClick={() => handleDelete(item.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <aside className="panel summary-panel">
          <h2>JSON 导入导出</h2>
          {message ? <p className="error-text">{message}</p> : null}
          <div className="stack-actions">
            <button type="button" className="primary-button full-width" onClick={handleExport}>导出当前数据 JSON</button>
            <button type="button" className="secondary-button full-width" onClick={handleRestoreDefault}>恢复默认数据</button>
          </div>
          <label className="json-import">
            <span>粘贴 JSON</span>
            <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={10} />
          </label>
          <label className="secondary-button full-width file-button">
            上传 JSON 文件
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setImportText(await file.text());
              }}
            />
          </label>
          <button type="button" className="primary-button full-width" onClick={handleImport}>导入 JSON</button>

          <div className="cloud-sync-block">
            <h2>云端同步</h2>
            <p className="muted-text">
              当前模式：{cloudConfigured ? "Supabase 已配置" : "本地 localStorage"}
            </p>
            {cloudMessage ? <p className="error-text">{cloudMessage}</p> : null}
            <div className="stack-actions">
              <button type="button" className="secondary-button full-width" onClick={handleUploadKnowledge} disabled={isSyncing}>
                上传本地知识库到 Supabase
              </button>
              <button type="button" className="secondary-button full-width" onClick={handlePullKnowledge} disabled={isSyncing}>
                从 Supabase 拉取知识库
              </button>
              <button type="button" className="secondary-button full-width" onClick={handleUploadWrongBook} disabled={isSyncing}>
                上传错题本
              </button>
              <button type="button" className="secondary-button full-width" onClick={handlePullWrongBook} disabled={isSyncing}>
                拉取错题本
              </button>
              <button type="button" className="secondary-button full-width" onClick={handleUploadHistory} disabled={isSyncing}>
                上传练习历史
              </button>
              <button type="button" className="secondary-button full-width" onClick={handlePullHistory} disabled={isSyncing}>
                拉取练习历史
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
