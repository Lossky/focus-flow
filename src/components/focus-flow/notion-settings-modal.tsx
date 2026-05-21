"use client";

import { useState } from "react";
import type { NotionConfig } from "@/lib/notion-config";
import { Modal } from "./ui";

type NotionSettingsModalProps = {
  onClose: () => void;
  onSave: (config: NotionConfig) => void;
  initialConfig: NotionConfig | null;
};

export function NotionSettingsModal({ onClose, onSave, initialConfig }: NotionSettingsModalProps) {
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? "");
  const [projectsDbId, setProjectsDbId] = useState(initialConfig?.projectsDbId ?? "");
  const [tasksDbId, setTasksDbId] = useState(initialConfig?.tasksDbId ?? "");

  const canSave = apiKey.trim().length > 0 && projectsDbId.trim().length > 0 && tasksDbId.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ apiKey: apiKey.trim(), projectsDbId: projectsDbId.trim(), tasksDbId: tasksDbId.trim() });
  };

  return (
    <Modal title="Notion 设置" onClose={onClose}>
      <div className="space-y-4">
        <label className="space-y-1">
          <span className="block text-xs text-zinc-400">Notion API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="ntn_xxxxxxxxxxxxx"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-600"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs text-zinc-400">Projects 数据库 ID</span>
          <input
            type="text"
            value={projectsDbId}
            onChange={(e) => setProjectsDbId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-600"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs text-zinc-400">Tasks 数据库 ID</span>
          <input
            type="text"
            value={tasksDbId}
            onChange={(e) => setTasksDbId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-zinc-600"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          保存
        </button>
      </div>
    </Modal>
  );
}
