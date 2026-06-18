import type {
  ParseKnowledgeTextOptions,
  ParsedImportGrammarPoint,
  ParsedImportPhrase,
  ParsedImportSentence,
  ParsedImportWord,
  ParsedKnowledgeImport,
} from "./import-types.ts";

const sectionHeadingPattern = /^[一二三四五六七八九十]+[、.．]\s*(.+)$/;

type SectionKind = "vocab" | "sentences" | "grammar" | "phonics" | "writing" | "unknown";

interface ParsedSection {
  title: string;
  kind: SectionKind;
  lines: string[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferImportMetadata(
  text: string,
  fileName: string,
  defaults: ParseKnowledgeTextOptions,
): ParseKnowledgeTextOptions {
  const source = `${fileName}\n${text.slice(0, 1200)}`;
  const normalized = source.replace(/\s+/g, " ");
  const unitMatch = normalized.match(/\bUnit\s*(\d{1,2})\b/i) ?? normalized.match(/\bU(\d{1,2})\b/i);
  const isSm3 = /SM\s*3|SM3/i.test(normalized);
  const isYilin = /译林|Yilin|4B/i.test(normalized);
  const unitNo = unitMatch ? Number(unitMatch[1]) : defaults.unitNo;
  const bookId = isSm3 ? "sm3" : isYilin ? "yilin-4b" : defaults.bookId;
  const bookName = isSm3 ? "SM3" : isYilin ? "译林英语 4B" : defaults.bookName;
  const titleMatch = normalized.match(/(?:Unit\s*\d{1,2}|U\d{1,2})\s*[-—:：]?\s*([^一二三四五六七八九十\n\r]{2,40})/i);

  return {
    ...defaults,
    gradeId: /四下|4B|SM\s*3|SM3/i.test(normalized) ? "primary-g4b" : defaults.gradeId,
    bookId,
    bookName,
    unitNo,
    unitTitle: titleMatch?.[1]?.trim() || `Unit${unitNo}`,
  };
}

function normalizeLine(line: string) {
  return line
    .replace(/\u00a0/g, " ")
    .trim();
}

function classifySection(title: string): SectionKind {
  if (/词|词组/.test(title)) return "vocab";
  if (/句型|句子/.test(title)) return "sentences";
  if (/知识点|语法/.test(title)) return "grammar";
  if (/语音/.test(title)) return "phonics";
  if (/佳作|写作/.test(title)) return "writing";
  return "unknown";
}

function splitSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection = { title: "未分类", kind: "unknown", lines: [] };

  text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)
    .forEach((line) => {
      const headingMatch = line.match(sectionHeadingPattern);

      if (headingMatch) {
        if (current.lines.length > 0 || current.title !== "未分类") {
          sections.push(current);
        }

        current = {
          title: headingMatch[1].trim(),
          kind: classifySection(headingMatch[1]),
          lines: [],
        };
        return;
      }

      current.lines.push(line);
    });

  if (current.lines.length > 0 || current.title !== "未分类") {
    sections.push(current);
  }

  return sections;
}

function firstChineseIndex(value: string) {
  const match = value.match(/[\u3400-\u9fff]/);
  return match?.index ?? -1;
}

function splitEnglishChinese(line: string) {
  const index = firstChineseIndex(line);

  if (index < 0) {
    return { enPart: line.trim(), zh: "" };
  }

  return {
    enPart: line.slice(0, index).trim(),
    zh: line.slice(index).trim(),
  };
}

function parseEnglishAndPos(enPart: string) {
  const compactMatch = enPart.match(/^(.+?)(n\.|v\.|adj\.|adv\.|prep\.|pron\.|num\.|conj\.|interj\.|phr\.)$/i);
  const spacedMatch = enPart.match(/^(.+?)\s+(n\.|v\.|adj\.|adv\.|prep\.|pron\.|num\.|conj\.|interj\.|phr\.)$/i);
  const match = spacedMatch ?? compactMatch;

  if (!match) {
    return { en: enPart.trim(), pos: "" };
  }

  return {
    en: match[1].trim(),
    pos: match[2].trim(),
  };
}

