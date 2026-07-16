"use client";

import { useEffect, useState, type CSSProperties, type RefObject } from "react";

type AnchoredMenuOptions = {
  /** 面板宽度（px） */
  width: number;
  /** 触发元素与面板之间的间距 */
  gap?: number;
  /** 水平对齐：left = 面板左缘对齐触发左缘；right = 面板右缘对齐触发右缘 */
  align?: "left" | "right";
  /** 视口边缘安全边距 */
  margin?: number;
  /** 面板期望高度，用于判断下方是否放得下（放不下则考虑向上翻转） */
  preferredHeight?: number;
};

/**
 * 计算 Portal 下拉面板的定位样式，保证不被视口边缘遮挡。
 *
 * 存在理由（第一性原理）：原实现永远从触发元素下方展开（top = rect.bottom），
 * 不检测下方剩余空间。当触发按钮靠近屏幕底部时，面板伸出视口被显示器边缘裁掉。
 *
 * 策略：
 * - 下方空间不足且上方空间更大时，改为向上展开（用 CSS bottom 锚定，无需预先知道面板高度）
 * - 水平方向钳制在视口内
 * - 用 maxHeight = 所选方向的可用空间，配合 overflow-y-auto，超高时内部滚动而非溢出
 *
 * 返回的 style 需要配合 `position: fixed` 与 `overflow-y-auto` 使用。
 */
export function useAnchoredMenu(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  { width, gap = 6, align = "left", margin = 8, preferredHeight = 260 }: AnchoredMenuOptions,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const spaceBelow = vh - r.bottom - margin;
      const spaceAbove = r.top - margin;
      const openUp = spaceBelow < preferredHeight && spaceAbove > spaceBelow;

      let left = align === "right" ? r.right - width : r.left;
      left = Math.max(margin, Math.min(left, vw - width - margin));

      if (openUp) {
        setStyle({ position: "fixed", left, width, bottom: vh - r.top + gap, maxHeight: spaceAbove });
      } else {
        setStyle({ position: "fixed", left, width, top: r.bottom + gap, maxHeight: spaceBelow });
      }
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, width, gap, align, margin, preferredHeight]);

  return style;
}
