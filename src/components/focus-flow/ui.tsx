import { memo, useEffect, useId, useRef, type ChangeEventHandler, type ReactNode, type RefObject } from "react";
import { useI18n } from "@/contexts/i18n-context";
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

const modalStack: symbol[] = [];
let bodyLockCount = 0;
let previousBodyOverflow = "";

/** 统一管理弹窗层级、焦点、Escape 和背景滚动，避免嵌套弹窗互相关闭。 */
export function useModalBehavior(panelRef: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const modalIdRef = useRef<symbol | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  if (!modalIdRef.current) modalIdRef.current = Symbol("modal");

  useEffect(() => {
    const modalId = modalIdRef.current;
    if (!modalId) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    modalStack.push(modalId);
    if (bodyLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    bodyLockCount += 1;

    const focusPanel = () => panelRef.current?.focus();
    focusPanel();
    const focusables = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || []).filter((element) => element.offsetParent !== null);
    const isTopModal = () => modalStack[modalStack.length - 1] === modalId;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements.length) {
        event.preventDefault();
        focusPanel();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;
      if (event.shiftKey ? active === first || active === panelRef.current : active === last) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const index = modalStack.indexOf(modalId);
      if (index !== -1) modalStack.splice(index, 1);
      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [panelRef]);
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalBehavior(panelRef, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[80vh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-zinc-900 p-6 outline-none`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-zinc-400 transition hover:text-zinc-200">
            {t("close")}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
