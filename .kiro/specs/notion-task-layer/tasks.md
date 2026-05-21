# Implementation Plan: Notion Task Layer

## Overview

为 Focus Flow 引入 Task 中间层（Project → Task → Item），通过 Notion API 单向同步 Project 和 Task 数据。实现分为六个阶段：数据模型扩展 → 配置管理 → 同步算法 → UI 集成 → 历史兼容 → 属性测试。每个阶段结束后有检查点确保增量正确性。

## Tasks

- [x] 1. 数据模型与持久化扩展
  - [x] 1.1 在 focus-flow-model.ts 中定义 Task 类型和常量
    - 新增 `Task` 类型（id, name, projectId, notionPageId, createdAt, updatedAt）
    - 新增 `DEFAULT_TASK_ID = "__default__"` 和 `DEFAULT_TASK_NAME = "未分类"` 常量
    - 扩展 `Project` 类型增加可选 `notionPageId?: string` 字段
    - 扩展 `Item` 类型增加可选 `taskId?: string` 字段
    - _Requirements: 1.1, 1.2, 7.1_

  - [x] 1.2 扩展 persistence.ts 的 PersistedSnapshot 类型
    - 在 `PersistedSnapshot` 类型中增加 `tasks: unknown[]` 字段
    - 不升级 version 号，加载时 tasks 字段缺失用 `[]` 降级
    - _Requirements: 1.4, 7.1_

  - [x] 1.3 扩展 useItems hook 支持 tasks 状态
    - 新增 `tasks` state 和 `setTasks`
    - 在 `applySnapshot` 中加载 tasks（缺失时用 `[]`）
    - 在 `buildSnapshot` 中包含 tasks
    - 在持久化 effect 中保存 tasks
    - 新增 `getTaskById`、`getTasksForProject` 辅助方法
    - 新增 `applyProjectSync`、`applyTaskSync` 方法供同步调用
    - _Requirements: 1.4, 5.3, 6.1_

- [x] 2. Checkpoint — 数据模型扩展验证
  - 确保 `npm run build` 通过，无类型错误。确保应用能正常启动加载旧数据（tasks 字段缺失时降级为空数组）。如有问题请询问用户。

- [x] 3. Notion 配置管理
  - [x] 3.1 创建 src/lib/notion-config.ts 配置模块
    - 实现 `NotionConfig` 类型（apiKey, projectsDbId, tasksDbId）
    - 实现 `loadNotionConfig()`：从 localStorage 读取，JSON 解析失败返回 null
    - 实现 `saveNotionConfig(config)`：写入 localStorage
    - 实现 `isNotionConfigComplete(config)`：三个字段均非空时返回 true
    - localStorage key 为 `"focus-flow-notion-config-v1"`
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ]* 3.2 为 notion-config 编写属性测试
    - **Property 2: 配置持久化 round-trip**
    - **Property 3: 不完整配置禁用同步**
    - **Validates: Requirements 2.2, 2.3, 2.5**

  - [x] 3.3 创建 NotionSettingsModal 组件
    - 新建 `src/components/focus-flow/notion-settings-modal.tsx`
    - 提供 API Key、Projects Database ID、Tasks Database ID 三个输入框
    - 打开时回显已保存配置
    - 提交时调用 `saveNotionConfig` 保存
    - 使用现有 `Modal` 组件
    - _Requirements: 2.1, 2.4_

- [x] 4. Notion 同步服务
  - [x] 4.1 创建 src/lib/notion-sync.ts 核心模块
    - 实现 `isTauriRuntime()` 环境检测
    - 实现 `checkSyncAvailability()`：Tauri 环境返回 available，浏览器返回不可用 + 原因
    - 实现 `fetchNotionPages(apiKey, databaseId)`：用原生 fetch 调用 Notion API，处理分页（has_more + start_cursor），提取 name 和 relation ids
    - API 版本固定 `2022-06-28`，请求头包含 Authorization 和 Notion-Version
    - 网络/API 错误抛出带有摘要信息的 Error
    - _Requirements: 3.2, 4.2, 3.7, 4.9, 8.4_

  - [x] 4.2 实现 reconcileProjects 纯函数
    - 输入：notionPages[], localProjects[]
    - 按 notionPageId 匹配：新增（新 UUID + 随机 color）、更新名称、保留未匹配的本地项目
    - 返回 `{ nextProjects, result: { created, updated, unchanged } }`
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [x] 4.3 实现 reconcileTasks 纯函数
    - 输入：notionPages[], localTasks[], localProjects[]
    - 按 notionPageId 匹配，通过 relation 的 notionPageId 查找本地 Project
    - 找不到对应 Project 的 Task 计入 skipped
    - 多个 relation 取第一个
    - 返回 `{ nextTasks, result: { created, updated, skipped, unchanged } }`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 4.4 为 reconcileProjects 编写属性测试
    - **Property 4: 项目同步 — 新增、更新、保留**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6**

  - [ ]* 4.5 为 reconcileTasks 编写属性测试
    - **Property 5: Task 同步 — 新增、更新、跳过、保留**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

  - [ ]* 4.6 为同步失败原子性编写属性测试
    - **Property 6: 同步失败原子性**
    - **Validates: Requirements 3.7, 4.9**

- [x] 5. Checkpoint — 同步算法验证
  - 运行 `node --experimental-strip-types --test tests/*.test.mjs` 确保所有测试通过。确保 `npm run build` 通过。如有问题请询问用户。

