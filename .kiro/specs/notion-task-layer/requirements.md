# Requirements Document

## Introduction

Focus Flow 当前使用两层数据模型（Project → Item），但用户的实际工作流是三层（Project → 迭代/版本 → 执行项），且 Project 与迭代/版本已经在用户的 Notion 工作区中维护。本特性引入 Task 中间层，将 Focus Flow 中的 Item 归属到从 Notion 同步而来的 Task 下。

设计的根本约束是：**Notion 是 Project 与 Task 的真相源，Focus Flow 是只读副本**。这一约束推导出后续所有规则：

- Task 不能在 Focus Flow 内手动创建（避免出现 Notion 中不存在的 Task，破坏单向同步语义）
- 本地 Task 在 Notion 端被归档/删除时仍保留（以保证历史 Item 的 taskId 引用不悬空）
- Item 的拆分与执行状态完全在本地管理，不回写 Notion（保持 Notion 工作区不被自动化污染）
- 升级前已存在的 Item（taskId 为空）必须能继续加载和编辑（升级不能丢数据）
- **本地实体之间通过本地 id 关联（Item.taskId → Task.id，Task.projectId → Project.id），Notion_Page_Id 仅作为同步去重的稳定键，不参与本地引用**。这样 Notion 上 Project/Task 改名后，本地引用关系保持稳定。

## Glossary

- **Focus_Flow**: 本特性所在的本地优先桌面任务流应用整体
- **Project**: 项目实体；可来自 Notion Projects 数据库的同步，也可以是 Focus Flow 内的本地默认项目
- **Task**: 任务实体（语义为迭代/版本），归属于一个 Project，作为 Project 与 Item 之间的中间层；只能从 Notion Tasks 数据库同步获得，不允许在 Focus Flow 内手动新建
- **Item**: 执行项实体，由用户在 Focus Flow 内手动拆分录入，归属于一个 Task
- **Notion_Page_Id**: Notion API 返回的页面唯一 id；本特性用作同步去重与本地副本对应的稳定键
- **Notion_Sync_Service**: Focus Flow 内调用 Notion API、读取 Notion 数据库、协调本地 Project 与 Task 数据更新的模块
- **Configuration_Manager**: 负责持久化和读取 Notion API Key 与数据库 ID 的模块
- **Notion_Settings_UI**: 用户输入 Notion 配置的设置界面
- **Sync_Control_UI**: 触发同步操作并展示同步反馈（按钮状态、toast）的界面
- **QuickCapture**: Focus Flow 现有的 Item 快速录入界面
- **Item_Editor**: Focus Flow 现有的 Item 编辑弹窗
- **Item_Card**: Item 列表中的单条卡片视图
- **Default_Task**: 系统内置的"未分类"占位 Task，用于在用户未指定具体 Task 时承载 Item，避免阻塞录入

## Requirements

### Requirement 1: 三层数据模型扩展

**User Story:** 作为 Focus Flow 用户，我希望系统支持 Project → Task → Item 的三层数据模型，以便我能在迭代/版本粒度上组织执行项。

#### Acceptance Criteria

1. THE Focus_Flow SHALL 维护 Task 实体，且每个 Task 至少包含 id、name、projectId、notionPageId、createdAt、updatedAt 字段
2. THE Focus_Flow SHALL 在 Item 实体上提供可选的 taskId 字段，引用 Task 的 id
3. WHEN 一个 Item 的 taskId 引用了某个 Task 时, THE Focus_Flow SHALL 保证该 Item 的 projectId 等于该 Task 的 projectId
4. THE Focus_Flow SHALL 将 Task 数据持久化到与 Project、Item 相同的本地存储层，并在应用启动时一并加载

### Requirement 2: Notion API 配置存储

**User Story:** 作为 Focus Flow 用户，我希望在应用本地保存 Notion API Key、Projects 数据库 ID、Tasks 数据库 ID，以便后续同步操作无需重复输入。

#### Acceptance Criteria

