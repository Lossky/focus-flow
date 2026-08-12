import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/contexts/i18n-context";
import { buildChildCountMap, filterVisibleTreeItems, getAncestorItems, type Item, type ItemStatus } from "@/lib/focus-flow-model";
import { ItemCard, getActiveDragId } from "./item-card";
import { EmptyState } from "./ui";

type TodayMainlineProps = {
  items: Item[];
  todayLoadWarning: string;
  moveItem: (id: string, status: ItemStatus) => void;
  activePomodoroTaskId?: string;
  isFocusMode?: boolean;
  collapsedTaskIds: string[];
  toggleCollapsedTask: (id: string) => void;
};

export function TodayMainline({
  items,
  todayLoadWarning,
  moveItem,
  activePomodoroTaskId,
  isFocusMode = false,
  collapsedTaskIds,
  toggleCollapsedTask,
}: TodayMainlineProps) {
  const { t } = useI18n();
  const todayItems = items.filter((item) => item.status === "today");
  const visibleTodayItems = filterVisibleTreeItems(todayItems, new Set(collapsedTaskIds));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(todayItems);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <section
      className={`rounded-xl border border-white/10 bg-[#0b1625]/80 p-3.5 shadow-xl shadow-black/20 backdrop-blur transition-colors duration-200 ${isDragOver ? "border-teal-400/60 ring-1 ring-teal-400/30" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const draggedId = e.dataTransfer.getData("text/plain") || getActiveDragId();
        if (draggedId) moveItem(draggedId, "today");
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-[5px]">
          <Image
            src="/icon/daily.png"
            alt=""
            width={64}
            height={44}
            className="h-11 w-16 shrink-0 object-contain"
            aria-hidden="true"
          />
          <div>
            <h2 className="mt-0 text-xl font-semibold tracking-tight text-zinc-100">{t("todayMainline")}</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{t("todayMainlineHint")}</p>
            {todayLoadWarning && <p className="mt-3 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">{todayLoadWarning}</p>}
          </div>
        </div>
        <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300">{t("itemCount", { count: todayItems.length })}</span>
      </div>
      <div className="space-y-2 stagger-children">
        {visibleTodayItems.length === 0 ? (
          <EmptyState />
        ) : (
          visibleTodayItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              parentItem={item.parentId ? itemById.get(item.parentId) : undefined}
              ancestorItems={getAncestorItems(item, itemById)}
              childCount={childCounts.get(item.id) || 0}
              isChildrenCollapsed={collapsedTaskIds.includes(item.id)}
              onToggleChildren={toggleCollapsedTask}
              isFocusMode={isFocusMode}
              isPomodoroActive={activePomodoroTaskId === item.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
