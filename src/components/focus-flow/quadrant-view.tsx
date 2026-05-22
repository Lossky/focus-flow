"use client";

import { useMemo } from "react";
import type { Item } from "@/lib/focus-flow-model";

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
};

const QUADRANTS: Quadrant[] = [
  { key: "important-urgent", title: "重要且紧急", subtitle: "立即做", color: "#ef4444", bgClass: "bg-red-950/20", borderClass: "border-red-500/30" },
  { key: "important-not-urgent", title: "重要不紧急", subtitle: "计划做", color: "#3b82f6", bgClass: "bg-blue-950/20", borderClass: "border-blue-500/30" },
  { key: "not-important-urgent", title: "不重要但紧急", subtitle: "快速处理", color: "#f59e0b", bgClass: "bg-amber-950/20", borderClass: "border-amber-500/30" },
  { key: "not-important-not-urgent", title: "不重要不紧急", subtitle: "减少或删除", color: "#71717a", bgClass: "bg-zinc-900/40", borderClass: "border-zinc-700/50" },
];

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

  const unclassified = useMemo(() => openItems.filter(i => !i.important && !i.urgent && i.important === undefined && i.urgent === undefined), [openItems]);

  return (
    <div className="space-y-4">
      {/* 未分类提示 */}
      {unclassified.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-xs text-zinc-400">
          有 {unclassified.length} 条任务未标记重要/紧急，默认归入"不重要不紧急"。可在编辑中设置。
        </div>
      )}
      {/* 四象限网格 */}
      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map((q) => (
          <QuadrantCard key={q.key} quadrant={q} items={quadrantItems[q.key]} />
        ))}
      </div>
    </div>
  );
}

function QuadrantCard({ quadrant, items }: { quadrant: Quadrant; items: Item[] }) {
  return (
    <div className={`flex min-h-[200px] flex-col rounded-xl border p-3 ${quadrant.bgClass} ${quadrant.borderClass}`}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium" style={{ color: quadrant.color }}>{quadrant.title}</h3>
          <p className="text-[10px] text-zinc-500">{quadrant.subtitle}</p>
        </div>
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] tabular-nums text-zinc-400">{items.length}</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-zinc-600">暂无任务</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-md bg-black/20 px-2.5 py-1.5 text-xs text-zinc-300">
              {item.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
