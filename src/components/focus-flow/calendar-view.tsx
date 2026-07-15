"use client";

import { useMemo, useState } from "react";
import {
  formatDayLabel,
  formatWeekRange,
  getItemsForDay,
  getWeekDayLabel,
  getWeekDays,
  isSameDay,
  type CalendarFilter,
  type Item,
} from "@/lib/focus-flow-model";

type CalendarViewProps = {
  items: Item[];
};

type CalendarScope = "week" | "month";

export function CalendarView({ items }: CalendarViewProps) {
  const [scope, setScope] = useState<CalendarScope>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [filter, setFilter] = useState<CalendarFilter>("all");

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  return (
    <div className="space-y-4">
      {/* Top bar: scope toggle + navigator + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ScopeToggle scope={scope} onChange={setScope} />
          {scope === "week" ? (
            <WeekNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
          ) : (
            <MonthNav monthOffset={monthOffset} setMonthOffset={setMonthOffset} />
          )}
        </div>
        <FilterBar filter={filter} onChange={setFilter} />
      </div>

      {/* Content */}
      {scope === "week" ? (
        <WeekGrid items={items} weekOffset={weekOffset} filter={filter} today={today} />
      ) : (
        <MonthGrid items={items} monthOffset={monthOffset} filter={filter} today={today} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScopeToggle
// ---------------------------------------------------------------------------

function ScopeToggle({ scope, onChange }: { scope: CalendarScope; onChange: (s: CalendarScope) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      <button
        onClick={() => onChange("week")}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${scope === "week" ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
      >
        周
      </button>
      <button
        onClick={() => onChange("month")}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${scope === "month" ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
      >
        月
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WeekNav
// ---------------------------------------------------------------------------

function WeekNav({ weekOffset, setWeekOffset }: { weekOffset: number; setWeekOffset: (fn: (v: number) => number) => void }) {
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekLabel = formatWeekRange(weekDays[0], weekDays[6]);
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setWeekOffset((v) => v - 1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10">←</button>
      <span className="min-w-[90px] text-center text-sm font-medium tabular-nums text-zinc-100">{weekLabel}</span>
      <button onClick={() => setWeekOffset((v) => v + 1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10">→</button>
      <button onClick={() => setWeekOffset(() => 0)} disabled={weekOffset === 0} className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2 py-1 text-xs text-teal-200 transition hover:bg-teal-500/20 disabled:opacity-40">本周</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MonthNav
// ---------------------------------------------------------------------------

function MonthNav({ monthOffset, setMonthOffset }: { monthOffset: number; setMonthOffset: (fn: (v: number) => number) => void }) {
  const targetMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const label = `${targetMonth.getFullYear()}年${targetMonth.getMonth() + 1}月`;
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setMonthOffset((v) => v - 1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10">←</button>
      <span className="min-w-[80px] text-center text-sm font-medium text-zinc-100">{label}</span>
      <button onClick={() => setMonthOffset((v) => v + 1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/10">→</button>
      <button onClick={() => setMonthOffset(() => 0)} disabled={monthOffset === 0} className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2 py-1 text-xs text-teal-200 transition hover:bg-teal-500/20 disabled:opacity-40">本月</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { key: CalendarFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "created", label: "新增" },
  { key: "completed", label: "完成" },
];

function FilterBar({ filter, onChange }: { filter: CalendarFilter; onChange: (f: CalendarFilter) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${filter === opt.key ? "bg-white/10 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WeekGrid
// ---------------------------------------------------------------------------

function WeekGrid({ items, weekOffset, filter, today }: { items: Item[]; weekOffset: number; filter: CalendarFilter; today: Date }) {
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekHasData = useMemo(() => weekDays.some((date) => {
    const { created, completed } = getItemsForDay(items, date, "all");
    return created.length > 0 || completed.length > 0;
  }), [items, weekDays]);

  if (!weekHasData) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">这一周没有任何任务记录</p>
        <p className="mt-1 text-xs text-zinc-600">试试切换到其他周看看</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((date) => {
        const { created, completed } = getItemsForDay(items, date, filter);
        return <DayCell key={date.toISOString()} date={date} isToday={isSameDay(date, today)} createdItems={created} completedItems={completed} filter={filter} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MonthGrid
// ---------------------------------------------------------------------------

function getMonthDays(monthOffset: number): Date[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  return days;
}

function MonthGrid({ items, monthOffset, filter, today }: { items: Item[]; monthOffset: number; filter: CalendarFilter; today: Date }) {
  const monthDays = useMemo(() => getMonthDays(monthOffset), [monthOffset]);

  // 补齐前面的空格（让第一天对齐到正确的星期列）
  const firstDayOfWeek = monthDays[0].getDay() || 7; // 1=周一 ... 7=周日
  const padBefore = firstDayOfWeek - 1;

  const monthHasData = useMemo(() => monthDays.some((date) => {
    const { created, completed } = getItemsForDay(items, date, "all");
    return created.length > 0 || completed.length > 0;
  }), [items, monthDays]);

  if (!monthHasData) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">这个月没有任何任务记录</p>
        <p className="mt-1 text-xs text-zinc-600">试试切换到其他月看看</p>
      </div>
    );
  }

  return (
    <div>
      {/* Weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
          <div key={d} className="text-center text-[11px] text-zinc-500">周{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padBefore }).map((_, i) => <div key={`pad-${i}`} />)}
        {monthDays.map((date) => {
          const { created, completed } = getItemsForDay(items, date, filter);
          return <MonthDayCell key={date.toISOString()} date={date} isToday={isSameDay(date, today)} createdCount={created.length} completedCount={completed.length} filter={filter} />;
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MonthDayCell — 月视图中的小格子（只显示数字统计）
// ---------------------------------------------------------------------------

function MonthDayCell({ date, isToday, createdCount, completedCount, filter }: { date: Date; isToday: boolean; createdCount: number; completedCount: number; filter: CalendarFilter }) {
  const hasData = createdCount > 0 || completedCount > 0;
  return (
    <div className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg border p-1 text-center transition ${
      isToday ? "border-teal-400/50 bg-teal-950/20" : hasData ? "border-white/[0.08] bg-white/[0.02]" : "border-transparent"
    }`}>
      <span className={`text-sm ${isToday ? "font-semibold text-teal-200" : "text-zinc-300"}`}>{date.getDate()}</span>
      {hasData && (
        <div className="mt-0.5 flex gap-1 text-[11px]">
          {(filter === "all" || filter === "created") && createdCount > 0 && <span className="text-sky-400">+{createdCount}</span>}
          {(filter === "all" || filter === "completed") && completedCount > 0 && <span className="text-emerald-400">✓{completedCount}</span>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DayCell — 周视图中的日格子
// ---------------------------------------------------------------------------

function DayCell({ date, isToday, createdItems, completedItems, filter }: {
  date: Date; isToday: boolean; createdItems: Item[]; completedItems: Item[]; filter: CalendarFilter;
}) {
  const dayLabel = formatDayLabel(date);
  const weekdayLabel = getWeekDayLabel(date);
  const hasData = createdItems.length > 0 || completedItems.length > 0;

  const displayItems = useMemo(() => {
    const seen = new Set<string>();
    const result: { item: Item; type: "created" | "completed" }[] = [];
    for (const item of completedItems) { if (!seen.has(item.id)) { seen.add(item.id); result.push({ item, type: "completed" }); } }
    for (const item of createdItems) { if (!seen.has(item.id)) { seen.add(item.id); result.push({ item, type: "created" }); } }
    return result;
  }, [createdItems, completedItems]);

  return (
    <div className={`flex h-[220px] flex-col rounded-xl border p-2.5 transition ${
      isToday ? "border-teal-400/50 bg-teal-950/20" : hasData ? "border-white/10 bg-white/[0.02]" : "border-dashed border-white/[0.06] bg-transparent"
    }`}>
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium ${isToday ? "text-teal-200" : "text-zinc-200"}`}>{dayLabel}</span>
          <span className="text-[11px] text-zinc-500">周{weekdayLabel}</span>
        </div>
        {isToday && <span className="rounded-full bg-teal-400/20 px-1.5 py-0.5 text-[10px] font-medium text-teal-200">今天</span>}
      </div>
      {hasData && (
        <div className="mb-2 flex shrink-0 gap-2 text-[11px]">
          {(filter === "all" || filter === "created") && createdItems.length > 0 && <span className="text-sky-300">+{createdItems.length} 新增</span>}
          {(filter === "all" || filter === "completed") && completedItems.length > 0 && <span className="text-emerald-300">✓{completedItems.length} 完成</span>}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
        {displayItems.map(({ item, type }) => (
          <TaskRow key={`${item.id}-${type}`} item={item} type={type} />
        ))}
        {!hasData && <div className="flex flex-1 items-center justify-center"><span className="text-[11px] text-zinc-600">无记录</span></div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskRow — 单条任务：一个类型色点 + 内容（hover 显示全文 tooltip + 复制图标）
// ---------------------------------------------------------------------------

function TaskRow({ item, type }: { item: Item; type: "created" | "completed" }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div
      className="group/row relative flex items-start gap-1.5 rounded px-1.5 py-1 pr-6 text-[13px] leading-snug transition hover:bg-white/[0.04]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: type === "completed" ? "#34d399" : "#38bdf8" }}
      />
      <span className="line-clamp-2 min-w-0 flex-1 break-words text-zinc-200">{item.content}</span>
      <button
        onClick={() => void copy()}
        className={`absolute right-1 top-1 rounded p-0.5 transition ${copied ? "text-emerald-400" : "text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:text-zinc-200"}`}
        title="复制内容"
      >
        {copied ? (
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8.5 6.5 12 13 4" /></svg>
        ) : (
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="1.5" /><path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" /></svg>
        )}
      </button>
      {/* 即时 tooltip：仅当内容较长时才有额外价值 */}
      {hovered && item.content.length > 24 && (
        <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 max-w-[280px] rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs leading-5 text-zinc-100 shadow-xl">
          {item.content}
        </div>
      )}
    </div>
  );
}
