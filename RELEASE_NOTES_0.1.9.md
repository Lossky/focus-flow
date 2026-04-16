# Focus Flow 0.1.9

## 项目总览视图

- 看板视图替换为项目总览视图，按项目维度查看进度。
- 每个项目卡片包含：项目名 + 颜色、进度条 + 百分比、完成数/总数、状态分布（Today/Inbox/Review/Batch）、未完成任务列表。
- 全部完成的项目显示 🎉 标识。
- 双栏卡片布局，信息密度适中。

## Tab 切换

- "分流处理"和"项目总览"做成 Tab 切换，放在内容区域上方。
- 从顶栏工具栏移除视图切换按钮，减少工具栏拥挤。
- FlowView 和 ProjectOverview 各自去掉了重复的标题区域。

## 清理

- 移除旧的 BoardView 组件及相关类型（BoardViewProps、DragState 引用）。
- 移除 page.tsx 中不再使用的 dragState、reorderInStatus。
