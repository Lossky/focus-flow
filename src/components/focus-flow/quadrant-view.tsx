"use client";

import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { formatDate, getEffectiveQuadrant, isDateBeforeToday, priorityTone, statusLabel, type Item, type QuadrantKey } from "@/lib/focus-flow-model";
import { useFocusFlowActions } from "@/contexts/focus-flow-context";
import { usePointerDrag } from "@/hooks/use-pointer-drag";

type QuadrantViewProps = {
  items: Item[];
};

type QuadrantDef = {
  key: QuadrantKey;
  important: boolean;
  urgent: boolean;
  title: string;
  subtitle: string;
  color: string;
  bgClass: string;
  borderClass: string;
  headerClass: string;
};

const QUADRANTS: QuadrantDef[] = [
  { key: "iu", important: true, urgent: true, title: "重要且紧急", subtitle: "立即做 · 转 Today", color: "#fb7185", bgClass: "bg-rose-950/15", borderClass: "border-rose-500/30", headerClass: "bg-rose-500/10" },
  { key: "in", important: true, urgent: false, title: "重要不紧急", subtitle: "排期做 · 别拖成紧急", color: "#60a5fa", bgClass: "bg-blue-950/15", borderClass: "border-blue-500/30", headerClass: "bg-blue-500/10" },
  { key: "nu", important: false, urgent: true, title: "不重要但紧急", subtitle: "快速处理 · 批量清掉", color: "#fbbf24", bgClass: "bg-amber-950/15", borderClass: "border-amber-500/30", headerClass: "bg-amber-500/10" },
  { key: "nn", important: false, urgent: false, title: "不重要不紧急", subtitle: "能删就删 · 少投入", color: "#a1a1aa", bgClass: "bg-zinc-900/30", borderClass: "border-white/15/50", headerClass: "bg-zinc-700/20" },
];

const QUADRANT_FLAGS: Record<QuadrantKey, { important: boolean; urgent: boolean }> = {
  iu: { important: true, urgent: true },
  in: { important: true, urgent: false },
  nu: { important: false, urgent: true },
  nn: { important: false, urgent: false },
};

export function QuadrantView({ items }: QuadrantViewProps) {
  const { setItemQuadrant, openEdit } = useFocusFlowActions();

  // 搁置是刻意冷藏的，不参与四象限决策
  const openItems = useMemo(
    () => items.filter((i) => i.status !== "done" && i.status !== "archived" && i.status !== "shelved"),
    [items],
  );

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const { grouped, autoCount } = useMemo(() => {
    const result: Record<QuadrantKey, Item[]> = { iu: [], in: [], nu: [], nn: [] };
    const rank = { high: 3, medium: 2, low: 1 } as const;
    let auto = 0;
    for (const item of openItems) {
      const q = getEffectiveQuadrant(item);
      result[q.key].push(item);
      if (!q.importantExplicit && !q.urgentExplicit) auto += 1;
    }
    // 每个象限内：主线优先 → 优先级 → 截止日期近的优先
    for (const key of Object.keys(result) as QuadrantKey[]) {
      result[key].sort((a, b) => {
        if (!!b.isMainline !== !!a.isMainline) return Number(!!b.isMainline) - Number(!!a.isMainline);
        if (rank[b.priority] !== rank[a.priority]) return rank[b.priority] - rank[a.priority];
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return ad - bd;
      });
    }
    return { grouped: result, autoCount: auto };
  }, [openItems]);

  const handleDrop = useCallback((id: string, zoneKey: string) => {
    const flags = QUADRANT_FLAGS[zoneKey as QuadrantKey];
    if (flags) setItemQuadrant(id, flags.important, flags.urgent);
  }, [setItemQuadrant]);

  const { drag, beginDrag, isDragging } = usePointerDrag({ onDrop: handleDrop, onTap: (id) => {
    const item = itemById.get(id);
    if (item) openEdit(item);
  } });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/15/60 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400">
        象限根据<strong className="text-zinc-200">优先级</strong>、<strong className="text-zinc-200">主线</strong>和<strong className="text-zinc-200">截止日期</strong>自动归类
        {autoCount > 0 && <>（当前 <strong className="text-zinc-200">{autoCount}</strong> 条为自动推断）</>}
        ，拖动卡片可手动固定到某个象限。
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {QUADRANTS.map((q) => (
          <QuadrantCard
            key={q.key}
            quadrant={q}
            items={grouped[q.key]}
            beginDrag={beginDrag}
            draggingId={drag?.id ?? null}
            isOver={isDragging && drag?.overKey === q.key}
          />
        ))}
      </div>

      {/* 拖拽跟随的浮层 ghost */}
      {drag && createPortal(
        <div
          className="pointer-events-none fixed z-[999] max-w-[240px] truncate rounded-lg border border-white/20 bg-zinc-800/95 px-2.5 py-1.5 text-xs text-zinc-100 shadow-2xl"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
        >
          {drag.label}
        </div>,
        document.body,
      )}
    </div>
  );
}

