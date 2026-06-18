import type { ErrorType } from "./types.ts";

export interface GradeResult {
  isCorrect: boolean;
  errorType: ErrorType;
  feedback: string;
}

const finalPunctuationPattern = /[,.!?;:，。！？；：]+$/g;

export function normalizeAnswer(answer: string): string {
  return answer
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(finalPunctuationPattern, "");
}

function normalizeForPunctuationCheck(answer: string): string {
  return answer
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function isLikelySpellingError(studentAnswer: string, correctAnswer: string): boolean {
  if (!studentAnswer || !correctAnswer) {
    return false;
  }

  const distance = levenshteinDistance(studentAnswer, correctAnswer);
  const threshold = correctAnswer.length <= 5 ? 1 : 2;
  return distance > 0 && distance <= threshold;
}

export function gradeAnswer(studentAnswer: string, correctAnswer: string): GradeResult {
  if (!studentAnswer.trim()) {
    return {
      isCorrect: false,
      errorType: "blank",
      feedback: "这题还没有作答。",
    };
  }

  const normalizedStudent = normalizeAnswer(studentAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (normalizedStudent === normalizedCorrect) {
    const studentWithPunctuation = normalizeForPunctuationCheck(studentAnswer);
    const correctWithPunctuation = normalizeForPunctuationCheck(correctAnswer);

    if (studentWithPunctuation !== correctWithPunctuation) {
      return {
        isCorrect: false,
        errorType: "punctuation_error",
        feedback: "答案内容正确，但句末标点需要注意。",
      };
    }

    return {
      isCorrect: true,
      errorType: "correct",
      feedback: "回答正确。",
    };
  }

  if (isLikelySpellingError(normalizedStudent, normalizedCorrect)) {
    return {
      isCorrect: false,
      errorType: "spelling_error",
      feedback: "接近正确答案，可能是拼写错误。",
    };
  }

  return {
    isCorrect: false,
    errorType: "wrong",
    feedback: "答案不正确，请对照正确答案复习。",
  };
}
