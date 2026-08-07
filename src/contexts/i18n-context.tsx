"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  localeToIntl,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";
import type { ItemSource, ItemStatus, ItemType, Priority, RepeatType } from "@/lib/focus-flow-model";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  statusLabel: (status: ItemStatus) => string;
  sourceLabel: (source: ItemSource) => string;
  repeatLabel: (repeat: RepeatType) => string;
  priorityLabel: (priority: Priority) => string;
  priorityShortLabel: (priority: Priority) => string;
  itemTypeLabel: (type: ItemType) => string;
  formatDate: (value?: string) => string;
  formatTime: (value?: string) => string;
  formatRelativeTime: (value?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const statusKeys: Record<ItemStatus, MessageKey> = {
  inbox: "inbox",
  today: "today",
  blocked: "blocked",
  shelved: "shelved",
  done: "done",
  archived: "archived",
};
const sourceKeys: Record<ItemSource, MessageKey> = {
  manual: "sourceManual",
  feishu: "sourceFeishu",
  ai: "sourceAi",
  obsidian: "sourceObsidian",
  doc: "sourceDoc",
  other: "sourceOther",
};
const repeatKeys: Record<RepeatType, MessageKey> = { none: "repeatNone", daily: "repeatDaily", weekly: "repeatWeekly" };
const priorityKeys: Record<Priority, MessageKey> = { high: "priorityHigh", medium: "priorityMedium", low: "priorityLow" };
const priorityShortKeys: Record<Priority, MessageKey> = { high: "priorityHighShort", medium: "priorityMediumShort", low: "priorityLowShort" };
const itemTypeKeys: Record<ItemType, MessageKey> = { task: "typeTask", candidate: "typeCandidate", draft: "typeDraft", note: "typeNote" };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "zh-CN" || saved === "en-US") {
        // Defer the client preference update to preserve the server-rendered default locale.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocaleState(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {}
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values);
    return {
      locale,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((current) => current === "zh-CN" ? "en-US" : "zh-CN"),
      t,
      statusLabel: (status) => t(statusKeys[status]),
      sourceLabel: (source) => t(sourceKeys[source]),
      repeatLabel: (repeat) => t(repeatKeys[repeat]),
      priorityLabel: (priority) => t(priorityKeys[priority]),
      priorityShortLabel: (priority) => t(priorityShortKeys[priority]),
      itemTypeLabel: (type) => t(itemTypeKeys[type]),
      formatDate: (input) => {
        if (!input) return "-";
        const date = /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Date(`${input}T00:00:00`) : new Date(input);
        return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(localeToIntl(locale));
      },
      formatTime: (input) => {
        if (!input) return "-";
        const date = new Date(input);
        return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString(localeToIntl(locale), { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      },
      formatRelativeTime: (input) => {
        if (!input) return "-";
        const date = new Date(input);
        if (Number.isNaN(date.getTime())) return "-";
        const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
        if (minutes < 1) return locale === "zh-CN" ? "刚刚" : "Just now";
        if (minutes < 60) return locale === "zh-CN" ? `${minutes} 分钟前` : `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return locale === "zh-CN" ? `${hours} 小时前` : `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return locale === "zh-CN" ? `${days} 天前` : `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 5) return locale === "zh-CN" ? `${weeks} 周前` : `${weeks}w ago`;
        return locale === "zh-CN" ? `${Math.floor(days / 30)} 个月前` : `${Math.floor(days / 30)}mo ago`;
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
