import type { Item, ItemStatus, Project, TagDef } from "@/lib/focus-flow-model";
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
  updateItemTags: (id: string, tagName: string) => void;
  openEdit: (item: Item) => void;
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
  updateItemTags,
  openEdit,
}: TodayMainlineProps) {
  const todayItems = items.filter((item) => item.status === "today");

  return (
    <section className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(245,158,11,0.12)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Mainline</p>
          <h2 className="mt-1 text-xl font-semibold text-amber-300">Today 主线</h2>
          <p className="mt-1 text-sm text-amber-100/70">今天真正要推进的任务，建议只保留最重要的 1 到 3 个。</p>
          {todayLoadWarning && <p className="mt-3 rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-100">{todayLoadWarning}</p>}
        </div>
        <span className="rounded-full border border-amber-500/40 px-3 py-1 text-xs text-amber-200">{todayItems.length} 条</span>
      </div>
      <div className="space-y-3">
        {todayItems.length === 0 ? (
          <EmptyState />
        ) : (
          todayItems.map((item) => (
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
    </section>
  );
}

