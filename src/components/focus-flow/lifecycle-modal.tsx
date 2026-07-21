"use client";

import { formatRelativeTime, formatTime, statusLabel, type Item, type ItemHistoryType } from "@/lib/focus-flow-model";

const TIMELINE_META: Record<ItemHistoryType, { label: string; color: string; dotClass: string; icon: string }> = {
  created: { label: "创建", color: "text-sky-300", dotClass: "bg-sky-400", icon: "＋" },
  status_changed: { label: "流转", color: "text-zinc-300", dotClass: "bg-zinc-400", icon: "→" },
  edited: { label: "编辑", color: "text-zinc-400", dotClass: "bg-zinc-500", icon: "✎" },
  completed: { label: "完成", color: "text-emerald-300", dotClass: "bg-emerald-400", icon: "✓" },
  archived: { label: "归档", color: "text-amber-300", dotClass: "bg-amber-400", icon: "▪" },
  merged: { label: "合并", color: "text-purple-300", dotClass: "bg-purple-400", icon: "⊕" },
};

type LifecycleModalProps = {
  item: Item;
  onClose: () => void;
};

export function LifecycleModal({ item, onClose }: LifecycleModalProps) {
  const history = item.history || [];
  const sorted = [...history].reverse();

  // 任务存在时长
  const createdDate = new Date(item.createdAt);
  const now = new Date();
  const ageDays = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / 86400000));
  const ageLabel = ageDays === 0 ? "今天创建" : `已存在 ${ageDays} 天`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="任务生命周期"
    >
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl outline-none scrollbar-thin">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">任务生命周期</h3>
          <button onClick={onClose} className="text-sm text-zinc-400 transition hover:text-zinc-200">关闭</button>
        </div>
      {/* 任务摘要 */}
      <div className="mb-4 rounded-xl border border-white/10 bg-zinc-950/80 p-4">
        <p className="text-sm font-medium text-zinc-100">{item.content}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
          <span>状态：<strong className="text-zinc-200">{statusLabel[item.status]}</strong></span>
          <span>{ageLabel}</span>
          <span>创建于 {formatTime(item.createdAt)}</span>
          {item.completedAt && <span className="text-emerald-400">完成于 {formatTime(item.completedAt)}</span>}
        </div>
      </div>

      {/* 时间线 */}
      {sorted.length > 0 ? (
        <div className="relative ml-3 border-l-2 border-white/10 pl-5">
          {sorted.map((entry, i) => {
            const meta = TIMELINE_META[entry.type] || TIMELINE_META.edited;
            return (
              <div key={`${entry.at}-${i}`} className="relative pb-5 last:pb-0">
                {/* 圆点 */}
                <span className={`absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-zinc-900 ${meta.dotClass} text-zinc-950`}>
                  {meta.icon}
                </span>
                {/* 内容 */}
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                    <span className="text-sm text-zinc-300">
                      {formatDescription(entry)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{formatRelativeTime(entry.at)}</span>
                    <span className="text-zinc-700">·</span>
                    <span>{formatTime(entry.at)}</span>
                  </div>
                  {entry.note && (
                    <p className="mt-1 rounded-md bg-white/[0.03] px-2 py-1 text-xs text-zinc-400">{entry.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950/40 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">暂无流转记录</p>
          <p className="mt-1 text-xs text-zinc-600">老任务可能未记录历史，后续操作会自动追踪</p>
        </div>
      )}
      </div>
    </div>
  );
}

function formatDescription(entry: { type: string; from?: string; to?: string; note?: string }): string {
  if (entry.type === "created") {
    return entry.to ? `进入 ${statusLabel[entry.to as keyof typeof statusLabel]}` : "";
  }
  if (entry.type === "status_changed" || entry.type === "completed" || entry.type === "archived") {
    const from = entry.from ? statusLabel[entry.from as keyof typeof statusLabel] : "";
    const to = entry.to ? statusLabel[entry.to as keyof typeof statusLabel] : "";
    if (from && to) return `${from} → ${to}`;
    if (to) return `→ ${to}`;
    return "";
  }
  if (entry.type === "merged") {
    return entry.note || "合并操作";
  }
  if (entry.type === "edited") {
    return "修改了任务内容";
  }
  return "";
}