- [x] 6. UI 集成 — 同步控制
  - [x] 6.1 扩展 ToolbarMenu 增加 Notion 相关菜单项
    - 在"设置"分组中新增"Notion 设置"菜单项，点击打开 NotionSettingsModal
    - 新增"同步项目"和"同步 Task"菜单项
    - 配置不完整时两个同步按钮 disabled
    - 浏览器环境下同步按钮 disabled + tooltip "仅桌面端可用"
    - _Requirements: 2.5, 3.1, 4.1, 8.3_

  - [x] 6.2 在 page.tsx 中集成同步流程
    - 加载 NotionConfig 状态
    - 实现 handleSyncProjects：调用 fetchNotionPages → reconcileProjects → applyProjectSync → toast 反馈
    - 实现 handleSyncTasks：调用 fetchNotionPages → reconcileTasks → applyTaskSync → toast 反馈
    - 同步中按钮 loading 状态，阻止重复触发
    - API 失败时 toast 显示错误摘要
    - _Requirements: 3.2, 4.2, 8.1, 8.2, 8.3, 8.4_

- [x] 7. UI 集成 — Task 选择
  - [x] 7.1 扩展 QuickCapture 增加 Task 选择控件
    - 新增 `tasks` prop
    - 新增 `selectedTaskId` state，默认值 `DEFAULT_TASK_ID`
    - Task 选择控件候选项：当前 Project 下的 Tasks + "未分类"
    - Project 切换时重置 selectedTaskId 为 DEFAULT_TASK_ID
    - 提交时将 selectedTaskId 传入 addItems（DEFAULT_TASK_ID 转为 undefined）
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 7.2 扩展 EditItemModal 增加 Task 选择控件
    - 新增 `tasks` prop
    - Task 选择控件候选项：当前 Item 所属 Project 下的 Tasks + "未分类"
    - 当前值为 Item 的 taskId（空时显示"未分类"）
    - Project 切换时重置 Task 选择为 DEFAULT_TASK_ID
    - 保存时 DEFAULT_TASK_ID 转为 undefined，有效 taskId 直接赋值
    - taskId 为空的历史 Item 编辑后不改变 Task 时保持 taskId 为空
    - _Requirements: 6.1, 6.2, 6.3, 7.3, 7.4_

  - [x] 7.3 扩展 addItems 函数支持 taskId 参数
    - `AddItemsOptions` 增加可选 `taskId?: string` 字段
    - 创建 Item 时设置 taskId（DEFAULT_TASK_ID 不存储）
    - _Requirements: 5.6, 1.2_

  - [x] 7.4 确保 Item-Task-Project 一致性
    - 在 saveItemEdit 中，如果 Item 的 taskId 引用了某个 Task，确保 Item.projectId 等于该 Task.projectId
    - 在 addItems 中同理保证一致性
    - _Requirements: 1.3_

  - [ ]* 7.5 为 Task 选项过滤和 Project 切换重置编写属性测试
    - **Property 7: Task 选项按 Project 过滤**
    - **Property 8: 切换 Project 重置 Task 选择**
    - **Validates: Requirements 5.3, 5.5, 6.1, 6.2**

  - [ ]* 7.6 为 Task 赋值持久化编写属性测试
    - **Property 9: Task 赋值持久化**
    - **Validates: Requirements 5.6, 6.3, 7.4**

- [x] 8. Checkpoint — UI 集成验证
  - 确保 `npm run build` 通过。运行全部测试确保通过。如有问题请询问用户。

- [x] 9. 历史数据兼容与最终集成
  - [x] 9.1 确保历史 Item 兼容性
    - Item_Card 渲染 taskId 为空的 Item 时正常显示，省略 Task 归属信息
    - 加载旧数据时 taskId 缺失的 Item 作为合法数据处理
    - _Requirements: 7.1, 7.2_

  - [ ]* 9.2 为历史数据兼容编写属性测试
    - **Property 10: 历史数据兼容**
    - **Validates: Requirements 7.1, 7.3**

  - [ ]* 9.3 为 Item-Task-Project 一致性编写属性测试
    - **Property 1: Item-Task-Project 一致性不变量**
    - **Validates: Requirements 1.2, 1.3**

- [x] 10. Final Checkpoint — 全部验证
  - 运行 `npm run build` 确保编译通过。运行 `node --experimental-strip-types --test tests/*.test.mjs` 确保所有测试通过。确保 `npm run lint` 无错误。如有问题请询问用户。

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 测试使用 Node.js 内置 test runner + 手写随机生成器，不引入 fast-check
- 同步算法（reconcileProjects、reconcileTasks）是纯函数，便于独立测试
- Notion API 调用使用原生 fetch，不引入 SDK
- 配置存 localStorage 独立 key（`focus-flow-notion-config-v1`），不混入 PersistedSnapshot
- 浏览器环境禁用同步功能（CORS 限制）
- PersistedSnapshot 不升级 version 号，tasks 字段缺失时用 `[]` 降级
- DEFAULT_TASK_ID = `"__default__"`，保存时转为 undefined
- 所有 UI 文本使用简体中文

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "3.1"] },
    { "id": 2, "tasks": ["1.3", "3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5", "4.6", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.3"] },
    { "id": 7, "tasks": ["7.1", "7.2", "7.4"] },
    { "id": 8, "tasks": ["7.5", "7.6", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3"] }
  ]
}
```
