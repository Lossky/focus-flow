"use client";

import { useEffect, useState } from "react";
import { buildChildCountMap, filterVisibleTreeItems, formatDate, formatSeconds, POMODORO_SECONDS, priorityTone, type Item, type PomodoroState, type Project } from "@/lib/focus-flow-model";
import { PixelHeart, PixelCat } from "./pixel-art";

type CornerMiniWindowProps = {
  pomodoro: PomodoroState;
  focusItem?: Item;
  todayItems: Item[];
  getProjectById: (id?: string) => Project;
  onExit: () => void;
  onStartPomodoro: (taskId?: string) => void;
  onStopPomodoro: () => void;
  onResetPomodoro: () => void;
  collapsedTaskIds: string[];
  toggleCollapsedTask: (id: string) => void;
};

export function CornerMiniWindow({
  pomodoro,
  focusItem,
  todayItems,
  getProjectById,
  onExit,
  onStartPomodoro,
  onStopPomodoro,
  onResetPomodoro,
  collapsedTaskIds,
  toggleCollapsedTask,
}: CornerMiniWindowProps) {
  const isFocusMode = pomodoro.running || !!pomodoro.taskId || pomodoro.secondsLeft !== POMODORO_SECONDS;
  const visibleTodayItems = filterVisibleTreeItems(todayItems, new Set(collapsedTaskIds)).slice(0, 5);
  const childCounts = buildChildCountMap(todayItems);
  const focusChildCount = focusItem ? childCounts.get(focusItem.id) || 0 : 0;
  const isChildrenCollapsed = focusItem ? collapsedTaskIds.includes(focusItem.id) : false;

  return (
    <main className="min-h-screen bg-zinc-950 p-3 text-zinc-50">
      <section className={`relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-xl border shadow-2xl shadow-black/40 ${isFocusMode ? "border-amber-200/40 bg-amber-300/[0.06]" : "border-teal-200/30 bg-teal-300/[0.05]"}`}>
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-40 blur-2xl"
          style={{ background: isFocusMode ? "radial-gradient(circle, rgba(251,191,36,0.4), transparent)" : "radial-gradient(circle, rgba(20,184,166,0.4), transparent)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-2">
            {isFocusMode ? <PixelHeart /> : <PixelCat />}
            <div>
              <p className={`text-[10px] uppercase tracking-[0.2em] ${isFocusMode ? "text-amber-100/70" : "text-teal-100/70"}`}>
                {isFocusMode ? "Focus" : "Mainline"}
              </p>
              <h1 className="mt-0.5 text-sm font-semibold">{isFocusMode ? "专注小窗" : "今日主线"}</h1>
            </div>
          </div>
          <button onClick={onExit} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10">展开</button>
        </div>

        {isFocusMode ? (
          <FocusMiniContent
            pomodoro={pomodoro}
            focusItem={focusItem}
            getProjectById={getProjectById}
            onStartPomodoro={onStartPomodoro}
            onStopPomodoro={onStopPomodoro}
            onResetPomodoro={onResetPomodoro}
            childCount={focusChildCount}
            isChildrenCollapsed={isChildrenCollapsed}
            onToggleChildren={toggleCollapsedTask}
          />
        ) : (
          <MainlineMiniContent
            items={visibleTodayItems}
            allItems={todayItems}
            totalCount={todayItems.length}
            getProjectById={getProjectById}
            onStartPomodoro={onStartPomodoro}
            onToggleChildren={toggleCollapsedTask}
            collapsedTaskIds={collapsedTaskIds}
          />
        )}
      </section>
    </main>
  );
}

function FocusMiniContent({
  pomodoro,
  focusItem,
  getProjectById,
  onStartPomodoro,
  onStopPomodoro,
  onResetPomodoro,
  childCount,
  isChildrenCollapsed,
  onToggleChildren,
}: {
  pomodoro: PomodoroState;
  focusItem?: Item;
  getProjectById: (id?: string) => Project;
  onStartPomodoro: (taskId?: string) => void;
  onStopPomodoro: () => void;
  onResetPomodoro: () => void;
  childCount: number;
  isChildrenCollapsed: boolean;
  onToggleChildren: (id: string) => void;
}) {
  const project = focusItem ? getProjectById(focusItem.projectId) : undefined;
  const isFinished = pomodoro.secondsLeft === 0;
  const progress = pomodoro.secondsLeft / POMODORO_SECONDS;
  const circumference = 2 * Math.PI * 52;
  const strokeOffset = circumference * (1 - progress);
  const [breathe, setBreathe] = useState(false);

  useEffect(() => {
    if (!pomodoro.running) return;
    const timer = setInterval(() => setBreathe((p) => !p), 1500);
    return () => clearInterval(timer);
  }, [pomodoro.running]);

  return (
    <div className="flex flex-1 flex-col px-3 py-3">
      {/* Circular timer */}
      <div className="flex justify-center">
        <div
          className="relative transition-transform duration-[1500ms] ease-in-out"
          style={{ transform: `scale(${breathe ? 1.04 : 1})` }}
        >
          <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={isFinished ? "rgba(52,211,153,0.8)" : "rgba(251,191,36,0.6)"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-semibold tabular-nums tracking-tight ${isFinished ? "text-emerald-300" : "text-amber-50"}`}>
              {formatSeconds(pomodoro.secondsLeft)}
            </div>
            <p className="mt-0.5 text-[9px] text-amber-100/50">
              {pomodoro.running ? "专注中" : isFinished ? "完成！" : "已暂停"}
            </p>
          </div>
        </div>
      </div>

      {/* Task info */}
      <div className="mt-3 min-h-0 flex-1 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {project && <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${project.color}22`, color: project.color }}>{project.name}</span>}
          {(focusItem?.tags || []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-300">#{tag}</span>)}
          {focusItem && childCount > 0 && (
            <button
              type="button"
              onClick={() => onToggleChildren(focusItem.id)}
              className="rounded-full border border-emerald-300/20 px-2 py-0.5 text-[11px] text-emerald-100 transition hover:bg-emerald-300/10"
            >
              {isChildrenCollapsed ? "展开" : "收起"} {childCount} 子项
            </button>
          )}
        </div>
        <h2 className="mt-2 line-clamp-4 text-base font-semibold leading-5 text-amber-50">{focusItem?.content || "自由专注"}</h2>
        {focusItem?.dueDate && <p className="mt-2 text-xs text-amber-100/60">截止 {formatDate(focusItem.dueDate)}</p>}
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {pomodoro.running ? (
          <button onClick={onStopPomodoro} className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100">暂停</button>
        ) : (
          <button onClick={() => onStartPomodoro(focusItem?.id)} className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100">{isFinished ? "再来一轮" : "继续"}</button>
        )}
        <button onClick={onResetPomodoro} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10">重置</button>
      </div>
    </div>
  );
}

function MainlineMiniContent({
  items,
  allItems,
  totalCount,
  getProjectById,
  onStartPomodoro,
  onToggleChildren,
  collapsedTaskIds,
}: {
  items: Item[];
  allItems: Item[];
  totalCount: number;
  getProjectById: (id?: string) => Project;
  onStartPomodoro: (taskId?: string) => void;
  onToggleChildren: (id: string) => void;
  collapsedTaskIds: string[];
}) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(allItems);
  const collapsedSet = new Set(collapsedTaskIds);
  const getAncestorPath = (item: Item) => {
    const ancestors: string[] = [];
    let currentParentId = item.parentId;
    while (currentParentId) {
      const parent = itemById.get(currentParentId);
      if (!parent) break;
      ancestors.unshift(parent.content);
      currentParentId = parent.parentId;
    }
    return ancestors.join(" > ");
  };

  return (
    <div className="flex flex-1 flex-col px-3 py-3">
      <div className="flex items-center justify-between rounded-xl border border-teal-200/20 bg-black/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <PixelCat />
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-teal-100/60">Today</p>
            <p className="text-sm text-teal-50">眼前要推进的事</p>
          </div>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-teal-100">{totalCount}</span>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {items.length ? items.map((item) => {
          const project = getProjectById(item.projectId);
          const priority = priorityTone[item.priority];
          const ancestorPath = getAncestorPath(item);
          const childCount = childCounts.get(item.id) || 0;
          return (
            <article
              key={item.id}
              className={`rounded-xl border bg-black/20 p-3 transition-colors hover:bg-black/30 ${item.isMainline ? "border-amber-200/40" : "border-white/10"}`}
              style={{ marginLeft: item.depth ? `${Math.min(item.depth, 4) * 8}px` : undefined }}
            >
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: priority.accent }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.isMainline && <span className="rounded-full border border-amber-300/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-amber-100">Mainline</span>}
                    {item.depth ? <span className="rounded-full border border-sky-300/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-sky-100">L{Math.min(item.depth, 4) + 1}</span> : null}
                    {childCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onToggleChildren(item.id)}
                        className="rounded-full border border-emerald-300/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-300/10"
                      >
                        {collapsedSet.has(item.id) ? "展开" : "收起"} {childCount} 子项
                      </button>
                    )}
                    <span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{ backgroundColor: `${project.color}22`, color: project.color }}>{project.name}</span>
                  </div>
                  {ancestorPath ? <p className="mt-1 truncate text-[10px] text-sky-100/70">{ancestorPath}</p> : null}
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-zinc-100">{item.content}</p>
                  {item.dueDate && <p className="mt-2 text-[11px] text-zinc-500">截止 {formatDate(item.dueDate)}</p>}
                </div>
              </div>
              <button onClick={() => onStartPomodoro(item.id)} className="mt-3 w-full rounded-lg border border-teal-200/30 px-3 py-1.5 text-xs font-medium text-teal-100 transition hover:bg-teal-200/10">
                专注这条
              </button>
            </article>
          );
        }) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-8 text-center text-sm text-zinc-500">
            <PixelHeart />
            今日主线是空的
          </div>
        )}
      </div>

      {totalCount > items.length && <p className="mt-2 text-center text-[11px] text-zinc-500">还有 {totalCount - items.length} 条，展开后继续看。</p>}
    </div>
  );
}
