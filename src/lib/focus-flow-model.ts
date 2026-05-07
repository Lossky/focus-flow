export type ItemType = "task" | "candidate" | "draft" | "note";
export type ItemStatus = "inbox" | "today" | "batch" | "review" | "done" | "archived";
export type ItemSource = "manual" | "feishu" | "ai" | "obsidian" | "doc" | "other";
export type Priority = "high" | "medium" | "low";
export type RepeatType = "none" | "daily" | "weekly";
export type ViewMode = "flow" | "board" | "calendar";
export type StorageMode = "loading" | "disk" | "local";
export type ItemHistoryType = "created" | "status_changed" | "edited" | "completed" | "archived" | "merged";
export type ItemHistoryEntry = {
  type: ItemHistoryType;
  from?: ItemStatus;
  to?: ItemStatus;
  at: string;
  note?: string;
};
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
  plannedFor?: string;
  output?: string;
  estimateMinutes?: number;
  blockedBy?: string;
  waitingFor?: string;
  mergedFrom?: string[];
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
  history?: ItemHistoryEntry[];
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

export type TaskMaturity = { score: number; level: "weak" | "medium" | "strong"; reasons: string[] };
export type TodayLoad = { totalMinutes: number; taskCount: number; level: "light" | "balanced" | "full" | "overloaded"; message: string };
export type AgingSignal = { level: "warning" | "danger"; days: number; message: string };
export type ProjectPressure = {
  project: Project;
  openCount: number;
  todayCount: number;
  reviewCount: number;
  blockedCount: number;
  agingCount: number;
  totalEstimateMinutes: number;
  score: number;
  pressureLevel: "low" | "medium" | "high";
};
export type MergeSuggestionGroup = { key: string; items: Item[]; reason: string };

const actionWords = ["梳理", "输出", "确认", "评审", "跟进", "整理", "完成", "推进", "设计", "写", "发", "处理", "沟通", "对齐", "复盘"];
const outputWords = ["清单", "方案", "原型", "文档", "问题", "纪要", "范围", "计划", "结论", "材料", "报告", "版本", "字段", "流程"];
const vagueWords = ["看看", "弄一下", "处理下", "跟进下", "想一下", "研究下", "搞一下", "看下"];
const mergeKeywords = ["后台", "企业", "产业链", "权限", "字段", "配置", "维护", "客户", "方案", "原型", "页面", "流程", "评审", "需求"];

function isOpenItem(item: Item) {
  return item.status !== "done" && item.status !== "archived" && !item.completedAt;
}

function daysSince(value: string | undefined, now = new Date()) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

export function analyzeTaskMaturity(item: Item): TaskMaturity {
  const text = `${item.content} ${item.output || ""}`;
  const reasons: string[] = [];
  let score = 100;
  if (item.content.trim().length < 8) {
    score -= 20;
    reasons.push("标题偏短");
  }
  if (!actionWords.some((word) => text.includes(word))) {
    score -= 25;
    reasons.push("缺少明确动作");
  }
  if (!item.output?.trim() && !outputWords.some((word) => text.includes(word))) {
    score -= 25;
    reasons.push("缺少产出物");
  }
  if (vagueWords.some((word) => text.includes(word))) {
    score -= 25;
    reasons.push("包含模糊表达");
  }
  if (!item.projectId) {
    score -= 10;
    reasons.push("未关联项目");
  }
  const normalizedScore = Math.max(0, Math.min(100, score));
  return {
    score: normalizedScore,
    level: normalizedScore >= 80 ? "strong" : normalizedScore >= 60 ? "medium" : "weak",
    reasons,
  };
}

export function analyzeTodayLoad(items: Item[]): TodayLoad {
  const todayItems = items.filter((item) => item.status === "today" && isOpenItem(item));
  const totalMinutes = todayItems.reduce((sum, item) => sum + (item.estimateMinutes || 0), 0);
  const hours = Number((totalMinutes / 60).toFixed(1));
  const level: TodayLoad["level"] = totalMinutes === 0
    ? todayItems.length > 5 ? "full" : "balanced"
    : totalMinutes >= 420 ? "overloaded" : totalMinutes > 300 ? "full" : totalMinutes >= 180 ? "balanced" : "light";
  const messageMap: Record<TodayLoad["level"], string> = {
    light: `Today 预计 ${hours}小时，负载偏轻，可补一个低风险推进项。`,
    balanced: totalMinutes ? `Today 预计 ${hours}小时，负载基本合理。` : `Today 有 ${todayItems.length} 条，建议补充预计耗时。`,
    full: totalMinutes ? `Today 预计 ${hours}小时，偏满，建议保留 1-3 个主线。` : `Today 有 ${todayItems.length} 条，偏满，建议精简。`,
    overloaded: `Today 预计 ${hours}小时，明显超载，建议移出低优先级任务。`,
  };
  return { totalMinutes, taskCount: todayItems.length, level, message: messageMap[level] };
}

export function getAgingLevel(item: Item, now = new Date()): AgingSignal | undefined {
  if (!isOpenItem(item)) return undefined;
  const days = daysSince(item.updatedAt || item.createdAt, now);
  const thresholds: Partial<Record<ItemStatus, { warning: number; danger: number; label: string }>> = {
    inbox: { warning: 3, danger: 7, label: "Inbox 超过 3 天未分流" },
    review: { warning: 5, danger: 7, label: "Review 超过 5 天未决策" },
    today: { warning: 2, danger: 4, label: "Today 连续多天未完成" },
    batch: { warning: 14, danger: 21, label: "Batch 长期未处理" },
  };
  const threshold = thresholds[item.status];
  if (!threshold || days < threshold.warning) return undefined;
  const level = days >= threshold.danger ? "danger" : "warning";
  return { level, days, message: `${threshold.label}（${days}天）` };
}

