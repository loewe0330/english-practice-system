import { createUnit } from "../helpers.ts";

export const sm3Unit6 = createUnit({
  id: "sm3-u6",
  bookId: "sm3",
  unitNo: 6,
  title: "Gadgets and comparisons",
  order: 106,
  words: [
    ["lift", "电梯", "n."],
    ["torch", "手电筒", "n."],
    ["laptop", "笔记本电脑", "n."],
    ["walkie-talkie", "无线对讲机；步话机", "n."],
    ["mp3 player", "MP3 播放器", "n."],
    ["CD player", "CD 播放器", "n."],
    ["games console", "游戏机", "n."],
    ["electric fan", "电风扇", "n."],
    ["electric toothbrush", "电动牙刷", "n."],
    ["mobile phone", "手机", "n."],
    ["cave", "山洞；洞穴", "n.", false],
    ["cheap", "便宜的", "adj.", false],
    ["light", "轻的", "adj.", false],
  ],
  phrases: [
    ["look around", "环顾四周", false],
    ["come out to play", "出去玩", false],
    ["play with you", "和你一起玩", false],
    ["in the world", "在世界上", false],
  ],
  sentences: [
    ["The DX24 is bigger than the DX32.", "DX24 比 DX32 更大。"],
    ["The DX32 is smaller than the DX24.", "DX32 比 DX24 更小。"],
    ["The DX32 is more expensive than the DX24.", "DX32 比 DX24 更贵。"],
    ["The Airbus A380 is the biggest passenger aircraft in the world.", "空客 A380 是全球最大的客运飞机。"],
    ["The Baldacchino Supreme is the most expensive bed in the world.", "至尊华盖床是全球最贵的床。"],
    ["The SSC Tuatara is the fastest car in the world.", "SSC 图塔拉是世界上速度最快的汽车。"],
  ],
  grammarPoints: [
    ["形容词比较级", "比较级用于两者比较，常用结构为 A be 比较级 than B。", ["The DX24 is bigger than the DX32."]],
    ["形容词最高级", "最高级用于三者及以上比较，最高级前通常加 the。", ["The Airbus A380 is the biggest passenger aircraft in the world."]],
    ["比较级和最高级变化", "单音节词常加 er/est；多音节词常用 more/most；good/well、many/much 有特殊变化。", ["cheap -> cheaper -> the cheapest", "expensive -> more expensive -> the most expensive"]],
  ],
});
