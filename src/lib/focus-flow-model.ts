export type ItemType = "task" | "candidate" | "draft" | "note";
export type ItemStatus = "inbox" | "today" | "batch" | "review" | "done" | "archived";
export type ItemSource = "manual" | "feishu" | "ai" | "obsidian" | "doc" | "other";
export type Priority = "high" | "medium" | "low";
export type RepeatType = "none" | "daily" | "weekly";
export type ViewMode = "flow" | "board";
export type StorageMode = "loading" | "disk" | "local";
export type DailySessionStats = {
  date: string;
  focusCount: number;
  restCount: number;
  lastFocusAt?: string;
  lastRestAt?: string;
};

export type Project = { id: string; name: string; color: string };
export type TagDef = { id: string; name: string; color: string };

export type Item = {
  id: string;
  content: string;
  source: ItemSource;
  type: ItemType;
  status: ItemStatus;
  priority: Priority;
  projectId?: string;
  dueDate?: string;
  completedAt?: string;
  repeatType?: RepeatType;
  tags?: string[];
  result?: string;
  createdAt: string;
  updatedAt: string;
  rawInput?: string;
  aiSuggestion?: { type: ItemType; status: ItemStatus; reason: string };
  isMainline?: boolean;
  parentId?: string;
  depth?: number;
};

export type PomodoroState = { running: boolean; secondsLeft: number; taskId?: string };
export type ToastState = { show: boolean; text: string };
export type DragState = { draggingId?: string; overStatus?: ItemStatus };
export type ExportPayload = {
  version: number;
  exportedAt: string;
  items: Item[];
  projects: Project[];
  tags: TagDef[];
  reports: { date: string; content: string }[];
  sessionStats?: DailySessionStats;
};
export type WidgetSnapshotItem = {
  id: string;
  content: string;
  parentId?: string;
  depth?: number;
  projectName: string;
  projectColor: string;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  isMainline: boolean;
  updatedAt: string;
};
export type ParsedTaskInput = {
  content: string;
  depth: number;
  parentIndex?: number;
};
export type WidgetSnapshot = {
  version: 1;
  generatedAt: string;
  storage: {
    mode: StorageMode;
    healthy: boolean;
  };
  counts: {
    inbox: number;
    today: number;
    review: number;
    batch: number;
    mainline: number;
  };
  todayItems: WidgetSnapshotItem[];
  mainlineItems: WidgetSnapshotItem[];
  nextItem?: WidgetSnapshotItem;
};

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDefaultDailySessionStats(date = getTodayKey()): DailySessionStats {
  return {
    date,
    focusCount: 0,
    restCount: 0,
  };
}

export const STORAGE_KEY = "focus-flow-items-v1";
export const PROJECTS_KEY = "focus-flow-projects-v1";
export const TAGS_KEY = "focus-flow-tags-v1";
export const REPORTS_KEY = "focus-flow-reports-v1";
export const SESSION_STATS_KEY = "focus-flow-session-stats-v1";
export const POMODORO_SECONDS = 25 * 60;

export const defaultProjects: Project[] = [{ id: "default", name: "默认项目", color: "#71717a" }];
export const defaultTags: TagDef[] = [
  { id: "customer", name: "客户", color: "#3b82f6" },
  { id: "prd", name: "PRD", color: "#8b5cf6" },
  { id: "urgent", name: "紧急", color: "#ef4444" },
  { id: "meeting", name: "会议", color: "#14b8a6" },
];
export const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#71717a"];

export const statusLabel: Record<ItemStatus, string> = { inbox: "Inbox", today: "Today", batch: "Batch", review: "Review", done: "Done", archived: "Archived" };
export const sourceLabel: Record<ItemSource, string> = { manual: "手动", feishu: "飞书", ai: "AI", obsidian: "Obsidian", doc: "文档", other: "其他" };
export const repeatLabel: Record<RepeatType, string> = { none: "不重复", daily: "每日", weekly: "每周" };
export const priorityLabel: Record<Priority, string> = { high: "高优先级", medium: "中优先级", low: "低优先级" };
export const priorityTone: Record<Priority, { label: string; accent: string; chipClass: string; summaryClass: string }> = {
  high: {
    label: "高",
    accent: "#fb7185",
    chipClass: "border-rose-400/50 bg-rose-500/10 text-rose-200",
    summaryClass: "text-rose-300",
  },
  medium: {
    label: "中",
    accent: "#fbbf24",
    chipClass: "border-amber-300/40 bg-amber-300/10 text-amber-100",
    summaryClass: "text-amber-200",
  },
  low: {
    label: "低",
    accent: "#2dd4bf",
    chipClass: "border-teal-300/30 bg-teal-300/10 text-teal-200",
    summaryClass: "text-teal-200",
  },
};