export function summarizeProjectPressure(items: Item[], projects: Project[], now = new Date()): ProjectPressure[] {
  return projects.map((project) => {
    const projectItems = items.filter((item) => (item.projectId || "default") === project.id && isOpenItem(item));
    const todayCount = projectItems.filter((item) => item.status === "today").length;
    const reviewCount = projectItems.filter((item) => item.status === "review").length;
    const blockedCount = projectItems.filter((item) => item.blockedBy?.trim() || item.waitingFor?.trim()).length;
    const agingCount = projectItems.filter((item) => getAgingLevel(item, now)).length;
    const totalEstimateMinutes = projectItems.reduce((sum, item) => sum + (item.estimateMinutes || 0), 0);
    const score = projectItems.length + todayCount + reviewCount + blockedCount * 2 + agingCount + Math.floor(totalEstimateMinutes / 120);
    const pressureLevel: ProjectPressure["pressureLevel"] = score >= 6 ? "high" : score >= 3 ? "medium" : "low";
    return {
      project,
      openCount: projectItems.length,
      todayCount,
      reviewCount,
      blockedCount,
      agingCount,
      totalEstimateMinutes,
      score,
      pressureLevel,
    };
  }).sort((left, right) => right.score - left.score);
}

function getMergeTokens(item: Item) {
  const text = item.content;
  return mergeKeywords.filter((keyword) => text.includes(keyword));
}

function shareAnyToken(left: Item, right: Item) {
  const leftTokens = new Set(getMergeTokens(left));
  return getMergeTokens(right).some((token) => leftTokens.has(token));
}

export function suggestMergeGroups(items: Item[]): MergeSuggestionGroup[] {
  const openItems = items.filter(isOpenItem);
  const usedIds = new Set<string>();
  const groups: MergeSuggestionGroup[] = [];

  openItems.forEach((seed) => {
    if (usedIds.has(seed.id) || !getMergeTokens(seed).length) return;
    const groupItems = openItems.filter((candidate) =>
      candidate.id !== seed.id
      && !usedIds.has(candidate.id)
      && (candidate.projectId || "default") === (seed.projectId || "default")
      && shareAnyToken(seed, candidate),
    );
    if (!groupItems.length) return;
    const merged = [seed, ...groupItems];
    merged.forEach((item) => usedIds.add(item.id));
    const tokens = Array.from(new Set(merged.flatMap(getMergeTokens))).slice(0, 3);
    groups.push({ key: `${seed.projectId || "default"}:${tokens.join("+")}`, items: merged, reason: `同项目内都包含 ${tokens.join("、")} 等关键词` });
  });

  return groups.slice(0, 5);
}

export function createSeedItems(): Item[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(), content: "把今天会议纪要整理成待办", source: "manual", type: "task", status: "inbox", priority: "medium", projectId: "default",
      tags: ["会议"], repeatType: "none", createdAt: now, updatedAt: now, aiSuggestion: { type: "task", status: "batch", reason: "像明确动作项，适合批处理。" }, history: [{ type: "created", to: "inbox", at: now }],
    },
    {
      id: crypto.randomUUID(), content: "AI 给了一版需求方案初稿，待我审", source: "ai", type: "draft", status: "review", priority: "medium", projectId: "default",
      tags: ["PRD"], repeatType: "none", createdAt: now, updatedAt: now, aiSuggestion: { type: "draft", status: "review", reason: "更像待审内容，不该直接进正式任务。" }, history: [{ type: "created", to: "review", at: now }],
    },
    {
      id: crypto.randomUUID(), content: "本周主线：把客户方案评审版发出去", source: "manual", type: "task", status: "today", priority: "high", projectId: "default",
      tags: ["客户", "紧急"], repeatType: "none", createdAt: now, updatedAt: now, isMainline: true, aiSuggestion: { type: "task", status: "today", reason: "高优先级主线任务。" }, history: [{ type: "created", to: "today", at: now }],
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

// ---------------------------------------------------------------------------
// Calendar view utilities
// ---------------------------------------------------------------------------

export type CalendarFilter = "all" | "created" | "completed";

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function getWeekDayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

export function getWeekDays(weekOffset = 0): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // getDay(): 0=周日, 1=周一, ..., 6=周六
  const dayOfWeek = today.getDay() || 7; // 把周日从 0 转为 7
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek - 1) + weekOffset * 7);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatWeekRange(start: Date, end: Date): string {
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}

export function formatDayLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function isSameDay(date: Date, other: Date): boolean {
  return date.getFullYear() === other.getFullYear()
    && date.getMonth() === other.getMonth()
    && date.getDate() === other.getDate();
}

export function getItemsForDay(
  items: Item[],
  date: Date,
  filter: CalendarFilter,
): { created: Item[]; completed: Item[] } {
  const key = getTodayKey(date);
  const created = filter === "completed" ? [] : items.filter((item) => item.createdAt?.slice(0, 10) === key);
  const completed = filter === "created" ? [] : items.filter((item) => item.completedAt?.slice(0, 10) === key);
  return { created, completed };
}
