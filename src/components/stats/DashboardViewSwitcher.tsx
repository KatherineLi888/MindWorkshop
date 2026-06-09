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
    <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-slate-100/80 p-1">
      {store.views.map((view) => {
        const active = store.activeViewId === view.id;
        return (
          <div key={view.id} className="flex shrink-0 items-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...store, activeViewId: view.id })}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-white text-[var(--primary)] shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
                disabled && "opacity-60"
              )}
            >
              {viewLabel(view)}
            </button>
            {!view.builtin && !disabled && (
              <button
                type="button"
                onClick={() => removeView(view)}
                className="ml-0.5 rounded-md px-1 text-[10px] text-slate-300 hover:text-red-500"
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