export function createSeedItems(): Item[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(), content: "把今天会议纪要整理成待办", source: "manual", type: "task", status: "inbox", priority: "medium", projectId: "default",
      tags: ["会议"], repeatType: "none", createdAt: now, updatedAt: now, aiSuggestion: { type: "task", status: "batch", reason: "像明确动作项，适合批处理。" },
    },
    {
      id: crypto.randomUUID(), content: "AI 给了一版需求方案初稿，待我审", source: "ai", type: "draft", status: "review", priority: "medium", projectId: "default",
      tags: ["PRD"], repeatType: "none", createdAt: now, updatedAt: now, aiSuggestion: { type: "draft", status: "review", reason: "更像待审内容，不该直接进正式任务。" },
    },
    {
      id: crypto.randomUUID(), content: "本周主线：把客户方案评审版发出去", source: "manual", type: "task", status: "today", priority: "high", projectId: "default",
      tags: ["客户", "紧急"], repeatType: "none", createdAt: now, updatedAt: now, isMainline: true, aiSuggestion: { type: "task", status: "today", reason: "高优先级主线任务。" },
    },
  ];
}

function stripMarkdownTaskText(value: string) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\[[ xX]\]\s+/, "")
    .trim();
}

function parseMarkdownTaskInput(text: string): ParsedTaskInput[] {
  const stack: { depth: number; index: number }[] = [];
  const tasks: ParsedTaskInput[] = [];

  text.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const listMatch = /^(\s*)(?:[-*+]\s+|\d+[.)、]\s+)(.+)$/.exec(line);
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (!listMatch && !headingMatch) return;

    const rawDepth = listMatch ? Math.floor(listMatch[1].replace(/\t/g, "  ").length / 2) : headingMatch ? headingMatch[1].length - 1 : 0;
    const content = stripMarkdownTaskText(listMatch ? listMatch[2] : headingMatch?.[2] || "");
    if (!content) return;

    while (stack.length && stack[stack.length - 1].depth >= rawDepth) stack.pop();
    const parentIndex = stack[stack.length - 1]?.index;
    const index = tasks.length;
    tasks.push({ content, depth: Math.min(rawDepth, 4), parentIndex });
    stack.push({ depth: rawDepth, index });
  });

  return tasks;
}

export function parseTaskInput(text: string): ParsedTaskInput[] {
  const markdownTasks = parseMarkdownTaskInput(text);
  if (markdownTasks.length) return markdownTasks;

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) return lines.map((content) => ({ content: stripMarkdownTaskText(content), depth: 0 })).filter((task) => task.content);
  if (text.includes("；") || text.includes(";")) return text.split(/[；;]/).map((value) => ({ content: stripMarkdownTaskText(value), depth: 0 })).filter((task) => task.content);
  if (/^\d+[.、]\s*.+/.test(text)) return text.split(/\d+[.、]\s*/).map((value) => ({ content: stripMarkdownTaskText(value), depth: 0 })).filter((task) => task.content);
  return [{ content: stripMarkdownTaskText(text), depth: 0 }].filter((task) => task.content);
}

export function parseMultiTask(text: string): string[] {
  return parseTaskInput(text).map((task) => task.content);
}

export function getAncestorItems(item: Item, itemById: Map<string, Item>) {
  const ancestors: Item[] = [];
  let currentParentId = item.parentId;

  while (currentParentId) {
    const parent = itemById.get(currentParentId);
    if (!parent) break;
    ancestors.unshift(parent);
    currentParentId = parent.parentId;
  }

  return ancestors;
}

export function buildChildCountMap(items: Item[]) {
  return items.reduce((counts, item) => {
    if (!item.parentId) return counts;
    counts.set(item.parentId, (counts.get(item.parentId) || 0) + 1);
    return counts;
  }, new Map<string, number>());
}

