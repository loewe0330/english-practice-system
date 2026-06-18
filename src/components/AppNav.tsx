"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/knowledge", label: "知识清单库" },
  { href: "/extension-vocab", label: "拓展词汇库" },
  { href: "/generator", label: "练习生成器" },
  { href: "/data-review", label: "数据校对" },
  { href: "/admin-data", label: "数据管理" },
  { href: "/history", label: "练习历史" },
  { href: "/wrong-book", label: "错题本" },
  { href: "/print", label: "打印预览" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="app-header print-hidden">
      <Link href="/" className="brand-link" aria-label="返回首页">
        <span className="brand-mark">英</span>
        <span>
          <strong>英语知识清单</strong>
          <small>智能练习系统</small>
        </span>
      </Link>
      <nav className="nav-links" aria-label="主导航">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "nav-link active" : "nav-link"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
