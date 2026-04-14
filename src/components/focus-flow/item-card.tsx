"use client";

import { memo } from "react";
import { formatDate, formatTime, isDateBeforeToday, priorityTone, repeatLabel, sourceLabel, statusLabel, type Item, type ItemStatus, type Project, type TagDef } from "@/lib/focus-flow-model";
import { Chip } from "./ui";

type ItemCardProps = {
  item: Item;
  parentItem?: Item;
  ancestorItems?: Item[];
  childCount?: number;
  isChildrenCollapsed?: boolean;
  project: Project;
  projects: Project[];
  tags: TagDef[];
  getTagDef: (name: string) => TagDef | undefined;
  moveItem: (id: string, status: ItemStatus) => void;
  removeItem: (id: string) => void;
  toggleMainline: (id: string) => void;
  changeProject: (id: string, projectId: string) => void;
  startPomodoro: (taskId?: string) => void;
  onToggleChildren?: (id: string) => void;
  isFocusMode?: boolean;
  isPomodoroActive?: boolean;
  updateItemTags: (id: string, tagName: string) => void;
  openEdit: (item: Item) => void;
};

type PrimaryAction = { label: string; to: ItemStatus; tone: "warm" | "cool" | "quiet" };

const primaryActionMap: Partial<Record<ItemStatus, PrimaryAction>> = {
  inbox: { label: "今天做", to: "today", tone: "cool" },
  today: { label: "完成", to: "done", tone: "warm" },
  review: { label: "转任务", to: "today", tone: "cool" },
  batch: { label: "提到今天", to: "today", tone: "cool" },
};

const secondaryActionMap: Partial<Record<ItemStatus, { label: string; to: ItemStatus }[]>> = {
  inbox: [{ label: "批处理", to: "batch" }, { label: "待审", to: "review" }, { label: "归档", to: "archived" }],
  today: [{ label: "转批处理", to: "batch" }, { label: "待审", to: "review" }],
  review: [{ label: "批处理", to: "batch" }, { label: "归档", to: "archived" }],
  batch: [{ label: "完成", to: "done" }, { label: "待审", to: "review" }],
};

