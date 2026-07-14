"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Item, ItemStatus, Project, TagDef } from "@/lib/focus-flow-model";

// --- Actions context: 操作函数，引用稳定，极少变化 ---
type FocusFlowActions = {
  getProjectById: (id?: string) => Project;
  getTagDef: (name: string) => TagDef | undefined;
  moveItem: (id: string, status: ItemStatus) => void;
  removeItem: (id: string) => void;
  toggleMainline: (id: string) => void;
  changeItemProject: (id: string, projectId: string) => void;
  setItemQuadrant: (id: string, important: boolean, urgent: boolean) => void;
  updateItemTags: (id: string, tagName: string) => void;
  startPomodoro: (taskId?: string) => void;
  openEdit: (item: Item) => void;
};

// --- Data context: 会随数据变化的值 ---
type FocusFlowData = {
  projects: Project[];
  tags: TagDef[];
};

// 保持向后兼容的组合类型
export type FocusFlowContextValue = FocusFlowActions & FocusFlowData;

const ActionsContext = createContext<FocusFlowActions | null>(null);
const DataContext = createContext<FocusFlowData | null>(null);

export function FocusFlowProvider({ value, children }: { value: FocusFlowContextValue; children: ReactNode }) {
  // 拆分 data 和 actions，让只依赖 actions 的组件不因 data 变化重渲染
  const { projects, tags, ...actions } = value;
  const data: FocusFlowData = { projects, tags };

  return (
    <ActionsContext.Provider value={actions}>
      <DataContext.Provider value={data}>
        {children}
      </DataContext.Provider>
    </ActionsContext.Provider>
  );
}

/**
 * 获取完整的 context（兼容现有代码）。
 * 注意：订阅了 data + actions，projects/tags 变化时会触发重渲染。
 */
export function useFocusFlow(): FocusFlowContextValue {
  const actions = useContext(ActionsContext);
  const data = useContext(DataContext);
  if (!actions || !data) throw new Error("useFocusFlow must be used within FocusFlowProvider");
  return { ...actions, ...data };
}

/**
 * 只获取操作函数。适合 ItemCard 等不直接显示 projects/tags 列表的组件。
 * projects/tags 变化时不会触发重渲染。
 */
export function useFocusFlowActions(): FocusFlowActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useFocusFlowActions must be used within FocusFlowProvider");
  return ctx;
}

/**
 * 只获取数据。适合只显示项目/标签列表的组件。
 */
export function useFocusFlowData(): FocusFlowData {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useFocusFlowData must be used within FocusFlowProvider");
  return ctx;
}
