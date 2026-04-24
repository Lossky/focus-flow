"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FocusFlowProvider } from "@/contexts/focus-flow-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { enterCornerWindowMode, exitCornerWindowMode } from "@/lib/window-controls";
import { AlwaysOnTopToggle } from "@/components/focus-flow/always-on-top-toggle";
import { BouncingQuote } from "@/components/focus-flow/bouncing-quote";
import { CornerMiniWindow } from "@/components/focus-flow/corner-mini-window";
import { EditItemModal } from "@/components/focus-flow/edit-item-modal";
import { FloatingPomodoro } from "@/components/focus-flow/floating-pomodoro";
import { FocusSession } from "@/components/focus-flow/focus-session";
import {
  CompletedHistoryModal,
  ProjectManagementModal,
  ProjectSummaryModal,
  ReportModal,
  RestReminderPanel,
  TagManagementModal,
} from "@/components/focus-flow/management-modals";
import { QuickCapture } from "@/components/focus-flow/quick-capture";
import { FlowView, ProjectOverview, type FlowSection } from "@/components/focus-flow/task-views";
import { TodayMainline } from "@/components/focus-flow/today-mainline";
import { ToolbarMenu } from "@/components/focus-flow/toolbar-menu";
import {
  type Item,
  type ToastState,
  type ViewMode,
} from "@/lib/focus-flow-model";
import { useItems } from "@/hooks/use-items";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useDataActions } from "@/hooks/use-data-actions";

// ---------------------------------------------------------------------------
// Motivation quotes
// ---------------------------------------------------------------------------

const MOTIVATION_QUOTES = [
  { zh: "未经审视的人生不值得过。", en: "The unexamined life is not worth living.", author: "苏格拉底" },
  { zh: "知人者智，自知者明。", en: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "老子" },
  { zh: "我思故我在。", en: "I think, therefore I am.", author: "笛卡尔" },
  { zh: "他人即地狱。", en: "Hell is other people.", author: "萨特" },
  { zh: "人是生而自由的，却无往不在枷锁之中。", en: "Man is born free, and everywhere he is in chains.", author: "卢梭" },
  { zh: "凡不能毁灭我的，必使我更强大。", en: "What does not kill me makes me stronger.", author: "尼采" },
  { zh: "世界上只有一种英雄主义，就是认清生活的真相后依然热爱它。", en: "There is only one heroism: to see the world as it is, and to love it.", author: "罗曼·罗兰" },
  { zh: "人不是因为没有信念而失败，而是因为不能把信念化成行动。", en: "People fail not because they lack belief, but because they cannot turn belief into action.", author: "巴巴拉·格雷斯" },
  { zh: "吾生也有涯，而知也无涯。", en: "Life is finite, but knowledge is infinite.", author: "庄子" },
  { zh: "天行健，君子以自强不息。", en: "As heaven maintains vigor through movements, a gentleman should constantly strive for self-perfection.", author: "《周易》" },
  { zh: "千里之行，始于足下。", en: "A journey of a thousand miles begins with a single step.", author: "老子" },
  { zh: "学而不思则罔，思而不学则殆。", en: "Learning without thought is labor lost; thought without learning is perilous.", author: "孔子" },
  { zh: "真正的智慧是知道自己的无知。", en: "True wisdom is in knowing you know nothing.", author: "苏格拉底" },
  { zh: "不要去追一匹马，用追马的时间种草。", en: "Do not chase a horse; spend that time planting grass.", author: "谚语" },
  { zh: "你无法在回顾中连接点滴，只能在展望中连接它们。", en: "You can't connect the dots looking forward; you can only connect them looking backwards.", author: "乔布斯" },
  { zh: "简单是终极的复杂。", en: "Simplicity is the ultimate sophistication.", author: "达·芬奇" },
  { zh: "行动是治愈恐惧的良药。", en: "Action is the foundational key to all success.", author: "毕加索" },
  { zh: "把每一天当作生命的最后一天来过。", en: "Live each day as if it were your last.", author: "马可·奥勒留" },
  { zh: "完成比完美更重要。", en: "Done is better than perfect.", author: "谢丽尔·桑德伯格" },
  { zh: "专注意味着对一千件好事说不。", en: "Focus means saying no to a thousand good things.", author: "乔布斯" },
];

