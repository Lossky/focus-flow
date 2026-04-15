"use client";

import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  inbox: { label: "转 Today", to: "today", tone: "cool" },
  today: { label: "完成", to: "done", tone: "warm" },
  review: { label: "转 Today", to: "today", tone: "cool" },
  batch: { label: "转 Today", to: "today", tone: "cool" },
};

const secondaryActionMap: Partial<Record<ItemStatus, { label: string; to: ItemStatus }[]>> = {
  inbox: [{ label: "转 Batch", to: "batch" }, { label: "转 Review", to: "review" }, { label: "归档", to: "archived" }],
  today: [{ label: "转 Batch", to: "batch" }, { label: "转 Review", to: "review" }],
  review: [{ label: "转 Batch", to: "batch" }, { label: "归档", to: "archived" }],
  batch: [{ label: "完成", to: "done" }, { label: "转 Review", to: "review" }],
};

export const ItemCard = memo(function ItemCard({ item, parentItem, ancestorItems = [], childCount = 0, isChildrenCollapsed = false, project, projects, tags, getTagDef, moveItem, removeItem, toggleMainline, changeProject, startPomodoro, onToggleChildren, isFocusMode = false, isPomodoroActive = false, updateItemTags, openEdit }: ItemCardProps) {
  const isMainline = item.isMainline && item.status !== "done" && item.status !== "archived";
  const primaryAction = primaryActionMap[item.status];
  const secondaryActions = secondaryActionMap[item.status] ?? [];
  const priority = priorityTone[item.priority];
  const depth = Math.min(item.depth || 0, 4);
  const focusTone = isPomodoroActive ? "ring-1 ring-amber-200/40" : isFocusMode ? "opacity-70 hover:opacity-100" : "";
  const ancestorPath = ancestorItems.map((ancestor) => ancestor.content).join(" > ");

  // Card background: priority color at 20% + mainline amber tint
  const bgStyle = isMainline
    ? { backgroundColor: `color-mix(in srgb, ${priority.accent} 12%, rgba(251,191,36,0.08))` }
    : { backgroundColor: `color-mix(in srgb, ${priority.accent} 10%, rgba(0,0,0,0.2))` };

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group relative rounded-xl border px-3 py-2.5 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl ${isMainline ? "border-amber-300/40" : "border-white/10"} ${focusTone}`}
      style={{ marginLeft: depth ? `${depth * 14}px` : undefined, borderLeftWidth: 3, borderLeftColor: priority.accent, ...bgStyle }}
    >
      {depth > 0 && <span className="absolute bottom-3 left-2 top-3 w-px rounded-full bg-sky-300/20" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {isMainline && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-100">Mainline</span>}
            {isPomodoroActive && <span className="rounded-full border border-amber-200/50 bg-amber-200/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-100">专注中</span>}
            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${priority.chipClass}`}>P{priority.label}</span>
            {depth > 0 && <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-sky-200">L{depth + 1} 子任务</span>}
            {childCount > 0 && (
              <button type="button" onClick={() => onToggleChildren?.(item.id)} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20">
                {isChildrenCollapsed ? "展开" : "收起"} {childCount} 子项
              </button>
            )}
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em]" style={{ backgroundColor: `${project.color}22`, color: project.color }}>{project.name}</span>
            <span className="text-[11px] text-zinc-600">{statusLabel[item.status]}</span>
          </div>
          {ancestorPath ? (
            <div className="mb-2 rounded-lg border border-sky-300/20 bg-sky-300/[0.06] px-2 py-1.5 text-[11px] leading-4 text-sky-100/80">
              <span className="mr-1 text-[10px] uppercase tracking-[0.12em] text-sky-200/60">Path</span>{ancestorPath}
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

      <ActionBar
        item={item}
        isMainline={!!isMainline}
        isPomodoroActive={!!isPomodoroActive}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        moveItem={moveItem}
        startPomodoro={startPomodoro}
        toggleMainline={toggleMainline}
        changeProject={changeProject}
        removeItem={removeItem}
        updateItemTags={updateItemTags}
        projects={projects}
        tags={tags}
      />
    </article>
  );
});

function ActionBar({
  item, isMainline, isPomodoroActive, primaryAction, secondaryActions,
  moveItem, startPomodoro, toggleMainline, changeProject, removeItem, updateItemTags,
  projects, tags,
}: {
  item: Item; isMainline: boolean; isPomodoroActive: boolean;
  primaryAction?: PrimaryAction; secondaryActions: { label: string; to: ItemStatus }[];
  moveItem: (id: string, status: ItemStatus) => void;
  startPomodoro: (taskId?: string) => void;
  toggleMainline: (id: string) => void;
  changeProject: (id: string, projectId: string) => void;
  removeItem: (id: string) => void;
  updateItemTags: (id: string, tagName: string) => void;
  projects: Project[]; tags: TagDef[];
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const panelW = 360;
      setPos({
        top: r.bottom + 6,
        left: Math.max(8, Math.min(r.left, window.innerWidth - panelW - 8)),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {primaryAction && (
          <button onClick={() => moveItem(item.id, primaryAction.to)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition ${primaryAction.tone === "warm" ? "bg-amber-200 text-zinc-950 shadow-amber-950/30 hover:bg-amber-100" : "bg-teal-200 text-zinc-950 shadow-teal-950/30 hover:bg-teal-100"}`}>
            {primaryAction.label}
          </button>
        )}
        {secondaryActions.map((action) => (
          <button key={action.label} onClick={() => moveItem(item.id, action.to)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:bg-white/10">{action.label}</button>
        ))}
        <button onClick={() => startPomodoro(item.id)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${isPomodoroActive ? "border-amber-200/60 bg-amber-200/15 text-amber-100" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{isPomodoroActive ? "专注中" : "专注"}</button>
        <button
          ref={btnRef}
          onClick={() => setOpen((p) => !p)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
        >
          更多
          <svg className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </button>
      </div>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="fixed z-[999] w-[360px] max-w-[calc(100vw-1rem)] space-y-2.5 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-2xl"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { toggleMainline(item.id); setOpen(false); }} className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${isMainline ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{isMainline ? "取消主线" : "设为主线"}</button>
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
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        </>,
        document.body,
      )}
    </div>
  );
}