function isSentenceLike(value: string) {
  return /[.!?]$/.test(value.trim()) || /^--/.test(value.trim());
}

function isPhraseLike(value: string) {
  return /\s/.test(value.trim()) || value.includes("...") || /!$/.test(value.trim());
}

function createId(prefix: string, order: number, en: string) {
  const slug = slugify(en).slice(0, 36) || String(order).padStart(3, "0");
  return `${prefix}-${String(order).padStart(3, "0")}-${slug}`;
}

function parseVocabLine(line: string, importIdPrefix: string, order: number) {
  const { enPart, zh } = splitEnglishChinese(line);
  const { en, pos } = parseEnglishAndPos(enPart);

  if (!en) {
    return { warning: `无法识别词汇行：${line}` };
  }

  if (pos && !isPhraseLike(en)) {
    return {
      word: {
        id: createId(`${importIdPrefix}-word`, order, en),
        en,
        zh,
        pos,
        order,
        required: true,
      } satisfies ParsedImportWord,
      warning: zh ? undefined : `词汇缺少中文翻译：${line}`,
    };
  }

  if (pos && isPhraseLike(en) && !/[.!?]$/.test(en)) {
    return {
      word: {
        id: createId(`${importIdPrefix}-word`, order, en),
        en,
        zh,
        pos,
        order,
        required: true,
      } satisfies ParsedImportWord,
      warning: zh ? undefined : `词汇缺少中文翻译：${line}`,
    };
  }

  return {
    phrase: {
      id: createId(`${importIdPrefix}-phrase`, order, en),
      en,
      zh,
      order,
      required: true,
    } satisfies ParsedImportPhrase,
    warning: zh ? undefined : `词组缺少中文翻译：${line}`,
  };
}

function parseSentenceLine(line: string, importIdPrefix: string, order: number) {
  const { enPart, zh } = splitEnglishChinese(line);
  const en = enPart.replace(/\s+/g, " ").trim();

  if (!en) {
    return { warning: `无法识别句型行：${line}` };
  }

  return {
    sentence: {
      id: createId(`${importIdPrefix}-sentence`, order, en),
      en,
      zh,
      order,
      required: true,
    } satisfies ParsedImportSentence,
    warning: zh ? undefined : `句子缺少中文翻译：${line}`,
  };
}

function startsGrammarItem(line: string) {
  return /^(\d+[.、．)]|[（(]\d+[）)]|[①②③④⑤⑥⑦⑧⑨⑩])\s*/.test(line);
}

function parseGrammar(lines: string[], importIdPrefix: string): ParsedImportGrammarPoint[] {
  const blocks: string[][] = [];
  let current: string[] = [];

  lines.forEach((line) => {
    if (startsGrammarItem(line) && current.length > 0) {
      blocks.push(current);
      current = [];
    }

    current.push(line);
  });

  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks.map((block, index) => {
    const firstLine = block[0].replace(/^(\d+[.、．)]|[（(]\d+[）)]|[①②③④⑤⑥⑦⑧⑨⑩])\s*/, "").trim();
    const contentLines = block.length > 1 ? block.slice(1) : [firstLine];
    const examples = block.filter((line) => /[A-Za-z].*[\u3400-\u9fff]|[.!?]$/.test(line));

    return {
      id: createId(`${importIdPrefix}-grammar`, index + 1, firstLine),
      title: firstLine.slice(0, 60) || `知识点 ${index + 1}`,
      content: contentLines.join("\n"),
      examples,
      order: index + 1,
    };
  });
}

