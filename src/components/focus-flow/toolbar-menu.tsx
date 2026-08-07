"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/contexts/i18n-context";
import { createPortal } from "react-dom";
import type { BackupEntry } from "@/lib/persistence";
import { useAnchoredMenu } from "@/hooks/use-anchored-menu";

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
  onShowNotionSettings?: () => void;
  onSyncProjects?: () => void;
  onSyncTasks?: () => void;
  onSyncObsidianCaptures?: () => void;
  isSyncingProjects?: boolean;
  isSyncingTasks?: boolean;
  isSyncingObsidian?: boolean;
  notionConfigComplete?: boolean;
};

type MenuGroup = {
  label: string;
  items: { label: string; onClick: () => void; tone?: "default" | "green" | "amber" | "red"; disabled?: boolean }[];
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
  onShowNotionSettings,
  onSyncProjects,
  onSyncTasks,
  onSyncObsidianCaptures,
  isSyncingProjects,
  isSyncingTasks,
  isSyncingObsidian,
  notionConfigComplete,
}: ToolbarMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuStyle = useAnchoredMenu(open, btnRef, { width: 220, gap: 4, align: "right", preferredHeight: 360 });

  const close = () => setOpen(false);

  const groups: MenuGroup[] = [
    {
      label: t("view"),
      items: [
        { label: t("report"), onClick: onShowReport },
        { label: t("projectManagement"), onClick: onShowProject },
        { label: t("tagManagement"), onClick: onShowTag },
        { label: t("completedHistory"), onClick: onShowHistory },
        { label: t("projectSummary"), onClick: onShowSummary },
      ],
    },
    {
      label: t("data"),
      items: [
        { label: t("exportBackup"), onClick: onExport },
        { label: t("importBackup"), onClick: onImportClick },
        { label: t("diskBackup"), onClick: onBackup, tone: "green" },
        { label: t("syncObsidian"), onClick: () => onSyncObsidianCaptures?.(), tone: "green", disabled: !onSyncObsidianCaptures || isSyncingObsidian },
        ...(backupEntries.length > 0
          ? [{ label: t("restoreRecentBackup"), onClick: () => onRestoreBackup(backupEntries[0].path), tone: "amber" as const }]
          : []),
      ],
    },
    {
      label: t("settings"),
      items: [
        { label: t("notionSettings"), onClick: () => onShowNotionSettings?.() },
        { label: t("syncProjects"), onClick: () => onSyncProjects?.(), tone: "green", disabled: !notionConfigComplete || isSyncingProjects },
        { label: t("syncTasks"), onClick: () => onSyncTasks?.(), tone: "green", disabled: !notionConfigComplete || isSyncingTasks },
        { label: t("copyDataPath"), onClick: onCopyPath },
        { label: t("chooseDataDirectory"), onClick: onChooseDir },
        { label: t("restoreDefaultDirectory"), onClick: onRestoreDefault },
        { label: t("resetAllData"), onClick: onReset, tone: "red" },
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
          {t("toolbox")}
          <svg className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
        </span>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={close} />
          <div
            className="z-[999] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl scrollbar-thin"
            style={menuStyle}
          >
            {groups.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="mx-2 my-1 h-px bg-zinc-800" />}
                <p className="px-2.5 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { if (!item.disabled) { close(); item.onClick(); } }}
                    disabled={item.disabled}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition ${toneClass[item.tone || "default"]} ${item.disabled ? "cursor-not-allowed opacity-40" : ""}`}
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
