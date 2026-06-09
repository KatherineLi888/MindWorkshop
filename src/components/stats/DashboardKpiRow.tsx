"use client";

import type { DashboardStats } from "@/lib/stats/aggregate";
import { cn } from "@/lib/utils";

type Props = {
  stats: DashboardStats;
};

const ITEMS = [
  { key: "thinking", label: "思考", accent: "text-violet-600", bar: "bg-violet-500" },
  { key: "decisions", label: "决策", accent: "text-blue-600", bar: "bg-blue-500" },
  { key: "goals", label: "目标", accent: "text-emerald-600", bar: "bg-emerald-500" },
  { key: "seeds", label: "种子", accent: "text-amber-700", bar: "bg-amber-400" },
] as const;

export function DashboardKpiRow({ stats }: Props) {
  const { kpis, seeds } = stats;

  const values: Record<(typeof ITEMS)[number]["key"], string> = {
    thinking: String(kpis.thinkingSessions),
    decisions: String(kpis.decisions),
    goals: String(kpis.activeGoals),
    seeds: `${seeds.sprouting} / ${seeds.growing}`,
  };

  return (
    <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
      {ITEMS.map((item, i) => (
        <div
          key={item.key}
          className={cn(
            "relative px-4 py-3.5",
            i % 2 === 0 && "border-b border-slate-100 sm:border-b-0"
          )}
        >
          <span
            className={cn("absolute left-0 top-3.5 h-8 w-0.5 rounded-full", item.bar)}
            aria-hidden
          />
          <p className="pl-2 text-[11px] font-medium text-slate-400">{item.label}</p>
          <p
            className={cn(
              "mt-1 pl-2 text-2xl font-semibold tabular-nums tracking-tight",
              item.accent
            )}
          >
            {values[item.key]}
          </p>
          {item.key === "seeds" && (
            <p className="mt-0.5 pl-2 text-[10px] text-slate-400">萌芽 / 生长</p>
          )}
        </div>
      ))}
    </div>
  );
}
