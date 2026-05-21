import type { Project, Task } from "@/lib/focus-flow-model";
import { colors } from "@/lib/focus-flow-model";

export type NotionPage = {
  id: string;
  name: string;
  projectRelationIds: string[];
};

export type SyncProjectsResult = {
  created: number;
  updated: number;
  unchanged: number;
};

export type SyncTasksResult = {
  created: number;
  updated: number;
  skipped: number;
  unchanged: number;
};

async function isTauriRuntime(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

export async function checkSyncAvailability(): Promise<{ available: boolean; reason?: string }> {
  if (await isTauriRuntime()) return { available: true };
  return { available: false, reason: "Notion 同步仅在桌面端可用（浏览器环境受 CORS 限制）" };
}

export async function fetchNotionPages(apiKey: string, databaseId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let startCursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const body: Record<string, unknown> = {
      page_size: 100,
      filter: { property: "Archive", checkbox: { equals: false } },
    };
    if (startCursor) body.start_cursor = startCursor;

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("API Key 无效或已过期");
      if (response.status === 404) throw new Error("数据库 ID 不存在");
      if (response.status === 429) throw new Error("请求过于频繁，请稍后重试");
      throw new Error(`Notion API 错误: ${response.status}`);
    }

    const data = await response.json();

    for (const result of data.results) {
      // Extract name from title property
      let name = "";
      for (const [, prop] of Object.entries(result.properties)) {
        if ((prop as Record<string, unknown>).type === "title") {
          const titleParts = (prop as Record<string, unknown[]>).title || [];
          name = titleParts.map((t: unknown) => (t as Record<string, string>).plain_text || "").join("");
          break;
        }
      }

      // Extract project relation ids from "项目" property
      const projectRelationIds: string[] = [];
      const projectProp = result.properties["项目"] as Record<string, unknown> | undefined;
      if (projectProp && projectProp.type === "relation") {
        const relations = (projectProp.relation as Array<{ id: string }>) || [];
        for (const rel of relations) {
          projectRelationIds.push(rel.id);
        }
      }

      if (name) {
        pages.push({ id: result.id, name, projectRelationIds });
      }
    }

    hasMore = data.has_more;
    startCursor = data.next_cursor || undefined;
  }

  return pages;
}

export function reconcileProjects(
  notionPages: NotionPage[],
  localProjects: Project[],
): { nextProjects: Project[]; result: SyncProjectsResult } {
  const result: SyncProjectsResult = { created: 0, updated: 0, unchanged: 0 };
  const nextProjects = [...localProjects];

  for (const page of notionPages) {
    const existingIndex = nextProjects.findIndex(p => p.notionPageId === page.id);
    if (existingIndex >= 0) {
      if (nextProjects[existingIndex].name !== page.name) {
        nextProjects[existingIndex] = { ...nextProjects[existingIndex], name: page.name };
        result.updated++;
      } else {
        result.unchanged++;
      }
    } else {
      nextProjects.push({
        id: crypto.randomUUID(),
        name: page.name,
        color: colors[nextProjects.length % colors.length],
        notionPageId: page.id,
      });
      result.created++;
    }
  }

  return { nextProjects, result };
}

export function reconcileTasks(
  notionPages: NotionPage[],
  localTasks: Task[],
  localProjects: Project[],
): { nextTasks: Task[]; result: SyncTasksResult } {
  const result: SyncTasksResult = { created: 0, updated: 0, skipped: 0, unchanged: 0 };
  const nextTasks = [...localTasks];
  const now = new Date().toISOString();

  for (const page of notionPages) {
    // 取第一个关联项目的 Notion page id
    const relationId = page.projectRelationIds[0];
    if (!relationId) { result.skipped++; continue; }

    // 通过 relation 的 notionPageId 查找本地 Project
    const localProject = localProjects.find(p => p.notionPageId === relationId);
    if (!localProject) { result.skipped++; continue; }

    const existingIndex = nextTasks.findIndex(t => t.notionPageId === page.id);
    if (existingIndex >= 0) {
      if (nextTasks[existingIndex].name !== page.name) {
        nextTasks[existingIndex] = { ...nextTasks[existingIndex], name: page.name, updatedAt: now };
        result.updated++;
      } else {
        result.unchanged++;
      }
    } else {
      nextTasks.push({
        id: crypto.randomUUID(),
        name: page.name,
        projectId: localProject.id,
        notionPageId: page.id,
        createdAt: now,
        updatedAt: now,
      });
      result.created++;
    }
  }

  return { nextTasks, result };
}
