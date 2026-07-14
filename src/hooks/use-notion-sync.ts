"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project, Task } from "@/lib/focus-flow-model";
import {
  isNotionConfigComplete,
  loadNotionConfig,
  saveNotionConfig,
  type NotionConfig,
} from "@/lib/notion-config";
import {
  checkSyncAvailability,
  fetchNotionPages,
  reconcileProjects,
  reconcileTasks,
} from "@/lib/notion-sync";

// Notion 数据库的状态属性名与"进行中"分组名（与用户工作区结构对应）
const PROJECTS_STATUS_PROPERTY = "Status";
const TASKS_STATUS_PROPERTY = "Status/状态";
const IN_PROGRESS_GROUP = "In progress";

type UseNotionSyncParams = {
  projects: Project[];
  tasks: Task[];
  applyProjectSync: (nextProjects: Project[]) => void;
  applyTaskSync: (nextTasks: Task[]) => void;
  showToast: (text: string) => void;
};

export function useNotionSync({ projects, tasks, applyProjectSync, applyTaskSync, showToast }: UseNotionSyncParams) {
  const [notionConfig, setNotionConfig] = useState<NotionConfig | null>(null);
  const [isSyncingProjects, setIsSyncingProjects] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);

  useEffect(() => {
    setNotionConfig(loadNotionConfig());
  }, []);

  const saveConfig = useCallback((config: NotionConfig) => {
    saveNotionConfig(config);
    setNotionConfig(config);
    showToast("Notion 配置已保存");
  }, [showToast]);

  const syncProjects = useCallback(async () => {
    if (!notionConfig || !isNotionConfigComplete(notionConfig)) return;
    const availability = await checkSyncAvailability();
    if (!availability.available) {
      showToast(availability.reason || "同步不可用");
      return;
    }
    setIsSyncingProjects(true);
    try {
      const pages = await fetchNotionPages(notionConfig.apiKey, notionConfig.projectsDbId, {
        statusProperty: PROJECTS_STATUS_PROPERTY,
        statusGroup: IN_PROGRESS_GROUP,
      });
      const { nextProjects, result } = reconcileProjects(pages, projects);
      applyProjectSync(nextProjects);
      showToast(`项目同步完成：新增 ${result.created}，更新 ${result.updated}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "同步失败");
    } finally {
      setIsSyncingProjects(false);
    }
  }, [notionConfig, projects, applyProjectSync, showToast]);

  const syncTasks = useCallback(async () => {
    if (!notionConfig || !isNotionConfigComplete(notionConfig)) return;
    const availability = await checkSyncAvailability();
    if (!availability.available) {
      showToast(availability.reason || "同步不可用");
      return;
    }
    setIsSyncingTasks(true);
    try {
      const pages = await fetchNotionPages(notionConfig.apiKey, notionConfig.tasksDbId, {
        statusProperty: TASKS_STATUS_PROPERTY,
        statusGroup: IN_PROGRESS_GROUP,
      });
      const { nextTasks, result } = reconcileTasks(pages, tasks, projects);
      applyTaskSync(nextTasks);
      showToast(`Task 同步完成：新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "同步失败");
    } finally {
      setIsSyncingTasks(false);
    }
  }, [notionConfig, tasks, projects, applyTaskSync, showToast]);

  return {
    notionConfig,
    isConfigComplete: isNotionConfigComplete(notionConfig),
    isSyncingProjects,
    isSyncingTasks,
    saveConfig,
    syncProjects,
    syncTasks,
  };
}
