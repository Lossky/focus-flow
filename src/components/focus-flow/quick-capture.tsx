import { useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";
import { parseMultiTask, type ItemSource, type Priority, type Project, type RepeatType, type TagDef } from "@/lib/focus-flow-model";
import { Select } from "./ui";

type QuickCaptureProps = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  source: ItemSource;
  setSource: Dispatch<SetStateAction<ItemSource>>;
  priority: Priority;
  setPriority: Dispatch<SetStateAction<Priority>>;
  dueDate: string;
  setDueDate: Dispatch<SetStateAction<string>>;
  repeatType: RepeatType;
  setRepeatType: Dispatch<SetStateAction<RepeatType>>;
  selectedProject: string;
  setSelectedProject: Dispatch<SetStateAction<string>>;
  selectedTags: string[];
  tags: TagDef[];
  projects: Project[];
  newQuickTag: string;
  setNewQuickTag: Dispatch<SetStateAction<string>>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  addItems: () => void;
  toggleSelectedTag: (tagName: string) => void;
  createQuickTag: () => void;
};

export function QuickCapture({
  input,
  setInput,
  source,
  setSource,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  repeatType,
  setRepeatType,
  selectedProject,
  setSelectedProject,
  selectedTags,
  tags,
  projects,
  newQuickTag,
  setNewQuickTag,
  textareaRef,
  addItems,
  toggleSelectedTag,
  createQuickTag,
}: QuickCaptureProps) {
  const pendingTasks = useMemo(() => input.trim() ? parseMultiTask(input) : [], [input]);
  const canAdd = pendingTasks.length > 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Capture first</p>
        <h2 className="mt-1 text-xl font-semibold">快速录入</h2>
        <p className="mt-1 text-sm text-zinc-500">先收集，再分流，不要让任务直接压进脑子里。按 Cmd+K 聚焦，Cmd+Enter 加入。</p>
      </div>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            addItems();
          }
        }}
        placeholder="支持多任务：换行 / 分号 / 1. 2. 3."
        className="min-h-32 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400">
        <span>{canAdd ? `将添加 ${pendingTasks.length} 条任务` : "输入内容后会在这里预览拆分数量"}</span>
        {pendingTasks.length > 1 && <span className="text-emerald-300">已识别多任务</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={source} onChange={(event) => setSource(event.target.value as ItemSource)} options={[["manual", "手动"], ["feishu", "飞书"], ["ai", "AI"], ["obsidian", "Obsidian"], ["doc", "文档"], ["other", "其他"]]} />
        <Select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} options={[["high", "高"], ["medium", "中"], ["low", "低"]]} />
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
        <Select value={repeatType} onChange={(event) => setRepeatType(event.target.value as RepeatType)} options={[["none", "不重复"], ["daily", "每日"], ["weekly", "每周"]]} />
        <Select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} options={projects.map((project) => [project.id, project.name])} />
        <button onClick={addItems} disabled={!canAdd} className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">加入系统</button>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="mb-2 text-sm text-zinc-400">标签选择</div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                onClick={() => toggleSelectedTag(tag.name)}
                className={`rounded-full border px-3 py-1 text-xs ${active ? "text-white" : "text-zinc-400"}`}
                style={{ borderColor: active ? tag.color : "#3f3f46", backgroundColor: active ? `${tag.color}22` : "transparent" }}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newQuickTag}
            onChange={(event) => setNewQuickTag(event.target.value)}
            placeholder="新建标签"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
          <button onClick={createQuickTag} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">创建并选中</button>
        </div>
      </div>
    </section>
  );
}
