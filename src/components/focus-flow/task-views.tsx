import { useState, type Dispatch, type SetStateAction } from "react";
import { buildChildCountMap, filterVisibleTreeItems, getAncestorItems, statusLabel, type DragState, type Item, type ItemStatus, type Project, type TagDef } from "@/lib/focus-flow-model";
import { ItemCard } from "./item-card";
import { MiniTag } from "./ui";

export type FlowSection = { key: ItemStatus; title: string; hint: string };

type CommonTaskViewProps = {
  items: Item[];
  projects: Project[];
  tags: TagDef[];
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

type FlowViewProps = CommonTaskViewProps & {
  sections: FlowSection[];
};

type BoardViewProps = {
  items: Item[];
  projects: Project[];
  dragState: DragState;
  setDragState: Dispatch<SetStateAction<DragState>>;
  activePomodoroTaskId?: string;
  isFocusMode?: boolean;
  getTagDef: (name: string) => TagDef | undefined;
  reorderInStatus: (status: ItemStatus, draggedId: string, targetId?: string) => void;
  collapsedTaskIds: string[];
  toggleCollapsedTask: (id: string) => void;
};

export function FlowView({
  items,
  projects,
  tags,
  sections,
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
}: FlowViewProps) {
  const orderedSections = [sections.find((section) => section.key === "today"), ...sections.filter((section) => section.key !== "today")].filter(Boolean) as FlowSection[];
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(items);
  const collapsedSet = new Set(collapsedTaskIds);
  const [dragOverLane, setDragOverLane] = useState<ItemStatus | null>(null);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Triage</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">分流处理</h2>
          <p className="mt-1 text-sm text-zinc-500">Inbox、Review 和 Batch 不必同时处理，挑当前最需要清理的入口就好。拖拽卡片可以在泳道间移动。</p>
        </div>
      </div>
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
                const draggedId = e.dataTransfer.getData("text/plain");
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
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", item.id); e.dataTransfer.effectAllowed = "move"; }}
                    >
                      <ItemCard
                        item={item}
                        parentItem={item.parentId ? itemById.get(item.parentId) : undefined}
                        ancestorItems={getAncestorItems(item, itemById)}
                        childCount={childCounts.get(item.id) || 0}
                        isChildrenCollapsed={collapsedSet.has(item.id)}
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
                    </div>
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

export function BoardView({ items, projects, dragState, setDragState, activePomodoroTaskId, isFocusMode = false, getTagDef, reorderInStatus, collapsedTaskIds, toggleCollapsedTask }: BoardViewProps) {
  const boardStatuses: ItemStatus[] = ["today", "inbox", "batch", "review"];
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(items);
  const collapsedSet = new Set(collapsedTaskIds);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Board</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">项目看板</h2>
        <p className="mt-1 text-sm text-zinc-500">按项目查看任务位置，拖拽卡片来调整分流状态。</p>
      </div>
      {projects.map((project) => {
        const projectItems = items.filter((item) => (item.projectId || "default") === project.id);
        const visibleProjectItems = filterVisibleTreeItems(projectItems, collapsedSet);
        if (!visibleProjectItems.length) return null;
        return (
          <div key={project.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
              <h3 className="text-lg font-semibold">{project.name}</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {boardStatuses.map((status) => {
                const colItems = visibleProjectItems.filter((item) => item.status === status);
                const isToday = status === "today";
                return (
                  <div
                    key={status}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragState((prev) => ({ ...prev, overStatus: status }));
                    }}
                    onDragLeave={() => setDragState((prev) => prev.overStatus === status ? { ...prev, overStatus: undefined } : prev)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const draggedId = event.dataTransfer.getData("text/plain");
                      if (draggedId) reorderInStatus(status, draggedId);
                      setDragState({});
                    }}
                    className={`rounded-xl border p-2.5 transition ${dragState.overStatus === status ? "border-amber-500/60 ring-1 ring-amber-500/40" : isToday ? "border-amber-500/40 bg-amber-950/10" : "border-zinc-800 bg-zinc-950/60"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className={`text-sm font-medium ${isToday ? "text-amber-300" : ""}`}>{statusLabel[status]}</p>
                      <span className={`text-xs ${isToday ? "text-amber-200/80" : "text-zinc-500"}`}>{colItems.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {colItems.map((item) => (
                        (() => {
                          const ancestors = getAncestorItems(item, itemById);
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", item.id);
                                setDragState({ draggingId: item.id, overStatus: status });
                              }}
                              onDragEnd={() => setDragState({})}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                const draggedId = event.dataTransfer.getData("text/plain");
                                if (draggedId) reorderInStatus(status, draggedId, item.id);
                                setDragState({});
                              }}
                              className={`relative cursor-move rounded-lg border px-2.5 py-2 text-xs leading-5 transition ${dragState.draggingId === item.id ? "border-amber-500/60 opacity-60" : activePomodoroTaskId === item.id ? "border-amber-200/70 bg-amber-200/[0.08] ring-1 ring-amber-200/40" : isFocusMode ? "border-zinc-800 opacity-70 hover:border-zinc-700 hover:opacity-100" : isToday ? "border-amber-500/30 hover:border-amber-400/60" : "border-zinc-800 hover:border-zinc-700"}`}
                              style={{ marginLeft: item.depth ? `${Math.min(item.depth, 4) * 10}px` : undefined }}
                            >
                              {item.depth ? <span className="absolute bottom-2 left-1 top-2 w-px rounded-full bg-sky-300/20" aria-hidden="true" /> : null}
                              {activePomodoroTaskId === item.id && <div className="mb-1 text-[10px] font-medium text-amber-100">专注中</div>}
                              {(item.depth || childCounts.get(item.id)) ? (
                                <div className="mb-1 flex flex-wrap gap-1 text-[10px] text-sky-200/80">
                                  {item.depth ? <span>L{Math.min(item.depth, 4) + 1}</span> : null}
                                  {childCounts.get(item.id) ? (
                                    <button type="button" onClick={() => toggleCollapsedTask(item.id)} className="rounded-full border border-emerald-300/20 px-1.5 py-0.5 text-[9px] text-emerald-100 transition hover:bg-emerald-300/10">
                                      {collapsedSet.has(item.id) ? "展开" : "收起"} {childCounts.get(item.id)} 子项
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                              {ancestors.length ? <div className="mb-1 truncate text-[10px] text-sky-100/70">{ancestors.map((ancestor) => ancestor.content).join(" > ")}</div> : null}
                              <div className="text-zinc-100">{item.content}</div>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {(item.tags || []).map((tag) => <MiniTag key={tag} color={getTagDef(tag)?.color}>#{tag}</MiniTag>)}
                              </div>
                            </div>
                          );
                        })()
                      ))}
                      {colItems.length === 0 && (
                        <div className={`rounded-lg border border-dashed px-3 py-6 text-center text-xs ${isToday ? "border-amber-500/30 text-amber-200/70" : "border-zinc-800 text-zinc-500"}`}>拖到这里开始处理</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
