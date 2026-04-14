"use client";

import { memo } from "react";
import { formatSeconds, type Item, type PomodoroState } from "@/lib/focus-flow-model";

type FloatingPomodoroProps = {
  pomodoro: PomodoroState;
  focusItem?: Item;
  startPomodoro: () => void;
  stopPomodoro: () => void;
  resetPomodoro: () => void;
};

export const FloatingPomodoro = memo(function FloatingPomodoro({ pomodoro, focusItem, startPomodoro, stopPomodoro, resetPomodoro }: FloatingPomodoroProps) {
  const isFinished = pomodoro.secondsLeft === 0;

  return (
    <div className={`fixed left-3 top-2 z-50 max-w-[calc(100vw-1.5rem)] rounded-xl border p-1.5 shadow-2xl shadow-black/30 backdrop-blur ${pomodoro.running ? "border-amber-200/60 bg-amber-950/90" : "border-amber-300/30 bg-zinc-950/85"}`}>
      <div className="flex items-center gap-1.5">
        <div className="rounded-lg bg-amber-300/10 px-2.5 py-1.5">
          <div className="text-[8px] uppercase tracking-[0.16em] text-amber-200/70">Pomodoro</div>
          <div className={`mt-0.5 text-sm font-semibold tabular-nums ${isFinished ? "text-emerald-300" : "text-amber-100"}`}>{formatSeconds(pomodoro.secondsLeft)}</div>
        </div>
        {pomodoro.running && (
          <div className="hidden max-w-44 min-w-0 rounded-lg border border-amber-200/20 bg-black/20 px-2.5 py-1.5 sm:block">
            <div className="text-[8px] uppercase tracking-[0.16em] text-amber-200/60">Focus</div>
            <div className="mt-0.5 truncate text-[11px] font-medium text-amber-50">{focusItem?.content || "自由专注"}</div>
          </div>
        )}
        {!pomodoro.running ? (
          <button onClick={startPomodoro} className="rounded-lg bg-amber-200 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-950 transition hover:bg-amber-100">
            {isFinished ? "再来一轮" : "开始"}
          </button>
        ) : (
          <button onClick={stopPomodoro} className="rounded-lg border border-amber-300/40 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-300/10">
            暂停
          </button>
        )}
        <button onClick={resetPomodoro} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:bg-white/10">重置</button>
      </div>
    </div>
  );
});
