"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatSourceType } from "@/lib/practice";
import { useWrongBookItems } from "@/lib/storage-hooks";
import type { SourceType } from "@/lib/types";

type WrongBookFilter = "all" | "word" | "phrase" | "sentence" | "extension";

const filters: { value: WrongBookFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "word", label: "单词" },
  { value: "phrase", label: "词组" },
  { value: "sentence", label: "句子" },
  { value: "extension", label: "拓展词汇" },
];

function matchesFilter(sourceType: SourceType, filter: WrongBookFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "word") {
    return sourceType === "knowledge_word";
  }

  if (filter === "phrase") {
    return sourceType === "knowledge_phrase";
  }

  if (filter === "sentence") {
    return sourceType === "knowledge_sentence";
  }

  return sourceType === "extension_word" || sourceType === "extension_phrase";
}

export default function WrongBookPage() {
  const items = useWrongBookItems();
  const [filter, setFilter] = useState<WrongBookFilter>("all");

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item.sourceType, filter)),
    [items, filter],
  );

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">自动收集</p>
        <h1>错题本</h1>
        <p>按来源、题型和错误类型复盘错题，错误次数会自动累加。</p>
      </section>

      <section className="panel">
        <div className="filter-row">
          {filters.map((item) => (
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
                  <th>来源</th>
                  <th>类型</th>
                  <th>中文题干</th>
                  <th>正确答案</th>
                  <th>错误答案</th>
                  <th>错误类型</th>
                  <th>错误次数</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.sourceLabel}</td>
                    <td>{formatSourceType(item.sourceType)}</td>
                    <td>{item.prompt}</td>
                    <td>{item.correctAnswer}</td>
                    <td>{item.studentAnswer || "未作答"}</td>
                    <td>{item.errorType}</td>
                    <td>{item.errorCount}</td>
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
