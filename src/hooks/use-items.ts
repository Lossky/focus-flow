"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  classifyInput,
  colors,
  createDefaultDailySessionStats,
  createSeedItems,
  createWidgetSnapshot,
  defaultProjects,
  defaultTags,
  getTodayKey,
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
} from "@/lib/focus-flow-model";
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

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [tags, setTags] = useState<TagDef[]>(defaultTags);
  const [savedReports, setSavedReports] = useState<{ date: string; content: string }[]>([]);
  const [sessionStats, setSessionStats] = useState<DailySessionStats>(createDefaultDailySessionStats());
  const [storageMode, setStorageMode] = useState<StorageMode>("loading");
  const [backupEntries, setBackupEntries] = useState<BackupEntry[]>([]);
  const initialLoadDone = useRef(false);

  // --- Initial load ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const diskSnapshot = await loadSnapshotFromDisk();
      if (cancelled) return;

      if (diskSnapshot) {
        applySnapshot(diskSnapshot);
        setStorageMode("disk");
      } else {
        const localItems = loadLocal<Item[]>(STORAGE_KEY, []);
        const localProjects = loadLocal<Project[]>(PROJECTS_KEY, defaultProjects);
        const localTags = loadLocal<TagDef[]>(TAGS_KEY, defaultTags);
        const localReports = loadLocal<{ date: string; content: string }[]>(REPORTS_KEY, []);
        const localStats = loadLocal<DailySessionStats>(SESSION_STATS_KEY, createDefaultDailySessionStats());
        setItems(localItems.length ? localItems : createSeedItems());
        setProjects(localProjects);
        setTags(localTags);
        setSavedReports(localReports);
        setSessionStats(localStats);
        setStorageMode("local");
      }

      initialLoadDone.current = true;
      void refreshBackupsList();
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  function applySnapshot(snapshot: PersistedSnapshot) {
    setItems((snapshot.items as Item[]).length ? (snapshot.items as Item[]) : createSeedItems());
    setProjects((snapshot.projects as Project[]).length ? (snapshot.projects as Project[]) : defaultProjects);
    setTags((snapshot.tags as TagDef[]).length ? (snapshot.tags as TagDef[]) : defaultTags);
    setSavedReports(snapshot.reports || []);
    if (snapshot.sessionStats) {
      setSessionStats(snapshot.sessionStats);
    }
  }

  // --- Persist on change ---
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const snapshot = buildSnapshot();
    if (storageMode === "disk") {
      void saveSnapshotToDisk(snapshot);
    }
    saveLocal(STORAGE_KEY, items);
    saveLocal(PROJECTS_KEY, projects);
    saveLocal(TAGS_KEY, tags);
    saveLocal(REPORTS_KEY, savedReports);
    saveLocal(SESSION_STATS_KEY, sessionStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, projects, tags, savedReports, sessionStats]);

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
        createdAt: now,
        updatedAt: now,
        rawInput: value,
        aiSuggestion: suggestion,
        parentId,
        depth: task.depth,
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
        const updates: Partial<Item> = { status, updatedAt: now };
        if (status === "done" || status === "archived") {
          updates.completedAt = now;
        }
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
      prev.map((item) =>
        item.id === updatedItem.id ? { ...updatedItem, updatedAt: new Date().toISOString() } : item,
      ),
    );
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

  function deleteProject(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setItems((prev) =>
      prev.map((item) =>
        item.projectId === projectId ? { ...item, projectId: "default", updatedAt: new Date().toISOString() } : item,
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
    savedReports,
    setSavedReports,
    sessionStats,
    setSessionStats,
    storageMode,
    backupEntries,
    getProjectById,
    getTagDef,
    addItems,
    moveItem,
    toggleMainline,
    removeItem,
    changeItemProject,
    updateItemTags,
    saveItemEdit,
    reorderInStatus,
    addProject,
    deleteProject,
    addTag,
    deleteTag,
    createDiskBackup,
    setCustomDataDirectory,
    restoreDefaultDataDirectory,
    restoreBackup,
    importData,
    resetAllData,
    refreshBackups: refreshBackupsList,
    createCurrentSnapshot,
  };
}
