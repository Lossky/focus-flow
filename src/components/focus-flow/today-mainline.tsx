import { useState } from "react";
import { buildChildCountMap, filterVisibleTreeItems, getAncestorItems, type Item, type ItemStatus, type Project, type TagDef } from "@/lib/focus-flow-model";
import { ItemCard } from "./item-card";
import { EmptyState } from "./ui";

type TodayMainlineProps = {
  items: Item[];
  projects: Project[];
  tags: TagDef[];
  todayLoadWarning: string;
  getProjectById: (id?: string) => Project;
  getTagDef: (name: string) => TagDef | undefined;
  moveItem: (id: string, status: ItemStatus) => void;
  removeItem: (id: string) => void;
  toggleMainline: (id: string) => void;
  changeProject: (id: string, projectId: string) => void;
  startPomodoro: (taskId?: string) => void;
  activePomodoroTaskId?: string;
  isFocusMode?: boolean;
  updateItemTags: (id: string, tagName: string) => void;
  openEdit: (item: Item) => void;
  collapsedTaskIds: string[];
  toggleCollapsedTask: (id: string) => void;
};

export function TodayMainline({
  items,
  projects,
  tags,
  todayLoadWarning,
  getProjectById,
  getTagDef,
  moveItem,
  removeItem,
  toggleMainline,
  changeProject,
  startPomodoro,
  activePomodoroTaskId,
  isFocusMode = false,
  updateItemTags,
  openEdit,
  collapsedTaskIds,
  toggleCollapsedTask,
}: TodayMainlineProps) {
  const todayItems = items.filter((item) => item.status === "today");
  const visibleTodayItems = filterVisibleTreeItems(todayItems, new Set(collapsedTaskIds));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(todayItems);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <section
      className={`rounded-[2rem] border bg-gradient-to-br from-amber-300/[0.14] via-orange-950/[0.18] to-black/20 p-4 shadow-2xl shadow-black/20 backdrop-blur transition-colors duration-200 ${isDragOver ? "border-amber-400/60 ring-1 ring-amber-400/30" : "border-amber-300/30"}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; setIsDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId) moveItem(draggedId, "today");
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Mainline</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-amber-100">Today 主线</h2>
          <p className="mt-1 text-sm leading-6 text-amber-100/70">今天真正要推进的任务，只保留最重要的 1 到 3 个。</p>
          {todayLoadWarning && <p className="mt-3 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">{todayLoadWarning}</p>}
        </div>
        <span className="rounded-full border border-amber-300/30 bg-amber-200/10 px-3 py-1 text-xs text-amber-100">{todayItems.length} 条</span>
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
              project={getProjectById(item.projectId)}
              projects={projects}
              tags={tags}
              getTagDef={getTagDef}
              moveItem={moveItem}
              removeItem={removeItem}
              toggleMainline={toggleMainline}
              changeProject={changeProject}
              startPomodoro={startPomodoro}
              onToggleChildren={toggleCollapsedTask}
              isFocusMode={isFocusMode}
              isPomodoroActive={activePomodoroTaskId === item.id}
              updateItemTags={updateItemTags}
              openEdit={openEdit}
            />
          ))
        )}
      </div>
    </section>
  );
}
