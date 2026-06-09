"use client";

import { DashboardChevron } from "@/components/stats/DashboardChevron";
import { useDashboardCollapse } from "@/lib/stats/use-dashboard-collapse";
import { cn } from "@/lib/utils";

type Props = {
  sectionId: string;
  title: string;
  subtitle?: string;
  /** 收起时在标题行右侧显示的摘要 */
  collapsedSummary?: string;
  children: React.ReactNode;
  className?: string;
  bare?: boolean;
  compact?: boolean;
};

export function DashboardSection({
  sectionId,
  title,
  subtitle,
  collapsedSummary,
  children,
  className,
  bare = false,
  compact = false,
}: Props) {
  const { collapsed, toggle } = useDashboardCollapse(sectionId);

  return (
    <section className={cn(compact ? "space-y-1" : "space-y-1.5", className)}>
      <button
        type="button"
        onClick={toggle}
        className="group flex w-full items-center gap-2 rounded-lg py-0.5 text-left transition hover:bg-slate-50/80"
      >
        <DashboardChevron
          collapsed={collapsed}
          className="shrink-0 group-hover:text-slate-600"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="text-sm font-semibold tracking-tight text-slate-800">
              {title}
            </h2>
            {collapsed && collapsedSummary && (
              <span className="truncate text-[11px] text-slate-400">
                {collapsedSummary}
              </span>
            )}
          </div>
          {!collapsed && subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </button>

      {!collapsed &&
        (bare ? (
          children
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
            {children}
          </div>
        ))}
    </section>
  );
}
