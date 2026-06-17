import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "英语知识清单智能练习系统",
  description: "基于英语知识清单生成智能练习的学习系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
