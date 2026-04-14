import type { DailySessionStats, WidgetSnapshot } from "@/lib/focus-flow-model";

export type PersistedSnapshot = {
  version: number;
  exportedAt: string;
  items: unknown[];
  projects: unknown[];
  tags: unknown[];
  reports: { date: string; content: string }[];
  sessionStats?: DailySessionStats;
};
export type PersistenceSettings = {
  version: 1;
  dataDir?: string;
  updatedAt: string;
};
export type BackupEntry = {
  name: string;
  path: string;
  reason: string;
  createdAt?: string;
};

export const STORAGE_FILE = "focus-flow-data.json";
export const WIDGET_SNAPSHOT_FILE = "focus-flow-widget-snapshot.json";
export const SETTINGS_FILE = "focus-flow-settings.json";
const BACKUP_DIR = "backups";

async function isTauriRuntime() {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

export async function loadSnapshotFromDisk(): Promise<PersistedSnapshot | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const [{ appDataDir, join }, { exists, readTextFile }] = await Promise.all([
      import("@tauri-apps/api/path"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const appDir = await appDataDir();
    const dir = await resolveActiveDataDir();
    const filePath = await join(dir, STORAGE_FILE);
    const fileExists = await exists(filePath);
    if (!fileExists) {
      const fallbackPath = await join(appDir, STORAGE_FILE);
      const fallbackExists = await exists(fallbackPath);
      if (!fallbackExists) return null;
      const fallbackText = await readTextFile(fallbackPath);
      return JSON.parse(fallbackText) as PersistedSnapshot;
    }
    const text = await readTextFile(filePath);
    return JSON.parse(text) as PersistedSnapshot;
  } catch (error) {
    console.error("Failed to load snapshot from disk", error);
    return null;
  }
}

export async function saveSnapshotToDisk(snapshot: PersistedSnapshot): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;

  try {
    const [{ join }, { mkdir, writeTextFile }] = await Promise.all([
      import("@tauri-apps/api/path"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const dir = await resolveActiveDataDir();
    await mkdir(dir, { recursive: true });
    const filePath = await join(dir, STORAGE_FILE);
    await writeTextFile(filePath, JSON.stringify(snapshot, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save snapshot to disk", error);
    return false;
  }
}

export async function createBackupSnapshotToDisk(snapshot: PersistedSnapshot, reason: string): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const [{ join }, { mkdir, writeTextFile }] = await Promise.all([
      import("@tauri-apps/api/path"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const dir = await resolveActiveDataDir();
    const backupDir = await join(dir, BACKUP_DIR);
    await mkdir(backupDir, { recursive: true });
    const safeReason = reason.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = await join(backupDir, `focus-flow-${safeReason}-${timestamp}.json`);
    await writeTextFile(filePath, JSON.stringify(snapshot, null, 2));
    return filePath;
  } catch (error) {
    console.error("Failed to create backup snapshot", error);
    return null;
  }
}

export async function listBackupSnapshotsFromDisk(): Promise<BackupEntry[]> {
  if (!(await isTauriRuntime())) return [];

  try {
    const [{ join }, { exists, readDir }] = await Promise.all([
      import("@tauri-apps/api/path"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const dir = await resolveActiveDataDir();
    const backupDir = await join(dir, BACKUP_DIR);
    if (!(await exists(backupDir))) return [];

    const entries = await readDir(backupDir);
    const backups = await Promise.all(entries
      .filter((entry) => entry.isFile && entry.name.startsWith("focus-flow-") && entry.name.endsWith(".json"))
      .map(async (entry) => ({
        ...parseBackupFileName(entry.name),
        name: entry.name,
        path: await join(backupDir, entry.name),
      })));

    return backups.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      if (rightTime !== leftTime) return rightTime - leftTime;
      return right.name.localeCompare(left.name);
    });
  } catch (error) {
    console.error("Failed to list backup snapshots", error);
    return [];
  }
}

export async function loadBackupSnapshotFromDisk(path: string): Promise<PersistedSnapshot | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const text = await readTextFile(path);
    return JSON.parse(text) as PersistedSnapshot;
  } catch (error) {
    console.error("Failed to load backup snapshot", error);
    return null;
  }
}

export async function saveWidgetSnapshotToDisk(snapshot: WidgetSnapshot): Promise<boolean> {
  if (!(await isTauriRuntime())) return false;

  try {
    const [{ join }, { mkdir, writeTextFile }] = await Promise.all([
      import("@tauri-apps/api/path"),
      import("@tauri-apps/plugin-fs"),
    ]);

    const dir = await resolveActiveDataDir();
    await mkdir(dir, { recursive: true });
    const filePath = await join(dir, WIDGET_SNAPSHOT_FILE);
    await writeTextFile(filePath, JSON.stringify(snapshot, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save widget snapshot to disk", error);
    return false;
  }
}

export async function getWidgetSnapshotPath(): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const { join } = await import("@tauri-apps/api/path");
    return join(await resolveActiveDataDir(), WIDGET_SNAPSHOT_FILE);
  } catch (error) {
    console.error("Failed to resolve widget snapshot path", error);
    return null;
  }
}

export async function getDataFilePath(): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const { join } = await import("@tauri-apps/api/path");
    return join(await resolveActiveDataDir(), STORAGE_FILE);
  } catch (error) {
    console.error("Failed to resolve data file path", error);
    return null;
  }
}

export async function getBackupDirPath(): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const { join } = await import("@tauri-apps/api/path");
    return join(await resolveActiveDataDir(), BACKUP_DIR);
  } catch (error) {
    console.error("Failed to resolve backup dir path", error);
    return null;
  }
}

export async function getActiveDataDir(): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    return resolveActiveDataDir();
  } catch (error) {
    console.error("Failed to resolve active data dir", error);
    return null;
  }
}

