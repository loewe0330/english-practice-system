# 英语知识清单智能练习系统

这是一个面向小学英语知识清单的智能练习系统，支持知识库管理、练习生成、在线作答、自动批改、错题本、打印预览、数据导入校对，以及可选的 Supabase 云端持久化。

## 技术栈

- Next.js 16 App Router
- React
- TypeScript
- ESLint
- localStorage
- Supabase（可选）

## 核心功能

- 知识清单库：按年级、教材、单元管理单词、词组、句子和语法点。
- 拓展词汇库：按分类管理课外拓展词汇。
- 练习生成器：支持多单元、多内容类型、校内知识与拓展词汇混合生成。
- 在线作答与自动批改：支持中文写英文，识别正确、空题、拼写错误、标点错误和错误答案。
- 错题本与错题再练：自动合并错题、记录错误次数、支持标记掌握。
- 打印预览：支持 A4 双栏学生版和答案版。
- 数据导入：支持粘贴文本、TXT、MD、JSON、DOCX、文字版 PDF、ZIP 批量解析预览。
- 数据管理：支持本地编辑、JSON 导入导出、数据校对和练习历史。
- 云端同步：配置 Supabase 后，可在数据管理页手动上传/拉取知识库、错题本和练习历史。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 可用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
```

测试：

```bash
node --test --experimental-strip-types src/lib/*.test.ts
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并填写 Supabase 项目配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

浏览器端只会使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。`SUPABASE_SERVICE_ROLE_KEY` 仅为后续服务端脚本或部署自动化预留，不会被前端代码引用。

如果未配置 Supabase 环境变量，系统会保持本地 localStorage 模式，页面不会报错。

## Supabase 初始化

1. 创建 Supabase 项目。
2. 在 Supabase SQL Editor 中执行：

```sql
-- supabase/migrations/001_initial_schema.sql
```

3. 在 `.env.local` 填入项目 URL 和 anon key。
4. 启动项目后进入 `/admin-data`，使用“云端同步”区域上传或拉取数据。

迁移文件位于：

```text
supabase/migrations/001_initial_schema.sql
```

当前 MVP 阶段的 RLS 策略允许 anon 读写，方便无登录验证完整流程。正式上线前需要加入登录、角色权限和更严格的 RLS。

## 数据模式

系统支持两种数据模式：

- 本地模式：默认使用内置 TypeScript 数据和 localStorage 覆盖数据。
- Supabase 模式：配置环境变量并执行迁移后，可手动同步知识库、错题本和练习历史。

本地模式仍然是默认与兜底模式。云端同步失败时会显示错误信息，并尽量避免影响现有本地流程。

## 当前限制

- 暂无登录和用户权限。
- Supabase 同步为手动触发，不是实时双向同步。
- PDF 只支持可复制文本的文字版 PDF，不支持 OCR 或扫描件识别。
- DOCX 只支持标准 `.docx`。
- ZIP 只处理其中的 TXT、MD、JSON、DOCX、PDF 文件。
