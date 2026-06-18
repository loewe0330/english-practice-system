import { createUnit } from "../helpers.ts";

export const sm3Unit4 = createUnit({
  id: "sm3-u4",
  bookId: "sm3",
  unitNo: 4,
  title: "Places and position",
  order: 104,
  words: [
    ["bank", "银行", "n."],
    ["map", "地图", "n."],
    ["library", "图书馆", "n."],
    ["supermarket", "超市", "n."],
    ["tower", "塔；塔楼", "n."],
    ["opposite", "在……对面", "prep."],
    ["above", "在……上面", "prep."],
    ["near", "在……附近", "prep."],
    ["below", "在……下方", "prep."],
  ],
  phrases: [
    ["bus station", "公共汽车站"],
    ["market square", "市集广场"],
    ["sports center", "体育中心"],
    ["find the way", "找到路"],
    ["look for", "寻找"],
    ["get lost", "迷路"],
    ["be going to", "即将去做"],
  ],
  sentences: [
    ["Where is ...? It's opposite / near / above / below ...", "……在哪里？它在……对面 / 附近 / 上面 / 下面。"],
    ["The school is opposite the park.", "学校在公园的对面。"],
    ["The map is near the library.", "地图就在图书馆附近。"],
    ["The clock is above the window.", "时钟在窗户上方。"],
    ["The clock is below the window.", "时钟在窗户下方。"],
    ["I'm going to the shop to buy some bread.", "我要去商店买些面包。"],
    ["I'm going to the library to get a book.", "我要去图书馆借一本书。"],
    ["I'm going to the sports center to play basketball.", "我要去体育中心打篮球。"],
    ["It's between the school and the cafe on the square.", "它在广场上的学校和咖啡馆之间。"],
  ],
  grammarPoints: [
    ["询问地点方位", "用 Where is ...? 询问某地点的方位，回答可用 opposite、near、above、below。", ["Where is the map?", "It's near the library."]],
    ["be going to + place + to do", "I'm going to + 地点 + to do 表示将去某地做某事，后一个 to do 表目的。", ["I'm going to the market square to buy some apples."]],
  ],
});
