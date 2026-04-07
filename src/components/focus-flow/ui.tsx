import type { ChangeEventHandler, ReactNode } from "react";

type SelectProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: [string, string][];
};

export function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"><div className="text-xs text-zinc-400">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></div>;
}

export function Select({ value, onChange, options }: SelectProps) {
  return <select value={value} onChange={onChange} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select>;
}

export function EmptyState() {
  return <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500"><div>这里还没有内容。</div><div className="mt-1 text-xs text-zinc-600">可以从上方快速录入，或把其它区块的任务拖过来。</div></div>;
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 ${className}`}>{children}</span>;
}

export function MiniTag({ children, color }: { children: ReactNode; color?: string }) {
  return <span className="rounded-full px-2 py-0.5 text-[10px] text-zinc-100" style={{ backgroundColor: color || "#3f3f46" }}>{children}</span>;
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[80vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6`}><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">{title}</h3><button onClick={onClose} className="text-sm text-zinc-400">关闭</button></div>{children}</div></div>;
}
