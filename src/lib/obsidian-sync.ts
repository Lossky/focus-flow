import type { Item } from "./focus-flow-model";

export type ObsidianCaptureEntry = {
  content: string;
  sourcePath: string;
  lineNumber: number;
  dateKey?: string;
  time?: string;
  focusFlowMarked: boolean;
  footers: string[];
  rawBlock: string;
  rawLine: string;
};

export type MergeObsidianCaptureOptions = {
  projectId?: string;
  now?: Date;
};

export type MergeObsidianCaptureResult = {
  nextItems: Item[];
  imported: Item[];
  skipped: ObsidianCaptureEntry[];
};

function normalizeText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `obs-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function classifyImportedContent(value: string) {
  const text = value.trim();
  const lower = text.toLowerCase();
  const draftWords = ["初稿", "草稿", "纪要", "总结", "提纲", "方案稿"];
  const taskWords = ["整理", "跟进", "输出", "处理", "发", "确认", "推进", "写一版", "沟通", "对齐"];
  const noteWords = ["想法", "灵感", "记录", "备忘"];
  if (draftWords.some((word) => text.includes(word))) return { type: "draft" as const };
  if (taskWords.some((word) => text.includes(word)) || lower.includes("todo")) return { type: "task" as const };
  if (noteWords.some((word) => text.includes(word))) return { type: "note" as const };
  return { type: "candidate" as const };
}

export function parseObsidianCaptureMarkdown(markdown: string, options: { sourcePath?: string } = {}): ObsidianCaptureEntry[] {
  const sourcePath = options.sourcePath || "obsidian-capture.md";
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const entries: ObsidianCaptureEntry[] = [];
  let currentDateKey: string | undefined;

  const pushCurrent = (current: { lineNumber: number; rawLine: string; content: string; time?: string; block: string[] }) => {
    const rawBlock = current.block.join("\n");
    const focusFlowMarked = /FocusFlow|#FocusFlow|转入\s*FocusFlow/i.test(rawBlock);
    if (!focusFlowMarked) return;

    const footers = current.block
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => /^(?:-\s*)?(?:备注|后续|标签)[:：]/.test(line));

    entries.push({
      content: normalizeText(current.content),
      sourcePath,
      lineNumber: current.lineNumber,
      dateKey: currentDateKey,
      time: current.time,
      focusFlowMarked,
      footers,
      rawBlock,
      rawLine: current.rawLine,
    });
  };

  let current: { lineNumber: number; rawLine: string; content: string; time?: string; block: string[] } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();
    const headingMatch = /^#{1,6}\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(headingMatch[1]);
      currentDateKey = dateMatch?.[1] || currentDateKey;
      if (current) {
        pushCurrent(current);
        current = null;
      }
      continue;
    }

    const taskMatch = /^- \[ \] (\d{2}:\d{2})\s+(.+)$/.exec(line.trim());
    if (taskMatch) {
      if (current) pushCurrent(current);
      current = {
        lineNumber: i + 1,
        rawLine: line,
        time: taskMatch[1],
        content: taskMatch[2].trim(),
        block: [],
      };
      continue;
    }

    if (!current) continue;
    if (/^#{1,6}\s+/.test(line.trim())) {
      pushCurrent(current);
      current = null;
      continue;
    }

    if (line.trim().length === 0 && current.block.length === 0) {
      continue;
    }

    current.block.push(line);
  }

  if (current) pushCurrent(current);
  return entries;
}

export function mergeObsidianCaptureItems(existingItems: Item[], entries: ObsidianCaptureEntry[], options: MergeObsidianCaptureOptions = {}): MergeObsidianCaptureResult {
  const now = (options.now || new Date()).toISOString();
  const existingKeys = new Set(
    existingItems.map((item) => normalizeText(item.rawInput || item.content)),
  );

  const imported: Item[] = [];
  const skipped: ObsidianCaptureEntry[] = [];
  const nextItems = [...existingItems];
  const projectId = options.projectId || "default";

  for (const entry of entries) {
    const key = normalizeText(entry.content);
    if (!key || existingKeys.has(key)) {
      skipped.push(entry);
      continue;
    }

    existingKeys.add(key);
    const suggestion = classifyImportedContent(entry.content);
    const type = suggestion.type === "note" ? "candidate" : suggestion.type;
    const item: Item = {
      id: createId(),
      content: entry.content,
      source: "obsidian",
      type,
      status: "inbox",
      priority: "medium",
      projectId,
      repeatType: "none",
      createdAt: now,
      updatedAt: now,
      rawInput: entry.content,
      aiSuggestion: {
        type,
        status: "inbox",
        reason: "从 Obsidian 捕获台的 FocusFlow 标记自动导入。",
      },
      tags: [],
      isMainline: false,
      depth: 0,
      history: [{ type: "created", to: "inbox", at: now, note: `imported from ${entry.sourcePath}:${entry.lineNumber}` }],
    };
    imported.push(item);
    nextItems.push(item);
  }

  return { nextItems, imported, skipped };
}
