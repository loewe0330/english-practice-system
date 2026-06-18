"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StatCard } from "@/components/StatCard";
import { formatSourceType } from "@/lib/practice";
import { useCurrentPaper, useEffectiveData, useLastAttempt, usePracticeHistory } from "@/lib/storage-hooks";

function ResultsContent() {
  const currentPaper = useCurrentPaper();
  const lastAttempt = useLastAttempt();
  const history = usePracticeHistory();
  const data = useEffectiveData();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";

  const selectedAttempt = useMemo(
    () => (attemptId ? history.find((item) => item.id === attemptId) ?? null : lastAttempt),
    [attemptId, history, lastAttempt],
  );
  const paper = selectedAttempt?.paper ?? currentPaper;
  const attempt = selectedAttempt;

  const answerRows = useMemo(() => {
    if (!paper || !attempt) {
      return [];
    }

    return paper.questions.map((question) => ({
      question,
      answer: attempt.answers.find((item) => item.questionId === question.id),
    }));
  }, [paper, attempt]);

  if (!paper || !attempt) {
    return (
      <main className="page-shell">
        <section className="empty-state">
          <h1>暂无批改结果</h1>
          <p>完成一次在线作答后，这里会显示得分和每题明细。</p>
          <Link href="/generator" className="primary-button">
            返回练习生成器
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">批改完成</p>
        <h1>{attemptId ? "历史练习结果" : "本次练习结果"}</h1>
        <p>{attempt.title ?? paper.title}</p>
      </section>

      <section className="stats-grid">
        <StatCard label="总题数" value={attempt.total} />
        <StatCard label="正确数" value={attempt.correct} />
        <StatCard label="错误数" value={attempt.total - attempt.correct} />
        <StatCard label="得分" value={`${attempt.score} 分`} />
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>逐题明细</h2>
          <div className="button-row">
            <Link href="/generator" className="secondary-button">返回练习生成器</Link>
            <Link href="/wrong-book" className="secondary-button">查看错题本</Link>
            <Link href="/print" className="primary-button">打印本次练习</Link>
          </div>
        </div>

        <div className="result-list">
          {answerRows.map(({ question, answer }, index) => (
            <article key={question.id} className={answer?.isCorrect ? "result-row correct" : "result-row"}>
              <div>
                <span className="question-number">第 {index + 1} 题 · {formatSourceType(question.sourceType)}</span>
                <h3>{question.prompt}</h3>
              </div>
              <dl>
                <div>
                  <dt>年级</dt>
                  <dd>{data.grades.find((grade) => grade.id === question.gradeId)?.displayName ?? "未分类"}</dd>
                </div>
                <div>
                  <dt>教材</dt>
                  <dd>{data.books.find((book) => book.id === question.bookId)?.name ?? "拓展词汇"}</dd>
                </div>
                <div>
                  <dt>单元</dt>
                  <dd>{data.units.find((unit) => unit.id === question.unitId)?.displayName ?? "分类"}</dd>
                </div>
                <div>
                  <dt>你的答案</dt>
                  <dd>{answer?.studentAnswer || "未作答"}</dd>
                </div>
                <div>
                  <dt>正确答案</dt>
                  <dd>{question.correctAnswer}</dd>
                </div>
                <div>
                  <dt>结果</dt>
                  <dd>{answer?.isCorrect ? "正确" : "需要订正"}</dd>
                </div>
                <div>
                  <dt>错误类型</dt>
                  <dd>{answer?.errorType}</dd>
                </div>
              </dl>
              <p>{answer?.feedback}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<main className="page-shell"><section className="empty-state"><h1>正在读取结果</h1></section></main>}>
      <ResultsContent />
    </Suspense>
  );
}
