export type Locale = "zh" | "en";

const LOCALE_KEY = "focus-flow-locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  return (localStorage.getItem(LOCALE_KEY) as Locale) || "zh";
}

export function setStoredLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
}

// All UI strings
const strings = {
  // Header
  "app.title": { zh: "今天，只推进真正重要的事", en: "Focus on what truly matters today" },
  "app.subtitle": { zh: "先收碎片，再把 1-3 个主线任务放到眼前。其它事情等它们该出现时再出现。", en: "Capture fragments first, then keep 1-3 mainline tasks in sight. Everything else can wait." },
  "app.macosApp": { zh: "macOS app", en: "macOS app" },
  "app.diskStorage": { zh: "磁盘存储", en: "Disk storage" },
  "app.browserStorage": { zh: "浏览器存储", en: "Browser storage" },
  "app.loading": { zh: "加载中...", en: "Loading..." },
  "app.cornerWindow": { zh: "角落小窗", en: "Mini window" },

  // Capture
  "capture.title": { zh: "快速录入", en: "Quick Capture" },
  "capture.subtitle": { zh: "先收进来，稍后判断。Cmd+K 聚焦，Cmd+Enter 加入。", en: "Capture first, triage later. Cmd+K to focus, Cmd+Enter to add." },
  "capture.step": { zh: "第一步", en: "Step 1" },
  "capture.submit": { zh: "收进系统", en: "Capture" },
  "capture.placeholder": { zh: "例如：\n- 发布客户方案\n  - 整理会议纪要\n  - 检查 AI 初稿", en: "e.g.:\n- Publish client proposal\n  - Organize meeting notes\n  - Review AI draft" },
  "capture.pending": { zh: "{n} 条待收", en: "{n} pending" },
  "capture.preview": { zh: "输入后预览拆分", en: "Preview after input" },
  "capture.multiLevel": { zh: "Markdown 多级", en: "Markdown multi-level" },
  "capture.multiTask": { zh: "多任务", en: "Multi-task" },
  "capture.options": { zh: "录入选项", en: "Capture options" },
  "capture.optionsHint": { zh: "项目 / 优先级 / 标签", en: "Project / Priority / Tags" },

  // Today mainline
  "mainline.label": { zh: "Mainline", en: "Mainline" },
  "mainline.title": { zh: "Today 主线", en: "Today Mainline" },
  "mainline.subtitle": { zh: "今天真正要推进的任务，只保留最重要的 1 到 3 个。", en: "Tasks to push forward today. Keep only the top 1-3." },
  "mainline.count": { zh: "{n} 条", en: "{n} items" },

  // Triage
  "triage.label": { zh: "Triage", en: "Triage" },
  "triage.title": { zh: "分流处理", en: "Triage" },
  "triage.subtitle": { zh: "Inbox、Review 和 Batch 不必同时处理，挑当前最需要清理的入口就好。拖拽卡片可以在泳道间移动。", en: "No need to process Inbox, Review and Batch at once. Pick the lane that needs attention. Drag cards to move between lanes." },

  // Workbench
  "workbench.control": { zh: "Control", en: "Control" },
  "workbench.diskOk": { zh: "磁盘存储正常", en: "Disk storage OK" },
  "workbench.browserMode": { zh: "浏览器预览模式", en: "Browser preview mode" },
  "workbench.storageLoading": { zh: "存储加载中", en: "Storage loading" },
  "workbench.flowView": { zh: "流程视图", en: "Flow view" },
  "workbench.boardView": { zh: "看板视图", en: "Board view" },
  "workbench.search": { zh: "搜索任务 / 项目 / 标签", en: "Search tasks / projects / tags" },
  "workbench.allTags": { zh: "全部标签", en: "All tags" },
  "workbench.toolbox": { zh: "工具箱：日报 / 项目 / 标签 / 备份", en: "Toolbox: Report / Projects / Tags / Backup" },
  "workbench.expand": { zh: "点击展开", en: "Click to expand" },

  // Focus session
  "focus.label": { zh: "Focus Session", en: "Focus Session" },
  "focus.hidden": { zh: "其它入口已临时收起", en: "Other sections are hidden" },
  "focus.exit": { zh: "退出专注", en: "Exit focus" },
  "focus.running": { zh: "● 专注中", en: "● Focusing" },
  "focus.done": { zh: "✓ 已完成", en: "✓ Done" },
  "focus.paused": { zh: "◉ 已暂停", en: "◉ Paused" },
  "focus.keepFocus": { zh: "保持专注", en: "Stay focused" },
  "focus.wellDone": { zh: "做得好！", en: "Well done!" },
  "focus.ready": { zh: "准备好了吗", en: "Ready?" },
  "focus.freeMode": { zh: "自由专注", en: "Free focus" },
  "focus.hint": { zh: "先把这一轮做完。收集、整理和分流都等番茄结束后再回来。", en: "Finish this round first. Capture, organize and triage can wait until the timer ends." },
  "focus.capture": { zh: "先记下来", en: "Capture now" },
  "focus.captureHint": { zh: "想到新任务时，先丢进 Inbox，不打断当前这轮专注。", en: "When a new task comes to mind, drop it in Inbox without breaking focus." },
  "focus.captureSubmit": { zh: "记下来", en: "Capture" },
  "focus.pause": { zh: "暂停", en: "Pause" },
  "focus.resume": { zh: "继续", en: "Resume" },
  "focus.complete": { zh: "✓ 完成并结束", en: "✓ Complete" },
  "focus.abandon": { zh: "放弃这一轮", en: "Abandon round" },

  // Common
  "common.close": { zh: "关闭", en: "Close" },
  "common.save": { zh: "保存", en: "Save" },
  "common.cancel": { zh: "取消", en: "Cancel" },
  "common.delete": { zh: "删除", en: "Delete" },
  "common.add": { zh: "添加", en: "Add" },
  "common.reset": { zh: "重置", en: "Reset" },
  "common.empty": { zh: "这里还没有内容。", en: "Nothing here yet." },
  "common.emptyHint": { zh: "可以从上方快速录入，或把其它区块的任务拖过来。", en: "Use quick capture above, or drag tasks from other lanes." },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, locale: Locale, replacements?: Record<string, string | number>): string {
  const entry = strings[key];
  let result: string = entry[locale] || entry.zh;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      result = result.replace(`{${k}}`, String(v));
    }
  }
  return result;
}
