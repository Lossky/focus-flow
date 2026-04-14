"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Item, ItemStatus, Project, TagDef } from "@/lib/focus-flow-model";

type FocusFlowContextValue = {
  projects: Project[];
  tags: TagDef[];
  getProjectById: (id?: string) => Project;
  getTagDef: (name: string) => TagDef | undefined;
  moveItem: (id: string, status: ItemStatus) => void;
  removeItem: (id: string) => void;
  toggleMainline: (id: string) => void;
  changeItemProject: (id: string, projectId: string) => void;
  updateItemTags: (id: string, tagName: string) => void;
  startPomodoro: (taskId?: string) => void;
  openEdit: (item: Item) => void;
};

const FocusFlowContext = createContext<FocusFlowContextValue | null>(null);

export function FocusFlowProvider({ value, children }: { value: FocusFlowContextValue; children: ReactNode }) {
  return <FocusFlowContext.Provider value={value}>{children}</FocusFlowContext.Provider>;
}

export function useFocusFlow(): FocusFlowContextValue {
  const ctx = useContext(FocusFlowContext);
  if (!ctx) throw new Error("useFocusFlow must be used within FocusFlowProvider");
  return ctx;
}
