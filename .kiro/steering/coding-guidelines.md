---
inclusion: always
---

# Focus Flow — Coding Guidelines

## 项目概述

Focus Flow 是一个本地优先的 macOS 桌面任务流应用，围绕"快速录入 → Today 主线 → 分流处理"的日常循环设计。

- **技术栈**: Next.js 16 + React 19 + Tailwind CSS 4 + Tauri 2 + TypeScript + Rust
- **当前版本**: 0.1.16（package.json）
- **包管理**: npm（非 pnpm/yarn）
- **数据存储**: 本地优先，Tauri 磁盘存储 + localStorage 降级
- **数据层级**: Project → Task → Item 三层模型。Project/Task 从 Notion 单向同步，Item 在本地手动拆分录入

## 目录结构

```
src/
├── app/              # Next.js App Router
│   ├── page.tsx      # 主页面（单页，承载所有视图）
│   └── api/
│       └── notion-proxy/  # Notion API 代理（仅浏览器 dev 模式用，绕过 CORS）
├── components/
│   ├── error-boundary.tsx
│   └── focus-flow/   # 所有业务组件
├── contexts/         # FocusFlowContext（共享操作）
├── hooks/            # useItems, usePomodoro, useDataActions, useNotionSync
└── lib/              # 纯工具函数和类型定义
    ├── focus-flow-model.ts  # 类型 + 解析 + 工具函数
    ├── persistence.ts       # Tauri 磁盘读写
    ├── notifications.ts     # 通知（Tauri + 浏览器）
    ├── window-controls.ts   # 窗口控制（置顶、角落模式）
    ├── notion-config.ts     # Notion 配置读写（localStorage 独立 key）
    └── notion-sync.ts       # Notion API 调用 + reconcileProjects/reconcileTasks 纯函数
src-tauri/            # Rust 后端（最小化，只初始化插件）
tests/               # Node.js 内置 test runner（*.test.mjs）
```

视图组件（`src/components/focus-flow/`）：四种视图通过 `viewMode` 切换——`flow`（分流处理）、`board`（项目总览）、`calendar`（日历视图，`calendar-view.tsx`）、`quadrant`（四象限，`quadrant-view.tsx`）。

## 关键约定

### 状态管理

- `useItems` hook 管理所有数据 CRUD 和持久化
- `usePomodoro` hook 管理番茄钟计时
- `useDataActions` hook 包装数据操作（导入/导出/备份/重置）+ toast 反馈
- `FocusFlowContext` 提供 `projects`、`tags`、`moveItem`、`removeItem`、`toggleMainline`、`changeItemProject`、`updateItemTags`、`startPomodoro`、`openEdit` 等共享操作
- 子组件（ItemCard、ActionBar）从 context 读取操作，不通过 props 传递

### UI 文本

- 所有用户可见文本使用简体中文
- 代码注释中英文均可，匹配所在文件的惯例

### 组件模式

- `ItemCard` 使用 `memo` + `useFocusFlow()` context
- 拖拽使用 HTML5 Drag and Drop + `activeDragId` 模块级后备变量
- Modal 使用 `activeModal: string | null` 单一状态控制
- Portal 弹出面板（ActionBar、ToolbarMenu）使用 `createPortal` + 绝对定位

### 数据模型

- 类型定义集中在 `src/lib/focus-flow-model.ts`
- Item 支持 `parentId` / `depth` 实现多级任务
- Item 支持 `taskId`（归属 Task，可空，历史数据兼容）、`important` / `urgent`（四象限维度，可空）
- Task 类型：`{ id, name, projectId, notionPageId, createdAt, updatedAt }`，只从 Notion 同步，不在本地手动创建
- Project 有可选 `notionPageId`（Notion 来源才有）
- 本地实体用本地 id 互相引用（Item.taskId → Task.id，Task.projectId → Project.id），`notionPageId` 仅作同步去重键
- 删除任务递归删除所有后代
- 删除项目时弹出迁移选择器，把项目下的 Item 迁移到目标项目，不删除内容
- 重复任务生成下一轮时重置为平级 Inbox

### Notion 同步

- 配置（API Key + Projects/Tasks 数据库 ID）存 localStorage 独立 key `focus-flow-notion-config-v1`，不混入数据快照
- 同步只拉 Notion 中状态为 "In progress" 的项目和 Task（Projects 用 `Status` 属性，Tasks 用 `Status/状态` 属性）
- 同步只新增/更新，不删除本地项目和 Task
- Tauri 桌面端用 `@tauri-apps/plugin-http` 的 fetch 发请求（绕过 WKWebView CORS），浏览器 dev 模式走 `/api/notion-proxy`
- `reconcileProjects` / `reconcileTasks` 是纯函数，便于测试

## 命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器（含 `/api` 路由） |
| `npm run build` | Next.js 构建（仅 `TAURI_BUILD=true` 或 Tauri 环境下静态导出到 `out/`，否则普通构建到 `.next/`） |
| `npm run lint` | ESLint 检查 |
| `npm test` | Node.js 内置测试（`tests/*.test.mjs`） |
| `npm run tauri:dev` | Tauri 桌面开发模式 |
| `npm run tauri:build` | 打包 macOS DMG |

## 发版流程

1. 更新版本号：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`page.tsx APP_VERSION`
2. `npm run lint` + `npm run build` 通过
3. 提交到 main，打 tag（`v0.x.x`），推送
4. GitHub Actions 自动打包 macOS arm64/x64 + Windows x64
5. GitHub Releases 直接发布正式版（`.github/workflows/build.yml` 中 `releaseDraft: false`）

## 注意事项

- 不要直接推分支再 PR——个人项目直接推 main
- Tauri 插件权限名用 `dialog:allow-open` 格式（非 `dialog:open`）
- 截止日期用本地日期解析（`parseLocalDate`），不要直接 `new Date("YYYY-MM-DD")`
- 持久化层在非 Tauri 环境下静默降级到 localStorage，不要抛错
- Tauri 调外部 HTTP（如 Notion API）需在 `src-tauri/capabilities/default.json` 配置 `http:allow-fetch` 的 URL scope
- `@tauri-apps/api` 的 npm 版本必须与 Rust 端 `tauri` crate 的 major/minor 一致，否则 `tauri build` 报版本不匹配