1. THE Notion_Settings_UI SHALL 提供 Notion API Key、Projects Database ID、Tasks Database ID 三项配置的输入控件
2. WHEN 用户提交 Notion_Settings_UI 中的配置表单时, THE Configuration_Manager SHALL 将三项配置写入本地存储
3. WHEN 用户启动 Focus_Flow 时, THE Configuration_Manager SHALL 从本地存储加载已保存的 Notion 配置并提供给 Notion_Sync_Service 使用
4. WHEN 用户再次打开 Notion_Settings_UI 时, THE Notion_Settings_UI SHALL 显示当前已保存的三项配置值
5. WHILE Notion 配置中的任一字段为空, THE Sync_Control_UI SHALL 将"同步项目"按钮和"同步 Task"按钮均置为不可触发状态

### Requirement 3: 同步 Notion 项目

**User Story:** 作为 Focus Flow 用户，我希望通过独立的"同步项目"按钮把 Notion Projects 数据库中的项目导入本地，以便本地的项目列表与 Notion 保持一致。

#### Acceptance Criteria

1. THE Sync_Control_UI SHALL 提供独立的"同步项目"按钮，与"同步 Task"按钮分开触发
2. WHEN 用户点击"同步项目"按钮且 Notion 配置完整时, THE Notion_Sync_Service SHALL 从已配置的 Notion Projects 数据库读取所有未归档的页面
3. THE Notion_Sync_Service SHALL 使用 Notion_Page_Id 作为本地 Project 与 Notion 项目页面的对应键
4. WHEN 同步读到一个 Notion_Page_Id 在本地不存在的项目页面时, THE Notion_Sync_Service SHALL 在本地新增一个 Project，名称取自 Notion 页面的 Name 字段
5. WHEN 同步读到一个 Notion_Page_Id 在本地已存在且 Notion 上 Name 字段与本地名称不同的项目页面时, THE Notion_Sync_Service SHALL 将本地 Project 的名称更新为 Notion 上的 Name 字段值
6. WHEN 一个本地 Project 的 Notion_Page_Id 在本次 Notion 同步结果中缺失时, THE Notion_Sync_Service SHALL 保留该本地 Project 不做删除或归档
7. IF 调用 Notion API 失败, THEN THE Notion_Sync_Service SHALL 中止本次"同步项目"操作并保持本地 Project 数据不变

### Requirement 4: 同步 Notion Task

**User Story:** 作为 Focus Flow 用户，我希望通过独立的"同步 Task"按钮把 Notion Tasks 数据库中的迭代/版本导入本地，以便我能将 Item 归属到具体 Task。

#### Acceptance Criteria

1. THE Sync_Control_UI SHALL 提供独立的"同步 Task"按钮，与"同步项目"按钮分开触发
2. WHEN 用户点击"同步 Task"按钮且 Notion 配置完整时, THE Notion_Sync_Service SHALL 从已配置的 Notion Tasks 数据库读取所有未归档的页面
3. THE Notion_Sync_Service SHALL 使用 Notion_Page_Id 作为本地 Task 与 Notion Task 页面的对应键
4. WHEN 同步读到的 Notion Task 页面通过"项目" relation 字段关联到一个 Notion 项目页面时, THE Notion_Sync_Service SHALL 通过该 Notion 项目页面的 Notion_Page_Id 在本地查找对应 Project
5. IF 一个 Notion Task 关联的 Notion 项目页面在本地找不到对应 Project, THEN THE Notion_Sync_Service SHALL 跳过该 Task 并将其计入跳过统计
6. WHEN 同步读到一个 Notion_Page_Id 在本地不存在且其关联项目能匹配到本地 Project 的 Task 页面时, THE Notion_Sync_Service SHALL 在本地新增一个 Task，名称取自 Notion 页面的 Name 字段，projectId 为匹配到的本地 Project 的 id
7. WHEN 同步读到一个 Notion_Page_Id 在本地已存在且 Notion 上 Name 字段与本地名称不同的 Task 页面时, THE Notion_Sync_Service SHALL 将本地 Task 的名称更新为 Notion 上的 Name 字段值
8. WHEN 一个本地 Task 的 Notion_Page_Id 在本次 Notion 同步结果中缺失时, THE Notion_Sync_Service SHALL 保留该本地 Task 不做删除或归档
9. IF 调用 Notion API 失败, THEN THE Notion_Sync_Service SHALL 中止本次"同步 Task"操作并保持本地 Task 数据不变

