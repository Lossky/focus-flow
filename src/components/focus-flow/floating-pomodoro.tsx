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
    <div className={`flex items-center gap-1.5 rounded-lg border p-1 ${pomodoro.running ? "border-amber-200/50 bg-amber-950/60" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="rounded px-2 py-0.5">
        <span className={`text-xs font-semibold tabular-nums ${isFinished ? "text-emerald-300" : pomodoro.running ? "text-amber-100" : "text-zinc-300"}`}>
          {formatSeconds(pomodoro.secondsLeft)}
        </span>
      </div>
      {pomodoro.running && focusItem && (
        <span className="hidden max-w-28 truncate text-[10px] text-amber-100/70 lg:inline">{focusItem.content}</span>
      )}
      {!pomodoro.running ? (
        <button onClick={startPomodoro} className="rounded px-2 py-0.5 text-[10px] font-semibold text-amber-200 transition hover:bg-amber-200/10">
          {isFinished ? "再来" : "开始"}
        </button>
      ) : (
        <button onClick={stopPomodoro} className="rounded px-2 py-0.5 text-[10px] font-semibold text-amber-100 transition hover:bg-amber-200/10">
          暂停
        </button>
      )}
      <button onClick={resetPomodoro} className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300">重置</button>
    </div>
  );
});
