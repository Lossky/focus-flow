import type { Dispatch, RefObject, SetStateAction } from "react";
import { formatSeconds, type PomodoroState, type StorageMode, type ViewMode } from "@/lib/focus-flow-model";

type WorkbenchProps = {
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  importInputRef: RefObject<HTMLInputElement | null>;
  importData: (file?: File) => void;
  setShowReportModal: Dispatch<SetStateAction<boolean>>;
  setShowSummaryModal: Dispatch<SetStateAction<boolean>>;
  setShowTagModal: Dispatch<SetStateAction<boolean>>;
  setShowProjectModal: Dispatch<SetStateAction<boolean>>;
  exportData: () => void;
  resetAllData: () => void;
  pomodoro: PomodoroState;
  startPomodoro: (taskId?: string) => void;
  stopPomodoro: () => void;
  resetPomodoro: () => void;
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
  exportData,
  resetAllData,
  pomodoro,
  startPomodoro,
  stopPomodoro,
  resetPomodoro,
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
}: WorkbenchProps) {
  const storageLabel = storageMode === "disk" ? "磁盘存储正常" : storageMode === "local" ? "浏览器存储兜底" : "存储加载中";
  const storageTone = storageMode === "disk" ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200" : storageMode === "local" ? "border-amber-500/30 bg-amber-950/20 text-amber-200" : "border-zinc-800 bg-zinc-950/40 text-zinc-400";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold">工作台</h2>
          <p className="mt-1 text-sm text-zinc-400">搜索和视图放外面，其它维护工具默认收起。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importData(event.target.files?.[0])} />
          <button onClick={() => setViewMode(viewMode === "flow" ? "board" : "flow")} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
            {viewMode === "flow" ? "看板视图" : "流程视图"}
          </button>
        </div>
      </div>
      <details className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <summary className="cursor-pointer list-none text-sm text-zinc-300">
          <div className="flex items-center justify-between gap-3">
            <span>工具箱：日报 / 项目 / 标签 / 备份</span>
            <span className="text-xs text-zinc-500">点击展开</span>
          </div>
        </summary>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <button onClick={() => setShowReportModal(true)} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">今日日报</button>
          <button onClick={() => setShowSummaryModal(true)} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">项目汇总</button>
          <button onClick={() => setShowTagModal(true)} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">标签管理</button>
          <button onClick={() => setShowProjectModal(true)} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">管理项目</button>
          <button onClick={exportData} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">导出备份</button>
          <button onClick={createDiskBackup} className="rounded-xl border border-emerald-800 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-950/40">创建磁盘备份</button>
          <button onClick={copyDataPath} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">复制数据位置</button>
          <button onClick={chooseDataDir} className="rounded-xl border border-sky-800 px-3 py-2 text-sm text-sky-300 hover:bg-sky-950/40">选择数据目录</button>
          <button onClick={restoreDefaultDataDir} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">恢复默认目录</button>
          <button onClick={() => importInputRef.current?.click()} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">导入备份</button>
          <button onClick={resetAllData} className="rounded-xl border border-red-900 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40">重置数据</button>
        </div>
      </details>
      <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${storageTone}`}>
        <div className="font-medium">{storageLabel}</div>
        <p className="mt-1 text-xs opacity-80">导入、重置、切换目录前会先尝试创建备份；自定义目录建议放在用户目录或 iCloud Drive 下。</p>
      </div>
      <details className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
        <summary className="cursor-pointer list-none text-sm text-amber-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span>番茄钟</span>
              <span className="ml-3 text-xl font-semibold text-amber-100">{formatSeconds(pomodoro.secondsLeft)}</span>
            </div>
            <span className="text-xs text-amber-100/60">点击展开</span>
          </div>
        </summary>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/20 pt-4">
          <p className="text-sm text-amber-100/70">专注时再展开控制，平时保持工作台清爽。</p>
          <div className="flex gap-2">
            {!pomodoro.running ? (
              <button onClick={() => startPomodoro()} className="rounded-lg bg-amber-400 px-3 py-2 text-sm text-black">开始</button>
            ) : (
              <button onClick={stopPomodoro} className="rounded-lg border border-amber-500 px-3 py-2 text-sm text-amber-300">暂停</button>
            )}
            <button onClick={resetPomodoro} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300">重置</button>
          </div>
        </div>
      </details>
      <div className="space-y-4">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="搜索任务 / 项目 / 标签"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterTag("all")} className={`rounded-full border px-3 py-1 text-xs ${filterTag === "all" ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>全部标签</button>
          {allUsedTags.map((tag) => (
            <button key={tag} onClick={() => setFilterTag(tag)} className={`rounded-full border px-3 py-1 text-xs ${filterTag === tag ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>#{tag}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
