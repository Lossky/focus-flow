# Focus Flow v0.1.14

## 新功能

### 数据刷新
- 顶栏新增「刷新」按钮，支持从磁盘重新加载数据
- 适用于外部程序（脚本、其他工具）修改了数据文件后，手动同步到界面
- 按钮带旋转动画 + 800ms 防抖，避免误触连点

### 项目编辑增强
- 项目管理弹窗中每个项目支持「编辑」重命名（inline 编辑，Enter 确认 / Escape 取消）
- 项目色块可点击，展开 9 色色板自由选择颜色
- 重命名和换色后，所有关联任务自动同步显示（基于 projectId 引用）

### 数据安全提示
- 导入、重置、恢复备份、恢复默认目录等破坏性操作执行前，先弹出"正在自动备份当前数据…"的 toast
- 操作完成后明确提示"原数据已自动备份"，让用户知道有安全网

## 移除

- 移除了任务卡片上的「表达提示」功能（maturity chip + 详情块）
- 移除了 `analyzeTaskMaturity` 在 UI 层的调用（底层函数保留，不影响其他入口）

## 技术变更

- `useItems` 新增 `reloadFromDisk()`、`renameProject()`、`updateProjectColor()` 方法
- `useDataActions` 中破坏性操作增加前置 toast 反馈
- `globals.css` 新增 `animate-spin-once` 关键帧动画
- `ProjectManagementModal` 重构为支持 inline 编辑 + 色板选择
- 无数据迁移

## 验证

- `npm run build` ✓
- `npm run lint`
- 手动验证：刷新按钮、项目编辑、颜色选择、备份 toast
