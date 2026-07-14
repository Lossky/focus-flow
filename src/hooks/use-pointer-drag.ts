"use client";

import { useCallback, useRef, useState } from "react";

/**
 * 基于 Pointer Events 的拖拽 hook。
 *
 * 存在理由（第一性原理）：Tauri 在 macOS 上用 WKWebView，其 HTML5 Drag and Drop
 * (draggable/dragstart/drop) 实现残缺——拖拽常被系统当原生拖拽拦截，drop 事件不触发，
 * dataTransfer 丢数据。Pointer Events 不依赖系统原生拖拽子系统，在 WKWebView 中稳定可靠。
 *
 * 用法：
 * - 放置区在 DOM 上标记 `data-drop-zone="<key>"`
 * - 可拖拽元素 onPointerDown 调用 beginDrag(id, label, e)
 * - 移动超过阈值才判定为拖拽（否则视为点击，触发 onTap）
 * - 松手时命中某放置区则回调 onDrop(id, zoneKey)
 */

export type PointerDragState = {
  id: string;
  label: string;
  x: number;
  y: number;
  overKey: string | null;
};

type UsePointerDragOptions = {
  onDrop: (id: string, zoneKey: string) => void;
  onTap?: (id: string) => void;
  /** 判定为拖拽的最小移动距离（px），低于此值视为点击 */
  threshold?: number;
};

function zoneKeyAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  const zone = el?.closest("[data-drop-zone]");
  return zone?.getAttribute("data-drop-zone") ?? null;
}

export function usePointerDrag({ onDrop, onTap, threshold = 6 }: UsePointerDragOptions) {
  const [drag, setDrag] = useState<PointerDragState | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const beginDrag = useCallback(
    (id: string, label: string, e: React.PointerEvent) => {
      // 点在交互控件（按钮等）上时不启动拖拽，让控件正常响应
      if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;

      const startX = e.clientX;
      const startY = e.clientY;
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < threshold) return;
        moved = true;
        setDrag({ id, label, x: ev.clientX, y: ev.clientY, overKey: zoneKeyAt(ev.clientX, ev.clientY) });
      };

      const onUp = (ev: PointerEvent) => {
        cleanup();
        if (moved) {
          const key = zoneKeyAt(ev.clientX, ev.clientY);
          if (key) onDrop(id, key);
        } else {
          onTap?.(id);
        }
        setDrag(null);
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        cleanupRef.current = null;
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      cleanupRef.current = cleanup;
    },
    [onDrop, onTap, threshold],
  );

  return { drag, beginDrag, isDragging: !!drag };
}