export function filterVisibleTreeItems(items: Item[], collapsedItemIds: Set<string>) {
  if (!collapsedItemIds.size) return items;
  const itemById = new Map(items.map((item) => [item.id, item]));
  const currentItemIds = new Set(items.map((item) => item.id));

  return items.filter((item) => {
    let currentParentId = item.parentId;
    while (currentParentId) {
      if (currentItemIds.has(currentParentId) && collapsedItemIds.has(currentParentId)) return false;
      currentParentId = itemById.get(currentParentId)?.parentId;
    }
    return true;
  });
}

export function classifyInput(text: string): NonNullable<Item["aiSuggestion"]> {
  const value = text.trim();
  const lower = value.toLowerCase();
  const draftWords = ["初稿", "草稿", "纪要", "总结", "提纲", "方案稿"];
  const taskWords = ["整理", "跟进", "输出", "处理", "发", "确认", "推进", "写一版"];
  const noteWords = ["想法", "灵感", "记录", "备忘"];
  const highWords = ["今天", "尽快", "马上", "必须"];
  if (draftWords.some((word) => value.includes(word))) return { type: "draft", status: "review", reason: "检测到草稿/纪要类关键词，建议先进入待审区。" };
  if (taskWords.some((word) => value.includes(word)) || lower.includes("todo")) return { type: "task", status: highWords.some((word) => value.includes(word)) ? "today" : "inbox", reason: highWords.some((word) => value.includes(word)) ? "带有时效信号，建议今天处理。" : "先进入 Inbox，后续再手动分流到 Today / Batch。" };
  if (noteWords.some((word) => value.includes(word))) return { type: "note", status: "archived", reason: "更像记录，不建议直接进入待办。" };
  return { type: "candidate", status: "inbox", reason: "暂时无法确定，先作为候选项进入 Inbox。" };
}

export function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function parseLocalDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  return new Date(value);
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return parseLocalDate(value).toLocaleDateString("zh-CN");
}

export function isDateBeforeToday(value?: string) {
  if (!value) return false;
  const date = parseLocalDate(value);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

export function addDaysToDate(value: string | undefined, days: number) {
  const date = value ? parseLocalDate(value) : new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function createWidgetSnapshot({ items, projects, storageMode }: { items: Item[]; projects: Project[]; storageMode: StorageMode }): WidgetSnapshot {
  const getProject = (id?: string) => projects.find((project) => project.id === id) || defaultProjects[0];
  const isOpen = (item: Item) => item.status !== "done" && item.status !== "archived";
  const toWidgetItem = (item: Item): WidgetSnapshotItem => {
    const project = getProject(item.projectId);
    return {
      id: item.id,
      content: item.content,
      parentId: item.parentId,
      depth: item.depth || 0,
      projectName: project.name,
      projectColor: project.color,
      priority: item.priority,
      dueDate: item.dueDate,
      tags: item.tags || [],
      isMainline: !!item.isMainline && isOpen(item),
      updatedAt: item.updatedAt,
    };
  };
  const sortForWidget = (left: Item, right: Item) => {
    if (!!right.isMainline !== !!left.isMainline) return Number(!!right.isMainline) - Number(!!left.isMainline);
    if (right.priority !== left.priority) return priorityRank[right.priority] - priorityRank[left.priority];
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  };
  const todayItems = items.filter((item) => item.status === "today" && isOpen(item)).sort(sortForWidget).map(toWidgetItem);
  const mainlineItems = items.filter((item) => item.isMainline && isOpen(item)).sort(sortForWidget).map(toWidgetItem);

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    storage: {
      mode: storageMode,
      healthy: storageMode === "disk",
    },
    counts: {
      inbox: items.filter((item) => item.status === "inbox").length,
      today: todayItems.length,
      review: items.filter((item) => item.status === "review").length,
      batch: items.filter((item) => item.status === "batch").length,
      mainline: mainlineItems.length,
    },
    todayItems: todayItems.slice(0, 6),
    mainlineItems: mainlineItems.slice(0, 6),
    nextItem: mainlineItems[0] || todayItems[0],
  };
}

const priorityRank: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};
