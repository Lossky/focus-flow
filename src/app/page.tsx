"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBackupSnapshotToDisk, getBackupDirPath, getDataFilePath, loadSnapshotFromDisk, resetDataDirToDefault, saveSnapshotToDisk, saveWidgetSnapshotToDisk, setCustomDataDir, type PersistedSnapshot } from "@/lib/persistence";
import { AlwaysOnTopToggle } from "@/components/focus-flow/always-on-top-toggle";
import { EditItemModal } from "@/components/focus-flow/edit-item-modal";
import { ProjectManagementModal, ProjectSummaryModal, ReportModal, TagManagementModal } from "@/components/focus-flow/management-modals";
import { QuickCapture } from "@/components/focus-flow/quick-capture";
import { BoardView, FlowView, type FlowSection } from "@/components/focus-flow/task-views";
import { TodayMainline } from "@/components/focus-flow/today-mainline";
import { StatCard } from "@/components/focus-flow/ui";
import { Workbench } from "@/components/focus-flow/workbench";
import {
  POMODORO_SECONDS,
  PROJECTS_KEY,
  REPORTS_KEY,
  STORAGE_KEY,
  TAGS_KEY,
  classifyInput,
  colors,
  createSeedItems,
  createWidgetSnapshot,
  defaultProjects,
  defaultTags,
  parseMultiTask,
  type DragState,
  type ExportPayload,
  type Item,
  type ItemSource,
  type ItemStatus,
  type PomodoroState,
  type Priority,
  type Project,
  type RepeatType,
  type StorageMode,
  type TagDef,
  type ToastState,
  type ViewMode,
} from "@/lib/focus-flow-model";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [tags, setTags] = useState<TagDef[]>(defaultTags);
  const [input, setInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [source, setSource] = useState<ItemSource>("manual");
  const [priority, setPriority] = useState<Priority>("medium");
  const [selectedProject, setSelectedProject] = useState("default");
  const [dueDate, setDueDate] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newQuickTag, setNewQuickTag] = useState("");
  const [repeatType, setRepeatType] = useState<RepeatType>("none");
  const [filterTag, setFilterTag] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("flow");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [savedReports, setSavedReports] = useState<{ date: string; content: string }[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [pomodoro, setPomodoro] = useState<PomodoroState>({ running: false, secondsLeft: POMODORO_SECONDS });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, text: "" });
  const [dragState, setDragState] = useState<DragState>({});
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode>("loading");

  useEffect(() => {
    const boot = async () => {
      const diskSnapshot = await loadSnapshotFromDisk();
      if (diskSnapshot?.items?.length) {
        setItems((diskSnapshot.items as Item[]).map((item) => ({ ...item, projectId: item.projectId || "default", tags: item.tags || [], repeatType: item.repeatType || "none" })));
        setProjects(diskSnapshot.projects?.length ? diskSnapshot.projects as Project[] : defaultProjects);
        setTags(diskSnapshot.tags?.length ? diskSnapshot.tags as TagDef[] : defaultTags);
        setSavedReports(diskSnapshot.reports?.length ? diskSnapshot.reports : []);
        setStorageMode("disk");
        return;
      }
      setStorageMode("local");
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems((JSON.parse(raw) as Item[]).map((item) => ({ ...item, projectId: item.projectId || "default", tags: item.tags || [], repeatType: item.repeatType || "none" })));
      else setItems(createSeedItems());

      const rawProjects = localStorage.getItem(PROJECTS_KEY);
      if (rawProjects) {
        const parsed = JSON.parse(rawProjects) as Project[];
        setProjects(parsed.find((p) => p.id === "default") ? parsed : [...defaultProjects, ...parsed]);
      }

      const rawTags = localStorage.getItem(TAGS_KEY);
      if (rawTags) setTags(JSON.parse(rawTags) as TagDef[]);

      const rawReports = localStorage.getItem(REPORTS_KEY);
      if (rawReports) setSavedReports(JSON.parse(rawReports) as { date: string; content: string }[]);
    };
    void boot();
  }, []);
  useEffect(() => { if (storageMode !== "loading" && items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items, storageMode]);
  useEffect(() => { if (storageMode !== "loading") localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); }, [projects, storageMode]);
  useEffect(() => { if (storageMode !== "loading") localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); }, [tags, storageMode]);
  useEffect(() => { if (storageMode !== "loading") localStorage.setItem(REPORTS_KEY, JSON.stringify(savedReports)); }, [savedReports, storageMode]);
  useEffect(() => {
    if (storageMode === "loading" || !items.length) return;
    const snapshot: PersistedSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      projects,
      tags,
      reports: savedReports,
    };
    void saveSnapshotToDisk(snapshot);
  }, [items, projects, tags, savedReports, storageMode]);
  useEffect(() => {
    if (storageMode === "loading") return;
    const widgetSnapshot = createWidgetSnapshot({ items, projects, storageMode });
    void saveWidgetSnapshotToDisk(widgetSnapshot);
  }, [items, projects, storageMode]);
  useEffect(() => {
    if (!pomodoro.running) return;
    const timer = setInterval(() => setPomodoro((prev) => prev.secondsLeft <= 1 ? { ...prev, running: false, secondsLeft: 0 } : { ...prev, secondsLeft: prev.secondsLeft - 1 }), 1000);
    return () => clearInterval(timer);
  }, [pomodoro.running]);
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

  const getProjectById = useCallback((id?: string) => projects.find((p) => p.id === id) || defaultProjects[0], [projects]);
  const getTagDef = (name: string) => tags.find((t) => t.name === name);

  const filteredItems = useMemo(() => {
    const byTag = filterTag === "all" ? items : items.filter((i) => (i.tags || []).includes(filterTag));
    const q = searchText.trim().toLowerCase();
    if (!q) return byTag;
    return byTag.filter((i) => {
      const hay = [i.content, getProjectById(i.projectId).name, ...(i.tags || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, filterTag, searchText, getProjectById]);
  const allUsedTags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags || []))), [items]);
  const counts = useMemo(() => ({
    inbox: filteredItems.filter((i) => i.status === "inbox").length,
    today: filteredItems.filter((i) => i.status === "today").length,
    review: filteredItems.filter((i) => i.status === "review").length,
    batch: filteredItems.filter((i) => i.status === "batch").length,
    mainline: filteredItems.filter((i) => i.isMainline && i.status !== "done" && i.status !== "archived").length,
  }), [filteredItems]);
  const todayLoadWarning = counts.today > 3 ? `Today 已有 ${counts.today} 条，建议收敛到 1-3 条主线。` : "";

  const projectSummary = useMemo(() => projects.map((project) => {
    const list = items.filter((i) => (i.projectId || "default") === project.id);
    return { project, total: list.length, done: list.filter((i) => i.status === "done" || i.status === "archived").length, undone: list.filter((i) => i.status !== "done" && i.status !== "archived").length, items: list };
  }).filter((x) => x.total > 0), [items, projects]);

  const dailyReport = useMemo(() => {
    const today = new Date();
    const sameDay = (v?: string) => !!v && new Date(v).toDateString() === today.toDateString();
    const added = items.filter((i) => sameDay(i.createdAt));
    const completed = items.filter((i) => sameDay(i.completedAt));
    const undone = items.filter((i) => i.status !== "done" && i.status !== "archived");
    const section = (status: ItemStatus) => undone.filter((i) => i.status === status);
    const projectStats = projects.map((p) => {
      const list = items.filter((i) => (i.projectId || "default") === p.id);
      const add = list.filter((i) => sameDay(i.createdAt)).length;
      const done = list.filter((i) => sameDay(i.completedAt)).length;
      const open = list.filter((i) => i.status !== "done" && i.status !== "archived").length;
      return { p, add, done, open };
    }).filter((x) => x.add || x.done || x.open);

    const lines: string[] = [];
    lines.push(`# Focus Flow 日报 - ${today.toLocaleDateString("zh-CN")}`);
    lines.push("", "## 1. 今日新增");
    if (!added.length) lines.push("- 无");
    added.forEach((i) => lines.push(`- [${getProjectById(i.projectId).name}] ${i.content}`));
    lines.push("", "## 2. 今日完成");
    if (!completed.length) lines.push("- 无");
    completed.forEach((i) => lines.push(`- [${getProjectById(i.projectId).name}] ${i.content}${i.result?.trim() ? `（结果：${i.result.trim()}）` : ""}`));
    lines.push("", "## 3. 当前未完成", "### Today 主线");
    const todayList = section("today");
    if (!todayList.length) lines.push("- 无");
    todayList.forEach((i) => lines.push(`- [${getProjectById(i.projectId).name}] ${i.content}`));
    lines.push("", "### Batch");
    const batchList = section("batch");
    if (!batchList.length) lines.push("- 无");
    batchList.forEach((i) => lines.push(`- [${getProjectById(i.projectId).name}] ${i.content}`));
    lines.push("", "### Review");
    const reviewList = section("review");
    if (!reviewList.length) lines.push("- 无");
    reviewList.forEach((i) => lines.push(`- [${getProjectById(i.projectId).name}] ${i.content}`));
    lines.push("", "## 4. 项目汇总", "| 项目 | 新增 | 完成 | 未完成 |", "|---|---:|---:|---:|");
    projectStats.forEach(({ p, add, done, open }) => lines.push(`| ${p.name} | ${add} | ${done} | ${open} |`));
    lines.push("", "## 5. 明日建议");
    if (todayList.length) lines.push(`- 优先处理 Today 主线中的 ${Math.min(todayList.length, 3)} 项`);
    if (reviewList.length >= 3) lines.push("- Review 区积压较多，建议集中清理");
    if (!todayList.length && batchList.length) lines.push("- 可从 Batch 中提炼 1~3 个明日主线任务");
    if (lines[lines.length - 1] === "## 5. 明日建议") lines.push("- 暂无明显风险，保持节奏即可");
    return lines.join("\n");
  }, [items, projects, getProjectById]);

  function addItems() {
    const value = input.trim();
    if (!value) return;
    const now = new Date().toISOString();
    const next = parseMultiTask(value).map((text) => {
      const suggestion = classifyInput(text);
      return { id: crypto.randomUUID(), content: text, source, type: suggestion.type, status: suggestion.status, priority, projectId: selectedProject, dueDate: dueDate || undefined, tags: selectedTags, repeatType, createdAt: now, updatedAt: now, rawInput: text, aiSuggestion: suggestion } as Item;
    });
    setItems((prev) => [...next, ...prev]);
    setInput(""); setDueDate(""); setSelectedTags([]); setNewQuickTag(""); setRepeatType("none"); setPriority("medium");
    showToast(`已加入 ${next.length} 条任务`);
  }

  function showToast(text: string) { setToast({ show: true, text }); }
  function addProject() {
    if (!newProjectName.trim()) return;
    const project = { id: crypto.randomUUID(), name: newProjectName.trim(), color: colors[projects.length % colors.length] };
    setProjects((prev) => [...prev, project]);
    setSelectedProject(project.id);
    setNewProjectName("");
    showToast("项目已创建");
  }
  function deleteProject(projectId: string) {
    if (!confirm("确认删除这个项目？该项目下任务会回到默认项目。")) return;
    setItems((prev) => prev.map((item) => item.projectId === projectId ? { ...item, projectId: "default" } : item));
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    showToast("项目已删除");
  }
  function addTag(name: string) {
    const clean = name.trim().replace(/^#/, "");
    if (!clean || tags.some((t) => t.name === clean)) return clean;
    const tag = { id: crypto.randomUUID(), name: clean, color: colors[tags.length % colors.length] };
    setTags((prev) => [...prev, tag]);
    return clean;
  }
  function deleteTag(tagName: string) {
    if (!confirm("确认删除这个标签？任务上的该标签会一并移除。")) return;
    setItems((prev) => prev.map((item) => ({ ...item, tags: (item.tags || []).filter((name) => name !== tagName) })));
    setTags((prev) => prev.filter((tag) => tag.name !== tagName));
    showToast("标签已删除");
  }
  function toggleSelectedTag(tagName: string) {
    setSelectedTags((prev) => prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]);
  }
  function createQuickTag() {
    const clean = addTag(newQuickTag);
    if (clean) toggleSelectedTag(clean);
    setNewQuickTag("");
  }
  function updateItemTags(id: string, tagName: string) {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const has = (item.tags || []).includes(tagName);
      return { ...item, tags: has ? (item.tags || []).filter((t) => t !== tagName) : [...(item.tags || []), tagName], updatedAt: new Date().toISOString() };
    }));
  }
  function saveItemEdit(updatedItem: Item) {
    setItems((prev) => prev.map((item) => item.id === updatedItem.id ? { ...updatedItem, updatedAt: new Date().toISOString() } : item));
    setEditingItem(null);
    showToast("任务已保存");
  }
  function reorderInStatus(status: ItemStatus, draggedId: string, targetId?: string) {
    setItems((prev) => {
      const list = [...prev];
      const draggedIndex = list.findIndex((i) => i.id === draggedId);
      if (draggedIndex === -1) return prev;
      const dragged = { ...list[draggedIndex], status, updatedAt: new Date().toISOString() };
      list.splice(draggedIndex, 1);
      if (!targetId) {
        const lastIndex = list.map((i) => i.status).lastIndexOf(status);
        list.splice(lastIndex + 1, 0, dragged);
        return list;
      }
      const targetIndex = list.findIndex((i) => i.id === targetId);
      if (targetIndex === -1) {
        list.push(dragged);
        return list;
      }
      list.splice(targetIndex, 0, dragged);
      return list;
    });
  }
  function moveItem(id: string, status: ItemStatus) {
    const now = new Date().toISOString();
    setItems((prev) => prev.flatMap((item) => {
      if (item.id !== id) return [item];
      const updated = { ...item, status, updatedAt: now, completedAt: status === "done" || status === "archived" ? now : item.completedAt };
      if ((status === "done" || status === "archived") && item.repeatType && item.repeatType !== "none") {
        const nextDue = item.dueDate ? new Date(item.dueDate) : new Date();
        if (item.repeatType === "daily") nextDue.setDate(nextDue.getDate() + 1);
        if (item.repeatType === "weekly") nextDue.setDate(nextDue.getDate() + 7);
        return [updated, { ...item, id: crypto.randomUUID(), status: "inbox", isMainline: false, completedAt: undefined, dueDate: nextDue.toISOString().slice(0, 10), createdAt: now, updatedAt: now }];
      }
      return [updated];
    }));
  }
  function toggleMainline(id: string) { setItems((prev) => prev.map((item) => item.id === id ? { ...item, isMainline: !item.isMainline, updatedAt: new Date().toISOString() } : item)); }
  function removeItem(id: string) { if (!confirm("确认删除这条任务？")) return; setItems((prev) => prev.filter((item) => item.id !== id)); showToast("任务已删除"); }
  function changeItemProject(id: string, projectId: string) { setItems((prev) => prev.map((item) => item.id === id ? { ...item, projectId, updatedAt: new Date().toISOString() } : item)); }
  function startPomodoro(taskId?: string) { setPomodoro({ running: true, secondsLeft: POMODORO_SECONDS, taskId }); }
  function stopPomodoro() { setPomodoro((prev) => ({ ...prev, running: false })); }
  function resetPomodoro() { setPomodoro({ running: false, secondsLeft: POMODORO_SECONDS }); }
  async function copyDailyReport() { try { await navigator.clipboard.writeText(dailyReport); showToast("日报已复制"); } catch {} }
  function saveDailyReport() {
    const date = new Date().toLocaleDateString("zh-CN");
    setSavedReports((prev) => [{ date, content: dailyReport }, ...prev.filter((r) => r.date !== date)]);
    showToast("日报已保存");
  }
  function exportData() {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      projects,
      tags,
      reports: savedReports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focus-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("已导出本地备份");
  }
  function createCurrentSnapshot(): PersistedSnapshot {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      projects,
      tags,
      reports: savedReports,
    };
  }
  async function createDiskBackup(reason = "manual") {
    const path = await createBackupSnapshotToDisk(createCurrentSnapshot(), reason);
    if (path) {
      showToast("磁盘备份已创建");
      return path;
    }
    showToast("当前环境不支持磁盘备份，建议使用导出备份");
    return null;
  }
  async function copyDataPath() {
    const dataPath = await getDataFilePath();
    const backupPath = await getBackupDirPath();
    const text = [dataPath && `数据文件：${dataPath}`, backupPath && `备份目录：${backupPath}`].filter(Boolean).join("\n");
    if (!text) {
      showToast("当前环境没有磁盘数据位置");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("数据位置已复制");
    } catch {
      showToast(text);
    }
  }
  async function chooseDataDir() {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        title: "选择 Focus Flow 数据目录",
        directory: true,
        multiple: false,
        canCreateDirectories: true,
      });
      if (!selected || Array.isArray(selected)) return;
      const snapshot = createCurrentSnapshot();
      await createBackupSnapshotToDisk(snapshot, "before-data-dir-change");
      const path = await setCustomDataDir(selected, snapshot);
      if (!path) {
        showToast("切换数据目录失败");
        return;
      }
      await saveWidgetSnapshotToDisk(createWidgetSnapshot({ items, projects, storageMode: "disk" }));
      showToast("数据目录已切换");
    } catch {
      showToast("选择数据目录失败");
    }
  }
  async function restoreDefaultDataDir() {
    if (!confirm("确认恢复默认 AppData 数据目录？当前数据会先迁移回默认位置。")) return;
    const snapshot = createCurrentSnapshot();
    await createBackupSnapshotToDisk(snapshot, "before-restore-default-dir");
    const path = await resetDataDirToDefault(snapshot);
    if (!path) {
      showToast("恢复默认目录失败");
      return;
    }
    await saveWidgetSnapshotToDisk(createWidgetSnapshot({ items, projects, storageMode: "disk" }));
    showToast("已恢复默认数据目录");
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Partial<ExportPayload>;
      if (!payload.items || !payload.projects || !payload.tags) throw new Error("invalid payload");
      await createBackupSnapshotToDisk(createCurrentSnapshot(), "before-import");
      setItems(payload.items as Item[]);
      setProjects(payload.projects as Project[]);
      setTags(payload.tags as TagDef[]);
      setSavedReports((payload.reports || []) as { date: string; content: string }[]);
      showToast("已导入备份，原数据已尝试自动备份");
    } catch {
      showToast("导入失败，请检查文件");
    }
  }
  async function resetAllData() {
    if (!confirm("确认重置所有本地数据？此操作不可撤销。")) return;
    await createBackupSnapshotToDisk(createCurrentSnapshot(), "before-reset");
    setItems(createSeedItems());
    setProjects(defaultProjects);
    setTags(defaultTags);
    setSavedReports([]);
    showToast("已重置为初始数据，原数据已尝试自动备份");
  }

  const sections: FlowSection[] = [
    { key: "inbox", title: "Inbox 分流台", hint: "所有新输入先在这里判断，不急着做。" },
    { key: "today", title: "Today 主线", hint: "今天真正要推进的事情，尽量控制在 1 到 3 个。" },
    { key: "review", title: "Review 待审区", hint: "AI 草稿、纪要摘要、方案初稿都先放这里。" },
    { key: "batch", title: "Batch 批处理", hint: "不需要实时响应，但值得集中处理。" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {toast.show && <div className="fixed right-6 top-6 z-[60] rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 shadow-2xl">{toast.text}</div>}
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[11px] text-emerald-300">macOS app</span>
                {storageMode === "disk" ? (
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-300">磁盘存储</span>
                ) : storageMode === "local" ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-[11px] text-amber-300">浏览器存储</span>
                ) : (
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400">加载中...</span>
                )}
                <AlwaysOnTopToggle onStatus={showToast} />
              </div>
              <p className="mt-3 text-sm uppercase tracking-[0.24em] text-zinc-400">Focus Flow MVP+</p>
              <h1 className="mt-2 text-3xl font-semibold">AI 反碎片分流台</h1>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard label="Inbox" value={counts.inbox} />
              <StatCard label="Today" value={counts.today} />
              <StatCard label="Review" value={counts.review} />
              <StatCard label="Batch" value={counts.batch} />
              <StatCard label="主线" value={counts.mainline} />
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.75fr)]">
          <QuickCapture
            input={input}
            setInput={setInput}
            source={source}
            setSource={setSource}
            priority={priority}
            setPriority={setPriority}
            dueDate={dueDate}
            setDueDate={setDueDate}
            repeatType={repeatType}
            setRepeatType={setRepeatType}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            selectedTags={selectedTags}
            tags={tags}
            projects={projects}
            newQuickTag={newQuickTag}
            setNewQuickTag={setNewQuickTag}
            textareaRef={captureInputRef}
            addItems={addItems}
            toggleSelectedTag={toggleSelectedTag}
            createQuickTag={createQuickTag}
          />
          <TodayMainline
            items={filteredItems}
            projects={projects}
            tags={tags}
            todayLoadWarning={todayLoadWarning}
            getProjectById={getProjectById}
            getTagDef={getTagDef}
            moveItem={moveItem}
            removeItem={removeItem}
            toggleMainline={toggleMainline}
            changeProject={changeItemProject}
            startPomodoro={startPomodoro}
            updateItemTags={updateItemTags}
            openEdit={setEditingItem}
          />
        </section>

        <Workbench
          viewMode={viewMode}
          setViewMode={setViewMode}
          importInputRef={importInputRef}
          importData={importData}
          setShowReportModal={setShowReportModal}
          setShowSummaryModal={setShowSummaryModal}
          setShowTagModal={setShowTagModal}
          setShowProjectModal={setShowProjectModal}
          exportData={exportData}
          resetAllData={resetAllData}
          pomodoro={pomodoro}
          startPomodoro={startPomodoro}
          stopPomodoro={stopPomodoro}
          resetPomodoro={resetPomodoro}
          searchText={searchText}
          setSearchText={setSearchText}
          filterTag={filterTag}
          setFilterTag={setFilterTag}
          allUsedTags={allUsedTags}
          storageMode={storageMode}
          createDiskBackup={createDiskBackup}
          copyDataPath={copyDataPath}
          chooseDataDir={chooseDataDir}
          restoreDefaultDataDir={restoreDefaultDataDir}
        />

        {viewMode === "flow" ? (
          <FlowView
            items={filteredItems}
            projects={projects}
            tags={tags}
            sections={sections}
            getProjectById={getProjectById}
            getTagDef={getTagDef}
            moveItem={moveItem}
            removeItem={removeItem}
            toggleMainline={toggleMainline}
            changeProject={changeItemProject}
            startPomodoro={startPomodoro}
            updateItemTags={updateItemTags}
            openEdit={setEditingItem}
          />
        ) : (
          <BoardView
            items={filteredItems}
            projects={projects}
            dragState={dragState}
            setDragState={setDragState}
            getTagDef={getTagDef}
            reorderInStatus={reorderInStatus}
          />
        )}
      </main>

      {showProjectModal && <ProjectManagementModal projects={projects} newProjectName={newProjectName} setNewProjectName={setNewProjectName} addProject={addProject} deleteProject={deleteProject} onClose={() => setShowProjectModal(false)} />}
      {showTagModal && <TagManagementModal tags={tags} newTagName={newTagName} setNewTagName={setNewTagName} addTag={addTag} deleteTag={deleteTag} onClose={() => setShowTagModal(false)} />}
      {showSummaryModal && <ProjectSummaryModal projectSummary={projectSummary} onClose={() => setShowSummaryModal(false)} />}
      {showReportModal && <ReportModal dailyReport={dailyReport} savedReports={savedReports} saveDailyReport={saveDailyReport} copyDailyReport={copyDailyReport} onClose={() => setShowReportModal(false)} />}
      {editingItem && <EditItemModal item={editingItem} projects={projects} tags={tags} onClose={() => setEditingItem(null)} onSave={saveItemEdit} />}
    </div>
  );
}
