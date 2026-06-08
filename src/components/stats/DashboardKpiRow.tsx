"use client";

import Link from "next/link";
import type { DashboardStats } from "@/lib/stats/aggregate";
import { cn } from "@/lib/utils";

type Theme = {
  border: string;
  bg: string;
  badge: string;
  dot: string;
};

const THEMES: Theme[] = [
  {
    border: "border-violet-100",
    bg: "bg-gradient-to-br from-white to-violet-50/50",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  {
    border: "border-blue-100",
    bg: "bg-gradient-to-br from-white to-blue-50/50",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    border: "border-emerald-100",
    bg: "bg-gradient-to-br from-white to-emerald-50/50",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  {
    border: "border-amber-100",
    bg: "bg-gradient-to-br from-white to-amber-50/50",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
];

function StatCard({
  label,
  value,
  href,
  theme,
}: {
  label: string;
  value: number | string;
  href?: string;
  theme: Theme;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", theme.dot)} />
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span
          className={cn(
            "ml-auto rounded-md px-2.5 py-0.5 text-lg font-bold tabular-nums leading-none",
            theme.badge
          )}
        >
          {value}
        </span>
      </div>
    </>
  );

  const className = cn(
    "rounded-xl border px-4 py-3.5 shadow-sm transition hover:shadow",
    theme.border,
    theme.bg,
    "hover:border-[#CBD5E1]"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

type Props = {
  stats: DashboardStats;
};

export function DashboardKpiRow({ stats }: Props) {
  const { kpis, seeds } = stats;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="正在进行的思考"
        value={kpis.thinkingSessions}
        href="/thinking"
        theme={THEMES[0]}
      />
      <StatCard
        label="正在进行的决策"
        value={kpis.decisions}
        href="/decisions"
        theme={THEMES[1]}
      />
      <StatCard
        label="正在追踪的目标"
        value={kpis.activeGoals}
        href="/goals"
        theme={THEMES[2]}
      />
      <StatCard
        label="种子 · 萌芽 / 生长"
        value={`${seeds.sprouting} / ${seeds.growing}`}
        href="/seeds"
        theme={THEMES[3]}
      />
    </div>
  );
}
