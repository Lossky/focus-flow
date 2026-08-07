import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/contexts/i18n-context";
import { usePointerDrag } from "@/hooks/use-pointer-drag";
import { buildChildCountMap, filterVisibleTreeItems, getAncestorItems, type Item, type ItemStatus, type Project } from "@/lib/focus-flow-model";
import { ItemCard } from "./item-card";

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
  const { t } = useI18n();
  const itemById = new Map(items.map((item) => [item.id, item]));
  const childCounts = buildChildCountMap(items);
  const collapsedSet = new Set(collapsedTaskIds);
  const [shelvedOpen, setShelvedOpen] = useState(false);
  const handleDrop = useCallback((id: string, zoneKey: string) => {
    const status = ["inbox", "blocked", "shelved"].includes(zoneKey) ? zoneKey as ItemStatus : undefined;
    if (status) moveItem(id, status);
  }, [moveItem]);
  const { drag, beginDrag } = usePointerDrag({ onDrop: handleDrop });

  // 日常视野只有 Inbox + 阻塞；搁置是收纳抽屉，默认折叠
  const laneSections = sections.filter((s) => s.key === "inbox" || s.key === "blocked");
  const shelvedSection = sections.find((s) => s.key === "shelved");
  const shelvedItems = items.filter((item) => item.status === "shelved");
  const visibleShelvedItems = filterVisibleTreeItems(shelvedItems, collapsedSet);

  const renderCard = (item: Item) => (
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
      onPointerDown={(event) => beginDrag(item.id, item.content, event)}
    />
  );

  return (
    <section className="space-y-4">
      <p className="text-sm text-zinc-500">{t("flowHint")}</p>
      <div className="grid gap-4 xl:grid-cols-2">
        {laneSections.map((section) => {
          const sectionItems = items.filter((item) => item.status === section.key);
          const visibleSectionItems = filterVisibleTreeItems(sectionItems, collapsedSet);
          return (
            <div
              key={section.key}
              data-drop-zone={section.key}
              className={`rounded-2xl border p-4 transition-colors duration-200 ${drag?.overKey === section.key ? "border-amber-400/50 bg-amber-950/15" : "border-white/10 bg-zinc-900/60"}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{section.hint}</p>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300">{visibleSectionItems.length} 条</span>
              </div>
              <div className="space-y-2 stagger-children">
                {visibleSectionItems.length === 0 ? (
                  <div className={`rounded-xl border border-dashed px-4 py-5 text-center text-sm ${drag?.overKey === section.key ? "border-amber-400/40 text-amber-200/70" : "border-white/10 text-zinc-500"}`}>
                    {drag?.overKey === section.key ? "松开放到这里" : "这里还没有内容。"}
                  </div>
                ) : (
                  visibleSectionItems.map(renderCard)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 搁置抽屉：默认折叠，不占日常视野 */}
      {shelvedSection && (
        <div
          data-drop-zone="shelved"
          className={`rounded-2xl border transition-colors duration-200 ${drag?.overKey === "shelved" ? "border-amber-400/50 bg-amber-950/15" : "border-white/10 bg-zinc-900/40"}`}
        >
          <button
            onClick={() => setShelvedOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <svg className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${shelvedOpen ? "rotate-90" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.5 3 7.5 6 4.5 9" /></svg>
              <div>
                <h3 className="text-sm font-medium text-zinc-300">{shelvedSection.title}</h3>
                {shelvedOpen && <p className="mt-0.5 text-xs text-zinc-500">{shelvedSection.hint}</p>}
              </div>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-zinc-400">
              {drag?.overKey === "shelved" ? "松开搁置" : `${shelvedItems.length} 条`}
            </span>
          </button>
          {shelvedOpen && (
            <div className="space-y-2 border-t border-white/10 p-4 stagger-children">
              {visibleShelvedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-zinc-500">
                  搁置区是空的。不确定要不要做的任务可以拖到这里。
                </div>
              ) : (
                visibleShelvedItems.map(renderCard)
              )}
            </div>
          )}
        </div>
      )}

      {drag && createPortal(
        <div
          className="pointer-events-none fixed z-[999] max-w-[240px] truncate rounded-lg border border-white/20 bg-zinc-800/95 px-2.5 py-1.5 text-xs text-zinc-100 shadow-2xl"
          style={{ left: drag.x + 12, top: drag.y + 12 }}
        >
          {drag.label}
        </div>,
        document.body,
      )}
    </section>
  );
}

export function ProjectOverview({ items, projects }: { items: Item[]; projects: Project[] }) {
  const { t, statusLabel } = useI18n();
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
          const blockedCount = projectItems.filter((i) => i.status === "blocked").length;
          const shelvedCount = projectItems.filter((i) => i.status === "shelved").length;

          return (
            <div key={project.id} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h3 className="text-base font-semibold">{project.name}</h3>
                </div>
                <span className="text-xs tabular-nums text-zinc-400">{done}/{total} {t("completed")}</span>
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
                  {todayCount > 0 && <span>{t("today")} {todayCount}</span>}
                  {inboxCount > 0 && <span>{t("inbox")} {inboxCount}</span>}
                  {blockedCount > 0 && <span className="text-red-300/70">{t("blocked")} {blockedCount}</span>}
                  {shelvedCount > 0 && <span>{t("shelved")} {shelvedCount}</span>}
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
                          <span>{statusLabel(task.status)}</span>
                          {task.isMainline && <span className="text-amber-300">{t("mainline")}</span>}
                          {task.dueDate && <span>{t("due")} {task.dueDate}</span>}
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
