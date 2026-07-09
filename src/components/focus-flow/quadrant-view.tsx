"use client";

import { useMemo } from "react";
import { useFocusFlow } from "@/contexts/focus-flow-context";
import type { Item, ItemStatus } from "@/lib/focus-flow-model";

type QuadrantViewProps = {
  items: Item[];
};

type Quadrant = {
  key: string;
  title: string;
  subtitle: string;
  color: string;
  bgClass: string;
  borderClass: string;
  headerGlow: string;
};

const QUADRANTS: Quadrant[] = [
  { key: "important-urgent", title: "重要且紧急", subtitle: "立即做", color: "#ef4444", bgClass: "bg-red-950/20", borderClass: "border-red-500/30", headerGlow: "shadow-[inset_0_1px_0_0_rgba(239,68,68,0.15)]" },
  { key: "important-not-urgent", title: "重要不紧急", subtitle: "计划做", color: "#3b82f6", bgClass: "bg-blue-950/20", borderClass: "border-blue-500/30", headerGlow: "shadow-[inset_0_1px_0_0_rgba(59,130,246,0.15)]" },
  { key: "not-important-urgent", title: "不重要但紧急", subtitle: "委托或快速处理", color: "#f59e0b", bgClass: "bg-amber-950/20", borderClass: "border-amber-500/30", headerGlow: "shadow-[inset_0_1px_0_0_rgba(245,158,11,0.15)]" },
  { key: "not-important-not-urgent", title: "不重要不紧急", subtitle: "减少或删除", color: "#71717a", bgClass: "bg-zinc-900/40", borderClass: "border-zinc-700/50", headerGlow: "" },
];

const STATUS_LABEL: Record<ItemStatus, string> = {
  inbox: "Inbox",
  today: "Today",
  review: "Review",
  batch: "Batch",
  done: "Done",
  archived: "Archived",
};

export function QuadrantView({ items }: QuadrantViewProps) {
  const openItems = useMemo(() => items.filter(i => i.status !== "done" && i.status !== "archived"), [items]);

  const quadrantItems = useMemo(() => {
    const result: Record<string, Item[]> = {
      "important-urgent": [],
      "important-not-urgent": [],
      "not-important-urgent": [],
      "not-important-not-urgent": [],
    };
    for (const item of openItems) {
      const imp = !!item.important;
      const urg = !!item.urgent;
      if (imp && urg) result["important-urgent"].push(item);
      else if (imp && !urg) result["important-not-urgent"].push(item);
      else if (!imp && urg) result["not-important-urgent"].push(item);
      else result["not-important-not-urgent"].push(item);
    }
    return result;
  }, [openItems]);

  const unclassified = useMemo(() => openItems.filter(i => i.important === undefined && i.urgent === undefined), [openItems]);

  const totalOpen = openItems.length;
  const classifiedCount = totalOpen - unclassified.length;

  return (
    <div className="space-y-4">
      {/* 概览统计 */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span>共 <strong className="text-zinc-200">{totalOpen}</strong> 条待办</span>
        <span className="h-3 w-px bg-zinc-700" />
        <span>已分类 <strong className="text-zinc-200">{classifiedCount}</strong></span>
        {unclassified.length > 0 && (
          <>
            <span className="h-3 w-px bg-zinc-700" />
            <span className="text-amber-400/80">未分类 {unclassified.length} 条（默认归入右下角）</span>
          </>
        )}
      </div>
      {/* 四象限网格 */}
      <div className="grid h-[calc(100vh-320px)] min-h-[400px] grid-cols-2 gap-3">
        {QUADRANTS.map((q) => (
          <QuadrantCard key={q.key} quadrant={q} items={quadrantItems[q.key]} />
        ))}
      </div>
    </div>
  );
}

function QuadrantCard({ quadrant, items }: { quadrant: Quadrant; items: Item[] }) {
  return (
    <div className={`flex flex-col rounded-xl border ${quadrant.bgClass} ${quadrant.borderClass} ${quadrant.headerGlow}`}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-3.5 py-2.5">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: quadrant.color }}>{quadrant.title}</h3>
          <p className="text-[10px] text-zinc-500">{quadrant.subtitle}</p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium tabular-nums"
          style={{ backgroundColor: `${quadrant.color}15`, color: quadrant.color }}
        >
          {items.length}
        </span>
      </div>
      {/* Items list with scroll */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[11px] text-zinc-600">暂无任务</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <QuadrantItemCard key={item.id} item={item} quadrantColor={quadrant.color} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuadrantItemCard({ item, quadrantColor }: { item: Item; quadrantColor: string }) {
  const { getProjectById, moveItem, toggleMainline, openEdit } = useFocusFlow();
  const project = getProjectById(item.projectId);

  return (
    <div
      className="group/qi flex flex-col gap-1 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2 transition hover:border-white/10 hover:bg-black/30"
    >
      {/* 内容行 */}
      <div className="flex items-start gap-2">
        {item.isMainline && (
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" title="主线任务" />
        )}
        <span className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-200">{item.content}</span>
      </div>
      {/* 元信息行 */}
      <div className="flex items-center gap-2 text-[10px]">
        <span
          className="rounded px-1.5 py-0.5"
          style={{ backgroundColor: `${project.color}20`, color: project.color }}
        >
          {project.name}
        </span>
        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-zinc-500">
          {STATUS_LABEL[item.status]}
        </span>
        {item.estimateMinutes && (
          <span className="text-zinc-600">{item.estimateMinutes}min</span>
        )}
        {/* 操作按钮 */}
        <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover/qi:opacity-100">
          <button
            onClick={() => toggleMainline(item.id)}
            className={`rounded p-0.5 transition ${item.isMainline ? "text-amber-400 hover:text-amber-300" : "text-zinc-600 hover:text-zinc-300"}`}
            title={item.isMainline ? "取消主线" : "设为主线"}
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill={item.isMainline ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2l1.8 3.6L14 6.4l-3 2.9.7 4.1L8 11.4 4.3 13.4l.7-4.1-3-2.9 4.2-.8L8 2z" />
            </svg>
          </button>
          <button
            onClick={() => openEdit(item)}
            className="rounded p-0.5 text-zinc-600 transition hover:text-zinc-300"
            title="编辑"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11 2.5l2.5 2.5M2 14l1-4L11.5 1.5 14 4 5.5 12.5 2 14z" />
            </svg>
          </button>
          {item.status !== "today" && (
            <button
              onClick={() => moveItem(item.id, "today")}
              className="rounded p-0.5 text-zinc-600 transition hover:text-teal-400"
              title="移到 Today"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8l5-5 5 5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
