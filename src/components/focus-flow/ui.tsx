import { memo, useEffect, useRef, type ChangeEventHandler, type ReactNode } from "react";
import { PixelCat } from "./pixel-art";

type SelectProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: [string, string][];
};

export const StatCard = memo(function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-2.5 py-2.5 text-center backdrop-blur">
      <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-zinc-50">{value}</div>
    </div>
  );
});

export function Select({ value, onChange, options }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-teal-400/70"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ hint }: { hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center">
      <PixelCat />
      <div>
        <p className="text-sm text-zinc-400">{hint || "这里还没有内容"}</p>
        <p className="mt-1 text-xs text-zinc-600">可以从上方快速录入，或把其它区块的任务拖过来。</p>
      </div>
    </div>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-300 ${className}`}>
      {children}
    </span>
  );
}

export function MiniTag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] text-zinc-100" style={{ backgroundColor: color || "#3f3f46" }}>
      {children}
    </span>
  );
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus trap: focus the panel on mount
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[80vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 outline-none`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-zinc-400 transition hover:text-zinc-200">
            关闭
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