type QuadrantCardProps = {
  quadrant: QuadrantDef;
  items: Item[];
  beginDrag: (id: string, label: string, e: React.PointerEvent) => void;
  draggingId: string | null;
  isOver: boolean;
};

function QuadrantCard({ quadrant, items, beginDrag, draggingId, isOver }: QuadrantCardProps) {
  return (
    <div
      data-drop-zone={quadrant.key}
      className={`flex min-h-[220px] flex-col rounded-xl border transition-colors ${quadrant.bgClass} ${isOver ? "border-white/40 ring-1 ring-white/20" : quadrant.borderClass}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between rounded-t-xl px-3 py-2 ${quadrant.headerClass}`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: quadrant.color }} />
          <div>
            <h3 className="text-sm font-medium leading-tight" style={{ color: quadrant.color }}>{quadrant.title}</h3>
            <p className="text-[10px] leading-tight text-zinc-500">{quadrant.subtitle}</p>
          </div>
        </div>
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] tabular-nums text-zinc-300">{items.length}</span>
      </div>

      {/* List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2 scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center">
            <p className="text-[11px] text-zinc-600">{isOver ? "松开放到这里" : "拖动任务到这里"}</p>
          </div>
        ) : (
          items.map((item) => (
            <QuadrantTaskCard key={item.id} item={item} beginDrag={beginDrag} isDragging={draggingId === item.id} />
          ))
        )}
      </div>
    </div>
  );
}

type QuadrantTaskCardProps = {
  item: Item;
  beginDrag: (id: string, label: string, e: React.PointerEvent) => void;
  isDragging: boolean;
};

function QuadrantTaskCard({ item, beginDrag, isDragging }: QuadrantTaskCardProps) {
  const { getProjectById, getTagDef, moveItem } = useFocusFlowActions();
  const project = getProjectById(item.projectId);
  const priority = priorityTone[item.priority];
  const isMainline = !!item.isMainline;
  const overdue = isDateBeforeToday(item.dueDate);
  const pinned = typeof item.important === "boolean" && typeof item.urgent === "boolean";
  const isToday = item.status === "today";

  return (
    <article
      onPointerDown={(e) => beginDrag(item.id, item.content, e)}
      className={`group cursor-grab touch-none select-none rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 transition hover:border-white/25 hover:bg-black/30 active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
      style={{ borderLeftWidth: 3, borderLeftColor: priority.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-xs leading-snug text-zinc-200">{item.content}</p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          {!isToday && (
            <button
              onClick={(e) => { e.stopPropagation(); moveItem(item.id, "today"); }}
              className="rounded p-0.5 text-zinc-500 transition hover:text-amber-300"
              title="转 Today"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 3v10M3 8h10" /></svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); moveItem(item.id, "done"); }}
            className="rounded p-0.5 text-zinc-500 transition hover:text-emerald-400"
            title="标记完成"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5 6.5 12 13 4" /></svg>
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {pinned && <span className="text-[10px] text-zinc-500" title="已手动固定到此象限">📌</span>}
        {isMainline && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-100">主线</span>}
        {isToday && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200">Today</span>}
        <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: `${project.color}22`, color: project.color }}>{project.name}</span>
        <span className="text-[10px] text-zinc-600">{statusLabel[item.status]}</span>
        {item.dueDate && (
          <span className={`text-[10px] ${overdue ? "text-red-300" : "text-zinc-500"}`}>截止 {formatDate(item.dueDate)}</span>
        )}
        {(item.tags || []).slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full px-1.5 py-0.5 text-[10px] text-zinc-100" style={{ backgroundColor: getTagDef(tag)?.color || "#3f3f46" }}>#{tag}</span>
        ))}
      </div>
    </article>
  );
}
