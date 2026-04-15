"use client";

import { formatTime, statusLabel, type Item, type Project, type TagDef } from "@/lib/focus-flow-model";
import { Modal } from "./ui";

type Report = { date: string; content: string };
type ProjectSummary = { project: Project; total: number; done: number; undone: number; items: Item[] };

export function ProjectManagementModal({
  projects,
  newProjectName,
  setNewProjectName,
  addProject,
  deleteProject,
  onClose,
}: {
  projects: Project[];
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  addProject: () => void;
  deleteProject: (projectId: string) => void;
  onClose: () => void;
}) {
  return <Modal title="管理项目" onClose={onClose}><div className="space-y-2">{projects.map((project) => <div key={project.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} /><span>{project.name}</span></div>{project.id !== "default" && <button onClick={() => deleteProject(project.id)} className="text-xs text-red-400">删除</button>}</div>)}</div><div className="mt-4 flex gap-2"><input value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="新项目名称" className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600" onKeyDown={(event) => event.key === "Enter" && addProject()} /><button onClick={addProject} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">添加</button></div></Modal>;
}

export function TagManagementModal({
  tags,
  newTagName,
  setNewTagName,
  addTag,
  deleteTag,
  onClose,
}: {
  tags: TagDef[];
  newTagName: string;
  setNewTagName: (name: string) => void;
  addTag: (name: string) => string | undefined;
  deleteTag: (tagName: string) => void;
  onClose: () => void;
}) {
  const createTag = () => {
    addTag(newTagName);
    setNewTagName("");
  };

  return <Modal title="标签管理" onClose={onClose}><div className="space-y-2">{tags.map((tag) => <div key={tag.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} /><span>#{tag.name}</span></div><button onClick={() => deleteTag(tag.name)} className="text-xs text-red-400">删除</button></div>)}</div><div className="mt-4 flex gap-2"><input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="新标签名称" className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600" onKeyDown={(event) => event.key === "Enter" && createTag()} /><button onClick={createTag} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black">添加</button></div></Modal>;
}

export function ProjectSummaryModal({ projectSummary, onClose }: { projectSummary: ProjectSummary[]; onClose: () => void }) {
  return <Modal title="项目任务汇总" onClose={onClose} wide><div className="space-y-6">{projectSummary.map(({ project, total, done, undone, items }) => <div key={project.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} /><span className="font-medium">{project.name}</span></div><div className="flex gap-4 text-sm"><span className="text-zinc-400">总计 {total}</span><span className="text-green-400">已完成 {done}</span><span className="text-amber-400">未完成 {undone}</span></div></div><div className="mt-3 space-y-1">{items.map((item) => <div key={item.id} className={`flex items-center gap-2 text-sm ${item.status === "done" || item.status === "archived" ? "text-zinc-500 line-through" : "text-zinc-200"}`}><span>{item.status === "done" || item.status === "archived" ? "✓" : "○"}</span><span className="flex-1 truncate">{item.content}</span><span className="text-xs">{statusLabel[item.status]}</span></div>)}</div></div>)}</div></Modal>;
}

export function ReportModal({
  dailyReport,
  savedReports,
  saveDailyReport,
  copyDailyReport,
  onClose,
}: {
  dailyReport: string;
  savedReports: Report[];
  saveDailyReport: () => void;
  copyDailyReport: () => void;
  onClose: () => void;
}) {
  return <Modal title="今日日报" onClose={onClose} wide><div className="mb-3 flex justify-end gap-2"><button onClick={saveDailyReport} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">保存日报</button><button onClick={copyDailyReport} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">复制 Markdown</button></div><pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">{dailyReport}</pre>{savedReports.length > 0 && <div className="mt-4"><div className="mb-2 text-sm text-zinc-400">历史日报</div><div className="space-y-2">{savedReports.map((report) => <details key={report.date} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><summary className="cursor-pointer text-sm text-zinc-300">{report.date}</summary><pre className="mt-3 whitespace-pre-wrap text-xs text-zinc-400">{report.content}</pre></details>)}</div></div>}</Modal>;
}

export function CompletedHistoryModal({
  completedHistoryItems,
  getProjectById,
  onClose,
}: {
  completedHistoryItems: Item[];
  getProjectById: (id?: string) => Project;
  onClose: () => void;
}) {
  const recentItems = completedHistoryItems.slice(0, 12);
  return (
    <Modal title="完成历史" onClose={onClose} wide>
      <p className="text-sm text-zinc-400">这里只在你需要回看时打开，不会占着主屏幕。</p>
      <div className="mt-4 space-y-2">
        {recentItems.length ? recentItems.map((item) => {
          const project = getProjectById(item.projectId);
          return (
            <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                    {item.status === "done" ? "完成" : "归档"}
                  </span>
                  <span className="truncate text-sm text-zinc-100">{item.content}</span>
                </div>
                <span className="text-[11px] text-zinc-500">{item.completedAt ? formatTime(item.completedAt) : "无完成时间"}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                <span style={{ color: project.color }}>{project.name}</span>
                <span>{item.parentId ? "有父任务" : "顶层任务"}</span>
                <span>{item.dueDate ? `截止 ${item.dueDate}` : "无截止"}</span>
              </div>
            </article>
          );
        }) : (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-sm text-zinc-500">还没有完成历史。完成任务后，这里会自动记录。</p>
        )}
      </div>
      {completedHistoryItems.length > recentItems.length && (
        <details className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          <summary className="flex cursor-pointer items-center justify-between text-sm text-zinc-300">
            <span>展开全部历史</span>
            <svg className="h-4 w-4 shrink-0 text-zinc-500 transition-transform [[open]>&]:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
          </summary>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {completedHistoryItems.slice(12).map((item) => {
              const project = getProjectById(item.projectId);
              return (
                <article key={item.id} className="rounded-xl border border-zinc-800 bg-black/20 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="truncate text-sm text-zinc-100">{item.content}</span>
                    <span className="text-[11px] text-zinc-500">{item.completedAt ? formatTime(item.completedAt) : "无完成时间"}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span style={{ color: project.color }}>{project.name}</span>
                    <span>{item.status === "done" ? "完成" : "归档"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </details>
      )}
    </Modal>
  );
}

export function RestReminderPanel({
  taskContent,
  onTakeRest,
  onDismiss,
}: {
  taskContent?: string;
  onTakeRest: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[70] w-[320px] rounded-2xl border border-amber-300/30 bg-zinc-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/70">Rest Reminder</p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-50">该休息一下了</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {taskContent ? `这轮专注已经结束，先离开一下：${taskContent}` : "你已经完成了一轮专注，先去休息一下吧。"}
      </p>
      <div className="mt-4 flex gap-2">
        <button onClick={onTakeRest} className="rounded-xl bg-amber-200 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100">
          我去休息
        </button>
        <button onClick={onDismiss} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
          稍后
        </button>
      </div>
    </div>
  );
}
