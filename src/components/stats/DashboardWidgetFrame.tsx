"use client";

import { DashboardChevron } from "@/components/stats/DashboardChevron";
import { useDashboardCollapse } from "@/lib/stats/use-dashboard-collapse";
import { cn } from "@/lib/utils";

type Props = {
  sectionId: string;
  title: string;
  children: React.ReactNode;
};

/** 网格组件：与 DashboardSection 一致的标题行收起交互 */
export function DashboardWidgetFrame({ sectionId, title, children }: Props) {
  const { collapsed, toggle } = useDashboardCollapse(sectionId);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60",
        collapsed && "h-auto min-h-0"
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full shrink-0 items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50/80"
      >
        <DashboardChevron
          collapsed={collapsed}
          className="shrink-0 text-slate-400"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
          {title}
        </span>
      </button>
      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-hidden border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}
