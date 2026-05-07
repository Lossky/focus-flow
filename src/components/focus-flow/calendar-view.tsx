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
  type Project,
} from "@/lib/focus-flow-model";

const MAX_DISPLAY_COUNT = 4;

type CalendarViewProps = {
  items: Item[];
  getProjectById: (id?: string) => Project;
};

export function CalendarView({ items, getProjectById }: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<CalendarFilter>("all");

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekLabel = formatWeekRange(weekDays[0], weekDays[6]);
  const isCurrentWeek = weekOffset === 0;
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const weekHasData = useMemo(() => {
    return weekDays.some((date) => {
      const { created, completed } = getItemsForDay(items, date, "all");
      return created.length > 0 || completed.length > 0;
    });
  }, [items, weekDays]);

  return (
    <div className="space-y-4">
      {/* Week navigator + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekNavigator
          weekLabel={weekLabel}
          isCurrentWeek={isCurrentWeek}
          onPrev={() => setWeekOffset((v) => v - 1)}
          onNext={() => setWeekOffset((v) => v + 1)}
          onToday={() => setWeekOffset(0)}
        />
        <FilterBar filter={filter} onChange={setFilter} />
      </div>

      {/* Week grid */}
      {weekHasData ? (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const { created, completed } = getItemsForDay(items, date, filter);
            return (
              <DayCell
                key={date.toISOString()}
                date={date}
                isToday={isSameDay(date, today)}
                createdItems={created}
                completedItems={completed}
                filter={filter}
                getProjectById={getProjectById}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">这一周没有任何任务记录</p>
          <p className="mt-1 text-xs text-zinc-600">试试切换到其他周看看</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WeekNavigator
// ---------------------------------------------------------------------------

function WeekNavigator({
  weekLabel,
  isCurrentWeek,
  onPrev,
  onNext,
  onToday,
}: {
  weekLabel: string;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
      >
        ← 上一周
      </button>
      <span className="min-w-[100px] text-center text-sm font-medium tabular-nums text-zinc-100">
        {weekLabel}
      </span>
      <button
        onClick={onNext}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
      >
        下一周 →
      </button>
      <button
        onClick={onToday}
        disabled={isCurrentWeek}
        className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-1.5 text-xs text-teal-200 transition hover:bg-teal-500/20 disabled:opacity-40 disabled:hover:bg-teal-500/10"
      >
        本周
      </button>
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
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            filter === opt.key
              ? "bg-white/10 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DayCell
// ---------------------------------------------------------------------------

function DayCell({
  date,
  isToday,
  createdItems,
  completedItems,
  filter,
  getProjectById,
}: {
  date: Date;
  isToday: boolean;
  createdItems: Item[];
  completedItems: Item[];
  filter: CalendarFilter;
  getProjectById: (id?: string) => Project;
}) {
  const dayLabel = formatDayLabel(date);
  const weekdayLabel = getWeekDayLabel(date);
  const hasData = createdItems.length > 0 || completedItems.length > 0;

  // 合并展示列表：先完成后新增，去重（同一个 item 可能同天创建又完成）
  const displayItems = useMemo(() => {
    const seen = new Set<string>();
    const result: { item: Item; type: "created" | "completed" }[] = [];

    for (const item of completedItems) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push({ item, type: "completed" });
      }
    }
    for (const item of createdItems) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push({ item, type: "created" });
      }
    }
    return result;
  }, [createdItems, completedItems]);

  const visibleItems = displayItems.slice(0, MAX_DISPLAY_COUNT);
  const overflowCount = displayItems.length - MAX_DISPLAY_COUNT;

  return (
    <div
      className={`flex min-h-[160px] flex-col rounded-xl border p-2.5 transition ${
        isToday
          ? "border-teal-400/50 bg-teal-950/20"
          : hasData
            ? "border-white/10 bg-white/[0.02]"
            : "border-dashed border-white/[0.06] bg-transparent"
      }`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${isToday ? "text-teal-200" : "text-zinc-200"}`}>
            {dayLabel}
          </span>
          <span className="text-[10px] text-zinc-500">周{weekdayLabel}</span>
        </div>
        {isToday && (
          <span className="rounded-full bg-teal-400/20 px-1.5 py-0.5 text-[9px] font-medium text-teal-200">
            今天
          </span>
        )}
      </div>

      {/* Stats */}
      {hasData && (
        <div className="mb-2 flex gap-2 text-[10px]">
          {(filter === "all" || filter === "created") && createdItems.length > 0 && (
            <span className="text-sky-300">+{createdItems.length} 新增</span>
          )}
          {(filter === "all" || filter === "completed") && completedItems.length > 0 && (
            <span className="text-emerald-300">✓{completedItems.length} 完成</span>
          )}
        </div>
      )}

      {/* Task list */}
      <div className="flex flex-1 flex-col gap-1">
        {visibleItems.map(({ item, type }) => {
          const project = getProjectById(item.projectId);
          return (
            <div
              key={`${item.id}-${type}`}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] leading-tight"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: type === "completed" ? "#34d399" : "#38bdf8" }}
              />
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="min-w-0 truncate text-zinc-300">{item.content}</span>
            </div>
          );
        })}
        {overflowCount > 0 && (
          <span className="mt-auto px-1.5 text-[10px] text-zinc-500">+{overflowCount} 条</span>
        )}
        {!hasData && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-[10px] text-zinc-600">无记录</span>
          </div>
        )}
      </div>
    </div>
  );
}
