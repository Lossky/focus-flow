# Focus Flow v0.1.15

## 新功能

### 日历视图
- 新增「日历视图」tab，与"分流处理"/"项目总览"并列
- **周视图**：七列网格展示每天新增/完成的任务，今天高亮
- **月视图**：整月日历网格，每天显示新增/完成数量统计
- 周/月切换按钮，上一周(月)/下一周(月)/回到本周(月)导航
- 筛选栏：全部 / 新增 / 完成
- 每条任务带一键复制图标（hover 显示），点击复制纯文本内容
- hover 即时显示完整任务内容（自定义 tooltip，无延迟）
- 空状态处理：单日/整周/整月无数据时显示提示

### 日历视图 UX 优化
- 每条任务前只保留一个类型色点（蓝=新增，绿=完成），去掉项目色点节省空间
- 复制图标缩小，文字区域最大化利用
- 省略号使用两点样式

## 技术变更

- `ViewMode` 类型扩展为 `"flow" | "board" | "calendar"`
- 新增工具函数：`getWeekDays`、`getItemsForDay`、`formatWeekRange`、`formatDayLabel`、`getWeekDayLabel`、`isSameDay`
- 新增 `CalendarFilter` 类型
- 新增组件文件 `src/components/focus-flow/calendar-view.tsx`
- 种子数据扩展为跨 7 天的多条任务（方便测试日历视图）

## 验证

- `npm run build` ✓