### Requirement 5: 录入 Item 时选择 Task

**User Story:** 作为 Focus Flow 用户，我希望在录入新 Item 时选择该 Item 归属的 Task，以便后续按迭代查看和归档执行项；同时我希望"未分类"是默认值，让我可以在不思考 Task 归属时直接录入。

#### Acceptance Criteria

1. THE QuickCapture SHALL 提供 Task 选择控件
2. THE Focus_Flow SHALL 在 Task 选择控件中提供一个名为"未分类"的 Default_Task 选项
3. WHILE 用户在 QuickCapture 中选定了某个 Project, THE QuickCapture SHALL 在 Task 选择控件中仅展示该 Project 下的全部 Task 加上 Default_Task 作为候选项
4. WHEN QuickCapture 首次渲染时, THE QuickCapture SHALL 将 Task 选择控件的当前值设为 Default_Task
5. WHEN QuickCapture 中的 Project 选择发生变化时, THE QuickCapture SHALL 将 Task 选择控件的当前值重置为 Default_Task
6. WHEN 用户提交 QuickCapture 录入时, THE Focus_Flow SHALL 将新建 Item 的 taskId 设置为 Task 选择控件当前选中的 Task id

### Requirement 6: 编辑 Item 时切换 Task

**User Story:** 作为 Focus Flow 用户，我希望在编辑已有 Item 时切换其归属 Task，以便我能将临时归到"未分类"的 Item 移动到具体迭代下，或在 Task 错配时纠正。

#### Acceptance Criteria

1. THE Item_Editor SHALL 提供 Task 选择控件，候选项为当前 Item 所属 Project 下的全部 Task 加上 Default_Task
2. WHEN 用户在 Item_Editor 中切换 Item 所属 Project 时, THE Item_Editor SHALL 重新加载新 Project 下的 Task 候选项并将 Task 选择控件的当前值重置为 Default_Task
3. WHEN 用户保存 Item_Editor 中的修改且 Task 选择控件的值与 Item 当前 taskId 不同时, THE Focus_Flow SHALL 将该 Item 的 taskId 更新为 Task 选择控件当前选中的 Task id

### Requirement 7: 历史数据兼容

**User Story:** 作为 Focus Flow 用户，我希望升级到三层数据模型后，原本 taskId 为空的 Item 仍能正常加载、显示和编辑，以便升级不会破坏我已有的执行项数据。

#### Acceptance Criteria

1. WHILE Focus_Flow 加载本地存储的 Item 数据, THE Focus_Flow SHALL 接受 taskId 字段缺失或为空的 Item 作为合法历史数据
2. WHEN Item_Card 渲染一个 taskId 为空的 Item 时, THE Item_Card SHALL 正常显示该 Item 内容并省略 Task 归属信息
3. WHILE 用户编辑一个 taskId 为空的 Item 且未在 Item_Editor 中改变 Task 选择控件的值, THE Focus_Flow SHALL 在保存时保持该 Item 的 taskId 为空
4. WHEN 用户编辑一个 taskId 为空的 Item 并在 Item_Editor 中显式选择了一个 Task 后保存时, THE Focus_Flow SHALL 将该 Item 的 taskId 设置为所选 Task 的 id

### Requirement 8: 同步反馈

**User Story:** 作为 Focus Flow 用户，我希望每次同步操作完成后看到清晰的统计反馈，以便我能确认同步结果是否符合预期、不会因为静默失败丢失数据。

#### Acceptance Criteria

1. WHEN "同步项目"操作完成且未发生错误时, THE Sync_Control_UI SHALL 显示 toast 消息，且消息内容包含本次同步的新增 Project 数量与更新 Project 数量
2. WHEN "同步 Task"操作完成且未发生错误时, THE Sync_Control_UI SHALL 显示 toast 消息，且消息内容包含本次同步的新增 Task 数量、更新 Task 数量、跳过 Task 数量
3. WHILE 一次同步操作正在进行, THE Sync_Control_UI SHALL 将对应的同步按钮置为加载状态并阻止该按钮被重复触发
4. IF 同步操作过程中调用 Notion API 失败, THEN THE Sync_Control_UI SHALL 显示 toast 消息，且消息内容包含失败原因摘要
