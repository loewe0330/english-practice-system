"use client";

import Link from "next/link";
import { useCurrentPaper } from "@/lib/storage-hooks";

export default function PrintPage() {
  const paper = useCurrentPaper();

  if (!paper) {
    return (
      <main className="page-shell">
        <section className="empty-state">
          <h1>暂无可打印练习</h1>
          <p>请先生成一次练习，再查看 A4 打印预览。</p>
          <Link href="/generator" className="primary-button">去生成练习</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="print-page">
      <div className="print-toolbar print-hidden">
        <div>
          <h1>A4 打印预览</h1>
          <p>{paper.title}</p>
        </div>
        <button type="button" className="primary-button" onClick={() => window.print()}>
          打印
        </button>
      </div>

      <section className="a4-sheet">
        <header className="print-title">
          <h2>{paper.title}</h2>
          <p>姓名：__________　日期：__________　得分：__________</p>
        </header>

        <div className="dictation-grid">
          {paper.questions.map((question, index) => (
            <div key={question.id} className="dictation-row">
              <span>{index + 1}</span>
              <strong>{question.prompt}</strong>
              <i aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
