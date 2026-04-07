"use client";

import { statusLabel, type Item, type Project, type TagDef } from "@/lib/focus-flow-model";
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
  addTag: (name: string) => string;
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
