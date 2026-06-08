"use client";

import {
  isBuiltinViewId,
  removeCustomView,
  VIEW_PRESET_LABELS,
  type DashboardView,
  type DashboardViewsStore,
} from "@/lib/stats/dashboard-views";
import { cn } from "@/lib/utils";

type Props = {
  store: DashboardViewsStore;
  disabled?: boolean;
  onChange: (store: DashboardViewsStore) => void;
};

function viewLabel(view: DashboardView): string {
  if (view.builtin && isBuiltinViewId(view.id)) {
    const key = view.timePreset as keyof typeof VIEW_PRESET_LABELS;
    if (key in VIEW_PRESET_LABELS) return VIEW_PRESET_LABELS[key];
  }
  return view.label;
}

export function DashboardViewSwitcher({ store, disabled, onChange }: Props) {
  const removeView = (view: DashboardView) => {
    if (view.builtin) return;
    if (!confirm(`删除视图「${view.label}」？`)) return;
    onChange(removeCustomView(store, view.id));
  };

  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white p-0.5">
      {store.views.map((view) => {
        const active = store.activeViewId === view.id;
        return (
          <div key={view.id} className="flex shrink-0 items-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...store, activeViewId: view.id })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50",
                disabled && "opacity-60"
              )}
            >
              {viewLabel(view)}
            </button>
            {!view.builtin && !disabled && (
              <button
                type="button"
                onClick={() => removeView(view)}
                className="ml-0.5 rounded px-1 text-[10px] text-slate-300 hover:bg-red-50 hover:text-red-500"
                title="删除视图"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
