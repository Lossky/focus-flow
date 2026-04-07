import type { Dispatch, SetStateAction } from "react";
import { statusLabel, type DragState, type Item, type ItemStatus, type Project, type TagDef } from "@/lib/focus-flow-model";
import { ItemCard } from "./item-card";
import { EmptyState, MiniTag } from "./ui";

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
  updateItemTags: (id: string, tagName: string) => void;
  openEdit: (item: Item) => void;
};

type FlowViewProps = CommonTaskViewProps & {
  sections: FlowSection[];
};

type BoardViewProps = {
  items: Item[];
  projects: Project[];
  dragState: DragState;
  setDragState: Dispatch<SetStateAction<DragState>>;
  getTagDef: (name: string) => TagDef | undefined;
  reorderInStatus: (status: ItemStatus, draggedId: string, targetId?: string) => void;
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
  updateItemTags,
  openEdit,
}: FlowViewProps) {
  const orderedSections = [sections.find((section) => section.key === "today"), ...sections.filter((section) => section.key !== "today")].filter(Boolean) as FlowSection[];

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        {orderedSections.filter((section) => section.key !== "today").map((section) => {
          const sectionItems = items.filter((item) => item.status === section.key);
          return (
            <div key={section.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{section.hint}</p>
                </div>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{sectionItems.length} 条</span>
              </div>
              <div className="space-y-3">
                {sectionItems.length === 0 ? (
                  <EmptyState />
                ) : (
                  sectionItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      project={getProjectById(item.projectId)}
                      projects={projects}
                      tags={tags}
                      getTagDef={getTagDef}
                      moveItem={moveItem}
                      removeItem={removeItem}
                      toggleMainline={toggleMainline}
                      changeProject={changeProject}
                      startPomodoro={startPomodoro}
                      updateItemTags={updateItemTags}
                      openEdit={openEdit}
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

export function BoardView({ items, projects, dragState, setDragState, getTagDef, reorderInStatus }: BoardViewProps) {
  const boardStatuses: ItemStatus[] = ["today", "inbox", "batch", "review"];

  return (
    <section className="space-y-5">
      {projects.map((project) => {
        const projectItems = items.filter((item) => (item.projectId || "default") === project.id);
        if (!projectItems.length) return null;
        return (
          <div key={project.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
              <h3 className="text-lg font-semibold">{project.name}</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {boardStatuses.map((status) => {
                const colItems = projectItems.filter((item) => item.status === status);
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
                    className={`rounded-xl border p-3 transition ${dragState.overStatus === status ? "border-amber-500/60 ring-1 ring-amber-500/40" : isToday ? "border-amber-500/40 bg-amber-950/10" : "border-zinc-800 bg-zinc-950/60"}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className={`text-sm font-medium ${isToday ? "text-amber-300" : ""}`}>{statusLabel[status]}</p>
                      <span className={`text-xs ${isToday ? "text-amber-200/80" : "text-zinc-500"}`}>{colItems.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colItems.map((item) => (
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
                          className={`cursor-move rounded-lg border p-3 text-sm transition ${dragState.draggingId === item.id ? "border-amber-500/60 opacity-60" : isToday ? "border-amber-500/30 hover:border-amber-400/60" : "border-zinc-800 hover:border-zinc-700"}`}
                        >
                          <div className="text-zinc-100">{item.content}</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(item.tags || []).map((tag) => <MiniTag key={tag} color={getTagDef(tag)?.color}>#{tag}</MiniTag>)}
                          </div>
                        </div>
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

