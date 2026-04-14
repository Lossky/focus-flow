# Focus Flow 0.1.5

## 新功能

- 名言卡片视觉升级：
  - 半透明毛玻璃背景，不遮挡下方内容。
  - 支持鼠标拖拽移走，拖动时弹跳暂停，松手后继续。
  - 新增像素风跳动爱心动画（8 帧循环，玫瑰色调）。
  - 新增像素风动画小猫（坐、挥手、眨眼、摇尾巴，青色调）。
  - 爱心和小猫保持鲜明色彩，文字和背景为半透明。

## 架构优化

- 新增 `src/contexts/focus-flow-context.tsx`，提供 `FocusFlowProvider` 和 `useFocusFlow` hook，将 `projects`、`tags`、查找函数和操作函数放入 Context，减少组件间 prop drilling。
- `use-items.ts` 中 `moveItem`、`toggleMainline`、`removeItem`、`changeItemProject`、`updateItemTags`、`saveItemEdit`、`reorderInStatus` 共 7 个函数改为 `useCallback`，稳定引用。
- 新增 `src/components/error-boundary.tsx`，防止单个组件崩溃导致整个 app 白屏，提供重试按钮。
- 像素动画统一到 `src/components/focus-flow/pixel-art.tsx`，删除旧的 `pixel-heart.tsx`。

## 验证

- `npm run lint`：通过，0 errors。
- `npm run build`：通过。
- `npm run tauri:build`：通过。
- 产物：`Focus Flow_0.1.5_aarch64.dmg`。
