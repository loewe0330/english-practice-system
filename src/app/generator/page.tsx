"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { extensionCategories, units } from "@/lib/mock-data";
import {
  buildPracticePaper,
  knowledgeSelectionLabels,
  type KnowledgeSelection,
} from "@/lib/practice";
import { saveCurrentPaper } from "@/lib/storage";

const knowledgeOptions: KnowledgeSelection[] = ["words", "phrases", "sentences"];

export default function GeneratorPage() {
  const router = useRouter();
  const [sourceMode, setSourceMode] = useState<"knowledge" | "extension">("knowledge");
  const [knowledgeSelections, setKnowledgeSelections] = useState<KnowledgeSelection[]>(["words"]);
  const [categoryIds, setCategoryIds] = useState<string[]>(["ext-animal"]);
  const [error, setError] = useState("");
  const unit = units[0];

  const estimatedCount = useMemo(() => {
    const paper = buildPracticePaper({ sourceMode, knowledgeSelections, categoryIds });
    return paper.questions.length;
  }, [sourceMode, knowledgeSelections, categoryIds]);

  function toggleKnowledgeSelection(selection: KnowledgeSelection) {
    setKnowledgeSelections((current) =>
      current.includes(selection)
        ? current.filter((item) => item !== selection)
        : [...current, selection],
    );
  }

  function toggleCategory(categoryId: string) {
    setCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  }

  function handleGenerate() {
    const paper = buildPracticePaper({ sourceMode, knowledgeSelections, categoryIds });

    if (paper.questions.length === 0) {
      setError("请至少选择一个有题目的内容范围。");
      return;
    }

    saveCurrentPaper(paper);
    router.push("/practice");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">练习生成</p>
        <h1>练习生成器</h1>
        <p>选择校内知识清单或拓展词汇，生成中文写英文在线练习。</p>
      </section>

      <section className="form-layout">
        <article className="panel">
          <h2>1. 选择内容来源</h2>
          <div className="segmented-control">
            <button
              type="button"
              className={sourceMode === "knowledge" ? "active" : ""}
              onClick={() => setSourceMode("knowledge")}
            >
              校内知识清单
            </button>
            <button
              type="button"
              className={sourceMode === "extension" ? "active" : ""}
              onClick={() => setSourceMode("extension")}
            >
              拓展词汇
            </button>
          </div>

          {sourceMode === "knowledge" ? (
            <div className="choice-group">
              <h3>译林英语 4B · {unit.name}</h3>
              {knowledgeOptions.map((option) => (
                <label key={option} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={knowledgeSelections.includes(option)}
                    onChange={() => toggleKnowledgeSelection(option)}
                  />
                  <span>{knowledgeSelectionLabels[option]}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="choice-group">
              <h3>拓展词汇分类</h3>
              {extensionCategories.map((category) => (
                <label key={category.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </article>

        <aside className="panel summary-panel">
          <h2>练习预览</h2>
          <p>当前将生成</p>
          <strong>{estimatedCount}</strong>
          <p>道中文写英文题目</p>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="button" className="primary-button full-width" onClick={handleGenerate}>
            生成练习
          </button>
        </aside>
      </section>
    </main>
  );
}
