# Requirements Document

## Introduction

为 Focus Flow 增加「日历视图」功能，作为第三个视图 tab（与现有的"分流处理"和"项目总览"并列）。日历视图以周为维度展示每天新增和完成的任务，帮助用户回顾工作节奏、发现产出规律。

**为什么需要这个功能：** 现有的 flow 和 board 视图都聚焦于"当前待办"，缺少时间维度的回顾能力。用户无法直观看到每天的产出量和输入量变化趋势，也无法快速定位某一天做了什么。日历视图填补这个缺口，让用户在不离开应用的情况下获得时间维度的任务洞察。

## Glossary

- **Calendar_View**: 日历视图组件，以周为单位展示每天的任务新增和完成情况
- **Week_Navigator**: 周导航器，允许用户在不同周之间切换
- **Day_Cell**: 日历中代表单天的单元格，展示该天的任务统计和列表
- **Filter_Bar**: 筛选栏，允许用户按"新增"或"完成"筛选展示内容
- **Item**: Focus Flow 中的任务条目，包含 `createdAt`（创建时间）和 `completedAt`（完成时间）字段
- **ViewMode**: 视图模式类型，当前为 `"flow" | "board"`，需扩展为 `"flow" | "board" | "calendar"`

## Requirements

### Requirement 1: 视图切换入口

**User Story:** As a 用户, I want 在顶部 tab 栏中看到"日历视图"选项, so that 我可以快速切换到日历视图查看时间维度的任务分布。

#### Acceptance Criteria

1. THE ViewMode_Type SHALL 包含 `"calendar"` 作为合法值
2. THE Tab_Switcher SHALL 在"分流处理"和"项目总览"旁展示"日历视图"按钮
3. WHEN 用户点击"日历视图"按钮, THE Tab_Switcher SHALL 将 viewMode 切换为 `"calendar"` 并高亮该按钮
4. WHEN viewMode 为 `"calendar"`, THE Main_Content SHALL 渲染 Calendar_View 组件替代 FlowView 和 ProjectOverview

### Requirement 2: 周维度展示

**User Story:** As a 用户, I want 以周为单位查看每天的任务情况, so that 我可以回顾一周的工作节奏和产出分布。

#### Acceptance Criteria

1. THE Calendar_View SHALL 默认展示当前周（周一到周日）的七天数据
2. THE Calendar_View SHALL 以七列网格布局展示七天，每列对应一天
3. THE Day_Cell SHALL 展示该天的日期标签（月/日，如"6/18"）和星期标识
4. THE Day_Cell SHALL 展示该天新增任务的数量
5. THE Day_Cell SHALL 展示该天完成任务的数量
6. WHEN 某天为今天, THE Day_Cell SHALL 以视觉高亮区分于其他日期

### Requirement 3: 周导航

**User Story:** As a 用户, I want 在不同周之间切换, so that 我可以回顾历史任何一周的任务情况。

#### Acceptance Criteria

1. THE Week_Navigator SHALL 展示当前周的日期范围（如"6/16 - 6/22"）
2. THE Week_Navigator SHALL 提供"上一周"和"下一周"导航按钮
3. WHEN 用户点击"上一周"按钮, THE Calendar_View SHALL 展示前一周的数据
4. WHEN 用户点击"下一周"按钮, THE Calendar_View SHALL 展示后一周的数据
5. THE Week_Navigator SHALL 提供"回到本周"按钮
6. WHEN 当前已展示本周数据, THE Week_Navigator SHALL 禁用"回到本周"按钮

### Requirement 4: 任务筛选

**User Story:** As a 用户, I want 按"新增"或"完成"筛选日历中展示的任务, so that 我可以分别关注输入量和产出量。

#### Acceptance Criteria

1. THE Filter_Bar SHALL 提供三个筛选选项："全部"、"新增"、"完成"
2. THE Filter_Bar SHALL 默认选中"全部"
3. WHEN 用户选择"新增"筛选, THE Day_Cell SHALL 仅展示该天新增（`createdAt` 日期匹配）的任务
4. WHEN 用户选择"完成"筛选, THE Day_Cell SHALL 仅展示该天完成（`completedAt` 日期匹配）的任务
5. WHEN 用户选择"全部"筛选, THE Day_Cell SHALL 同时展示该天新增和完成的任务

### Requirement 5: 日任务详情展示

**User Story:** As a 用户, I want 在日历的每天格子中看到具体的任务列表, so that 我可以快速了解某天做了什么或新增了什么。

#### Acceptance Criteria

1. THE Day_Cell SHALL 在统计数字下方展示该天的任务列表（任务标题）
2. THE Day_Cell SHALL 对新增任务和完成任务使用不同的视觉标识（颜色或图标）加以区分
3. IF 某天的任务数量超过展示区域容量, THEN THE Day_Cell SHALL 显示剩余任务数量提示（如"+3 条"）
4. THE Day_Cell SHALL 对每条任务展示其所属项目的颜色标识

### Requirement 6: 空状态处理

**User Story:** As a 用户, I want 在没有任务数据的日期看到明确的空状态提示, so that 我能区分"没有数据"和"加载中"。

#### Acceptance Criteria

1. WHEN 某天既无新增任务也无完成任务, THE Day_Cell SHALL 展示空状态占位（如灰色虚线边框或淡色文字提示）
2. WHEN 整周都无任何任务数据, THE Calendar_View SHALL 展示整体空状态提示文案
