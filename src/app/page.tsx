import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { extensionCategories, extensionWords, units } from "@/lib/mock-data";

const entryCards = [
  {
    href: "/knowledge",
    title: "知识清单库",
    description: "查看教材、单元、单词、词组、句子和语法点。",
  },
  {
    href: "/extension-vocab",
    title: "拓展词汇库",
    description: "按动物、食物、高频易错词分类管理课外词汇。",
  },
  {
    href: "/generator",
    title: "练习生成器",
    description: "选择内容范围，一键生成中文写英文在线练习。",
  },
  {
    href: "/wrong-book",
    title: "错题本",
    description: "自动收集错题，按题型和来源进行复习。",
  },
];

export default function DashboardPage() {
  const unit = units[0];

  return (
    <main className="page-shell">
      <section className="hero-section">
        <div>
          <p className="eyebrow">MVP 1 · 本地练习流程</p>
          <h1>英语知识清单智能练习系统</h1>
          <p className="hero-copy">
            面向家长和小学生的英语知识清单练习工具，先用本地数据完成清单查看、练习生成、在线作答、自动批改和错题复习。
          </p>
        </div>
        <Link href="/generator" className="primary-button">
          生成练习
        </Link>
      </section>

      <section className="stats-grid" aria-label="系统概览">
        <StatCard label="校内单词" value={unit.words.length} hint="译林英语 4B Unit1" />
        <StatCard label="校内词组" value={unit.phrases.length} hint="可用于中文写英文" />
        <StatCard label="校内句子" value={unit.sentences.length} hint="支持整句默写" />
        <StatCard label="拓展词汇" value={extensionWords.length} hint={`${extensionCategories.length} 个分类`} />
      </section>

      <section className="entry-grid" aria-label="功能入口">
        {entryCards.map((card) => (
          <Link key={card.href} href={card.href} className="entry-card">
            <span>{card.title}</span>
            <p>{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
