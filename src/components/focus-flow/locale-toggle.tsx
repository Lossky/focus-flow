"use client";

import { useLocale } from "@/contexts/locale-context";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="rounded-full border border-zinc-600 bg-zinc-900/60 px-2.5 py-1 text-[11px] tabular-nums text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      {locale === "zh" ? "EN" : "中"}
    </button>
  );
}
