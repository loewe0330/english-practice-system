import type { KnowledgeDataSet, SourceType } from "./types.ts";

export type ReviewContentType = "all" | "words" | "phrases" | "sentences" | "grammar" | "extension";

export interface DataReviewIssue {
  code:
    | "empty_chinese"
    | "empty_english"
    | "duplicate_english"
    | "duplicate_chinese"
    | "english_has_chinese"
    | "sentence_missing_punctuation";
  message: string;
}

export interface DataReviewRow {
  id: string;
  gradeId?: string;
  bookId?: string;
  unitId?: string;
  categoryId?: string;
  sourceType: SourceType;
  contentType: Exclude<ReviewContentType, "all">;
  english: string;
  chinese: string;
  extra?: string;
  issues: DataReviewIssue[];
}

export interface DataReviewStats {
  wordCount: number;
  phraseCount: number;
  sentenceCount: number;
  grammarCount: number;
  extensionCount: number;
}

function issue(code: DataReviewIssue["code"], message: string): DataReviewIssue {
  return { code, message };
}

function hasChineseCharacters(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

function hasSentenceEnding(value: string) {
  return /[.!?。！？]$/.test(value.trim());
}

function duplicateKeys(values: string[]) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const key = value.trim().toLowerCase();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

export function getDataReviewStats(data: KnowledgeDataSet): DataReviewStats {
  return {
    wordCount: data.units.reduce((total, unit) => total + unit.words.length, 0),
    phraseCount: data.units.reduce((total, unit) => total + unit.phrases.length, 0),
    sentenceCount: data.units.reduce((total, unit) => total + unit.sentences.length, 0),
    grammarCount: data.units.reduce((total, unit) => total + unit.grammarPoints.length, 0),
    extensionCount: data.extensionWords.length + data.extensionPhrases.length,
  };
}

export function getDataReviewRows(data: KnowledgeDataSet): DataReviewRow[] {
  const rows: DataReviewRow[] = [];

  data.units.forEach((unit) => {
    const duplicatedWordEnglish = duplicateKeys(unit.words.map((word) => word.english));
    const duplicatedWordChinese = duplicateKeys(unit.words.map((word) => word.chinese));
    const duplicatedPhraseEnglish = duplicateKeys(unit.phrases.map((phrase) => phrase.english));
    const duplicatedPhraseChinese = duplicateKeys(unit.phrases.map((phrase) => phrase.chinese));
    const duplicatedSentenceEnglish = duplicateKeys(unit.sentences.map((sentence) => sentence.english));
    const duplicatedSentenceChinese = duplicateKeys(unit.sentences.map((sentence) => sentence.chinese));

    unit.words.forEach((word) => {
      const issues: DataReviewIssue[] = [];
      const englishKey = word.english.trim().toLowerCase();
      const chineseKey = word.chinese.trim().toLowerCase();

      if (!word.english.trim()) issues.push(issue("empty_english", "英文为空"));
      if (!word.chinese.trim()) issues.push(issue("empty_chinese", "中文为空"));
      if (duplicatedWordEnglish.has(englishKey)) issues.push(issue("duplicate_english", "同一单元内英文重复"));
      if (duplicatedWordChinese.has(chineseKey)) issues.push(issue("duplicate_chinese", "同一单元内中文重复"));
      if (hasChineseCharacters(word.english)) issues.push(issue("english_has_chinese", "英文中包含中文字符"));

      rows.push({
        id: word.id,
        gradeId: word.gradeId,
        bookId: word.bookId,
        unitId: word.unitId,
        sourceType: "knowledge_word",
        contentType: "words",
        english: word.english,
        chinese: word.chinese,
        extra: word.partOfSpeech,
        issues,
      });
    });

    unit.phrases.forEach((phrase) => {
      const issues: DataReviewIssue[] = [];
      const englishKey = phrase.english.trim().toLowerCase();
      const chineseKey = phrase.chinese.trim().toLowerCase();

      if (!phrase.english.trim()) issues.push(issue("empty_english", "英文为空"));
      if (!phrase.chinese.trim()) issues.push(issue("empty_chinese", "中文为空"));
      if (duplicatedPhraseEnglish.has(englishKey)) issues.push(issue("duplicate_english", "同一单元内英文重复"));
      if (duplicatedPhraseChinese.has(chineseKey)) issues.push(issue("duplicate_chinese", "同一单元内中文重复"));
      if (hasChineseCharacters(phrase.english)) issues.push(issue("english_has_chinese", "英文中包含中文字符"));

      rows.push({
        id: phrase.id,
        gradeId: phrase.gradeId,
        bookId: phrase.bookId,
        unitId: phrase.unitId,
        sourceType: "knowledge_phrase",
        contentType: "phrases",
        english: phrase.english,
        chinese: phrase.chinese,
        issues,
      });
    });

    unit.sentences.forEach((sentence) => {
      const issues: DataReviewIssue[] = [];
      const englishKey = sentence.english.trim().toLowerCase();
      const chineseKey = sentence.chinese.trim().toLowerCase();

      if (!sentence.english.trim()) issues.push(issue("empty_english", "英文为空"));
      if (!sentence.chinese.trim()) issues.push(issue("empty_chinese", "中文为空"));
      if (duplicatedSentenceEnglish.has(englishKey)) issues.push(issue("duplicate_english", "同一单元内英文重复"));
      if (duplicatedSentenceChinese.has(chineseKey)) issues.push(issue("duplicate_chinese", "同一单元内中文重复"));
      if (hasChineseCharacters(sentence.english)) issues.push(issue("english_has_chinese", "英文中包含中文字符"));
      if (sentence.english.trim() && !hasSentenceEnding(sentence.english)) {
        issues.push(issue("sentence_missing_punctuation", "句子没有句末标点"));
      }

      rows.push({
        id: sentence.id,
        gradeId: sentence.gradeId,
        bookId: sentence.bookId,
        unitId: sentence.unitId,
        sourceType: "knowledge_sentence",
        contentType: "sentences",
        english: sentence.english,
        chinese: sentence.chinese,
        issues,
      });
    });

    unit.grammarPoints.forEach((point) => {
      const issues: DataReviewIssue[] = [];
      if (!point.title.trim()) issues.push(issue("empty_english", "语法标题为空"));
      if (!point.explanation.trim()) issues.push(issue("empty_chinese", "语法说明为空"));

      rows.push({
        id: point.id,
        gradeId: point.gradeId,
        bookId: point.bookId,
        unitId: point.unitId,
        sourceType: "grammar",
        contentType: "grammar",
        english: point.title,
        chinese: point.explanation,
        extra: point.examples.join(" / "),
        issues,
      });
    });
  });

  data.extensionWords.forEach((word) => {
    const issues: DataReviewIssue[] = [];
    if (!word.english.trim()) issues.push(issue("empty_english", "英文为空"));
    if (!word.chinese.trim()) issues.push(issue("empty_chinese", "中文为空"));
    if (hasChineseCharacters(word.english)) issues.push(issue("english_has_chinese", "英文中包含中文字符"));

    rows.push({
      id: word.id,
      gradeId: word.gradeId ?? word.recommendedGradeIds[0],
      categoryId: word.categoryId,
      sourceType: "extension_word",
      contentType: "extension",
      english: word.english,
      chinese: word.chinese,
      extra: `${word.partOfSpeech} · ${word.difficulty}`,
      issues,
    });
  });

  data.extensionPhrases.forEach((phrase) => {
    const issues: DataReviewIssue[] = [];
    if (!phrase.english.trim()) issues.push(issue("empty_english", "英文为空"));
    if (!phrase.chinese.trim()) issues.push(issue("empty_chinese", "中文为空"));
    if (hasChineseCharacters(phrase.english)) issues.push(issue("english_has_chinese", "英文中包含中文字符"));

    rows.push({
      id: phrase.id,
      gradeId: phrase.gradeId ?? phrase.recommendedGradeIds[0],
      categoryId: phrase.categoryId,
      sourceType: "extension_phrase",
      contentType: "extension",
      english: phrase.english,
      chinese: phrase.chinese,
      extra: phrase.difficulty,
      issues,
    });
  });

  return rows;
}
