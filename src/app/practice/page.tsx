"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PracticeQuestionCard } from "@/components/PracticeQuestionCard";
import { gradeAnswer } from "@/lib/grading";
import { createId } from "@/lib/practice";
import {
  saveLastAttempt,
  upsertWrongBookItems,
} from "@/lib/storage";
import { useCurrentPaper } from "@/lib/storage-hooks";
import type { WrongBookItem } from "@/lib/types";

export default function PracticePage() {
  const router = useRouter();
  const paper = useCurrentPaper();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function updateAnswer(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function handleSubmit() {
    if (!paper) {
      return;
    }

    const submittedAt = new Date().toISOString();
    const gradedAnswers = paper.questions.map((question) => {
      const studentAnswer = answers[question.id] ?? "";
      const grade = gradeAnswer(studentAnswer, question.correctAnswer);

      return {
        questionId: question.id,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: grade.isCorrect,
        errorType: grade.errorType,
        feedback: grade.feedback,
      };
    });

    const correct = gradedAnswers.filter((answer) => answer.isCorrect).length;
    const blank = gradedAnswers.filter((answer) => answer.errorType === "blank").length;
    const spellingErrors = gradedAnswers.filter(
      (answer) => answer.errorType === "spelling_error",
    ).length;
    const punctuationErrors = gradedAnswers.filter(
      (answer) => answer.errorType === "punctuation_error",
    ).length;
    const wrong = gradedAnswers.filter((answer) => answer.errorType === "wrong").length;
    const score = paper.questions.length > 0 ? Math.round((correct / paper.questions.length) * 100) : 0;

    saveLastAttempt({
      id: createId("attempt"),
      paperId: paper.id,
      submittedAt,
      total: paper.questions.length,
      correct,
      blank,
      spellingErrors,
      punctuationErrors,
      wrong,
      score,
      answers: gradedAnswers,
    });

    const wrongItems: WrongBookItem[] = gradedAnswers.flatMap((answer) => {
        if (answer.errorType === "correct") {
          return [];
        }

        const question = paper.questions.find((item) => item.id === answer.questionId);

        if (!question) {
          return [];
        }

        return [{
          id: createId("wrong"),
          questionId: question.id,
          gradeId: question.gradeId,
          bookId: question.bookId,
          unitId: question.unitId,
          categoryId: question.categoryId,
          sourceType: question.sourceType,
          sourceItemId: question.sourceItemId,
          questionType: question.questionType,
          sourceLabel: question.sourceLabel,
          prompt: question.prompt,
          correctAnswer: question.correctAnswer,
          studentAnswer: answer.studentAnswer,
          errorType: answer.errorType,
          errorCount: 1,
          firstWrongAt: submittedAt,
          lastWrongAt: submittedAt,
        } satisfies WrongBookItem];
      });

    upsertWrongBookItems(wrongItems);
    router.push("/results");
  }

  if (!paper) {
    return (
      <main className="page-shell">
        <section className="empty-state">
          <h1>还没有当前练习</h1>
          <p>请先在练习生成器中选择内容并生成题目。</p>
          <Link href="/generator" className="primary-button">
            去生成练习
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">在线作答</p>
        <h1>{paper.title}</h1>
        <p>根据中文写出英文答案，提交后系统会自动批改并收集错题。</p>
      </section>

      <section className="question-list">
        {paper.questions.map((question, index) => (
          <PracticeQuestionCard
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id] ?? ""}
            onChange={updateAnswer}
          />
        ))}
      </section>

      <div className="sticky-actions print-hidden">
        <span>共 {paper.questions.length} 题</span>
        <button type="button" className="primary-button" onClick={handleSubmit}>
          提交批改
        </button>
      </div>
    </main>
  );
}
