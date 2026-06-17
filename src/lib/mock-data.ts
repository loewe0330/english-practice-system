import type {
  Book,
  ExtensionCategory,
  ExtensionPhrase,
  ExtensionWord,
  GrammarPoint,
  KnowledgePhrase,
  KnowledgeSentence,
  KnowledgeWord,
  Unit,
} from "./types";

export const books: Book[] = [
  {
    id: "book-yl-4b",
    name: "译林英语 4B",
    publisher: "译林出版社",
    grade: "四年级下册",
  },
];

const unit1Words: KnowledgeWord[] = [
  ["strong", "强壮的", "adj."],
  ["them", "他们，她们，它们", "pron."],
  ["from", "来自", "prep."],
  ["party", "聚会，联欢会", "n."],
  ["like", "像", "prep."],
  ["thin", "瘦的", "adj."],
  ["back", "背部", "n."],
  ["angry", "生气的", "adj."],
  ["how", "怎样，如何", "adv."],
  ["sad", "难过的", "adj."],
  ["kind", "友好的", "adj."],
  ["weak", "虚弱的", "adj."],
  ["friendship", "友谊", "n."],
  ["forest", "森林", "n."],
].map(([english, chinese, partOfSpeech], index) => ({
  id: `kw-u1-${index + 1}`,
  unitId: "unit-yl-4b-1",
  english,
  chinese,
  partOfSpeech,
}));

const unit1Phrases: KnowledgePhrase[] = [
  ["become good friends", "成为好朋友"],
  ["get together", "聚会，相聚"],
  ["so many carrots", "如此多的胡萝卜"],
  ["share ... with ...", "与……分享……"],
  ["be from", "来自"],
  ["thank you for ...", "为……感谢你"],
  ["have a fruit party", "举办水果派对"],
  ["in the forest", "在森林里"],
  ["big and strong", "又大又强壮"],
  ["small and thin", "又小又瘦"],
  ["go away", "走开"],
  ["help each other", "互相帮助"],
].map(([english, chinese], index) => ({
  id: `kp-u1-${index + 1}`,
  unitId: "unit-yl-4b-1",
  english,
  chinese,
}));

const unit1Sentences: KnowledgeSentence[] = [
  ["There are so many carrots.", "有如此多的胡萝卜。"],
  ["We want to share our fruit with you.", "我们想要和你分享我们的水果。"],
  ["Let's have a fruit party.", "我们举办水果派对吧。"],
  ["Thank you for the carrots.", "谢谢你的胡萝卜。"],
  ["There are many animals in the forest.", "森林里有很多动物。"],
  ["Please don't eat me! I can help you one day.", "请不要吃我！有一天我能帮你的。"],
  ["How can you help me?", "你怎么帮我？"],
  ["There is a big hole in the net.", "网里有一个大洞。"],
  ["What can friends do for each other?", "朋友能为彼此做什么？"],
].map(([english, chinese], index) => ({
  id: `ks-u1-${index + 1}`,
  unitId: "unit-yl-4b-1",
  english,
  chinese,
}));

const unit1Grammar: GrammarPoint[] = [
  {
    id: "grammar-u1-there-be",
    unitId: "unit-yl-4b-1",
    title: "There be 句型",
    explanation: "用 There is/are 表示某处有某物，is 搭配单数，are 搭配复数。",
    examples: ["There are many animals in the forest.", "There is a big hole in the net."],
  },
];

export const units: Unit[] = [
  {
    id: "unit-yl-4b-1",
    bookId: "book-yl-4b",
    name: "Unit 1",
    title: "Our animal friends",
    order: 1,
    words: unit1Words,
    phrases: unit1Phrases,
    sentences: unit1Sentences,
    grammarPoints: unit1Grammar,
  },
];

export const extensionCategories: ExtensionCategory[] = [
  {
    id: "ext-animal",
    name: "动物",
    description: "围绕课文动物主题拓展的常见动物词汇。",
  },
  {
    id: "ext-food",
    name: "食物",
    description: "水果、蔬菜和食物表达，适合听写与句子迁移。",
  },
  {
    id: "ext-common-mistakes",
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
].map(([id, categoryId, english, chinese, partOfSpeech, difficulty]) => ({
  id,
  categoryId,
  english,
  chinese,
  partOfSpeech,
  difficulty,
})) as ExtensionWord[];

export const extensionPhrases: ExtensionPhrase[] = [
  {
    id: "ext-phrase-animal-friends",
    categoryId: "ext-animal",
    english: "animal friends",
    chinese: "动物朋友",
    difficulty: "基础",
  },
  {
    id: "ext-phrase-delicious-food",
    categoryId: "ext-food",
    english: "delicious food",
    chinese: "美味的食物",
    difficulty: "进阶",
  },
  {
    id: "ext-phrase-because-of",
    categoryId: "ext-common-mistakes",
    english: "because of",
    chinese: "因为，由于",
    difficulty: "易错",
  },
];

export function getUnitById(unitId: string) {
  return units.find((unit) => unit.id === unitId);
}

export function getCategoryName(categoryId: string) {
  return extensionCategories.find((category) => category.id === categoryId)?.name ?? "未分类";
}
