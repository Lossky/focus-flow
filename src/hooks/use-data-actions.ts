"use client";

import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getBackupDirPath, getDataFilePath } from "@/lib/persistence";
import type { ExportPayload } from "@/lib/focus-flow-model";

type DataHooks = {
  createCurrentSnapshot: () => ExportPayload;
  createDiskBackup: (reason: string) => Promise<string | null>;
  setCustomDataDirectory: (dir: string) => Promise<string | null>;
  restoreDefaultDataDirectory: () => Promise<string | null>;
  restoreBackup: (path: string) => Promise<boolean>;
  importData: (file: File) => Promise<boolean>;
  resetAllData: () => Promise<void>;
};

type ShowToast = (text: string) => void;

export function useDataActions(hooks: DataHooks, showToast: ShowToast) {
  const exportData = useCallback(() => {
    const payload = hooks.createCurrentSnapshot();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focus-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("已导出本地备份");
  }, [hooks, showToast]);

  const createDiskBackup = useCallback(async (reason = "manual") => {
    const path = await hooks.createDiskBackup(reason);
    if (path) {
      showToast("磁盘备份已创建");
      return path;
    }
    showToast("当前环境不支持磁盘备份，建议使用导出备份");
    return null;
  }, [hooks, showToast]);

  const copyDataPath = useCallback(async () => {
    const dataPath = await getDataFilePath();
    const backupPath = await getBackupDirPath();
    const text = [dataPath && `数据文件：${dataPath}`, backupPath && `备份目录：${backupPath}`]
      .filter(Boolean)
      .join("\n");
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
  }, [showToast]);

  const chooseDataDir = useCallback(async () => {
    try {
      const selected = await open({
        title: "选择 Focus Flow 数据目录",
        directory: true,
        multiple: false,
        canCreateDirectories: true,
      });
      if (!selected || Array.isArray(selected)) return;
      const path = await hooks.setCustomDataDirectory(selected);
      if (!path) {
        showToast("切换数据目录失败");
        return;
      }
      showToast("数据目录已切换");
    } catch {
      showToast("选择数据目录失败");
    }
  }, [hooks, showToast]);

  const restoreDefaultDataDir = useCallback(async () => {
    if (!confirm("确认恢复默认 AppData 数据目录？当前数据会先迁移回默认位置。")) return;
    const path = await hooks.restoreDefaultDataDirectory();
    if (!path) {
      showToast("恢复默认目录失败");
      return;
    }
    showToast("已恢复默认数据目录");
  }, [hooks, showToast]);

  const restoreDiskBackup = useCallback(async (path: string) => {
    if (!confirm("确认恢复这个磁盘备份？当前数据会先自动备份。")) return;
    const success = await hooks.restoreBackup(path);
    if (!success) {
      showToast("备份文件不可用");
      return;
    }
    showToast("已恢复磁盘备份");
  }, [hooks, showToast]);

  const importData = useCallback(async (file?: File) => {
    if (!file) return;
    const success = await hooks.importData(file);
    if (success) {
      showToast("已导入备份，原数据已尝试自动备份");
    } else {
      showToast("导入失败，请检查文件");
    }
  }, [hooks, showToast]);

  const resetAllData = useCallback(async () => {
    if (!confirm("确认重置所有本地数据？此操作不可撤销。")) return;
    await hooks.resetAllData();
    showToast("已重置为初始数据，原数据已尝试自动备份");
  }, [hooks, showToast]);

  return {
    exportData,
    createDiskBackup,
    copyDataPath,
    chooseDataDir,
    restoreDefaultDataDir,
    restoreDiskBackup,
    importData,
    resetAllData,
  };
}
