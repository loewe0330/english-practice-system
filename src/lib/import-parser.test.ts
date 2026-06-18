import assert from "node:assert/strict";
import test from "node:test";
import { parseKnowledgeText } from "./import-parser.ts";

const baseOptions = {
  gradeId: "primary-g4b",
  bookId: "yilin-4b",
  bookName: "译林英语 4B",
  unitNo: 1,
  unitTitle: "Unit1",
};

test("parse words, phrases, sentences, grammar, phonics and writing sections", () => {
  const parsed = parseKnowledgeText(
    [
      "一、四会词&词组",
      "strong adj. 强壮的",
      "become good friends 成为好朋友",
      "二、四会句型",
      "There are so many carrots. 有如此多的胡萝卜。",
      "三、知识点",
      "1. There be 句型",
      "There are many animals in the forest. 森林里有很多动物。",
      "四、语音知识",
      "字母 a 的发音",
      "五、佳作赏析",
      "My friend is kind.",
    ].join("\n"),
    baseOptions,
  );

  assert.equal(parsed.words[0].en, "strong");
  assert.equal(parsed.words[0].pos, "adj.");
  assert.equal(parsed.phrases[0].en, "become good friends");
  assert.equal(parsed.sentences[0].en, "There are so many carrots.");
  assert.equal(parsed.grammarPoints[0].title, "There be 句型");
  assert.equal(parsed.phonics[0], "字母 a 的发音");
  assert.equal(parsed.writing[0], "My friend is kind.");
});

test("parse Yilin Unit5 compact part-of-speech format", () => {
  const parsed = parseKnowledgeText(
    [
      "一、四会词&词组",
      "noodle n.面条",
      "hot dog n.热狗",
      "eat out 去饭店吃饭",
      "二、四会句型",
      "Here’s our menu. 这是我们的菜单。",
    ].join("\n"),
    { ...baseOptions, unitNo: 5, unitTitle: "Unit5" },
  );

  assert.equal(parsed.words.length, 2);
  assert.equal(parsed.words[0].en, "noodle");
  assert.equal(parsed.words[1].en, "hot dog");
  assert.equal(parsed.phrases[0].en, "eat out");
  assert.equal(parsed.sentences[0].en, "Here’s our menu.");
});

test("parse SM3 Unit5 sea animal format and collect missing translation warning", () => {
  const parsed = parseKnowledgeText(
    [
      "一、四会词&词组",
      "dolphin n.海豚",
      "octopus n.章鱼",
      "二、四会句型",
      "Great auks were sea birds. 大海雀是海鸟。",
      "--Were you in the sea? --No, I wasn’t.",
    ].join("\n"),
    { ...baseOptions, bookId: "sm3", bookName: "SM3", unitNo: 5, unitTitle: "Unit5" },
  );

  assert.equal(parsed.words.length, 2);
  assert.equal(parsed.sentences[0].en, "Great auks were sea birds.");
  assert.equal(parsed.sentences[1].en, "--Were you in the sea? --No, I wasn’t.");
  assert.ok(parsed.warnings.some((warning) => warning.includes("句子缺少中文翻译")));
});

test("parse present continuous Unit7 examples", () => {
  const parsed = parseKnowledgeText(
    [
      "一、四会词组",
      "wash the dishes 洗碗",
      "三、四会句型",
      "What are you doing? 你正在做什么？",
      "I'm washing the dishes. 我正在洗碗。",
    ].join("\n"),
    { ...baseOptions, unitNo: 7, unitTitle: "Unit7" },
  );

  assert.equal(parsed.phrases[0].en, "wash the dishes");
  assert.equal(parsed.sentences.length, 2);
  assert.equal(parsed.sentences[1].en, "I'm washing the dishes.");
});

test("collect warning for unknown content", () => {
  const parsed = parseKnowledgeText("这是一段没有标题的内容", baseOptions);

  assert.ok(parsed.warnings.some((warning) => warning.includes("未识别内容")));
});
