"use client";

import { formatDate, formatTime, repeatLabel, sourceLabel, statusLabel, type Item, type ItemStatus, type Project, type TagDef } from "@/lib/focus-flow-model";
import { Chip } from "./ui";

type ItemCardProps = {
  item: Item;
  project: Project;
  projects: Project[];
  tags: TagDef[];
  getTagDef: (name: string) => TagDef | undefined;
  moveItem: (id: string, status: ItemStatus) => void;
  removeItem: (id: string) => void;
  toggleMainline: (id: string) => void;
  changeProject: (id: string, projectId: string) => void;
  startPomodoro: (taskId?: string) => void;
  updateItemTags: (id: string, tagName: string) => void;
  openEdit: (item: Item) => void;
};

export function ItemCard({ item, project, projects, tags, getTagDef, moveItem, removeItem, toggleMainline, changeProject, startPomodoro, updateItemTags, openEdit }: ItemCardProps) {
  const isMainline = item.isMainline && item.status !== "done" && item.status !== "archived";
  const actionMap: Partial<Record<ItemStatus, { label: string; to: ItemStatus }[]>> = {
    inbox: [{ label: "今天做", to: "today" }, { label: "批处理", to: "batch" }, { label: "待审", to: "review" }, { label: "归档", to: "archived" }],
    today: [{ label: "完成", to: "done" }, { label: "转批处理", to: "batch" }, { label: "待审", to: "review" }],
    review: [{ label: "转任务", to: "today" }, { label: "批处理", to: "batch" }, { label: "归档", to: "archived" }],
    batch: [{ label: "提到今天", to: "today" }, { label: "待审", to: "review" }, { label: "完成", to: "done" }],
  };

  return <div className={`rounded-xl border bg-zinc-950/70 p-4 ${isMainline ? "border-amber-500/50" : "border-zinc-800"}`}><div className="space-y-3"><div className="flex items-start justify-between gap-3"><p className={`text-sm leading-6 ${isMainline ? "text-amber-100" : "text-zinc-100"}`}>{isMainline && <span className="mr-1 text-amber-400">⚡</span>}{item.content}</p><button onClick={() => openEdit(item)} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">编辑</button></div><div className="flex flex-wrap gap-2"><Chip><span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: project.color }} /> {project.name}</Chip><Chip>{item.priority}</Chip><Chip>{statusLabel[item.status]}</Chip>{item.dueDate && <Chip className={new Date(item.dueDate) < new Date() && item.status !== "done" && item.status !== "archived" ? "border-red-500/50 text-red-300" : ""}>截止 {formatDate(item.dueDate)}</Chip>}{isMainline && <Chip className="border-amber-500/50 text-amber-400">主线</Chip>}{(item.tags || []).map((tag) => <span key={tag} className="rounded-full px-2.5 py-1 text-xs text-zinc-100" style={{ backgroundColor: getTagDef(tag)?.color || "#3f3f46" }}>#{tag}</span>)}</div>{item.result?.trim() && <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200"><span className="mr-2 text-emerald-400">处理结果</span>{item.result}</div>}<details className="rounded-lg border border-zinc-800 p-2"><summary className="cursor-pointer text-xs text-zinc-500">展开更多</summary>{item.aiSuggestion ? <p className="mt-3 text-xs leading-5 text-zinc-400">系统建议：{item.aiSuggestion.reason}</p> : null}<div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500"><span>来源 {sourceLabel[item.source]}</span><span>类型 {item.type}</span><span>加入 {formatTime(item.createdAt)}</span>{item.repeatType && item.repeatType !== "none" && <span>重复 {repeatLabel[item.repeatType]}</span>}{item.completedAt && (item.status === "done" || item.status === "archived") && <span className="text-green-400">完成于 {formatTime(item.completedAt)}</span>}</div><div className="mt-3"><div className="mb-2 text-xs text-zinc-500">编辑标签</div><div className="flex flex-wrap gap-2">{tags.map((tag) => { const active = (item.tags || []).includes(tag.name); return <button key={tag.id} onClick={() => updateItemTags(item.id, tag.name)} className="rounded-full border px-2 py-1 text-[11px]" style={{ borderColor: active ? tag.color : "#3f3f46", backgroundColor: active ? `${tag.color}22` : "transparent", color: active ? "#fff" : "#a1a1aa" }}>#{tag.name}</button>; })}</div></div></details></div><div className="mt-4 flex flex-wrap gap-2">{(actionMap[item.status] ?? []).map((action) => <button key={action.label} onClick={() => moveItem(item.id, action.to)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800">{action.label}</button>)}<button onClick={() => openEdit(item)} className="rounded-lg border border-emerald-800 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/40">处理结果</button><button onClick={() => toggleMainline(item.id)} className={`rounded-lg border px-3 py-1.5 text-xs ${isMainline ? "border-amber-500 bg-amber-950 text-amber-400" : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"}`}>{isMainline ? "取消主线" : "设为主线"}</button><button onClick={() => startPomodoro(item.id)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800">番茄钟</button><select value={item.projectId || "default"} onChange={(event) => changeProject(item.id, event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 outline-none">{projects.map((optionProject) => <option key={optionProject.id} value={optionProject.id}>{optionProject.name}</option>)}</select><button onClick={() => removeItem(item.id)} className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/50">删除</button></div></div>;
}
