"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatSourceType } from "@/lib/practice";
import {
  clearWrongBook,
  deleteWrongBookItem,
  markWrongBookItem,
  saveCurrentPaper,
} from "@/lib/storage";
import { useEffectiveData, useWrongBookItems } from "@/lib/storage-hooks";
import {
  buildWrongBookPracticePaper,
  getWrongCount,
  matchesWrongBookFilter,
  wrongBookFilters,
  type WrongBookFilter,
} from "@/lib/wrong-practice";

export default function WrongBookPage() {
  const router = useRouter();
  const items = useWrongBookItems();
  const data = useEffectiveData();
  const [filter, setFilter] = useState<WrongBookFilter>("all");
  const [message, setMessage] = useState("");

  const filteredItems = useMemo(
    () => items.filter((item) => matchesWrongBookFilter(item, filter)),
    [items, filter],
  );
  const retryItems = filteredItems.filter((item) => !item.mastered);

  function handleRetry() {
    if (retryItems.length === 0) {
      setMessage("当前筛选下没有未掌握错题。");
      return;
    }

    saveCurrentPaper(buildWrongBookPracticePaper(retryItems, "错题再练 · 中文写英文"));
    router.push("/practice");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">自动收集</p>
        <h1>错题本</h1>
        <p>按来源、题型和错误类型复盘错题，错误次数会自动累加。</p>
      </section>

      <section className="panel">
        <div className="filter-row">
          {wrongBookFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? "active" : ""}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="section-title-row compact-row">
          <p>当前筛选 {filteredItems.length} 条，未掌握 {retryItems.length} 条。</p>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={handleRetry}>错题再练</button>
            <button type="button" className="secondary-button" onClick={clearWrongBook}>清空错题本</button>
          </div>
        </div>
        {message ? <p className="error-text">{message}</p> : null}

        {filteredItems.length === 0 ? (
          <div className="empty-state compact">
            <h2>暂时没有错题</h2>
            <p>完成一次练习后，错误和空题会自动进入错题本。</p>
            <Link href="/generator" className="primary-button">去生成练习</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>年级</th>
                  <th>教材/分类</th>
                  <th>单元</th>
                  <th>来源</th>
                  <th>类型</th>
                  <th>中文题干</th>
                  <th>正确答案</th>
                  <th>错误答案</th>
                  <th>错误类型</th>
                  <th>错误次数</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{data.grades.find((grade) => grade.id === item.gradeId)?.displayName ?? "未分类"}</td>
                    <td>
                      {data.books.find((book) => book.id === item.bookId)?.name ??
                        data.extensionCategories.find((category) => category.id === item.categoryId)?.name ??
                        "未分类"}
                    </td>
                    <td>{data.units.find((unit) => unit.id === item.unitId)?.displayName ?? "拓展词汇"}</td>
                    <td>{item.sourceLabel}</td>
                    <td>{formatSourceType(item.sourceType)}</td>
                    <td>{item.prompt}</td>
                    <td>{item.correctAnswer}</td>
                    <td>{item.studentAnswer || "未作答"}</td>
                    <td>{item.errorType}</td>
                    <td>{getWrongCount(item)}</td>
                    <td>{item.mastered ? "已掌握" : "未掌握"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => markWrongBookItem(item.id, !item.mastered)}
                        >
                          {item.mastered ? "标记未掌握" : "标记已掌握"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button danger-button"
                          onClick={() => deleteWrongBookItem(item.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
