import type { ExtensionCategory, ExtensionPhrase, ExtensionWord } from "@/lib/types";

const recommendedGradeIds = ["primary-g4b"];

export const extensionCategories: ExtensionCategory[] = [
  {
    id: "ext-animal",
    gradeId: "primary-g4b",
    recommendedGradeIds,
    name: "动物",
    description: "围绕课文动物和海洋主题拓展的常见词汇。",
  },
  {
    id: "ext-food",
    gradeId: "primary-g4b",
    recommendedGradeIds,
    name: "食物",
    description: "餐饮、食物和厨房场景表达。",
  },
  {
    id: "ext-common-mistakes",
    gradeId: "primary-g4b",
    recommendedGradeIds,
    name: "高频易错词",
    description: "拼写和发音容易混淆的高频词。",
  },
];

export const extensionWords: ExtensionWord[] = [
  ["ext-word-rabbit", "ext-animal", "rabbit", "兔子", "n.", "基础"],
  ["ext-word-elephant", "ext-animal", "elephant", "大象", "n.", "基础"],
  ["ext-word-vegetable", "ext-food", "vegetable", "蔬菜", "n.", "进阶"],
  ["ext-word-because", "ext-common-mistakes", "because", "因为", "conj.", "易错"],
  ["ext-word-beautiful", "ext-common-mistakes", "beautiful", "美丽的", "adj.", "易错"],
  ["ext-word-delicious", "ext-food", "delicious", "美味的", "adj.", "进阶"],
].map(([id, categoryId, english, chinese, partOfSpeech, difficulty], index) => ({
  id,
  gradeId: "primary-g4b",
  categoryId,
  recommendedGradeIds,
  english,
  chinese,
  partOfSpeech,
  sortOrder: index + 1,
  difficulty,
})) as ExtensionWord[];

export const extensionPhrases: ExtensionPhrase[] = [
  {
    id: "ext-phrase-animal-friends",
    gradeId: "primary-g4b",
    categoryId: "ext-animal",
    recommendedGradeIds,
    english: "animal friends",
    chinese: "动物朋友",
    sortOrder: 1,
    difficulty: "基础",
  },
  {
    id: "ext-phrase-delicious-food",
    gradeId: "primary-g4b",
    categoryId: "ext-food",
    recommendedGradeIds,
    english: "delicious food",
    chinese: "美味的食物",
    sortOrder: 2,
    difficulty: "进阶",
  },
  {
    id: "ext-phrase-because-of",
    gradeId: "primary-g4b",
    categoryId: "ext-common-mistakes",
    recommendedGradeIds,
    english: "because of",
    chinese: "因为，由于",
    sortOrder: 3,
    difficulty: "易错",
  },
];
