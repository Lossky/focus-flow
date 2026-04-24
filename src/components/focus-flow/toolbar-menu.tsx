"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BackupEntry } from "@/lib/persistence";

type ToolbarMenuProps = {
  backupEntries: BackupEntry[];
  onShowReport: () => void;
  onShowProject: () => void;
  onShowTag: () => void;
  onShowHistory: () => void;
  onShowSummary: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onBackup: () => void;
  onCopyPath: () => void;
  onChooseDir: () => void;
  onRestoreDefault: () => void;
  onRestoreBackup: (path: string) => void;
  onReset: () => void;
};

type MenuGroup = {
  label: string;
  items: { label: string; onClick: () => void; tone?: "default" | "green" | "amber" | "red" }[];
};

export function ToolbarMenu({
  backupEntries,
  onShowReport,
  onShowProject,
  onShowTag,
  onShowHistory,
  onShowSummary,
  onExport,
  onImportClick,
  onBackup,
  onCopyPath,
  onChooseDir,
  onRestoreDefault,
  onRestoreBackup,
  onReset,
}: ToolbarMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const menuW = 220;
      setPos({
        top: r.bottom + 4,
        left: Math.max(8, Math.min(r.right - menuW, window.innerWidth - menuW - 8)),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const close = () => setOpen(false);

  const groups: MenuGroup[] = [
    {
      label: "查看",
      items: [
        { label: "日报", onClick: onShowReport },
        { label: "项目管理", onClick: onShowProject },
        { label: "标签管理", onClick: onShowTag },
        { label: "完成历史", onClick: onShowHistory },
        { label: "项目汇总", onClick: onShowSummary },
      ],
    },
    {
      label: "数据",
      items: [
        { label: "导出备份", onClick: onExport },
        { label: "导入备份", onClick: onImportClick },
        { label: "创建磁盘备份", onClick: onBackup, tone: "green" },
        ...(backupEntries.length > 0
          ? [{ label: "恢复最近备份", onClick: () => onRestoreBackup(backupEntries[0].path), tone: "amber" as const }]
          : []),
      ],
    },
    {
      label: "设置",
      items: [
        { label: "复制数据路径", onClick: onCopyPath },
        { label: "选择数据目录", onClick: onChooseDir },
        { label: "恢复默认目录", onClick: onRestoreDefault },
        { label: "重置所有数据", onClick: onReset, tone: "red" },
      ],
    },
  ];

  const toneClass = {
    default: "text-zinc-300 hover:bg-white/10 hover:text-zinc-100",
    green: "text-emerald-300 hover:bg-emerald-950/40",
    amber: "text-amber-300 hover:bg-amber-950/40",
    red: "text-red-400 hover:bg-red-950/40",
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((p) => !p)}
        className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] transition ${open ? "border-white/20 bg-white/10 text-zinc-100" : "border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"}`}
      >
        <span className="flex items-center gap-1">
          工具箱
          <svg className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </span>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={close} />
          <div
            className="fixed z-[999] w-[220px] rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl"
            style={{ top: pos.top, left: pos.left }}
          >
            {groups.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="mx-2 my-1 h-px bg-zinc-800" />}
                <p className="px-2.5 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { close(); item.onClick(); }}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition ${toneClass[item.tone || "default"]}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
