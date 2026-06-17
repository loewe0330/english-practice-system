"use client";

import type { PracticeQuestion } from "@/lib/types";

interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  index: number;
  value: string;
  onChange: (questionId: string, value: string) => void;
}

export function PracticeQuestionCard({
  question,
  index,
  value,
  onChange,
}: PracticeQuestionCardProps) {
  return (
    <label className="question-card">
      <span className="question-number">第 {index + 1} 题</span>
      <span className="question-prompt">{question.prompt}</span>
      <input
        value={value}
        onChange={(event) => onChange(question.id, event.target.value)}
        placeholder="请输入英文答案"
        autoComplete="off"
      />
    </label>
  );
}
