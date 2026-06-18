"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCurrentPaper } from "@/lib/storage-hooks";

export default function PrintPage() {
  const paper = useCurrentPaper();
  const [showAnswers, setShowAnswers] = useState(false);

  const groupedQuestions = useMemo(() => {
    if (!paper) return [];
    const groups = new Map<string, typeof paper.questions>();
    paper.questions.forEach((question) => {
      const key = question.sourceLabel;
      groups.set(key, [...(groups.get(key) ?? []), question]);
    });
    return Array.from(groups.entries()).map(([label, questions]) => ({ label, questions }));
  }, [paper]);

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
    <main className={showAnswers ? "print-page answer-mode" : "print-page"}>
      <div className="print-toolbar print-hidden">
        <div>
          <h1>A4 打印预览</h1>
          <p>{paper.title}</p>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => setShowAnswers((value) => !value)}>
            {showAnswers ? "隐藏答案" : "显示答案"}
          </button>
          <button type="button" className="primary-button" onClick={() => window.print()}>
            {showAnswers ? "打印答案版" : "打印学生版"}
          </button>
        </div>
      </div>

      <section className="a4-sheet">
        <header className="print-title">
          <h2>{paper.title}</h2>
          <p>姓名：__________　日期：__________　得分：__________</p>
        </header>

        {groupedQuestions.map((group) => (
          <section key={group.label} className="print-group">
            <h3>{group.label}</h3>
            <div className="dictation-grid">
              {group.questions.map((question, index) => (
                <div key={question.id} className="dictation-row">
                  <span>{index + 1}</span>
                  <strong>{question.prompt}</strong>
                  {showAnswers ? <em>{question.correctAnswer}</em> : <i aria-hidden="true" />}
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