export const ItemCard = memo(function ItemCard({ item, parentItem, ancestorItems = [], childCount = 0, isChildrenCollapsed = false, project, projects, tags, getTagDef, moveItem, removeItem, toggleMainline, changeProject, startPomodoro, onToggleChildren, isFocusMode = false, isPomodoroActive = false, updateItemTags, openEdit }: ItemCardProps) {
  const isMainline = item.isMainline && item.status !== "done" && item.status !== "archived";
  const primaryAction = primaryActionMap[item.status];
  const secondaryActions = secondaryActionMap[item.status] ?? [];
  const priority = priorityTone[item.priority];
  const depth = Math.min(item.depth || 0, 4);
  const focusTone = isPomodoroActive ? "border-amber-200/70 bg-amber-200/[0.08] ring-1 ring-amber-200/40" : isFocusMode ? "opacity-70 hover:opacity-100" : "";
  const ancestorPath = ancestorItems.map((ancestor) => ancestor.content).join(" > ");

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border bg-black/20 px-3 py-2.5 pl-4 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl ${isMainline ? "border-amber-300/40 bg-amber-200/[0.05]" : "border-white/10"} ${focusTone}`}
      style={{ marginLeft: depth ? `${depth * 14}px` : undefined }}
    >
      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full" style={{ backgroundColor: priority.accent }} aria-hidden="true" />
      {depth > 0 && <span className="absolute bottom-3 left-2 top-3 w-px rounded-full bg-sky-300/20" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {isMainline && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-100">Mainline</span>}
            {isPomodoroActive && <span className="rounded-full border border-amber-200/50 bg-amber-200/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-100">专注中</span>}
            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${priority.chipClass}`}>P{priority.label}</span>
            {depth > 0 && <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-sky-200">L{depth + 1} 子任务</span>}
            {childCount > 0 && (
              <button
                type="button"
                onClick={() => onToggleChildren?.(item.id)}
                className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20"
              >
                {isChildrenCollapsed ? "展开" : "收起"} {childCount} 子项
              </button>
            )}
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-400" style={{ backgroundColor: `${project.color}22`, color: project.color }}>{project.name}</span>
            <span className="text-[11px] text-zinc-600">{statusLabel[item.status]}</span>
          </div>
          {ancestorPath ? (
            <div className="mb-2 rounded-lg border border-sky-300/20 bg-sky-300/[0.06] px-2 py-1.5 text-[11px] leading-4 text-sky-100/80">
              <span className="mr-1 text-[10px] uppercase tracking-[0.12em] text-sky-200/60">Path</span>
              {ancestorPath}
            </div>
          ) : parentItem ? (
            <p className="mb-1 text-[11px] leading-4 text-zinc-500">属于：{parentItem.content}</p>
          ) : null}
          <p className={`text-sm leading-5 ${isMainline ? "text-amber-50" : "text-zinc-100"}`}>{item.content}</p>
        </div>
        <button onClick={() => openEdit(item)} className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[11px] text-zinc-300 opacity-80 transition hover:bg-white/10 hover:opacity-100">编辑</button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.dueDate && <Chip className={isDateBeforeToday(item.dueDate) && item.status !== "done" && item.status !== "archived" ? "border-red-500/50 text-red-300" : ""}>截止 {formatDate(item.dueDate)}</Chip>}
        {(item.tags || []).map((tag) => <span key={tag} className="rounded-full px-2 py-0.5 text-[11px] text-zinc-100" style={{ backgroundColor: getTagDef(tag)?.color || "#3f3f46" }}>#{tag}</span>)}
      </div>

      {item.result?.trim() && (
        <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-1.5 text-xs leading-5 text-emerald-200">
          <span className="mr-2 text-emerald-400">处理结果</span>{item.result}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {primaryAction && (
          <button onClick={() => moveItem(item.id, primaryAction.to)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition ${primaryAction.tone === "warm" ? "bg-amber-200 text-zinc-950 shadow-amber-950/30 hover:bg-amber-100" : "bg-teal-200 text-zinc-950 shadow-teal-950/30 hover:bg-teal-100"}`}>
            {primaryAction.label}
          </button>
        )}
        <button onClick={() => startPomodoro(item.id)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${isPomodoroActive ? "border-amber-200/60 bg-amber-200/15 text-amber-100" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{isPomodoroActive ? "专注中" : "专注"}</button>
        <details className="contents">
          <summary className="inline-flex cursor-pointer list-none rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300">更多</summary>
          <div className="mt-1.5 basis-full space-y-2.5 rounded-lg border border-white/10 bg-black/10 p-2.5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggleMainline(item.id)} className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${isMainline ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{isMainline ? "取消主线" : "设为主线"}</button>
            <button onClick={() => openEdit(item)} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:bg-white/10">记录结果</button>
            {secondaryActions.map((action) => (
              <button key={action.label} onClick={() => moveItem(item.id, action.to)} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:bg-white/10">{action.label}</button>
            ))}
          </div>
          {item.aiSuggestion ? <p className="text-xs leading-5 text-zinc-500">系统建议：{item.aiSuggestion.reason}</p> : null}
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span>来源 {sourceLabel[item.source]}</span>
            <span>类型 {item.type}</span>
            <span>加入 {formatTime(item.createdAt)}</span>
            {item.repeatType && item.repeatType !== "none" && <span>重复 {repeatLabel[item.repeatType]}</span>}
            {item.completedAt && (item.status === "done" || item.status === "archived") && <span className="text-green-400">完成于 {formatTime(item.completedAt)}</span>}
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <select value={item.projectId || "default"} onChange={(event) => changeProject(item.id, event.target.value)} className="rounded-lg border border-white/10 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-zinc-200 outline-none">
              {projects.map((optionProject) => <option key={optionProject.id} value={optionProject.id}>{optionProject.name}</option>)}
            </select>
            <button onClick={() => removeItem(item.id)} className="rounded-lg border border-red-900/80 px-2.5 py-1.5 text-xs text-red-300 transition hover:bg-red-950/50">删除</button>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-zinc-500">标签</div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = (item.tags || []).includes(tag.name);
                return (
                  <button key={tag.id} onClick={() => updateItemTags(item.id, tag.name)} className="rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: active ? tag.color : "#3f3f46", backgroundColor: active ? `${tag.color}22` : "transparent", color: active ? "#fff" : "#a1a1aa" }}>#{tag.name}</button>
                );
              })}
            </div>
          </div>
        </div>
        </details>
      </div>
    </article>
  );
});
