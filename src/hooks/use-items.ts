"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottledCallback } from "./use-debounce";
import {
  classifyInput,
  colors,
  createDefaultDailySessionStats,
  createSeedItems,
  createWidgetSnapshot,
  defaultProjects,
  defaultTags,
  getTodayKey,
  migrateItems,
  parseTaskInput,
  PROJECTS_KEY,
  REPORTS_KEY,
  SESSION_STATS_KEY,
  STORAGE_KEY,
  TAGS_KEY,
  type DailySessionStats,
  type ExportPayload,
  type Item,
  type ItemSource,
  type ItemStatus,
  type ParsedTaskInput,
  type Priority,
  type Project,
  type RepeatType,
  type StorageMode,
  type TagDef,
  type Task,
} from "@/lib/focus-flow-model";
import {
  mergeObsidianCaptureItems,
  parseObsidianCaptureMarkdown,
  type ObsidianCaptureEntry,
} from "@/lib/obsidian-sync";
import {
  createBackupSnapshotToDisk,
  listBackupSnapshotsFromDisk,
  loadBackupSnapshotFromDisk,
  loadSnapshotFromDisk,
  resetDataDirToDefault,
  saveSnapshotToDisk,
  saveWidgetSnapshotToDisk,
  setCustomDataDir,
  type BackupEntry,
  type PersistedSnapshot,
} from "@/lib/persistence";

type AddItemsOptions = {
  dueDate?: string;
  source: ItemSource;
  priority: Priority;
  projectId: string;
  tags: string[];
  repeatType: RepeatType;
  statusOverride?: ItemStatus;
  taskId?: string;
};

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const DEFAULT_OBSIDIAN_VAULT_DIR = "/Users/ls/Downloads/同步空间/obsidian/bdy";
const OBSIDIAN_CAPTURE_DIR = "捕获台";

