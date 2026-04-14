# Focus Flow 0.1.7

## 过渡动画

- 任务卡片出现时带淡入上滑动画（`card-in`），列表子项依次错开显示（stagger）。
- 卡片 hover 时阴影放大，过渡更平滑（`transition-all duration-200`）。
- 新增 `globals.css` 中 `@keyframes card-in`、`slide-up` 和 `.stagger-children` 工具类。

## 流程视图拖拽

- FlowView 的 Inbox / Review / Batch 泳道支持拖拽卡片跨泳道移动。
- 拖拽悬停时目标泳道边框高亮为琥珀色。
- 空泳道在拖拽悬停时显示"松开放到这里"提示。

## 国际化基础

- 新增 `src/lib/i18n.ts`：100+ 条中英双语翻译字符串，支持变量替换。
- 新增 `src/contexts/locale-context.tsx`：`LocaleProvider` 和 `useLocale` hook，语言偏好持久化到 localStorage。
- 新增 `src/components/focus-flow/locale-toggle.tsx`：EN/中 切换按钮，显示在 header 标签栏。
- 后续组件可逐步接入 `useLocale().t()` 完成完整国际化。

## 验证

- `npm run lint`：通过，0 errors。
- `npm run build`：通过。
- `npm run tauri:build`：通过。
- 产物：`Focus Flow_0.1.7_aarch64.dmg`。
