"use client";

import { useMemo, useState } from "react";
import { useEffectiveData } from "@/lib/storage-hooks";

export default function KnowledgePage() {
  const data = useEffectiveData();
  const [gradeId, setGradeId] = useState("all");
  const [bookId, setBookId] = useState("all");
  const [unitId, setUnitId] = useState("all");

  const filteredUnits = useMemo(
    () =>
      data.units.filter(
        (unit) =>
          (gradeId === "all" || unit.gradeId === gradeId) &&
          (bookId === "all" || unit.bookId === bookId) &&
          (unitId === "all" || unit.id === unitId),
      ),
    [bookId, data.units, gradeId, unitId],
  );

  const groupedGrades = data.grades
    .filter((grade) => gradeId === "all" || grade.id === gradeId)
    .map((grade) => ({
      grade,
      books: data.books
        .filter((book) => book.gradeId === grade.id && (bookId === "all" || book.id === bookId))
        .map((book) => ({
          book,
          units: filteredUnits.filter((unit) => unit.bookId === book.id),
        }))
        .filter((group) => group.units.length > 0),
    }))
    .filter((group) => group.books.length > 0);

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">校内知识清单</p>
        <h1>知识清单库</h1>
        <p>按年级、教材和单元整理真实知识清单，支持展开查看单词、词组、句子和语法点。</p>
      </section>

      <section className="panel filter-panel">
        <label>
          <span>年级</span>
          <select value={gradeId} onChange={(event) => setGradeId(event.target.value)}>
            <option value="all">全部</option>
            {data.grades.map((grade) => (
              <option key={grade.id} value={grade.id}>{grade.displayName}</option>
            ))}
          </select>
        </label>
        <label>
          <span>教材</span>
          <select value={bookId} onChange={(event) => setBookId(event.target.value)}>
            <option value="all">全部</option>
            {data.books.map((book) => (
              <option key={book.id} value={book.id}>{book.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>单元</span>
          <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
            <option value="all">全部</option>
            {data.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {data.books.find((book) => book.id === unit.bookId)?.name} {unit.displayName}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="category-stack">
        {groupedGrades.map(({ grade, books: bookGroups }) => (
          <article key={grade.id} className="panel">
            <div className="section-title-row">
              <h2>{grade.displayName}</h2>
              <span className="pill">{filteredUnits.length} 个单元</span>
            </div>
            {bookGroups.map(({ book, units: bookUnits }) => (
              <div key={book.id} className="book-group">
                <h3>{book.name}</h3>
                <div className="unit-list">
                  {bookUnits.map((unit) => (
                    <details key={unit.id} className="unit-details">
                      <summary>
                        <span>
                          <strong>{unit.displayName}</strong>
                          <small>{unit.title}</small>
                        </span>
                        <span className="summary-stats">
                          单词 {unit.words.length}，词组 {unit.phrases.length}，句子 {unit.sentences.length}，语法 {unit.grammarPoints.length}
                        </span>
                      </summary>
                      <div className="content-columns">
                        <article>
                          <h3>单词</h3>
                          <ul className="term-list">
                            {unit.words.map((word) => (
                              <li key={word.id}><strong>{word.english}</strong><span>{word.chinese} · {word.partOfSpeech}</span></li>
                            ))}
                          </ul>
                        </article>
                        <article>
                          <h3>词组</h3>
                          <ul className="term-list">
                            {unit.phrases.map((phrase) => (
                              <li key={phrase.id}><strong>{phrase.english}</strong><span>{phrase.chinese}</span></li>
                            ))}
                          </ul>
                        </article>
                        <article className="wide-column">
                          <h3>句子</h3>
                          <ul className="sentence-list">
                            {unit.sentences.map((sentence) => (
                              <li key={sentence.id}><strong>{sentence.english}</strong><span>{sentence.chinese}</span></li>
                            ))}
                          </ul>
                        </article>
                        <article className="wide-column">
                          <h3>语法点</h3>
                          <ul className="sentence-list">
                            {unit.grammarPoints.map((point) => (
                              <li key={point.id}><strong>{point.title}</strong><span>{point.explanation}</span></li>
                            ))}
                          </ul>
                        </article>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