async function isTauriRuntime() {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

async function loadObsidianCaptureEntries(): Promise<ObsidianCaptureEntry[]> {
  if (!(await isTauriRuntime())) return [];

  try {
    const [{ join }, { exists, readDir, readTextFile }] = await Promise.all([
      import("@tauri-apps/api/path"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const captureDir = await join(DEFAULT_OBSIDIAN_VAULT_DIR, OBSIDIAN_CAPTURE_DIR);
    if (!(await exists(captureDir))) return [];

    const entries = await readDir(captureDir);
    const markdownFiles = entries.filter((entry) => entry.isFile && entry.name.endsWith(".md"));
    const parsed = await Promise.all(markdownFiles.map(async (entry) => {
      const filePath = await join(captureDir, entry.name);
      const text = await readTextFile(filePath);
      return parseObsidianCaptureMarkdown(text, { sourcePath: filePath });
    }));

    return parsed.flat();
  } catch (error) {
    console.error("Failed to load Obsidian capture entries", error);
    return [];
  }
}

async function syncObsidianCaptures(existingItems: Item[]) {
  const entries = await loadObsidianCaptureEntries();
  if (!entries.length) return { nextItems: existingItems, importedCount: 0, skippedCount: 0 };

  const result = mergeObsidianCaptureItems(existingItems, entries, { projectId: "default" });
  return {
    nextItems: result.nextItems,
    importedCount: result.imported.length,
    skippedCount: result.skipped.length,
  };
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [tags, setTags] = useState<TagDef[]>(defaultTags);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savedReports, setSavedReports] = useState<{ date: string; content: string }[]>([]);
  const [sessionStats, setSessionStats] = useState<DailySessionStats>(createDefaultDailySessionStats());
  const [storageMode, setStorageMode] = useState<StorageMode>("loading");
  const [backupEntries, setBackupEntries] = useState<BackupEntry[]>([]);
  const [isSyncingObsidian, setIsSyncingObsidian] = useState(false);
  const initialLoadDone = useRef(false);

  // --- Initial load ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const diskSnapshot = await loadSnapshotFromDisk();
      if (cancelled) return;

      const nextSnapshot: PersistedSnapshot = diskSnapshot || {
        version: 1,
        exportedAt: new Date().toISOString(),
        items: loadLocal<Item[]>(STORAGE_KEY, []),
        projects: loadLocal<Project[]>(PROJECTS_KEY, defaultProjects),
        tags: loadLocal<TagDef[]>(TAGS_KEY, defaultTags),
        tasks: loadLocal<Task[]>("focus-flow-tasks-v1", []),
        reports: loadLocal<{ date: string; content: string }[]>(REPORTS_KEY, []),
        sessionStats: loadLocal<DailySessionStats>(SESSION_STATS_KEY, createDefaultDailySessionStats()),
      };

      const baseItems = (nextSnapshot.items as Item[]).length ? (nextSnapshot.items as Item[]) : createSeedItems();
      const { nextItems, importedCount } = await syncObsidianCaptures(baseItems);
      if (cancelled) return;

      const mergedSnapshot = {
        ...nextSnapshot,
        items: importedCount ? nextItems : baseItems,
      };

      if (diskSnapshot) {
        applySnapshot(mergedSnapshot);
        setStorageMode("disk");
      } else {
        setItems(migrateItems(mergedSnapshot.items as Item[]));
        setProjects(mergedSnapshot.projects as Project[]);
        setTags(mergedSnapshot.tags as TagDef[]);
        setTasks((mergedSnapshot.tasks as Task[]) || []);
        setSavedReports(mergedSnapshot.reports || []);
        setSessionStats(mergedSnapshot.sessionStats || createDefaultDailySessionStats());
        setStorageMode("local");
      }

      initialLoadDone.current = true;
      void refreshBackupsList();
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // --- Reload from disk (for external data changes) ---
  async function reloadFromDisk(): Promise<boolean> {
    const diskSnapshot = await loadSnapshotFromDisk();
    if (diskSnapshot) {
      applySnapshot(diskSnapshot);
      return true;
    }
    // 非磁盘模式下从 localStorage 重新读取
    const localItems = loadLocal<Item[]>(STORAGE_KEY, []);
    const localProjects = loadLocal<Project[]>(PROJECTS_KEY, defaultProjects);
    const localTags = loadLocal<TagDef[]>(TAGS_KEY, defaultTags);
    const localReports = loadLocal<{ date: string; content: string }[]>(REPORTS_KEY, []);
    const localStats = loadLocal<DailySessionStats>(SESSION_STATS_KEY, createDefaultDailySessionStats());
    setItems(localItems.length ? migrateItems(localItems) : createSeedItems());
    setProjects(localProjects);
    setTags(localTags);
    setSavedReports(localReports);
    setSessionStats(localStats);
    return true;
  }

  function applySnapshot(snapshot: PersistedSnapshot) {
    // 迁移历史遗留状态（review/batch → inbox/shelved）
    setItems((snapshot.items as Item[]).length ? migrateItems(snapshot.items as Item[]) : createSeedItems());
    setProjects((snapshot.projects as Project[]).length ? (snapshot.projects as Project[]) : defaultProjects);
    setTags((snapshot.tags as TagDef[]).length ? (snapshot.tags as TagDef[]) : defaultTags);
    setTasks((snapshot.tasks as Task[]) || []);
    setSavedReports(snapshot.reports || []);
    if (snapshot.sessionStats) {
      setSessionStats(snapshot.sessionStats);
    }
  }

  // --- Persist on change (throttled to avoid excessive disk writes) ---
  const persistSnapshot = useThrottledCallback(() => {
    const snapshot = buildSnapshot();
    if (storageMode === "disk") {
      void saveSnapshotToDisk(snapshot);
    }
    saveLocal(STORAGE_KEY, items);
    saveLocal(PROJECTS_KEY, projects);
    saveLocal(TAGS_KEY, tags);
    saveLocal(REPORTS_KEY, savedReports);
    saveLocal(SESSION_STATS_KEY, sessionStats);
    saveLocal("focus-flow-tasks-v1", tasks);
  }, 800);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    persistSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, projects, tags, savedReports, sessionStats, tasks]);

  // --- Widget snapshot ---
  useEffect(() => {
    if (!initialLoadDone.current || storageMode !== "disk") return;
    void saveWidgetSnapshotToDisk(createWidgetSnapshot({ items, projects, storageMode }));
  }, [items, projects, storageMode]);

  // --- Session stats date rollover ---
  useEffect(() => {
    const today = getTodayKey();
    if (sessionStats.date !== today) {
      setSessionStats(createDefaultDailySessionStats(today));
    }
  }, [sessionStats.date]);

  function buildSnapshot(): PersistedSnapshot {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      projects,
      tags,
      tasks,
      reports: savedReports,
      sessionStats,
    };
  }

  function createCurrentSnapshot(): ExportPayload {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      projects,
      tags,
      tasks,
      reports: savedReports,
      sessionStats,
    };
  }

  // --- Lookups ---
  const getProjectById = useCallback(
    (id?: string): Project => projects.find((p) => p.id === id) || projects[0] || defaultProjects[0],
    [projects],
  );

  const getTagDef = useCallback(
    (name: string): TagDef | undefined => tags.find((t) => t.name === name),
    [tags],
  );

  const getTaskById = useCallback(
    (id?: string): Task | undefined => tasks.find((t) => t.id === id),
    [tasks],
  );

  const getTasksForProject = useCallback(
    (projectId: string): Task[] => tasks.filter((t) => t.projectId === projectId),
    [tasks],
  );

  // --- Item operations ---
  function addItems(
    value: string,
    options: AddItemsOptions,
  ): { parsedTasks: ParsedTaskInput[]; next: Item[] } {
    const parsedTasks = parseTaskInput(value);
    if (!parsedTasks.length) return { parsedTasks: [], next: [] };

    const now = new Date().toISOString();
    const newItems: Item[] = [];
    const idMap = new Map<number, string>();

    parsedTasks.forEach((task, index) => {
      const id = crypto.randomUUID();
      idMap.set(index, id);
      const parentId = task.parentIndex !== undefined ? idMap.get(task.parentIndex) : undefined;
      const suggestion = classifyInput(task.content);
      const targetStatus = options.statusOverride || suggestion.status;

      newItems.push({
        id,
        content: task.content,
        source: options.source,
        type: suggestion.type,
        status: targetStatus,
        priority: options.priority,
        projectId: options.projectId,
        dueDate: options.dueDate,
        repeatType: options.repeatType,
        tags: options.tags.length ? [...options.tags] : undefined,
        taskId: options.taskId,
        createdAt: now,
        updatedAt: now,
        rawInput: value,
        aiSuggestion: suggestion,
        parentId,
        depth: task.depth,
        history: [{ type: "created", to: targetStatus, at: now }],
      });
    });

    setItems((prev) => [...prev, ...newItems]);
    return { parsedTasks, next: newItems };
  }

  const moveItem = useCallback((id: string, status: ItemStatus) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const now = new Date().toISOString();
        const completedAt = status === "done" || status === "archived" ? now : undefined;
        const historyType = status === "done" ? "completed" : status === "archived" ? "archived" : "status_changed";
        const updates: Partial<Item> = {
          status,
          updatedAt: now,
          completedAt,
          history: item.status === status
            ? item.history
            : [...(item.history || []), { type: historyType, from: item.status, to: status, at: now }],
        };
        return { ...item, ...updates };
      }),
    );
  }, []);

  const toggleMainline = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isMainline: !item.isMainline, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const idsToRemove = new Set<string>([id]);
      // 递归收集所有后代任务
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of prev) {
          if (item.parentId && idsToRemove.has(item.parentId) && !idsToRemove.has(item.id)) {
            idsToRemove.add(item.id);
            changed = true;
          }
        }
      }
      return prev.filter((item) => !idsToRemove.has(item.id));
    });
  }, []);

  const changeItemProject = useCallback((id: string, projectId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, projectId, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const setItemQuadrant = useCallback((id: string, important: boolean, urgent: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, important, urgent, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const updateItemTags = useCallback((id: string, tagName: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const current = item.tags || [];
        const next = current.includes(tagName) ? current.filter((t) => t !== tagName) : [...current, tagName];
        return { ...item, tags: next, updatedAt: new Date().toISOString() };
      }),
    );
  }, []);

  const saveItemEdit = useCallback((updatedItem: Item) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== updatedItem.id) return item;
        const now = new Date().toISOString();
        const statusChanged = item.status !== updatedItem.status;
        const completedAt = updatedItem.status === "done" || updatedItem.status === "archived"
          ? updatedItem.completedAt || now
          : undefined;
        const historyType = updatedItem.status === "done" ? "completed" : updatedItem.status === "archived" ? "archived" : "status_changed";
        // 确保 Item-Task-Project 一致性：如果 taskId 引用了一个 Task，projectId 必须等于该 Task 的 projectId
        let finalItem = updatedItem;
        if (finalItem.taskId) {
          const referencedTask = tasks.find((t) => t.id === finalItem.taskId);
          if (referencedTask && finalItem.projectId !== referencedTask.projectId) {
            finalItem = { ...finalItem, projectId: referencedTask.projectId };
          }
        }
        return {
          ...finalItem,
          completedAt,
          updatedAt: now,
          history: statusChanged
            ? [...(item.history || []), { type: historyType, from: item.status, to: finalItem.status, at: now }]
            : [...(item.history || []), { type: "edited", at: now }],
        };
      }),
    );
  }, [tasks]);

  const mergeItems = useCallback((itemIds: string[], content: string): Item | null => {
    const cleanContent = content.trim();
    if (itemIds.length < 2 || !cleanContent) return null;
    let createdItem: Item | null = null;
    setItems((prev) => {
      const sourceItems = prev.filter((item) => itemIds.includes(item.id) && item.status !== "done" && item.status !== "archived");
      if (sourceItems.length < 2) return prev;
      const now = new Date().toISOString();
      const priorityRank: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
      const topPriority = sourceItems.reduce<Priority>((current, item) => priorityRank[item.priority] > priorityRank[current] ? item.priority : current, "low");
      const tagSet = new Set(sourceItems.flatMap((item) => item.tags || []));
      const estimateMinutes = sourceItems.reduce((sum, item) => sum + (item.estimateMinutes || 0), 0) || undefined;
      const joinedBlockers = sourceItems.map((item) => item.blockedBy).filter(Boolean).join("；") || undefined;
      const joinedWaiting = sourceItems.map((item) => item.waitingFor).filter(Boolean).join("；") || undefined;
      const mergedItem: Item = {
        id: crypto.randomUUID(),
        content: cleanContent,
        source: "manual",
        type: "task",
        status: "inbox",
        priority: topPriority,
        projectId: sourceItems[0].projectId || "default",
        repeatType: "none",
        tags: tagSet.size ? Array.from(tagSet) : undefined,
        estimateMinutes,
        blockedBy: joinedBlockers,
        waitingFor: joinedWaiting,
        mergedFrom: sourceItems.map((item) => item.id),
        createdAt: now,
        updatedAt: now,
        history: [{ type: "merged", to: "inbox", at: now, note: `由 ${sourceItems.length} 条任务合并` }],
      };
      createdItem = mergedItem;
      return [
        ...prev.map((item) => itemIds.includes(item.id) ? {
          ...item,
          status: "archived" as ItemStatus,
          completedAt: now,
          updatedAt: now,
          history: [...(item.history || []), { type: "merged" as const, from: item.status, to: "archived" as ItemStatus, at: now, note: `合并到：${cleanContent}` }],
        } : item),
        mergedItem,
      ];
    });
    return createdItem;
  }, []);

  const reorderInStatus = useCallback((status: ItemStatus, draggedId: string, targetId?: string) => {
    setItems((prev) => {
      const inStatus = prev.filter((item) => item.status === status);
      const rest = prev.filter((item) => item.status !== status);
      const draggedIndex = inStatus.findIndex((item) => item.id === draggedId);
      if (draggedIndex === -1) return prev;
      const [dragged] = inStatus.splice(draggedIndex, 1);
      if (targetId) {
        const targetIndex = inStatus.findIndex((item) => item.id === targetId);
        if (targetIndex !== -1) {
          inStatus.splice(targetIndex, 0, dragged);
        } else {
          inStatus.push(dragged);
        }
      } else {
        inStatus.push(dragged);
      }
      return [...rest, ...inStatus];
    });
  }, []);

  // --- Project operations ---
  function addProject(name: string): Project {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      color: colors[projects.length % colors.length],
    };
    setProjects((prev) => [...prev, project]);
    return project;
  }

  function renameProject(projectId: string, newName: string) {
    const clean = newName.trim();
    if (!clean) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: clean } : p)),
    );
  }

  function updateProjectColor(projectId: string, color: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, color } : p)),
    );
  }

  function deleteProject(projectId: string, migrateToProjectId?: string) {
    const targetId = migrateToProjectId || "default";
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setItems((prev) =>
      prev.map((item) =>
        item.projectId === projectId ? { ...item, projectId: targetId, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }

  // --- Tag operations ---
  function addTag(name: string): string | undefined {
    const clean = name.trim().replace(/^#/, "");
    if (!clean) return undefined;
    if (tags.some((t) => t.name === clean)) return undefined;
    const tag: TagDef = {
      id: crypto.randomUUID(),
      name: clean,
      color: colors[tags.length % colors.length],
    };
    setTags((prev) => [...prev, tag]);
    return clean;
  }

  function deleteTag(tagName: string) {
    setTags((prev) => prev.filter((t) => t.name !== tagName));
    setItems((prev) =>
      prev.map((item) => {
        if (!item.tags?.includes(tagName)) return item;
        return { ...item, tags: item.tags.filter((t) => t !== tagName), updatedAt: new Date().toISOString() };
      }),
    );
  }

  // --- Sync helpers ---
  function applyProjectSync(nextProjects: Project[]) {
    setProjects(nextProjects);
  }

  function applyTaskSync(nextTasks: Task[]) {
    setTasks(nextTasks);
  }

  async function syncObsidianCapturesNow(): Promise<{ importedCount: number; skippedCount: number }> {
    setIsSyncingObsidian(true);
    try {
      const result = await syncObsidianCaptures(items);
      if (result.importedCount > 0) {
        setItems(result.nextItems);
      }
      return { importedCount: result.importedCount, skippedCount: result.skippedCount };
    } finally {
      setIsSyncingObsidian(false);
    }
  }

  // --- Backup / Import / Reset ---
  async function refreshBackupsList() {
    const entries = await listBackupSnapshotsFromDisk();
    setBackupEntries(entries);
  }

  async function createDiskBackup(reason: string): Promise<string | null> {
    const snapshot = buildSnapshot();
    const path = await createBackupSnapshotToDisk(snapshot, reason);
    if (path) void refreshBackupsList();
    return path;
  }

  async function setCustomDataDirectory(directory: string): Promise<string | null> {
    await createDiskBackup("pre-migrate");
    const snapshot = buildSnapshot();
    const path = await setCustomDataDir(directory, snapshot);
    if (path) void refreshBackupsList();
    return path;
  }

  async function restoreDefaultDataDirectory(): Promise<string | null> {
    await createDiskBackup("pre-restore-default");
    const snapshot = buildSnapshot();
    const path = await resetDataDirToDefault(snapshot);
    if (path) void refreshBackupsList();
    return path;
  }

  async function restoreBackup(path: string): Promise<boolean> {
    await createDiskBackup("pre-restore");
    const snapshot = await loadBackupSnapshotFromDisk(path);
    if (!snapshot) return false;
    applySnapshot(snapshot);
    return true;
  }

  async function importData(file: File): Promise<boolean> {
    try {
      await createDiskBackup("pre-import");
      const text = await file.text();
      const payload = JSON.parse(text) as PersistedSnapshot;
      applySnapshot(payload);
      return true;
    } catch {
      return false;
    }
  }

  async function resetAllData() {
    await createDiskBackup("pre-reset");
    setItems(createSeedItems());
    setProjects(defaultProjects);
    setTags(defaultTags);
    setSavedReports([]);
    setSessionStats(createDefaultDailySessionStats());
  }

  return {
    items,
    setItems,
    projects,
    setProjects,
    tags,
    setTags,
    tasks,
    setTasks,
    savedReports,
    setSavedReports,
    sessionStats,
    setSessionStats,
    storageMode,
    backupEntries,
    isSyncingObsidian,
    getProjectById,
    getTagDef,
    getTaskById,
    getTasksForProject,
    addItems,
    moveItem,
    toggleMainline,
    removeItem,
    changeItemProject,
    setItemQuadrant,
    updateItemTags,
    saveItemEdit,
    mergeItems,
    reorderInStatus,
    addProject,
    renameProject,
    updateProjectColor,
    deleteProject,
    addTag,
    deleteTag,
    applyProjectSync,
    applyTaskSync,
    syncObsidianCaptures: syncObsidianCapturesNow,
    createDiskBackup,
    setCustomDataDirectory,
    restoreDefaultDataDirectory,
    restoreBackup,
    importData,
    resetAllData,
    reloadFromDisk,
    refreshBackups: refreshBackupsList,
    createCurrentSnapshot,
  };
}