const COLLAPSED_TASK_IDS_KEY = "focus-flow-collapsed-task-ids-v2";
const APP_VERSION = "0.1.9";

const SECTIONS: FlowSection[] = [
  { key: "inbox", title: "Inbox 分流台", hint: "所有新输入先在这里判断，不急着做。" },
  { key: "today", title: "Today 主线", hint: "今天真正要推进的事情，尽量控制在 1 到 3 个。" },
  { key: "review", title: "Review 待审区", hint: "AI 草稿、纪要摘要、方案初稿都先放这里。" },
  { key: "batch", title: "Batch 批处理", hint: "不需要实时响应，但值得集中处理。" },
];

// ---------------------------------------------------------------------------
// Home component
// ---------------------------------------------------------------------------

export default function Home() {
  // --- UI state ---
  const [searchText, setSearchText] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("flow");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(() => new Date().getDate() % MOTIVATION_QUOTES.length);
  const [showQuote, setShowQuote] = useState(true);
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(COLLAPSED_TASK_IDS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string");
      }
    } catch {}
    return [];
  });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, text: "" });
  const [isCornerMode, setIsCornerMode] = useState(false);

  // --- Refs ---
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLTextAreaElement | null>(null);

  // --- Data hook ---
  const {
    items,
    projects,
    tags,
    savedReports,
    setSavedReports,
    sessionStats,
    setSessionStats,
    storageMode,
    backupEntries,
    getProjectById,
    getTagDef,
    addItems: addItemsHook,
    moveItem: moveItemHook,
    toggleMainline: toggleMainlineHook,
    removeItem: removeItemHook,
    changeItemProject: changeItemProjectHook,
    updateItemTags: updateItemTagsHook,
    saveItemEdit: saveItemEditHook,
    addProject: addProjectHook,
    deleteProject: deleteProjectHook,
    addTag: addTagHook,
    deleteTag: deleteTagHook,
    createDiskBackup: createDiskBackupHook,
    setCustomDataDirectory: setCustomDataDirectoryHook,
    restoreDefaultDataDirectory: restoreDefaultDataDirectoryHook,
    restoreBackup: restoreBackupHook,
    importData: importDataHook,
    resetAllData: resetAllDataHook,
    createCurrentSnapshot,
  } = useItems();

  // --- Pomodoro hook ---
  const getTaskLabel = useCallback(
    (taskId: string) => items.find((i) => i.id === taskId)?.content,
    [items],
  );

  const onFocusComplete = useCallback(
    () => {
      setSessionStats((prev) => ({
        ...prev,
        focusCount: prev.focusCount + 1,
        lastFocusAt: new Date().toISOString(),
      }));
    },
    [setSessionStats],
  );

  const {
    pomodoro,
    showRestReminder,
    restReminderTask,
    startPomodoro,
    stopPomodoro,
    resetPomodoro,
    acknowledgeRest,
    dismissRest,
  } = usePomodoro({ onFocusComplete, getTaskLabel });

  // --- Computed values ---
  const counts = useMemo(() => {
    const open = items.filter((i) => i.status !== "done" && i.status !== "archived");
    return {
      inbox: items.filter((i) => i.status === "inbox").length,
      today: items.filter((i) => i.status === "today").length,
      review: items.filter((i) => i.status === "review").length,
      batch: items.filter((i) => i.status === "batch").length,
      mainline: open.filter((i) => i.isMainline).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items.filter((i) => i.status !== "done" && i.status !== "archived");
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (i) =>
          i.content.toLowerCase().includes(q) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (getProjectById(i.projectId)?.name || "").toLowerCase().includes(q),
      );
    }
    if (filterTag !== "all") {
      result = result.filter((i) => (i.tags || []).includes(filterTag));
    }
    return result;
  }, [items, searchText, filterTag, getProjectById]);

  const allUsedTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => (i.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const todayLoadWarning = useMemo(() => {
    const todayCount = items.filter((i) => i.status === "today").length;
    if (todayCount > 5) return `Today 已有 ${todayCount} 条，建议精简到 1-3 条主线任务。`;
    if (todayCount > 3) return `Today 有 ${todayCount} 条，留意是否都需要今天推进。`;
    return "";
  }, [items]);

  const cornerTodayItems = useMemo(
    () => items.filter((i) => i.status === "today"),
    [items],
  );

  const completedHistoryItems = useMemo(
    () =>
      items
        .filter((i) => i.status === "done" || i.status === "archived")
        .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()),
    [items],
  );

  const projectSummary = useMemo(() => {
    return projects.map((project) => {
      const projectItems = items.filter((i) => (i.projectId || "default") === project.id);
      const done = projectItems.filter((i) => i.status === "done" || i.status === "archived").length;
      return { project, total: projectItems.length, done, undone: projectItems.length - done, items: projectItems };
    });
  }, [items, projects]);

  const dailyReport = useMemo(() => {
    const today = items.filter((i) => i.status === "today");
    const done = items.filter((i) => i.status === "done");
    const mainline = items.filter((i) => i.isMainline && i.status !== "done" && i.status !== "archived");
    const lines: string[] = [
      `# 日报 ${new Date().toLocaleDateString("zh-CN")}`,
      "",
      `## 今日主线 (${mainline.length})`,
      ...mainline.map((i) => `- ${i.content}`),
      "",
      `## Today (${today.length})`,
      ...today.map((i) => `- ${i.content}`),
      "",
      `## 已完成 (${done.length})`,
      ...done.map((i) => `- ${i.content}`),
      "",
      `## 专注统计`,
      `- 番茄钟完成：${sessionStats.focusCount} 次`,
      `- 休息次数：${sessionStats.restCount} 次`,
    ];
    return lines.join("\n");
  }, [items, sessionStats]);

  const focusItem = useMemo(
    () => (pomodoro.taskId ? items.find((item) => item.id === pomodoro.taskId) : undefined),
    [items, pomodoro.taskId],
  );
  const isFocusMode = pomodoro.running;
  const activePomodoroTaskId = isFocusMode ? pomodoro.taskId : undefined;
  const isTaskFocusMode = isFocusMode && !!activePomodoroTaskId;
  const focusProject = focusItem ? getProjectById(focusItem.projectId) : undefined;
  const activeQuote = MOTIVATION_QUOTES[quoteIndex];

  // --- Effects ---
  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => setToast({ show: false, text: "" }), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const focusCapture = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        captureInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusCapture);
    return () => window.removeEventListener("keydown", focusCapture);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_TASK_IDS_KEY, JSON.stringify(collapsedTaskIds));
    } catch {}
  }, [collapsedTaskIds]);

  // --- Handlers ---
  const showToast = (text: string) => setToast({ show: true, text });

  // --- Data actions hook ---
  const dataActions = useDataActions(
    {
      createCurrentSnapshot,
      createDiskBackup: createDiskBackupHook,
      setCustomDataDirectory: setCustomDataDirectoryHook,
      restoreDefaultDataDirectory: restoreDefaultDataDirectoryHook,
      restoreBackup: restoreBackupHook,
      importData: importDataHook,
      resetAllData: resetAllDataHook,
    },
    showToast,
  );

  const toggleCollapsedTask = useCallback((id: string) => {
    setCollapsedTaskIds((prev) => (prev.includes(id) ? prev.filter((taskId) => taskId !== id) : [...prev, id]));
  }, []);

  const addFocusCaptureItems = useCallback((value: string, projectId: string) => {
    const { parsedTasks, next } = addItemsHook(value, {
      source: "manual",
      priority: "medium",
      projectId,
      dueDate: undefined,
      tags: [],
      repeatType: "none",
      statusOverride: "inbox",
    });
    if (parsedTasks.some((task) => task.parentIndex !== undefined || task.depth > 0)) {
      showToast(`已记下 ${next.length} 条多级任务，稍后去 Inbox 分流`);
      return;
    }
    showToast(`已记下 ${next.length} 条任务，稍后去 Inbox 处理`);
  }, [addItemsHook]);

  const addProject = () => {
    if (!newProjectName.trim()) return;
    addProjectHook(newProjectName.trim());
    setNewProjectName("");
    showToast("项目已创建");
  };

  const deleteProject = (projectId: string) => {
    if (!confirm("确认删除这个项目？该项目下任务会回到默认项目。")) return;
    deleteProjectHook(projectId);
    showToast("项目已删除");
  };

  const addTag = (name: string) => {
    const clean = addTagHook(name);
    if (!clean) return undefined;
    return clean;
  };

  const deleteTag = (tagName: string) => {
    if (!confirm("确认删除这个标签？任务上的该标签会一并移除。")) return;
    deleteTagHook(tagName);
    showToast("标签已删除");
  };

  const updateItemTags = updateItemTagsHook;

  const saveItemEdit = (updatedItem: Item) => {
    saveItemEditHook(updatedItem);
    setEditingItem(null);
    showToast("任务已保存");
  };

  const moveItem = moveItemHook;
  const toggleMainline = toggleMainlineHook;

  const removeItem = useCallback((id: string) => {
    if (!confirm("确认删除这条任务？")) return;
    removeItemHook(id);
    showToast("任务已删除");
  }, [removeItemHook]);

  const changeItemProject = changeItemProjectHook;

  // --- Pomodoro handlers (from hook) ---
  function acknowledgeRestReminder() {
    setSessionStats((prev) => ({
      ...prev,
      restCount: prev.restCount + 1,
      lastRestAt: new Date().toISOString(),
    }));
    acknowledgeRest();
    showToast("记下休息次数了");
  }

  function dismissRestReminder() {
    dismissRest();
  }

  const completeFocusItem = () => {
    if (!focusItem) return;
    moveItem(focusItem.id, "done");
    resetPomodoro();
  };

  // --- Window modes ---
  async function enterCornerMode() {
    const result = await enterCornerWindowMode();
    if (result === false) {
      showToast("角落模式切换失败");
      return;
    }
    setIsCornerMode(true);
    showToast(result ? "已缩到角落并置顶" : "已切换角落小窗");
  }

  async function exitCornerMode() {
    const result = await exitCornerWindowMode();
    if (result === false) {
      showToast("窗口恢复失败");
      return;
    }
    setIsCornerMode(false);
    showToast(result ? "已展开窗口" : "已退出角落小窗");
  }

  // --- Report ---
  async function copyDailyReport() {
    try {
      await navigator.clipboard.writeText(dailyReport);
      showToast("日报已复制");
    } catch {}
  }

  function saveDailyReport() {
    const date = new Date().toLocaleDateString("zh-CN");
    setSavedReports((prev) => [{ date, content: dailyReport }, ...prev.filter((r) => r.date !== date)]);
    showToast("日报已保存");
  }

  // --- Context value ---
  const ctxValue = useMemo(
    () => ({
      projects,
      tags,
      getProjectById,
      getTagDef,
      moveItem,
      removeItem,
      toggleMainline,
      changeItemProject,
      updateItemTags,
      startPomodoro,
      openEdit: setEditingItem,
    }),
    [projects, tags, getProjectById, getTagDef, moveItem, removeItem, toggleMainline, changeItemProject, updateItemTags, startPomodoro],
  );

  // --- Corner mode render ---
  if (isCornerMode) {
    return (
      <div className="min-h-screen text-zinc-50">
        {toast.show && (
          <div className="animate-toast-in fixed right-3 top-3 z-[60] flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            {toast.text}
          </div>
        )}
        <CornerMiniWindow
          pomodoro={pomodoro}
          focusItem={focusItem}
          todayItems={cornerTodayItems}
          getProjectById={getProjectById}
          onExit={() => void exitCornerMode()}
          onStartPomodoro={startPomodoro}
          onStopPomodoro={stopPomodoro}
          onResetPomodoro={resetPomodoro}
          collapsedTaskIds={collapsedTaskIds}
          toggleCollapsedTask={toggleCollapsedTask}
        />
        {showRestReminder && (
          <RestReminderPanel taskContent={restReminderTask} onTakeRest={acknowledgeRestReminder} onDismiss={dismissRestReminder} />
        )}
      </div>
    );
  }

  // --- Main render ---
  return (
    <FocusFlowProvider value={ctxValue}>
    <div className="min-h-screen text-zinc-50">
      {/* Toast */}
      {toast.show && (
        <div className="animate-toast-in fixed right-6 top-16 z-[60] flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 text-sm text-zinc-100 shadow-2xl backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          {toast.text}
        </div>
      )}

      {/* Floating bouncing quote card */}
      {showQuote && (
        <BouncingQuote quote={activeQuote} onClose={() => setShowQuote(false)} />
      )}

      {/* ===== Compact Top Bar ===== */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-2.5 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-teal-100">Focus Flow</h1>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] tabular-nums text-zinc-500">v{APP_VERSION}</span>
          </div>

          {/* Search — grows to fill */}
          <div className="relative min-w-0 flex-1">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜索任务 / 项目 / 标签 ⌘K"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs outline-none transition placeholder:text-zinc-500 focus:border-teal-300/50 focus:bg-white/[0.06]"
            />
          </div>

          {/* Inline stats */}
          <div className="hidden items-center gap-1 text-[11px] tabular-nums text-zinc-400 md:flex">
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Inbox <strong className="text-zinc-200">{counts.inbox}</strong></span>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Today <strong className="text-amber-200">{counts.today}</strong></span>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Review <strong className="text-zinc-200">{counts.review}</strong></span>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Batch <strong className="text-zinc-200">{counts.batch}</strong></span>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5">主线 <strong className="text-amber-200">{counts.mainline}</strong></span>
          </div>

          {/* Pomodoro inline */}
          <FloatingPomodoro pomodoro={pomodoro} focusItem={focusItem} startPomodoro={() => startPomodoro()} stopPomodoro={stopPomodoro} resetPomodoro={resetPomodoro} />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {storageMode === "disk" ? (
              <span className="hidden rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 sm:inline">磁盘</span>
            ) : storageMode === "local" ? (
              <span className="hidden rounded-full border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 sm:inline">浏览器</span>
            ) : null}
            <AlwaysOnTopToggle onStatus={showToast} />
            {!showQuote && (
              <button
                onClick={() => setShowQuote(true)}
                className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-1 text-[10px] text-teal-200 transition hover:bg-teal-500/20"
              >
                名言
              </button>
            )}
            <button
              onClick={() => void enterCornerMode()}
              className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-100 transition hover:bg-amber-400/15"
            >
              小窗
            </button>
          </div>
        </div>

        {/* Tag filter + toolbar row */}
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 pb-2 sm:px-6">
          {/* Tags */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFilterTag("all")} className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${filterTag === "all" ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>全部</button>
            {allUsedTags.map((tag) => (
              <button key={tag} onClick={() => setFilterTag(tag)} className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${filterTag === tag ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>#{tag}</button>
            ))}
          </div>
          <span className="mx-1 h-3 w-px shrink-0 bg-zinc-700" />
          {/* Toolbar menu */}
          <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => dataActions.importData(event.target.files?.[0])} />
          <ToolbarMenu
            backupEntries={backupEntries}
            onShowReport={() => setActiveModal("report")}
            onShowProject={() => setActiveModal("project")}
            onShowTag={() => setActiveModal("tag")}
            onShowHistory={() => setActiveModal("history")}
            onShowSummary={() => setActiveModal("summary")}
            onExport={dataActions.exportData}
            onImportClick={() => importInputRef.current?.click()}
            onBackup={() => dataActions.createDiskBackup()}
            onCopyPath={() => dataActions.copyDataPath()}
            onChooseDir={() => dataActions.chooseDataDir()}
            onRestoreDefault={() => dataActions.restoreDefaultDataDir()}
            onRestoreBackup={dataActions.restoreDiskBackup}
            onReset={dataActions.resetAllData}
          />
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-5 pb-7 pt-5 sm:px-6">

        {/* Focus mode */}
        {isFocusMode && (
          <FocusSession
            pomodoro={pomodoro}
            focusItem={focusItem}
            focusProject={focusProject}
            selectedProject={focusItem?.projectId || "default"}
            stopPomodoro={stopPomodoro}
            resetPomodoro={resetPomodoro}
            completeFocusItem={completeFocusItem}
            addFocusCaptureItems={addFocusCaptureItems}
          />
        )}

        {/* Normal mode content */}
        <ErrorBoundary>
        <div className={isFocusMode ? "hidden" : "contents"}>

          {/* Row 1: Today mainline (big, left) + Quick capture (compact, right) */}
          <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.65fr)]">
            <TodayMainline
              items={filteredItems}
              todayLoadWarning={todayLoadWarning}
              moveItem={moveItem}
              activePomodoroTaskId={activePomodoroTaskId}
              isFocusMode={isTaskFocusMode}
              collapsedTaskIds={collapsedTaskIds}
              toggleCollapsedTask={toggleCollapsedTask}
            />
            <QuickCapture
              projects={projects}
              tags={tags}
              addItemsHook={addItemsHook}
              addTagHook={addTagHook}
              textareaRef={captureInputRef}
              showToast={showToast}
            />
          </section>

          {/* Row 2: Tab switcher + content */}
          <section>
            <div className="mb-4 flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 w-fit">
              <button
                onClick={() => setViewMode("flow")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${viewMode === "flow" ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                分流处理
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${viewMode === "board" ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                项目总览
              </button>
            </div>

            {viewMode === "flow" ? (
              <FlowView
                items={filteredItems}
                sections={SECTIONS}
                moveItem={moveItem}
                activePomodoroTaskId={activePomodoroTaskId}
                isFocusMode={isTaskFocusMode}
                collapsedTaskIds={collapsedTaskIds}
                toggleCollapsedTask={toggleCollapsedTask}
              />
            ) : (
              <ProjectOverview items={items} projects={projects} />
            )}
          </section>

        </div>
        </ErrorBoundary>
      </main>

      {/* Modals */}
      {activeModal === "project" && (
        <ProjectManagementModal
          projects={projects}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          addProject={addProject}
          deleteProject={deleteProject}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "tag" && (
        <TagManagementModal
          tags={tags}
          newTagName={newTagName}
          setNewTagName={setNewTagName}
          addTag={addTag}
          deleteTag={deleteTag}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "summary" && <ProjectSummaryModal projectSummary={projectSummary} onClose={() => setActiveModal(null)} />}
      {activeModal === "report" && (
        <ReportModal
          dailyReport={dailyReport}
          savedReports={savedReports}
          saveDailyReport={saveDailyReport}
          copyDailyReport={copyDailyReport}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "history" && (
        <CompletedHistoryModal
          completedHistoryItems={completedHistoryItems}
          getProjectById={getProjectById}
          onClose={() => setActiveModal(null)}
        />
      )}
      {showRestReminder && (
        <RestReminderPanel taskContent={restReminderTask} onTakeRest={acknowledgeRestReminder} onDismiss={dismissRestReminder} />
      )}
      {editingItem && (
        <EditItemModal item={editingItem} projects={projects} tags={tags} onClose={() => setEditingItem(null)} onSave={saveItemEdit} />
      )}
    </div>
    </FocusFlowProvider>
  );
}
