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
  // 开发模式下允许浏览器环境同步（通过 API route 代理）
  return { available: true };
}

export type FetchOptions = {
  statusProperty?: string;
  statusGroup?: string;
};

export async function fetchNotionPages(apiKey: string, databaseId: string, options?: FetchOptions): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let startCursor: string | undefined;
  let hasMore = true;
  const useTauri = await isTauriRuntime();

  while (hasMore) {
    let data: Record<string, unknown>;

    // 统一通过代理或直接 fetch（Tauri 环境用 plugin-http 绕过 CORS）
    const filters: Record<string, unknown>[] = [
      { property: "Archive", checkbox: { equals: false } },
    ];
    if (options?.statusProperty && options?.statusGroup) {
      filters.push({ property: options.statusProperty, status: { equals: options.statusGroup } });
    }
    const requestBody: Record<string, unknown> = {
      page_size: 100,
      filter: filters.length === 1 ? filters[0] : { and: filters },
    };
    if (startCursor) requestBody.start_cursor = startCursor;

    if (useTauri) {
      // Tauri 环境：用 @tauri-apps/plugin-http 的 fetch 绕过 CORS
      try {
        const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
        const response = await tauriFetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody) as unknown as BodyInit,
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("API Key 无效或已过期");
          if (response.status === 404) throw new Error("数据库 ID 不存在");
          if (response.status === 429) throw new Error("请求过于频繁，请稍后重试");
          throw new Error(`Notion API 错误: ${response.status}`);
        }

        data = await response.json() as Record<string, unknown>;
      } catch (err) {
        if (err instanceof Error && (err.message.includes("API Key") || err.message.includes("数据库") || err.message.includes("频繁") || err.message.includes("Notion API"))) throw err;
        throw new Error(`网络连接失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    } else {
      // 浏览器环境通过 API route 代理
      const response = await fetch("/api/notion-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          databaseId,
          startCursor,
          statusProperty: options?.statusProperty,
          statusGroup: options?.statusGroup,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        if (response.status === 401) throw new Error("API Key 无效或已过期");
        if (response.status === 404) throw new Error("数据库 ID 不存在");
        if (response.status === 429) throw new Error("请求过于频繁，请稍后重试");
        throw new Error((errBody as Record<string, string>).error || `同步失败: ${response.status}`);
      }

      data = await response.json();
    }

    for (const result of (data.results as Array<Record<string, unknown>>)) {
      // Extract name from title property
      let name = "";
      const properties = result.properties as Record<string, Record<string, unknown>>;
      for (const [, prop] of Object.entries(properties)) {
        if (prop.type === "title") {
          const titleParts = (prop.title as Array<Record<string, string>>) || [];
          name = titleParts.map((t) => t.plain_text || "").join("");
          break;
        }
      }

      // Extract project relation ids from "项目" property
      const projectRelationIds: string[] = [];
      const projectProp = properties["项目"];
      if (projectProp && projectProp.type === "relation") {
        const relations = (projectProp.relation as Array<{ id: string }>) || [];
        for (const rel of relations) {
          projectRelationIds.push(rel.id);
        }
      }

      if (name) {
        pages.push({ id: result.id as string, name, projectRelationIds });
      }
    }

    hasMore = (data.has_more as boolean) || false;
    startCursor = (data.next_cursor as string) || undefined;
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
    const relationId = page.projectRelationIds[0];
    if (!relationId) { result.skipped++; continue; }

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