export async function setCustomDataDir(directory: string, snapshot: PersistedSnapshot): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const { join } = await import("@tauri-apps/api/path");
    const { mkdir, writeTextFile } = await import("@tauri-apps/plugin-fs");
    await mkdir(directory, { recursive: true });
    const filePath = await join(directory, STORAGE_FILE);
    await writeTextFile(filePath, JSON.stringify(snapshot, null, 2));
    await savePersistenceSettings({ version: 1, dataDir: directory, updatedAt: new Date().toISOString() });
    return filePath;
  } catch (error) {
    console.error("Failed to set custom data dir", error);
    return null;
  }
}

export async function resetDataDirToDefault(snapshot: PersistedSnapshot): Promise<string | null> {
  if (!(await isTauriRuntime())) return null;

  try {
    const { appDataDir, join } = await import("@tauri-apps/api/path");
    const { mkdir, writeTextFile } = await import("@tauri-apps/plugin-fs");
    const dir = await appDataDir();
    await mkdir(dir, { recursive: true });
    const filePath = await join(dir, STORAGE_FILE);
    await writeTextFile(filePath, JSON.stringify(snapshot, null, 2));
    await savePersistenceSettings({ version: 1, updatedAt: new Date().toISOString() });
    return filePath;
  } catch (error) {
    console.error("Failed to reset data dir to default", error);
    return null;
  }
}

async function resolveActiveDataDir(): Promise<string> {
  const { appDataDir } = await import("@tauri-apps/api/path");
  const settings = await loadPersistenceSettings();
  return settings.dataDir || await appDataDir();
}

async function loadPersistenceSettings(): Promise<PersistenceSettings> {
  const [{ appDataDir, join }, { exists, readTextFile }] = await Promise.all([
    import("@tauri-apps/api/path"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const filePath = await join(await appDataDir(), SETTINGS_FILE);
  if (!(await exists(filePath))) return { version: 1, updatedAt: new Date().toISOString() };
  const text = await readTextFile(filePath);
  return JSON.parse(text) as PersistenceSettings;
}

async function savePersistenceSettings(settings: PersistenceSettings): Promise<void> {
  const [{ appDataDir, join }, { mkdir, writeTextFile }] = await Promise.all([
    import("@tauri-apps/api/path"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const dir = await appDataDir();
  await mkdir(dir, { recursive: true });
  const filePath = await join(dir, SETTINGS_FILE);
  await writeTextFile(filePath, JSON.stringify(settings, null, 2));
}

function parseBackupFileName(name: string): Pick<BackupEntry, "reason" | "createdAt"> {
  const match = name.match(/^focus-flow-(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/);
  if (!match) return { reason: "backup" };

  const [, rawReason, rawTimestamp] = match;
  const createdAt = rawTimestamp.replace(
    /^(\d{4}-\d{2}-\d{2}T)(\d{2})-(\d{2})-(\d{2})-(\d{3}Z)$/,
    "$1$2:$3:$4.$5",
  );
  return {
    reason: rawReason.replace(/-/g, " "),
    createdAt,
  };
}
