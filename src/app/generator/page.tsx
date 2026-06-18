"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildPracticePaper,
  contentTypeLabels,
  getBookOptionsByGrade,
  getCategoryOptionsByGrade,
  getUnitOptionsByBooks,
} from "@/lib/practice";
import { saveCurrentPaper } from "@/lib/storage";
import { useEffectiveData, useWrongBookItems } from "@/lib/storage-hooks";
import type { PracticeContentType } from "@/lib/types";
import {
  buildWrongBookPracticePaper,
  selectWrongPracticeItems,
  type WrongPracticeMode,
} from "@/lib/wrong-practice";

const contentOptions: PracticeContentType[] = ["words", "phrases", "sentences", "extension"];

export default function GeneratorPage() {
  const router = useRouter();
  const data = useEffectiveData();
  const wrongBookItems = useWrongBookItems();
  const [gradeId, setGradeId] = useState("primary-g4b");
  const [bookIds, setBookIds] = useState<string[]>(["yilin-4b"]);
  const [unitIds, setUnitIds] = useState<string[]>(["yilin-4b-u1"]);
  const [contentTypes, setContentTypes] = useState<PracticeContentType[]>(["words"]);
  const [categoryIds, setCategoryIds] = useState<string[]>(["ext-animal"]);
  const [error, setError] = useState("");

  const availableBooks = getBookOptionsByGrade(gradeId, data);
  const availableUnits = getUnitOptionsByBooks(gradeId, bookIds, data);
  const availableCategories = getCategoryOptionsByGrade(gradeId, data);

  const estimatedPaper = useMemo(
    () =>
      buildPracticePaper({
        gradeId,
        bookIds,
        unitIds,
        contentTypes,
        categoryIds,
        questionType: "zh_to_en",
      }, data),
    [bookIds, categoryIds, contentTypes, data, gradeId, unitIds],
  );

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function toggleContent(type: PracticeContentType) {
    setContentTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  }

  function handleGradeChange(nextGradeId: string) {
    const nextBooks = data.books.filter((book) => book.gradeId === nextGradeId).map((book) => book.id);
    const firstBookId = nextBooks[0];
    const nextUnits = data.units.filter((unit) => unit.gradeId === nextGradeId && unit.bookId === firstBookId);
    setGradeId(nextGradeId);
    setBookIds(firstBookId ? [firstBookId] : []);
    setUnitIds(nextUnits[0] ? [nextUnits[0].id] : []);
  }

  function handleGenerate() {
    if (estimatedPaper.questions.length === 0) {
      setError("请至少选择一个有题目的单元、内容类型或拓展分类。");
      return;
    }

    saveCurrentPaper(estimatedPaper);
    router.push("/practice");
  }

  function handleWrongPractice(mode: WrongPracticeMode) {
    const selectedItems = selectWrongPracticeItems(wrongBookItems, mode);

    if (selectedItems.length === 0) {
      setError("当前没有符合条件的未掌握错题。");
      return;
    }

    saveCurrentPaper(buildWrongBookPracticePaper(selectedItems, "错题再练 · 中文写英文"));
    router.push("/practice");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">练习生成</p>
        <h1>练习生成器</h1>
        <p>按年级、教材、单元和内容类型组合生成中文写英文练习，支持校内知识清单和拓展词汇混合。</p>
      </section>

      <section className="form-layout">
        <article className="panel wizard-panel">
          <div className="choice-group">
            <h2>1. 选择年级</h2>
            <select value={gradeId} onChange={(event) => handleGradeChange(event.target.value)}>
              {data.grades.map((grade) => (
                <option key={grade.id} value={grade.id}>{grade.displayName}</option>
              ))}
            </select>
          </div>

          <div className="choice-group">
            <h2>2. 选择教材</h2>
            <div className="checkbox-grid">
              {availableBooks.map((book) => (
                <label key={book.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={bookIds.includes(book.id)}
                    onChange={() => toggle(bookIds, book.id, setBookIds)}
                  />
                  <span>{book.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="choice-group">
            <h2>3. 选择单元</h2>
            <div className="checkbox-grid">
              {availableUnits.map((unit) => (
                <label key={unit.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={unitIds.includes(unit.id)}
                    onChange={() => toggle(unitIds, unit.id, setUnitIds)}
                  />
                  <span>{data.books.find((book) => book.id === unit.bookId)?.name} · {unit.displayName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="choice-group">
            <h2>4. 选择内容</h2>
            <div className="checkbox-grid">
              {contentOptions.map((type) => (
                <label key={type} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={contentTypes.includes(type)}
                    onChange={() => toggleContent(type)}
                  />
                  <span>{contentTypeLabels[type]}</span>
                </label>
              ))}
            </div>
          </div>

          {contentTypes.includes("extension") ? (
            <div className="choice-group">
              <h2>拓展词汇分类</h2>
              <div className="checkbox-grid">
                {availableCategories.map((category) => (
                  <label key={category.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(category.id)}
                      onChange={() => toggle(categoryIds, category.id, setCategoryIds)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="choice-group">
            <h2>5. 选择题型</h2>
            <div className="segmented-control">
              <button type="button" className="active">中文写英文</button>
            </div>
          </div>
        </article>

        <aside className="panel summary-panel">
          <h2>6. 生成练习</h2>
          <p>当前将生成</p>
          <strong>{estimatedPaper.questions.length}</strong>
          <p>道中文写英文题目</p>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="button" className="primary-button full-width" onClick={handleGenerate}>
            生成练习
          </button>

          <div className="divider" />
          <h2>从错题本生成</h2>
          <p>当前错题本：{wrongBookItems.length} 条</p>
          <div className="stack-actions">
            <button type="button" className="secondary-button full-width" onClick={() => handleWrongPractice("all-unmastered")}>
              所有未掌握错题
            </button>
            <button type="button" className="secondary-button full-width" onClick={() => handleWrongPractice("recent")}>
              最近错题
            </button>
            <button type="button" className="secondary-button full-width" onClick={() => handleWrongPractice("frequent")}>
              错误次数 ≥ 2
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
