# Implementation Plan: Calendar View

## Overview

为 Focus Flow 增加日历视图，作为第三个视图 tab。实现分为四个阶段：类型扩展与工具函数 → 日历组件构建 → page.tsx 集成 → 测试。每个阶段结束后有检查点确保增量正确。

## Tasks

- [x] 1. 扩展 ViewMode 类型并实现日期工具函数
  - [x] 1.1 在 `src/lib/focus-flow-model.ts` 中将 ViewMode 类型扩展为 `"flow" | "board" | "calendar"`
    - 修改 `export type ViewMode = "flow" | "board"` 为 `"flow" | "board" | "calendar"`
    - _Requirements: 1.1_

  - [x] 1.2 在 `src/lib/focus-flow-model.ts` 中新增日历视图工具函数
    - 实现 `getWeekDays(weekOffset: number): Date[]` — 返回目标周周一到周日的 7 个 Date 对象
    - 实现 `formatWeekRange(start: Date, end: Date): string` — 返回 "6/16 - 6/22" 格式的周范围标签
    - 实现 `getItemsForDay(items: Item[], date: Date, filter: CalendarFilter): { created: Item[]; completed: Item[] }` — 按日期和筛选模式返回当天任务
    - 导出 `CalendarFilter` 类型：`"all" | "created" | "completed"`
    - 日期匹配使用 `slice(0, 10)` 与 `getTodayKey` 风格一致（沿用项目现有时区策略）
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.1, 4.3, 4.4, 4.5_

  - [ ]* 1.3 为日期工具函数编写属性测试
    - **Property 1: Week calculation produces valid Monday-to-Sunday range**
    - **Property 4: Week navigation shifts by exactly 7 days**
    - **Property 5: Day item filtering returns correct subset**
    - 测试文件：`tests/calendar-utils.test.mjs`
    - 使用 Node.js 内置 test runner + 手写随机生成器（不引入 fast-check）
    - 每个属性至少 100 次随机迭代
    - **Validates: Requirements 2.1, 3.3, 3.4, 2.4, 2.5, 4.3, 4.4, 4.5**

- [x] 2. Checkpoint - 确保工具函数正确
  - 运行 `node --experimental-strip-types --test tests/calendar-utils.test.mjs` 确保所有测试通过
  - 运行 `npm run build` 确保类型扩展不破坏现有编译
  - 如有问题请询问用户

- [x] 3. 实现 CalendarView 组件
  - [x] 3.1 创建 `src/components/focus-flow/calendar-view.tsx` 主组件
    - 实现 CalendarView 组件，接收 `items: Item[]` 和 `getProjectById` props
    - 内部管理 `weekOffset` state（0=本周，-1=上周，+1=下周）
    - 内部管理 `filter: CalendarFilter` state（默认 "all"）
    - 调用 `getWeekDays(weekOffset)` 计算当前展示的 7 天
    - 以七列网格布局渲染 7 个 DayCell
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 实现 WeekNavigator 子组件（内联在同一文件）
    - 展示周日期范围标签（调用 `formatWeekRange`）
    - 提供"上一周"、"下一周"按钮，点击时修改 weekOffset
    - 提供"回到本周"按钮，weekOffset=0 时禁用
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.3 实现 FilterBar 子组件（内联在同一文件）
    - 提供"全部"、"新增"、"完成"三个筛选按钮
    - 默认选中"全部"
    - 点击时切换 filter state
    - _Requirements: 4.1, 4.2_

  - [x] 3.4 实现 DayCell 子组件（内联在同一文件）
    - 展示日期标签（月/日格式，如"6/18"）和星期标识
    - 今天的格子使用视觉高亮（特殊边框/背景色）
    - 展示新增任务数量和完成任务数量统计
    - 展示任务列表（最多 4 条），每条显示任务标题和项目颜色标识
    - 新增任务和完成任务使用不同颜色区分
    - 超过 4 条时显示"+N 条"溢出提示
    - 无任务时展示空状态占位（灰色虚线边框）
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4, 6.1_

  - [x] 3.5 实现整周空状态
    - 当整周 7 天都无任何任务数据时，展示整体空状态提示文案
    - _Requirements: 6.2_

- [x] 4. 集成到 page.tsx
  - [x] 4.1 在 page.tsx 的 tab switcher 中增加"日历视图"按钮
    - 在"分流处理"和"项目总览"按钮旁增加第三个按钮
    - 点击时 `setViewMode("calendar")`
    - 选中时高亮样式与其他 tab 一致
    - _Requirements: 1.2, 1.3_

  - [x] 4.2 在 page.tsx 的内容区域渲染 CalendarView
    - 当 `viewMode === "calendar"` 时渲染 `<CalendarView items={items} getProjectById={getProjectById} />`
    - 传入全量 items（非 filteredItems），因为日历需要展示 done 状态的任务
    - 导入 CalendarView 组件
    - _Requirements: 1.4_

- [x] 5. Checkpoint - 确保集成正确
  - 运行 `npm run build` 确保编译通过
  - 确认三个 tab 切换正常，日历视图渲染无报错
  - 如有问题请询问用户

- [ ]* 6. 补充单元测试
  - [ ]* 6.1 为格式化函数编写属性测试
    - **Property 2: Day label formatting correctness**
    - **Property 3: Week range label formatting**
    - 测试文件：`tests/calendar-utils.test.mjs`（追加）
    - **Validates: Requirements 2.3, 3.1**

  - [ ]* 6.2 为溢出逻辑编写属性测试
    - **Property 6: Overflow indicator shows correct remaining count**
    - 测试文件：`tests/calendar-utils.test.mjs`（追加）
    - **Validates: Requirements 5.3**

- [x] 7. Final checkpoint - 确保所有测试通过
  - 运行 `node --experimental-strip-types --test tests/calendar-utils.test.mjs` 确保所有测试通过
  - 运行 `npm run build` 确保最终构建成功
  - 如有问题请询问用户

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 技术栈：TypeScript + React 19 + Tailwind CSS 4，组件风格匹配现有 `task-views.tsx`
- 测试使用 Node.js 内置 test runner（`node --experimental-strip-types --test`），不引入 fast-check
- 所有 UI 文本使用简体中文
- 日期工具函数为纯函数，放在 `focus-flow-model.ts` 中与现有工具函数一致
- CalendarView 组件独立文件，不修改 FlowView/ProjectOverview 内部逻辑
