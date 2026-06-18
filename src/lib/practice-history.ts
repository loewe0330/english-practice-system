import type { PracticeAttempt, PracticePaper } from "./types.ts";

export function summarizePracticeSources(paper: PracticePaper) {
  const labels = [...new Set(paper.questions.map((question) => question.sourceLabel))];

  if (labels.length <= 2) {
    return labels.join("；") || paper.title;
  }

  return `${labels.slice(0, 2).join("；")} 等 ${labels.length} 个来源`;
}

export function enrichPracticeAttempt(attempt: PracticeAttempt, paper: PracticePaper): PracticeAttempt {
  const wrongCount = attempt.total - attempt.correct;

  return {
    ...attempt,
    title: attempt.title ?? paper.title,
    createdAt: attempt.createdAt ?? paper.createdAt,
    totalQuestions: attempt.totalQuestions ?? attempt.total,
    correctCount: attempt.correctCount ?? attempt.correct,
    wrongCount: attempt.wrongCount ?? wrongCount,
    sourceSummary: attempt.sourceSummary ?? summarizePracticeSources(paper),
    paper: attempt.paper ?? paper,
  };
}
