"use client";

import { memo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAgingLevel, isDateBeforeToday, priorityTone, type Item, type ItemStatus } from "@/lib/focus-flow-model";
import { useFocusFlowActions, useFocusFlow } from "@/contexts/focus-flow-context";
import { useI18n } from "@/contexts/i18n-context";
import { useAnchoredMenu } from "@/hooks/use-anchored-menu";
import { LifecycleModal } from "./lifecycle-modal";
import { Chip } from "./ui";

// 用于将生命周期弹窗提升到 body 层级，避免被卡片 overflow/z-index 遮挡
function LifecyclePortal({ item, onClose }: { item: Item; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(<LifecycleModal item={item} onClose={onClose} />, document.body);
}

// 模块级变量，作为 dataTransfer 的后备方案
// 某些 WebView 环境下 dataTransfer 在拖拽过程中可能丢失数据
let activeDragId: string | null = null;

export function getActiveDragId() {
  return activeDragId;
}

type ItemCardProps = {
  item: Item;
  parentItem?: Item;
  ancestorItems?: Item[];
  childCount?: number;
  isChildrenCollapsed?: boolean;
  onToggleChildren?: (id: string) => void;
  isFocusMode?: boolean;
  isPomodoroActive?: boolean;
  onPointerDown?: (event: React.PointerEvent) => void;
};

type PrimaryAction = { label: string; to: ItemStatus; tone: "warm" | "cool" | "quiet" };

export const ItemCard = memo(function ItemCard({ item, parentItem, ancestorItems = [], childCount = 0, isChildrenCollapsed = false, onToggleChildren, isFocusMode = false, isPomodoroActive = false, onPointerDown }: ItemCardProps) {
  const { getProjectById, getTagDef, openEdit } = useFocusFlowActions();
  const { locale, t, statusLabel, formatDate: formatLocaleDate } = useI18n();
  const [showLifecycle, setShowLifecycle] = useState(false);
  const project = getProjectById(item.projectId);
  const isMainline = item.isMainline && item.status !== "done" && item.status !== "archived";
  const priority = priorityTone[item.priority];
  const depth = Math.min(item.depth || 0, 4);
  const focusTone = isPomodoroActive ? "ring-1 ring-amber-200/40" : isFocusMode ? "opacity-70 hover:opacity-100" : "";
  const ancestorPath = ancestorItems.map((ancestor) => ancestor.content).join(" > ");
  const aging = getAgingLevel(item);
  const primaryActionMap: Partial<Record<ItemStatus, PrimaryAction>> = {
    inbox: { label: t("moveToToday"), to: "today", tone: "cool" },
    today: { label: t("complete"), to: "done", tone: "warm" },
    blocked: { label: t("unblock"), to: "today", tone: "cool" },
    shelved: { label: t("restart"), to: "inbox", tone: "cool" },
  };
  const secondaryActionMap: Partial<Record<ItemStatus, { label: string; to: ItemStatus }[]>> = {
    inbox: [{ label: t("blocked"), to: "blocked" }, { label: t("shelved"), to: "shelved" }, { label: t("archive"), to: "archived" }],
    today: [{ label: t("blocked"), to: "blocked" }, { label: t("shelved"), to: "shelved" }],
    blocked: [{ label: t("shelved"), to: "shelved" }, { label: t("archive"), to: "archived" }],
    shelved: [{ label: t("moveToToday"), to: "today" }, { label: t("archive"), to: "archived" }],
  };
  const primaryAction = primaryActionMap[item.status];
  const secondaryActions = secondaryActionMap[item.status] ?? [];

  // Card background: priority color at 20% + mainline amber tint
  const bgStyle = isMainline
    ? { backgroundColor: `color-mix(in srgb, ${priority.accent} 12%, rgba(251,191,36,0.08))` }
    : { backgroundColor: `color-mix(in srgb, ${priority.accent} 10%, rgba(0,0,0,0.2))` };

  return (
    <article
      draggable={!onPointerDown}
      onPointerDown={onPointerDown}
      onDragStart={onPointerDown ? undefined : (e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
        activeDragId = item.id;
      }}
      onDragEnd={onPointerDown ? undefined : () => {
        activeDragId = null;
      }}
      className={`group relative rounded-xl border px-3 py-2.5 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl ${isMainline ? "border-amber-300/40" : "border-white/10"} ${focusTone} ${onPointerDown ? "touch-none select-none cursor-grab active:cursor-grabbing" : ""}`}
      style={{ marginLeft: depth ? `${depth * 14}px` : undefined, borderLeftWidth: 3, borderLeftColor: priority.accent, ...bgStyle }}
    >
      {depth > 0 && <span className="absolute bottom-3 left-2 top-3 w-px rounded-full bg-sky-300/20" aria-hidden="true" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {isMainline && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100">{t("mainline")}</span>}
            {isPomodoroActive && <span className="rounded-full border border-amber-200/50 bg-amber-200/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100">专注中</span>}
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${priority.chipClass}`}>P{priority.label}</span>
            {depth > 0 && <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-sky-200">L{depth + 1} 子任务</span>}
            {childCount > 0 && (
              <button type="button" onClick={() => onToggleChildren?.(item.id)} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20">
                {isChildrenCollapsed ? t("expand") : t("collapse")} {childCount} {t("subtask")}
              </button>
            )}
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ backgroundColor: `${project.color}22`, color: project.color }}>{project.name}</span>
            <span className="text-[11px] text-zinc-600">{statusLabel(item.status)}</span>
          </div>
          {ancestorPath ? (
            <div className="mb-2 rounded-lg border border-sky-300/20 bg-sky-300/[0.06] px-2 py-1.5 text-[11px] leading-4 text-sky-100/80">
              <span className="mr-1 text-[10px] uppercase tracking-[0.12em] text-sky-200/60">{t("path")}</span>{ancestorPath}
            </div>
          ) : parentItem ? (
            <p className="mb-1 text-[11px] leading-4 text-zinc-500">{t("parent")}：{parentItem.content}</p>
          ) : null}
          <p className={`text-sm leading-5 ${isMainline ? "text-amber-50" : "text-zinc-100"}`}>{item.content}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={() => setShowLifecycle(true)} className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[11px] text-sky-200 opacity-80 transition hover:bg-sky-400/20 hover:opacity-100" title={t("viewLifecycle")}>
            <svg className="mr-0.5 inline-block h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="3" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="8" cy="13" r="1.5" /><path d="M8 4.5v2M8 9.5v2" /></svg>
            {t("lifecycle")}
          </button>
          <button onClick={() => openEdit(item)} className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-zinc-300 opacity-80 transition hover:bg-white/10 hover:opacity-100">{t("edit")}</button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.plannedFor && <Chip>{t("planned")} {formatLocaleDate(item.plannedFor)}</Chip>}
        {item.estimateMinutes ? <Chip>{Math.round(item.estimateMinutes / 60 * 10) / 10}{t("estimateHours")}</Chip> : null}
        {aging && <Chip className={aging.level === "danger" ? "border-red-500/50 text-red-300" : "border-amber-500/40 text-amber-200"}>{t("aging")} {aging.days}{locale === "zh-CN" ? "天" : "d"}</Chip>}
        {(item.blockedBy || item.waitingFor) && <Chip className="border-red-500/40 text-red-200">{t("blockedWaiting")}</Chip>}
        {item.mergedFrom?.length ? <Chip>{t("mergedFrom")} {item.mergedFrom.length} {locale === "zh-CN" ? "条" : "items"}</Chip> : null}
        {item.dueDate && <Chip className={isDateBeforeToday(item.dueDate) && item.status !== "done" && item.status !== "archived" ? "border-red-500/50 text-red-300" : ""}>{t("due")} {formatLocaleDate(item.dueDate)}</Chip>}
        {(item.tags || []).map((tag) => <span key={tag} className="rounded-full px-2 py-0.5 text-[11px] text-zinc-100" style={{ backgroundColor: getTagDef(tag)?.color || "#3f3f46" }}>#{tag}</span>)}
      </div>

      {item.output?.trim() && (
        <div className="mt-2 rounded-lg border border-sky-500/20 bg-sky-950/20 px-2.5 py-1.5 text-xs leading-5 text-sky-100">
          <span className="mr-2 text-sky-300">{t("output")}</span>{item.output}
        </div>
      )}

      {(item.blockedBy?.trim() || item.waitingFor?.trim()) && (
        <div className="mt-2 rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1.5 text-xs leading-5 text-red-100">
          {item.blockedBy?.trim() && <div><span className="mr-2 text-red-300">{t("blocked")}</span>{item.blockedBy}</div>}
          {item.waitingFor?.trim() && <div><span className="mr-2 text-red-300">{t("waiting")}</span>{item.waitingFor}</div>}
        </div>
      )}

      {item.result?.trim() && (
        <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-1.5 text-xs leading-5 text-emerald-200">
          <span className="mr-2 text-emerald-400">{t("result")}</span>{item.result}
        </div>
      )}

      {/* 生命周期弹窗（Portal 到 body，确保居中无遮挡） */}
      {showLifecycle && <LifecyclePortal item={item} onClose={() => setShowLifecycle(false)} />}

      <ActionBar
        item={item}
        isMainline={!!isMainline}
        isPomodoroActive={!!isPomodoroActive}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
    </article>
  );
});

function ActionBar({
  item, isMainline, isPomodoroActive, primaryAction, secondaryActions,
}: {
  item: Item; isMainline: boolean; isPomodoroActive: boolean;
  primaryAction?: PrimaryAction; secondaryActions: { label: string; to: ItemStatus }[];
}) {
  const { projects, tags, moveItem, removeItem, toggleMainline, changeItemProject, updateItemTags, startPomodoro } = useFocusFlow();
  const { t, sourceLabel, repeatLabel, itemTypeLabel, formatTime: formatLocaleTime } = useI18n();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelStyle = useAnchoredMenu(open, btnRef, { width: 360, gap: 6, align: "left", preferredHeight: 320 });

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
        <button onClick={() => startPomodoro(item.id)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${isPomodoroActive ? "border-amber-200/60 bg-amber-200/15 text-amber-100" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{isPomodoroActive ? t("focusNow") : t("focus")}</button>
        <button
          ref={btnRef}
          onClick={() => setOpen((p) => !p)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
        >
          {t("more")}
          <svg className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </button>
      </div>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="z-[999] max-w-[calc(100vw-1rem)] space-y-2.5 overflow-y-auto rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-2xl scrollbar-thin"
            style={panelStyle}
          >
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { toggleMainline(item.id); setOpen(false); }} className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${isMainline ? "border-amber-300/50 bg-amber-300/10 text-amber-100" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{isMainline ? t("removeMainline") : t("makeMainline")}</button>
            </div>
            {item.aiSuggestion ? <p className="text-xs leading-5 text-zinc-500">{t("systemSuggestion")}：{item.aiSuggestion.reason}</p> : null}
            <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>{t("origin")} {sourceLabel(item.source)}</span>
              <span>{t("typeTask")} {itemTypeLabel(item.type)}</span>
              <span>{t("joinedAt")} {formatLocaleTime(item.createdAt)}</span>
              {item.repeatType && item.repeatType !== "none" && <span>{t("repeated")} {repeatLabel(item.repeatType)}</span>}
              {item.completedAt && (item.status === "done" || item.status === "archived") && <span className="text-green-400">{t("completedAt")} {formatLocaleTime(item.completedAt)}</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <select value={item.projectId || "default"} onChange={(event) => changeItemProject(item.id, event.target.value)} className="rounded-lg border border-white/10 bg-zinc-950/80 px-2.5 py-1.5 text-xs text-zinc-200 outline-none">
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