export function parseKnowledgeText(text: string, options: ParseKnowledgeTextOptions): ParsedKnowledgeImport {
  const unitId = `${options.bookId}-u${options.unitNo}`;
  const importIdPrefix = slugify(unitId) || "import";
  const parsed: ParsedKnowledgeImport = {
    gradeId: options.gradeId,
    bookId: options.bookId,
    bookName: options.bookName,
    unitId,
    unitTitle: options.unitTitle?.trim() || `Unit${options.unitNo}`,
    unitNo: options.unitNo,
    words: [],
    phrases: [],
    sentences: [],
    grammarPoints: [],
    phonics: [],
    writing: [],
    warnings: [],
  };

  const sections = splitSections(text);

  sections.forEach((section) => {
    if (section.kind === "vocab") {
      section.lines.forEach((line) => {
        const { enPart } = splitEnglishChinese(line);
        const { pos } = parseEnglishAndPos(enPart);
        if (!pos && isSentenceLike(enPart) && firstChineseIndex(line) >= 0) {
          const result = parseSentenceLine(line, importIdPrefix, parsed.sentences.length + 1);
          if (result.sentence) parsed.sentences.push(result.sentence);
          if (result.warning) parsed.warnings.push(result.warning);
          return;
        }

        const result = parseVocabLine(line, importIdPrefix, parsed.words.length + parsed.phrases.length + 1);
        if (result.word) parsed.words.push(result.word);
        if (result.phrase) parsed.phrases.push(result.phrase);
        if (result.warning) parsed.warnings.push(result.warning);
      });
      return;
    }

    if (section.kind === "sentences") {
      section.lines.forEach((line) => {
        const result = parseSentenceLine(line, importIdPrefix, parsed.sentences.length + 1);
        if (result.sentence) parsed.sentences.push(result.sentence);
        if (result.warning) parsed.warnings.push(result.warning);
      });
      return;
    }

    if (section.kind === "grammar") {
      parsed.grammarPoints.push(...parseGrammar(section.lines, importIdPrefix));
      return;
    }

    if (section.kind === "phonics") {
      parsed.phonics.push(...section.lines);
      return;
    }

    if (section.kind === "writing") {
      parsed.writing.push(...section.lines);
      return;
    }

    section.lines.forEach((line) => parsed.warnings.push(`未识别内容：${line}`));
  });

  if (sections.length === 0) {
    parsed.warnings.push("未找到可解析的内容。");
  }

  if (parsed.words.length === 0 && parsed.phrases.length === 0 && parsed.sentences.length === 0) {
    parsed.warnings.push("未解析出单词、词组或句子，请检查文本格式。");
  }

  return parsed;
}

export function validateParsedImport(parsed: ParsedKnowledgeImport) {
  const warnings: string[] = [];

  const checkDuplicate = (label: string, items: { en?: string; zh?: string; title?: string }[]) => {
    const seen = new Set<string>();
    items.forEach((item) => {
      const key = `${item.en ?? item.title ?? ""}::${item.zh ?? ""}`.trim().toLowerCase();
      if (!key || key === "::") return;
      if (seen.has(key)) warnings.push(`${label} 存在重复：${item.en ?? item.title}`);
      seen.add(key);
    });
  };

  parsed.words.forEach((word) => {
    if (!word.en.trim()) warnings.push(`单词英文不能为空：${word.zh}`);
    if (!word.zh.trim()) warnings.push(`单词中文不能为空：${word.en}`);
  });
  parsed.phrases.forEach((phrase) => {
    if (!phrase.en.trim()) warnings.push(`词组英文不能为空：${phrase.zh}`);
    if (!phrase.zh.trim()) warnings.push(`词组中文不能为空：${phrase.en}`);
  });
  parsed.sentences.forEach((sentence) => {
    if (!sentence.en.trim()) warnings.push(`句子英文不能为空：${sentence.zh}`);
    if (!sentence.zh.trim()) warnings.push(`句子中文不能为空：${sentence.en}`);
  });

  checkDuplicate("单词", parsed.words);
  checkDuplicate("词组", parsed.phrases);
  checkDuplicate("句子", parsed.sentences);

  return warnings;
}
