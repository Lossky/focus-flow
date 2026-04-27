"use client";

import { useState } from "react";
import { formatTime, statusLabel, type Item, type ItemStatus, type Priority, type Project, type RepeatType, type TagDef } from "@/lib/focus-flow-model";
import { Modal, Select } from "./ui";

type EditItemModalProps = {
  item: Item;
  projects: Project[];
  tags: TagDef[];
  onClose: () => void;
  onSave: (item: Item) => void;
};

export function EditItemModal({ item, projects, tags, onClose, onSave }: EditItemModalProps) {
  const [draft, setDraft] = useState<Item>(item);

  const toggleTag = (name: string) => setDraft((prev) => ({
    ...prev,
    tags: (prev.tags || []).includes(name) ? (prev.tags || []).filter((tag) => tag !== name) : [...(prev.tags || []), name],
  }));

  return (
    <Modal title="编辑任务" onClose={onClose} wide>
      <div className="space-y-4">
        <label className="space-y-1">
          <span className="block text-xs text-zinc-400">任务内容</span>
          <textarea
            value={draft.content}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            className="min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-600"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs text-zinc-400">目标产出物</span>
          <textarea
            value={draft.output || ""}
            onChange={(event) => setDraft({ ...draft, output: event.target.value || undefined })}
            placeholder="例如：输出郑州产业大脑培训资料目录和第一版正文"
            className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-600"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })} options={[["high", "高"], ["medium", "中"], ["low", "低"]]} />
          <Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ItemStatus })} options={Object.entries(statusLabel)} />
          <Select value={draft.projectId || "default"} onChange={(event) => setDraft({ ...draft, projectId: event.target.value })} options={projects.map((project) => [project.id, project.name])} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="block text-xs text-zinc-400">计划处理日</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={draft.plannedFor || ""}
                onChange={(event) => setDraft({ ...draft, plannedFor: event.target.value || undefined })}
                className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              />
              {draft.plannedFor && <button onClick={() => setDraft({ ...draft, plannedFor: undefined })} className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800">清除</button>}
            </div>
          </label>
          <label className="space-y-1">
            <span className="block text-xs text-zinc-400">截止日期</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={draft.dueDate || ""}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || undefined })}
                className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              />
              {draft.dueDate && <button onClick={() => setDraft({ ...draft, dueDate: undefined })} className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800">清除</button>}
            </div>
          </label>
          <label className="space-y-1">
            <span className="block text-xs text-zinc-400">重复</span>
            <Select value={draft.repeatType || "none"} onChange={(event) => setDraft({ ...draft, repeatType: event.target.value as RepeatType })} options={[["none", "不重复"], ["daily", "每日"], ["weekly", "每周"]]} />
          </label>
        </div>

        <div>
          <div className="mb-2 text-sm text-zinc-400">标签</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = (draft.tags || []).includes(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${active ? "text-white" : "text-zinc-400"}`}
                  style={{ borderColor: active ? tag.color : "#3f3f46", backgroundColor: active ? `${tag.color}22` : "transparent" }}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <label className="space-y-1">
          <span className="block text-xs text-zinc-400">处理结果</span>
          <textarea
            value={draft.result || ""}
            onChange={(event) => setDraft({ ...draft, result: event.target.value || undefined })}
            placeholder="完成后可记录关键结果，便于日报/周报复盘"
            className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-600"
          />
        </label>

        {draft.history?.length ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="mb-2 text-sm text-zinc-400">最近流转</div>
            <div className="space-y-1 text-xs text-zinc-500">
              {draft.history.slice(-5).reverse().map((entry, index) => (
                <div key={`${entry.at}-${index}`}>
                  {formatHistoryType(entry.type)} {entry.from && entry.to ? `${statusLabel[entry.from]} → ${statusLabel[entry.to]}` : entry.to ? statusLabel[entry.to] : ""} · {formatTime(entry.at)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">取消</button>
          <button onClick={() => onSave(draft)} className="rounded-xl bg-teal-200 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-100">保存</button>
        </div>
      </div>
    </Modal>
  );
}

function formatHistoryType(type: NonNullable<Item["history"]>[number]["type"]) {
  const labels: Record<NonNullable<Item["history"]>[number]["type"], string> = {
    created: "创建",
    status_changed: "流转",
    edited: "编辑",
    completed: "完成",
    archived: "归档",
  };
  return labels[type];
}
