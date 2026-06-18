"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/StatCard";
import {
  getDataReviewRows,
  getDataReviewStats,
  type ReviewContentType,
} from "@/lib/data-review";
import { formatSourceType } from "@/lib/practice";
import { useEffectiveData } from "@/lib/storage-hooks";

const contentTypeOptions: { value: ReviewContentType; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "words", label: "单词" },
  { value: "phrases", label: "词组" },
  { value: "sentences", label: "句子" },
  { value: "grammar", label: "语法" },
  { value: "extension", label: "拓展词汇" },
];

export default function DataReviewPage() {
  const data = useEffectiveData();
  const [gradeId, setGradeId] = useState("all");
  const [bookId, setBookId] = useState("all");
  const [unitId, setUnitId] = useState("all");
  const [contentType, setContentType] = useState<ReviewContentType>("all");

  const stats = useMemo(() => getDataReviewStats(data), [data]);
  const rows = useMemo(
    () =>
      getDataReviewRows(data).filter(
        (row) =>
          (gradeId === "all" || row.gradeId === gradeId) &&
          (bookId === "all" || row.bookId === bookId) &&
          (unitId === "all" || row.unitId === unitId) &&
          (contentType === "all" || row.contentType === contentType),
      ),
    [bookId, contentType, data, gradeId, unitId],
  );
  const issueCount = rows.reduce((total, row) => total + row.issues.length, 0);

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">数据校对</p>
        <h1>知识库数据校对</h1>
        <p>筛选查看当前有效数据，并自动标记空值、重复、英文夹中文和句子标点等疑似问题。</p>
      </section>

      <section className="stats-grid">
        <StatCard label="单词数量" value={stats.wordCount} />
        <StatCard label="词组数量" value={stats.phraseCount} />
        <StatCard label="句子数量" value={stats.sentenceCount} />
        <StatCard label="语法点数量" value={stats.grammarCount} />
        <StatCard label="拓展词汇数量" value={stats.extensionCount} />
        <StatCard label="当前显示" value={rows.length} />
        <StatCard label="疑似问题" value={issueCount} hint="按 warning 标签累计" />
      </section>

      <section className="panel filter-panel four-columns">
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
        <label>
          <span>内容类型</span>
          <select value={contentType} onChange={(event) => setContentType(event.target.value as ReviewContentType)}>
            {contentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>warning</th>
                <th>年级</th>
                <th>教材/分类</th>
                <th>单元</th>
                <th>类型</th>
                <th>英文</th>
                <th>中文</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.issues.length > 0 ? "warning-row" : undefined}>
                  <td>
                    <div className="warning-stack">
                      {row.issues.length === 0 ? (
                        <span className="muted-text">正常</span>
                      ) : (
                        row.issues.map((issue) => (
                          <span key={`${row.id}-${issue.code}`} className="warning-badge">{issue.message}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>{data.grades.find((grade) => grade.id === row.gradeId)?.displayName ?? "未分类"}</td>
                  <td>
                    {data.books.find((book) => book.id === row.bookId)?.name ??
                      data.extensionCategories.find((category) => category.id === row.categoryId)?.name ??
                      "未分类"}
                  </td>
                  <td>{data.units.find((unit) => unit.id === row.unitId)?.displayName ?? "拓展词汇"}</td>
                  <td>{formatSourceType(row.sourceType)}</td>
                  <td>{row.english || "（空）"}</td>
                  <td>{row.chinese || "（空）"}</td>
                  <td>{row.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
