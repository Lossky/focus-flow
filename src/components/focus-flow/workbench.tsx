import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ViewMode } from "@/lib/focus-flow-model";
import type { BackupEntry } from "@/lib/persistence";

type WorkbenchProps = {
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  importInputRef: RefObject<HTMLInputElement | null>;
  importData: (file?: File) => void;
  setShowReportModal: Dispatch<SetStateAction<boolean>>;
  setShowSummaryModal: Dispatch<SetStateAction<boolean>>;
  setShowTagModal: Dispatch<SetStateAction<boolean>>;
  setShowProjectModal: Dispatch<SetStateAction<boolean>>;
  setShowHistoryModal: Dispatch<SetStateAction<boolean>>;
  exportData: () => void;
  resetAllData: () => void;
  createDiskBackup: () => void;
  copyDataPath: () => void;
  chooseDataDir: () => void;
  restoreDefaultDataDir: () => void;
  backupEntries: BackupEntry[];
  refreshBackups: () => void;
  restoreDiskBackup: (path: string) => void;
};

export function Workbench({
  viewMode,
  setViewMode,
  importInputRef,
  importData,
  setShowReportModal,
  setShowSummaryModal,
  setShowTagModal,
  setShowProjectModal,
  setShowHistoryModal,
  exportData,
  resetAllData,
  createDiskBackup,
  copyDataPath,
  chooseDataDir,
  restoreDefaultDataDir,
  backupEntries,
  refreshBackups,
  restoreDiskBackup,
}: WorkbenchProps) {
  const btn = "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10";

  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 shadow-xl shadow-black/10 backdrop-blur">
      <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importData(event.target.files?.[0])} />

      {/* All actions in one row */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-xs uppercase tracking-[0.22em] text-zinc-500">工具箱</p>
        <button onClick={() => setViewMode(viewMode === "flow" ? "board" : "flow")} className={btn}>
          {viewMode === "flow" ? "看板视图" : "流程视图"}
        </button>
        <button onClick={() => setShowReportModal(true)} className={btn}>日报</button>
        <button onClick={() => setShowSummaryModal(true)} className={btn}>项目汇总</button>
        <button onClick={() => setShowTagModal(true)} className={btn}>标签</button>
        <button onClick={() => setShowProjectModal(true)} className={btn}>项目</button>
        <button onClick={() => setShowHistoryModal(true)} className={btn}>历史</button>
        <button onClick={exportData} className={btn}>导出</button>
        <button onClick={() => importInputRef.current?.click()} className={btn}>导入</button>
        <button onClick={createDiskBackup} className="rounded-lg border border-emerald-800 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-950/40">磁盘备份</button>
        <button onClick={copyDataPath} className={btn}>数据位置</button>
        <button onClick={chooseDataDir} className="rounded-lg border border-sky-800 px-3 py-1.5 text-xs text-sky-300 transition hover:bg-sky-950/40">数据目录</button>
        <button onClick={restoreDefaultDataDir} className={btn}>恢复默认</button>
        <button onClick={resetAllData} className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">重置</button>
      </div>

      {/* Backup list */}
      {backupEntries.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-medium text-zinc-300">最近备份</h3>
            <button onClick={refreshBackups} className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800">刷新</button>
          </div>
          <div className="mt-2 space-y-1.5">
            {backupEntries.slice(0, 5).map((backup) => (
              <div key={backup.path} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-200">{backup.createdAt ? new Date(backup.createdAt).toLocaleString("zh-CN") : backup.name}</p>
                  <p className="truncate text-[11px] text-zinc-500">{backup.reason}</p>
                </div>
                <button onClick={() => restoreDiskBackup(backup.path)} className="shrink-0 rounded-lg border border-amber-700 px-2.5 py-1 text-[11px] text-amber-200 hover:bg-amber-950/40">恢复</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
