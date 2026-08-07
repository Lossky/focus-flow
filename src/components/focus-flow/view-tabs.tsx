import { memo } from "react";
import { useI18n } from "@/contexts/i18n-context";
import type { ViewMode } from "@/lib/focus-flow-model";

type ViewTab = { key: ViewMode; label: string };

type ViewTabsProps = {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export const ViewTabs = memo(function ViewTabs({ active, onChange }: ViewTabsProps) {
  const { t } = useI18n();
  const tabs: ViewTab[] = [
    { key: "flow", label: t("flow") },
    { key: "board", label: t("board") },
    { key: "calendar", label: t("calendar") },
    { key: "quadrant", label: t("quadrant") },
  ];
  return (
    <div className="mb-4 flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            active === tab.key
              ? "bg-white/10 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});
