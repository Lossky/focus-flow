"use client";

import { useEffect, useRef, useCallback } from "react";
import { PixelHeart, PixelCat } from "./pixel-art";

type Quote = { zh: string; en: string; author: string };

type BouncingQuoteProps = {
  quote: Quote;
  onClose: () => void;
};

export function BouncingQuote({ quote, onClose }: BouncingQuoteProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 40, y: 80 });
  const velRef = useRef({ vx: 0.4, vy: 0.3 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const pausedRef = useRef(false);
  const animRef = useRef<number>(0);

  const applyPosition = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    applyPosition();

    const step = () => {
      if (!pausedRef.current) {
        const cRect = card.getBoundingClientRect();
        const maxX = window.innerWidth - cRect.width - 16;
        const maxY = window.innerHeight - cRect.height - 16;
        const vel = velRef.current;
        const pos = posRef.current;

        pos.x += vel.vx;
        pos.y += vel.vy;

        if (pos.x <= 0) { pos.x = 0; vel.vx = Math.abs(vel.vx); }
        else if (pos.x >= maxX) { pos.x = maxX; vel.vx = -Math.abs(vel.vx); }

        if (pos.y <= 0) { pos.y = 0; vel.vy = Math.abs(vel.vy); }
        else if (pos.y >= maxY) { pos.y = maxY; vel.vy = -Math.abs(vel.vy); }

        applyPosition();
      }
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [applyPosition]);

  return (
    <div
      ref={cardRef}
      className="fixed left-0 top-0 z-[45] w-[260px] cursor-grab rounded-2xl border border-teal-300/8 bg-zinc-950/25 px-3.5 py-3 shadow-lg shadow-black/10 backdrop-blur-[2px] transition-colors will-change-transform hover:bg-zinc-950/45 active:cursor-grabbing"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-close-quote]")) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pausedRef.current = true;
        dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: posRef.current.x, baseY: posRef.current.y };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current) return;
        posRef.current.x = dragRef.current.baseX + (e.clientX - dragRef.current.startX);
        posRef.current.y = dragRef.current.baseY + (e.clientY - dragRef.current.startY);
        applyPosition();
      }}
      onPointerUp={() => { dragRef.current = null; pausedRef.current = false; }}
      onPointerCancel={() => { dragRef.current = null; pausedRef.current = false; }}
    >
      <button
        data-close-quote
        onClick={onClose}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-[10px] text-zinc-400 opacity-0 transition hover:bg-zinc-700 hover:text-zinc-200 [div:hover>&]:opacity-100"
      >
        ✕
      </button>
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          <PixelHeart />
          <PixelCat />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.24em] text-teal-200/25">{quote.author}</p>
          <p className="mt-1.5 text-[15px] font-medium leading-6 text-teal-50/60">{quote.zh}</p>
          <p className="mt-1 text-[12px] leading-5 text-teal-100/25">{quote.en}</p>
        </div>
      </div>
    </div>
  );
}
