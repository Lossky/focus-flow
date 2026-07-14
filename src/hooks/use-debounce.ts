"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 延迟更新值，用于搜索框等高频输入场景。
 * 在用户停止输入 delay ms 后才更新返回值，避免中间态触发重计算。
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * 节流执行回调，同一时间窗口内只执行一次。
 * 适合持久化写入等不需要每次状态变化都立即执行的操作。
 * 
 * - leading: true 表示首次立即执行
 * - trailing: true 表示时间窗口结束后补一次执行
 * - 组件卸载时自动 flush 未执行的 trailing 调用
 */
export function useThrottledCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCallback = useRef(callback);
  const latestArgs = useRef<Parameters<T> | null>(null);

  // 始终保持回调引用最新
  useEffect(() => {
    latestCallback.current = callback;
  });

  // 组件卸载时 flush
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        // Flush: 执行最后一次挂起的调用
        if (latestArgs.current) {
          latestCallback.current(...latestArgs.current);
          latestArgs.current = null;
        }
      }
    };
  }, []);

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastRun.current;

    latestArgs.current = args;

    if (elapsed >= delay) {
      // 足够时间已过，立即执行
      lastRun.current = now;
      latestArgs.current = null;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      latestCallback.current(...args);
    } else if (!timer.current) {
      // 安排 trailing 执行
      timer.current = setTimeout(() => {
        lastRun.current = Date.now();
        timer.current = null;
        if (latestArgs.current) {
          latestCallback.current(...latestArgs.current);
          latestArgs.current = null;
        }
      }, delay - elapsed);
    }
  }) as T;

  return throttled;
}
