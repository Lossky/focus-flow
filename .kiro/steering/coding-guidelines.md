---
inclusion: always
---

# Focus Flow — Coding Guidelines

## 项目概述

Focus Flow 是一个本地优先的 macOS 桌面任务流应用，围绕"快速录入 → Today 主线 → 分流处理"的日常循环设计。

- **技术栈**: Next.js 16 + React 19 + Tailwind CSS 4 + Tauri 2 + TypeScript + Rust
- **当前版本**: 0.1.13
- **包管理**: npm（非 pnpm/yarn）
- **数据存储**: 本地优先，Tauri 磁盘存储 + localStorage 降级

## 目录结构

```
src/
├── app/              # Next.js App Router（单页 page.tsx）
├── components/
│   ├── error-boundary.tsx
│   └── focus-flow/   # 所有业务组件
├── contexts/         # FocusFlowContext（共享操作）
├── hooks/            # useItems, usePomodoro, useDataActions
└── lib/              # 纯工具函数和类型定义
    ├── focus-flow-model.ts  # 类型 + 解析 + 工具函数
    ├── persistence.ts       # Tauri 磁盘读写
    ├── notifications.ts     # 通知（Tauri + 浏览器）
    └── window-controls.ts   # 窗口控制（置顶、角落模式）
src-tauri/            # Rust 后端（最小化，只初始化插件）
```

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
- 删除任务递归删除所有后代
- 重复任务生成下一轮时重置为平级 Inbox

## 命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 静态导出到 `out/` |
| `npm run lint` | ESLint 检查 |
| `npm run tauri:dev` | Tauri 桌面开发模式 |
| `npm run tauri:build` | 打包 macOS DMG |

## 发版流程

1. 更新版本号：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`page.tsx APP_VERSION`
2. `npm run lint` + `npm run build` 通过
3. 提交到 main，打 tag（`v0.x.x`），推送
4. GitHub Actions 自动打包 macOS arm64/x64 + Windows x64
5. 在 GitHub Releases 发布 draft release

## 注意事项

- 不要直接推分支再 PR——个人项目直接推 main
- Tauri 插件权限名用 `dialog:allow-open` 格式（非 `dialog:open`）
- 截止日期用本地日期解析（`parseLocalDate`），不要直接 `new Date("YYYY-MM-DD")`
- 持久化层在非 Tauri 环境下静默降级到 localStorage，不要抛错
