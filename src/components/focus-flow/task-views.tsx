import { useState } from "react";
import { buildChildCountMap, filterVisibleTreeItems, getAncestorItems, statusLabel, type Item, type ItemStatus, type Project } from "@/lib/focus-flow-model";
import { ItemCard, getActiveDragId } from "./item-card";

export type FlowSection = { key: ItemStatus; title: string; hint: string };

type FlowViewProps = {
  items: Item[];
  sections: FlowSection[];
  moveItem: (id: string, status: ItemStatus) => void;
  activePomodoroTaskId?: string;
  isFocusMode?: boolean;
  collapsedTaskIds: string[];
  toggleCollapsedTask: (id: string) => void;
};

export function FlowView({
  items,
  sections,
  moveItem,
  activePomodoroTaskId,
  isFocusMode = false,
  collapsedTaskIds,
  toggleCollapsedTask,
}: FlowViewProps) {
  const orderedSections = [sections.find((section) => section.key === "today"), ...sections.filter((section) => section.key !== "today")].filter(Boolean) as FlowSection[];
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(items);
  const collapsedSet = new Set(collapsedTaskIds);
  const [dragOverLane, setDragOverLane] = useState<ItemStatus | null>(null);

  return (
    <section className="space-y-4">
      <p className="text-sm text-zinc-500">Inbox、Review 和 Batch 不必同时处理，挑当前最需要清理的入口就好。拖拽卡片可以在泳道间移动。</p>
      <div className="grid gap-4 xl:grid-cols-3">
        {orderedSections.filter((section) => section.key !== "today").map((section) => {
          const sectionItems = items.filter((item) => item.status === section.key);
          const visibleSectionItems = filterVisibleTreeItems(sectionItems, collapsedSet);
          const isDragOver = dragOverLane === section.key;
          return (
            <div
              key={section.key}
              className={`rounded-2xl border p-4 transition-colors duration-200 ${isDragOver ? "border-amber-400/50 bg-amber-950/15" : "border-zinc-800 bg-zinc-900/60"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverLane(section.key); }}
              onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setDragOverLane(null); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverLane(null);
                const draggedId = e.dataTransfer.getData("text/plain") || getActiveDragId();
                if (draggedId) moveItem(draggedId, section.key);
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{section.hint}</p>
                </div>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{visibleSectionItems.length} 条</span>
              </div>
              <div className="space-y-2 stagger-children">
                {visibleSectionItems.length === 0 ? (
                  <div className={`rounded-xl border border-dashed px-4 py-5 text-center text-sm ${isDragOver ? "border-amber-400/40 text-amber-200/70" : "border-white/10 text-zinc-500"}`}>
                    {isDragOver ? "松开放到这里" : "这里还没有内容。"}
                  </div>
                ) : (
                  visibleSectionItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      parentItem={item.parentId ? itemById.get(item.parentId) : undefined}
                      ancestorItems={getAncestorItems(item, itemById)}
                      childCount={childCounts.get(item.id) || 0}
                      isChildrenCollapsed={collapsedSet.has(item.id)}
                      onToggleChildren={toggleCollapsedTask}
                      isFocusMode={isFocusMode}
                      isPomodoroActive={activePomodoroTaskId === item.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ProjectOverview({ items, projects }: { items: Item[]; projects: Project[] }) {
  // Include all items (open + done) for progress calculation
  const allItems = items;

  return (
    <section className="space-y-4">
      <p className="text-sm text-zinc-500">按项目查看进度和任务分布。</p>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => {
          const projectItems = allItems.filter((i) => (i.projectId || "default") === project.id);
          if (!projectItems.length) return null;
          const done = projectItems.filter((i) => i.status === "done" || i.status === "archived").length;
          const total = projectItems.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const open = projectItems.filter((i) => i.status !== "done" && i.status !== "archived");
          const todayCount = projectItems.filter((i) => i.status === "today").length;
          const inboxCount = projectItems.filter((i) => i.status === "inbox").length;
          const reviewCount = projectItems.filter((i) => i.status === "review").length;
          const batchCount = projectItems.filter((i) => i.status === "batch").length;

          return (
            <div key={project.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h3 className="text-base font-semibold">{project.name}</h3>
                </div>
                <span className="text-xs tabular-nums text-zinc-400">{done}/{total} 完成</span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: project.color }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span style={{ color: project.color }}>{pct}%</span>
                <div className="flex gap-2 text-zinc-500">
                  {todayCount > 0 && <span>Today {todayCount}</span>}
                  {inboxCount > 0 && <span>Inbox {inboxCount}</span>}
                  {reviewCount > 0 && <span>Review {reviewCount}</span>}
                  {batchCount > 0 && <span>Batch {batchCount}</span>}
                </div>
              </div>

              {/* Open tasks */}
              {open.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
                  {open.slice(0, 8).map((task) => (
                    <div key={task.id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color, opacity: 0.6 }} />
                      <div className="min-w-0 flex-1">
                        <span className={`leading-5 ${task.isMainline ? "font-medium text-amber-100" : "text-zinc-200"}`}>{task.content}</span>
                        <div className="flex gap-2 text-[10px] text-zinc-500">
                          <span>{statusLabel[task.status]}</span>
                          {task.isMainline && <span className="text-amber-300">主线</span>}
                          {task.dueDate && <span>截止 {task.dueDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {open.length > 8 && (
                    <p className="text-[11px] text-zinc-500">还有 {open.length - 8} 条未完成</p>
                  )}
                </div>
              )}

              {/* All done */}
              {open.length === 0 && (
                <div className="mt-3 rounded-lg border border-dashed border-emerald-500/20 bg-emerald-950/10 px-3 py-2 text-center text-xs text-emerald-300">
                  全部完成 🎉
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
