export { grades } from "./grades.ts";
export { books } from "./books.ts";
export { extensionCategories, extensionPhrases, extensionWords } from "./extension-vocab.ts";

import { books } from "./books.ts";
import { extensionCategories } from "./extension-vocab.ts";
import { grades } from "./grades.ts";
import { sm3Unit4 } from "./units/sm3-unit4.ts";
import { sm3Unit5 } from "./units/sm3-unit5.ts";
import { sm3Unit6 } from "./units/sm3-unit6.ts";
import { yilin4bUnit1 } from "./units/yilin-4b-unit1.ts";
import { yilin4bUnit3 } from "./units/yilin-4b-unit3.ts";
import { yilin4bUnit4 } from "./units/yilin-4b-unit4.ts";
import { yilin4bUnit5 } from "./units/yilin-4b-unit5.ts";
import { yilin4bUnit6 } from "./units/yilin-4b-unit6.ts";
import { yilin4bUnit7 } from "./units/yilin-4b-unit7.ts";
import { yilin4bUnit8 } from "./units/yilin-4b-unit8.ts";

export const units = [
  yilin4bUnit1,
  yilin4bUnit3,
  yilin4bUnit4,
  yilin4bUnit5,
  yilin4bUnit6,
  yilin4bUnit7,
  yilin4bUnit8,
  sm3Unit4,
  sm3Unit5,
  sm3Unit6,
].sort((a, b) => {
  const bookOrderA = books.find((book) => book.id === a.bookId)?.sortOrder ?? 999;
  const bookOrderB = books.find((book) => book.id === b.bookId)?.sortOrder ?? 999;

  return (
    (grades.find((grade) => grade.id === a.gradeId)?.sortOrder ?? 999) -
      (grades.find((grade) => grade.id === b.gradeId)?.sortOrder ?? 999) ||
    bookOrderA - bookOrderB ||
    a.unitNo - b.unitNo
  );
});

export function getGradeById(gradeId?: string) {
  return grades.find((grade) => grade.id === gradeId);
}

export function getBookById(bookId?: string) {
  return books.find((book) => book.id === bookId);
}

export function getUnitById(unitId?: string) {
  return units.find((unit) => unit.id === unitId);
}

export function getCategoryName(categoryId?: string) {
  return extensionCategories.find((category) => category.id === categoryId)?.name ?? "未分类";
}

export function getSourceParts({
  gradeId,
  bookId,
  unitId,
  categoryId,
}: {
  gradeId?: string;
  bookId?: string;
  unitId?: string;
  categoryId?: string;
}) {
  const grade = getGradeById(gradeId);
  const book = getBookById(bookId);
  const unit = getUnitById(unitId);
  const category = getCategoryName(categoryId);

  return {
    gradeName: grade?.displayName ?? "未分类",
    bookName: book?.name ?? "拓展词汇",
    unitName: unit?.displayName,
    categoryName: category,
  };
}
