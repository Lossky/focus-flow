# Focus Flow 0.1.3

## 代码质量与架构

- 新增 `src/hooks/use-items.ts`，将数据管理逻辑（CRUD、持久化、备份、导入导出）从 page.tsx 中抽离为独立 hook。
- 完全重写 `src/app/page.tsx`：修复重复声明 bug、清理格式问题、补全缺失的计算属性。
- 修复 `getDataFilePath` / `getBackupDirPath` 的错误 import 路径。

## React 19 合规

- 用 lazy state initializer 替代 `useEffect` 内的同步 `setState`，消除 `react-hooks/set-state-in-effect` 错误。
- 番茄钟完成后的级联状态更新改用 `queueMicrotask` 处理。

## 无障碍改进

- Modal 组件支持 Escape 键关闭、点击遮罩关闭。
- Modal 添加 `role="dialog"`、`aria-modal`、`aria-label` 属性。
- Modal 打开时自动聚焦面板。

## UI 组件格式化

- `ui.tsx` 中的组件从单行压缩格式重写为可读的多行格式。
- `TagManagementModal` 的 `addTag` prop 类型修正为 `string | undefined`。
