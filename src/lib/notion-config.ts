export const NOTION_CONFIG_KEY = "focus-flow-notion-config-v1";

export type NotionConfig = {
  apiKey: string;
  projectsDbId: string;
  tasksDbId: string;
};

export function loadNotionConfig(): NotionConfig | null {
  try {
    const raw = localStorage.getItem(NOTION_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NotionConfig;
  } catch {
    return null;
  }
}

export function saveNotionConfig(config: NotionConfig): void {
  localStorage.setItem(NOTION_CONFIG_KEY, JSON.stringify(config));
}

export function isNotionConfigComplete(config: NotionConfig | null): boolean {
  if (!config) return false;
  return (
    config.apiKey.length > 0 &&
    config.projectsDbId.length > 0 &&
    config.tasksDbId.length > 0
  );
}
