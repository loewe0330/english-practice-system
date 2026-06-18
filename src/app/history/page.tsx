"use client";

import Link from "next/link";
import { clearPracticeHistory, deletePracticeHistoryItem } from "@/lib/storage";
import { usePracticeHistory } from "@/lib/storage-hooks";

function formatDate(value?: string) {
  if (!value) return "未知时间";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HistoryPage() {
  const history = usePracticeHistory();

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">练习留痕</p>
        <h1>练习历史</h1>
        <p>每次提交后会保存一条本地历史记录，可回看当次得分和逐题明细。</p>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>历史记录</h2>
            <p>共 {history.length} 次练习。</p>
          </div>
          <button type="button" className="secondary-button" onClick={clearPracticeHistory}>清空全部历史</button>
        </div>

        {history.length === 0 ? (
          <div className="empty-state compact">
            <h2>暂无练习历史</h2>
            <p>完成一次在线练习后，这里会显示历史记录。</p>
            <Link href="/generator" className="primary-button">去生成练习</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>创建时间</th>
                  <th>提交时间</th>
                  <th>题数</th>
                  <th>正确</th>
                  <th>错误</th>
                  <th>得分</th>
                  <th>来源摘要</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {history.map((attempt) => {
                  const total = attempt.totalQuestions ?? attempt.total;
                  const correct = attempt.correctCount ?? attempt.correct;
                  const wrong = attempt.wrongCount ?? total - correct;

                  return (
                    <tr key={attempt.id}>
                      <td>{attempt.title ?? attempt.paper?.title ?? "未命名练习"}</td>
                      <td>{formatDate(attempt.createdAt ?? attempt.paper?.createdAt)}</td>
                      <td>{formatDate(attempt.submittedAt)}</td>
                      <td>{total}</td>
                      <td>{correct}</td>
                      <td>{wrong}</td>
                      <td>{attempt.score} 分</td>
                      <td>{attempt.sourceSummary ?? "未记录"}</td>
                      <td>
                        <div className="table-actions">
                          <Link href={`/results?attemptId=${attempt.id}`} className="secondary-button">查看详情</Link>
                          <button type="button" className="secondary-button danger-button" onClick={() => deletePracticeHistoryItem(attempt.id)}>
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
