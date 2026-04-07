"use client";

import { useEffect, useState } from "react";
import { getAlwaysOnTopState, setAlwaysOnTopState } from "@/lib/window-controls";

export function AlwaysOnTopToggle({ onStatus }: { onStatus: (message: string) => void }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAlwaysOnTopState()
      .then((state) => {
        if (cancelled) return;
        setIsDesktop(state !== null);
        if (state !== null) setIsAlwaysOnTop(state);
      })
      .catch(() => {
        if (!cancelled) setIsDesktop(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleAlwaysOnTop() {
    if (!isDesktop) {
      onStatus("置顶功能只在桌面 App 中生效");
      return;
    }

    const next = !isAlwaysOnTop;
    setIsPending(true);
    try {
      const state = await setAlwaysOnTopState(next);
      setIsAlwaysOnTop(state ?? next);
      onStatus(state ?? next ? "窗口已置顶" : "已取消置顶");
    } catch {
      onStatus("置顶切换失败，请重试");
    } finally {
      setIsPending(false);
    }
  }

  return <button onClick={toggleAlwaysOnTop} disabled={isPending} title={isAlwaysOnTop ? "取消窗口置顶" : "窗口置顶"} aria-pressed={isAlwaysOnTop} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition ${isAlwaysOnTop ? "border-sky-400/60 bg-sky-500/15 text-sky-200" : "border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800"} ${isPending ? "opacity-60" : ""}`}><svg aria-hidden="true" viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${isAlwaysOnTop ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4l6 6" /><path d="M8 10l6-6 6 6-6 6" /><path d="M4 20l6-6" /></svg><span>{isAlwaysOnTop ? "已置顶" : "置顶"}</span></button>;
}
