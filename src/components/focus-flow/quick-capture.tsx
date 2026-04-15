import { useMemo, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from "react";
import { parseTaskInput, priorityTone, type ItemSource, type Priority, type Project, type RepeatType, type TagDef } from "@/lib/focus-flow-model";
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
  const pendingTasks = useMemo(() => input.trim() ? parseTaskInput(input) : [], [input]);
  const canAdd = pendingTasks.length > 0;
  const hasHierarchy = pendingTasks.some((task) => task.parentIndex !== undefined || task.depth > 0);
  const priorityMeta = priorityTone[priority];

  return (
    <section className="rounded-[1.5rem] border border-teal-300/20 bg-teal-950/[0.18] p-4 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-teal-200">Capture</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">快速录入</h2>
          <p className="mt-1 text-sm leading-5 text-zinc-400">先收进来，稍后判断。⌘K 聚焦，⌘Enter 加入。</p>
        </div>
      </div>

      {/* Quick settings row — always visible */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="项目">
          <Select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} options={projects.map((project) => [project.id, project.name])} />
        </Field>
        <Field label="优先级">
          <Select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} options={[["high", "高"], ["medium", "中"], ["low", "低"]]} />
        </Field>
        <Field label="截止">
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/70"
          />
        </Field>
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
        placeholder={"例如：\n- 发布客户方案\n  - 整理会议纪要\n  - 检查 AI 初稿"}
        className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-zinc-600 focus:border-teal-300/70 focus:bg-black/40"
      />

      {/* Status bar + submit */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <span className={canAdd ? "text-teal-200" : ""}>{canAdd ? `${pendingTasks.length} 条待收` : "输入后预览拆分"}</span>
          {hasHierarchy && <span className="text-sky-300">多级任务</span>}
          {pendingTasks.length > 1 && <span className="text-emerald-300">多任务</span>}
          <span className={`font-medium ${priorityMeta.summaryClass}`}>P{priorityMeta.label}</span>
          {selectedTags.map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
        <button onClick={addItems} disabled={!canAdd} className="rounded-xl bg-teal-200 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none">
          收进系统
        </button>
      </div>

      {/* Advanced options — collapsed */}
      <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-2.5">
        <summary className="cursor-pointer list-none text-sm text-zinc-400">
          <div className="flex items-center justify-between gap-3">
            <span>更多选项</span>
            <svg className="h-4 w-4 shrink-0 text-zinc-600 transition-transform [[open]>&]:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
          </div>
        </summary>
        <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2">
          <Field label="来源">
            <Select value={source} onChange={(event) => setSource(event.target.value as ItemSource)} options={[["manual", "手动"], ["feishu", "飞书"], ["ai", "AI"], ["obsidian", "Obsidian"], ["doc", "文档"], ["other", "其他"]]} />
          </Field>
          <Field label="重复">
            <Select value={repeatType} onChange={(event) => setRepeatType(event.target.value as RepeatType)} options={[["none", "不重复"], ["daily", "每日"], ["weekly", "每周"]]} />
          </Field>
        </div>
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-2 text-sm text-zinc-400">标签</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleSelectedTag(tag.name)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${active ? "text-white" : "text-zinc-400"}`}
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
              className="flex-1 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/70"
            />
            <button onClick={createQuickTag} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">创建</button>
          </div>
        </div>
      </details>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="block text-[11px] tracking-[0.12em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
