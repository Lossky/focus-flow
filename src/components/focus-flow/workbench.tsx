import type { Dispatch, RefObject, SetStateAction } from "react";
import { type StorageMode, type ViewMode } from "@/lib/focus-flow-model";
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
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  filterTag: string;
  setFilterTag: Dispatch<SetStateAction<string>>;
  allUsedTags: string[];
  storageMode: StorageMode;
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
  searchText,
  setSearchText,
  filterTag,
  setFilterTag,
  allUsedTags,
  storageMode,
  createDiskBackup,
  copyDataPath,
  chooseDataDir,
  restoreDefaultDataDir,
  backupEntries,
  refreshBackups,
  restoreDiskBackup,
}: WorkbenchProps) {
  const storageLabel = storageMode === "disk" ? "磁盘存储正常" : storageMode === "local" ? "浏览器预览模式" : "存储加载中";
  const storageTone = storageMode === "disk" ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200" : storageMode === "local" ? "border-amber-500/30 bg-amber-950/20 text-amber-200" : "border-zinc-800 bg-zinc-950/40 text-zinc-400";
  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3 shadow-xl shadow-black/10 backdrop-blur">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Control</p>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] ${storageTone}`}>{storageLabel}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importData(event.target.files?.[0])} />
          <button onClick={() => setViewMode(viewMode === "flow" ? "board" : "flow")} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10">
            {viewMode === "flow" ? "看板视图" : "流程视图"}
          </button>
        </div>
      </div>
      <div className="mb-2 space-y-2">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="搜索任务 / 项目 / 标签"
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm outline-none transition placeholder:text-zinc-500 focus:border-teal-300/70"
        />
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilterTag("all")} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${filterTag === "all" ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>全部标签</button>
          {allUsedTags.map((tag) => (
            <button key={tag} onClick={() => setFilterTag(tag)} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${filterTag === tag ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>#{tag}</button>
          ))}
        </div>
      </div>
      <details className="rounded-xl border border-white/10 bg-black/15 p-2.5">
        <summary className="cursor-pointer list-none text-sm text-zinc-300">
          <div className="flex items-center justify-between gap-3">
            <span>工具箱：日报 / 项目 / 标签 / 备份</span>
            <span className="text-xs text-zinc-500">点击展开</span>
          </div>
        </summary>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <button onClick={() => setShowReportModal(true)} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">今日日报</button>
          <button onClick={() => setShowSummaryModal(true)} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">项目汇总</button>
          <button onClick={() => setShowTagModal(true)} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">标签管理</button>
          <button onClick={() => setShowProjectModal(true)} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">管理项目</button>
          <button onClick={() => setShowHistoryModal(true)} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">完成历史</button>
          <button onClick={exportData} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">导出备份</button>
          <button onClick={createDiskBackup} className="rounded-xl border border-emerald-800 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-950/40">创建磁盘备份</button>
          <button onClick={copyDataPath} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">复制数据位置</button>
          <button onClick={chooseDataDir} className="rounded-xl border border-sky-800 px-3 py-1.5 text-sm text-sky-300 hover:bg-sky-950/40">选择数据目录</button>
          <button onClick={restoreDefaultDataDir} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">恢复默认目录</button>
          <button onClick={() => importInputRef.current?.click()} className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">导入备份</button>
          <button onClick={resetAllData} className="rounded-xl border border-red-900 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40">重置数据</button>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">最近磁盘备份</h3>
              <p className="mt-1 text-xs text-zinc-500">恢复前会先自动备份当前数据，给我们留条退路。</p>
            </div>
            <button onClick={refreshBackups} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">刷新</button>
          </div>
          <div className="mt-3 space-y-2">
            {backupEntries.length ? backupEntries.slice(0, 5).map((backup) => (
              <div key={backup.path} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-200">{backup.createdAt ? new Date(backup.createdAt).toLocaleString("zh-CN") : backup.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">{backup.reason}</p>
                </div>
                <button onClick={() => restoreDiskBackup(backup.path)} className="rounded-lg border border-amber-700 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-950/40">恢复</button>
              </div>
            )) : (
              <p className="rounded-xl border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-500">还没有磁盘备份。先点“创建磁盘备份”，或在导入/重置/切换目录前自动生成。</p>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
