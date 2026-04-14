"use client";

import { useEffect, useState } from "react";

// --- Shared pixel renderer ---
const PX = 4;

function PixelGrid({ grid, color, cols, rows }: { grid: number[][]; color: string; cols: number; rows: number }) {
  return (
    <svg
      viewBox={`0 0 ${cols * PX} ${rows * PX}`}
      width={cols * PX}
      height={rows * PX}
      className="block"
    >
      {grid.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect key={`${y}-${x}`} x={x * PX} y={y * PX} width={PX} height={PX} rx={1} fill={color} />
          ) : null,
        ),
      )}
    </svg>
  );
}

// --- Heart ---
const HEART_SMALL: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,1,0,0,0,1,0,0],
  [0,1,1,1,0,1,1,1,0],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,0,0,0,1,0,0,0,0],
];

const HEART_BIG: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,1,1,0],
  [1,1,1,1,0,1,1,1,1],
  [1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,0,0,0],
  [0,0,0,0,1,0,0,0,0],
];

const HEART_SPARKLE: number[][] = [
  [0,1,0,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,1,0,0,0,1,0,0],
  [0,1,1,1,0,1,1,1,0],
  [0,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,0,0,0],
  [1,0,0,0,1,0,0,0,1],
];

const HEART_FRAMES = [HEART_SMALL, HEART_BIG, HEART_BIG, HEART_SMALL, HEART_SMALL, HEART_SPARKLE, HEART_SMALL, HEART_SMALL];
const HEART_COLORS = [
  "rgba(251,113,133,0.85)",
  "rgba(244,63,94,0.9)",
  "rgba(251,113,133,0.75)",
  "rgba(251,113,133,0.85)",
  "rgba(251,113,133,0.85)",
  "rgba(253,164,175,0.9)",
  "rgba(251,113,133,0.85)",
  "rgba(251,113,133,0.85)",
];

// --- Cat --- 11x8
const CAT_SIT: number[][] = [
  [0,1,0,0,0,0,0,1,0,0,0],
  [1,1,1,0,0,0,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,0,0],
  [1,0,1,1,1,1,0,1,1,0,0],
  [1,1,1,0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,0,0,0,0,0,1,0,0,0],
];

const CAT_WAVE: number[][] = [
  [0,1,0,0,0,0,0,1,0,0,0],
  [1,1,1,0,0,0,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,0],
  [1,0,1,1,1,1,0,1,1,0,0],
  [1,1,1,0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,0,0,0,0,0,1,0,0,0],
];

const CAT_BLINK: number[][] = [
  [0,1,0,0,0,0,0,1,0,0,0],
  [1,1,1,0,0,0,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,0,0],
  [1,1,0,1,1,1,1,0,1,0,0],
  [1,1,1,0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,0,0,0,0,0,1,0,0,0],
];

const CAT_TAIL: number[][] = [
  [0,1,0,0,0,0,0,1,0,0,0],
  [1,1,1,0,0,0,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,0,0],
  [1,0,1,1,1,1,0,1,1,0,0],
  [1,1,1,0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,0,1,0],
  [0,1,0,0,0,0,0,1,1,0,0],
];

const CAT_FRAMES = [CAT_SIT, CAT_SIT, CAT_BLINK, CAT_SIT, CAT_WAVE, CAT_SIT, CAT_TAIL, CAT_SIT];
const CAT_COLOR = "rgba(94,234,212,0.7)"; // teal-300

export function PixelHeart() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFrame((p) => (p + 1) % HEART_FRAMES.length), 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="shrink-0" style={{ width: 9 * PX, height: 8 * PX }} aria-hidden="true">
      <PixelGrid grid={HEART_FRAMES[frame]} color={HEART_COLORS[frame]} cols={9} rows={8} />
    </div>
  );
}

export function PixelCat() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFrame((p) => (p + 1) % CAT_FRAMES.length), 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="shrink-0" style={{ width: 11 * PX, height: 8 * PX }} aria-hidden="true">
      <PixelGrid grid={CAT_FRAMES[frame]} color={CAT_COLOR} cols={11} rows={8} />
    </div>
  );
}
