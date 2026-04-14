"use client";

import { memo, useEffect, useRef, useState, useMemo } from "react";
import { formatSeconds, parseTaskInput, POMODORO_SECONDS, type Item, type PomodoroState, type Project } from "@/lib/focus-flow-model";
import { PixelHeart } from "./pixel-art";

type FocusSessionProps = {
  pomodoro: PomodoroState;
  focusItem?: Item;
  focusProject?: Project;
  selectedProject: string;
  stopPomodoro: () => void;
  resetPomodoro: () => void;
  completeFocusItem: () => void;
  addFocusCaptureItems: (value: string, projectId: string) => void;
};

export const FocusSession = memo(function FocusSession({
  pomodoro,
  focusItem,
  focusProject,
  selectedProject,
  stopPomodoro,
  resetPomodoro,
  completeFocusItem,
  addFocusCaptureItems,
}: FocusSessionProps) {
  const [focusCaptureInput, setFocusCaptureInput] = useState("");
  const focusCaptureInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [breathScale, setBreathScale] = useState(1);

  const focusCapturePreview = useMemo(
    () => (focusCaptureInput.trim() ? parseTaskInput(focusCaptureInput) : []),
    [focusCaptureInput],
  );

  // Breathing animation for the timer ring
  useEffect(() => {
    if (!pomodoro.running) return;
    const timer = setInterval(() => {
      setBreathScale((prev) => (prev === 1 ? 1.03 : 1));
    }, 1500);
    return () => clearInterval(timer);
  }, [pomodoro.running]);

  const handleCapture = () => {
    const value = focusCaptureInput.trim();
    if (!value) return;
    addFocusCaptureItems(value, focusItem?.projectId || selectedProject);
    setFocusCaptureInput("");
    focusCaptureInputRef.current?.focus();
  };

  const progress = pomodoro.secondsLeft / POMODORO_SECONDS;
  const isFinished = pomodoro.secondsLeft === 0;
  const circumference = 2 * Math.PI * 90;
  const strokeOffset = circumference * (1 - progress);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/30 bg-gradient-to-br from-amber-300/[0.12] via-zinc-950/95 to-black/80 p-5 shadow-2xl shadow-amber-950/20 backdrop-blur md:p-8">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full opacity-30 blur-3xl transition-all duration-[3000ms]"
        style={{ background: isFinished ? "radial-gradient(circle, rgba(52,211,153,0.4), transparent)" : "radial-gradient(circle, rgba(251,191,36,0.3), transparent)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full opacity-20 blur-3xl transition-all duration-[3000ms]"
        style={{ background: "radial-gradient(circle, rgba(251,113,133,0.3), transparent)" }}
      />

      <div className="relative flex min-h-[54vh] flex-col justify-between gap-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="animate-pulse rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100">
              {pomodoro.running ? "● 专注中" : isFinished ? "✓ 已完成" : "◉ 已暂停"}
            </span>
            <PixelHeart />
          </div>
          <button
            onClick={resetPomodoro}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
          >
            退出专注
          </button>
        </div>

        {/* Main content */}
        <div className="mx-auto grid w-full max-w-5xl gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          {/* Timer side */}
          <div className="flex flex-col items-center text-center xl:items-start xl:text-left">
            {/* Circular progress ring */}
            <div
              className="relative transition-transform duration-[1500ms] ease-in-out"
              style={{ transform: `scale(${breathScale})` }}
            >
              <svg viewBox="0 0 200 200" className="h-48 w-48 -rotate-90 sm:h-56 sm:w-56 md:h-64 md:w-64">
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="100" cy="100" r="90" fill="none"
                  stroke={isFinished ? "rgba(52,211,153,0.8)" : "rgba(251,191,36,0.6)"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl ${isFinished ? "text-emerald-300" : "text-amber-50"}`}>
                  {formatSeconds(pomodoro.secondsLeft)}
                </div>
                <p className="mt-1 text-[11px] text-amber-100/50">
                  {pomodoro.running ? "保持专注" : isFinished ? "做得好！" : "准备好了吗"}
                </p>
              </div>
            </div>

            {/* Task info */}
            <div className="mt-5 flex flex-wrap justify-center gap-2 xl:justify-start">
              {focusProject && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${focusProject.color}22`, color: focusProject.color }}
                >
                  {focusProject.name}
                </span>
              )}
              {(focusItem?.tags || []).map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-200">
                  #{tag}
                </span>
              ))}
            </div>
            <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-amber-50 sm:text-3xl">
              {focusItem?.content || "自由专注"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-amber-100/50">
              先把这一轮做完。收集、整理和分流都等番茄结束后再回来。
            </p>
          </div>

          {/* Capture side */}
          <aside className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-xl shadow-black/20 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-amber-100/60">Capture</p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-50">先记下来</h3>
                <p className="mt-1 text-sm leading-5 text-zinc-400">想到新任务时，先丢进 Inbox，不打断当前这轮专注。</p>
              </div>
              {focusProject ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: `${focusProject.color}22`, color: focusProject.color }}
                >
                  {focusProject.name}
                </span>
              ) : null}
            </div>
            <textarea
              ref={focusCaptureInputRef}
              value={focusCaptureInput}
              onChange={(event) => setFocusCaptureInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  handleCapture();
                }
              }}
              placeholder={"例如：\n- 稍后回客户消息\n- 补需求备注"}
              className="mt-4 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-3.5 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-300/60"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className={focusCapturePreview.length ? "text-amber-100/80" : ""}>
                  {focusCapturePreview.length ? `${focusCapturePreview.length} 条待记` : "⌘+Enter 记下"}
                </span>
              </div>
              <button
                onClick={handleCapture}
                disabled={!focusCaptureInput.trim()}
                className="rounded-xl bg-amber-200 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                记下来
              </button>
            </div>
          </aside>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-wrap justify-center gap-3">
          {pomodoro.running ? (
            <button onClick={stopPomodoro} className="rounded-xl bg-amber-200 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-100 hover:shadow-xl">
              暂停
            </button>
          ) : (
            <button onClick={stopPomodoro} className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-6 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20">
              继续
            </button>
          )}
          {focusItem && (
            <button
              onClick={completeFocusItem}
              className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-6 py-2.5 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300/15 hover:shadow-xl"
            >
              ✓ 完成并结束
            </button>
          )}
          <button onClick={resetPomodoro} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200">
            放弃这一轮
          </button>
        </div>
      </div>
    </section>
  );
});
