"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { DashboardStats } from "@/lib/stats/aggregate";
import {
  buildPeriodBrief,
  type MetricDelta,
  type PeriodBriefRange,
} from "@/lib/stats/period-brief";
import { withStatsReturn } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

type Props = {
  preset: PeriodBriefRange;
  stats: DashboardStats;
};

const TONE_ACCENT = {
  ahead: {
    bar: "from-emerald-500/90 to-emerald-400/40",
    pill: "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20",
  },
  behind: {
    bar: "from-amber-500/90 to-amber-400/40",
    pill: "bg-amber-500/10 text-amber-900 ring-amber-500/20",
  },
  sync: {
    bar: "from-indigo-500/80 to-indigo-400/30",
    pill: "bg-indigo-500/10 text-indigo-900 ring-indigo-500/20",
  },
  mixed: {
    bar: "from-slate-500/70 to-slate-400/25",
    pill: "bg-slate-500/8 text-slate-700 ring-slate-400/20",
  },
  none: {
    bar: "from-slate-400/50 to-slate-300/20",
    pill: "bg-slate-100 text-slate-600 ring-slate-200",
  },
} as const;

const METRIC_STYLE: Record<
  string,
  { chip: string; dot: string }
> = {
  thinking: {
    chip: "bg-violet-500/[0.07] text-violet-900 ring-violet-500/15",
    dot: "bg-violet-500",
  },
  decisions: {
    chip: "bg-blue-500/[0.07] text-blue-900 ring-blue-500/15",
    dot: "bg-blue-500",
  },
  goals: {
    chip: "bg-emerald-500/[0.07] text-emerald-900 ring-emerald-500/15",
    dot: "bg-emerald-500",
  },
  track: {
    chip: "bg-amber-500/[0.07] text-amber-900 ring-amber-500/15",
    dot: "bg-amber-500",
  },
  triage: {
    chip: "bg-slate-500/[0.06] text-slate-700 ring-slate-400/15",
    dot: "bg-slate-400",
  },
};

function MetricChip({ metric }: { metric: MetricDelta }) {
  const diff = metric.current - metric.previous;
  const style = METRIC_STYLE[metric.key] ?? METRIC_STYLE.triage;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] ring-1",
        style.chip
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
      <span className="text-slate-600">{metric.label}</span>
      <span className="font-semibold tabular-nums">{metric.current}</span>
      <span
        className={cn(
          "text-[10px] tabular-nums",
          metric.trend === "up" && "text-emerald-600",
          metric.trend === "down" && "text-amber-600",
          metric.trend === "flat" && "text-slate-400"
        )}
      >
        {diff === 0 ? "—" : diff > 0 ? `+${diff}` : diff}
      </span>
    </span>
  );
}

/** 供 DashboardSection 收起时显示的摘要 */
export function periodOverviewSummary(
  preset: PeriodBriefRange,
  stats: DashboardStats
): string {
  const b = buildPeriodBrief(preset, stats.raw.goals, stats.raw.decisions);
  const think = b.metrics.find((m) => m.key === "thinking");
  const dec = b.metrics.find((m) => m.key === "decisions");
  const parts = [b.overallHeadline];
  if (think) parts.push(`思考${think.current}`);
  if (dec) parts.push(`决策${dec.current}`);
  return parts.join(" · ");
}

export function DashboardPeriodBrief({ preset, stats }: Props) {
  const brief = useMemo(
    () =>
      buildPeriodBrief(
        preset,
        stats.raw.goals,
        stats.raw.decisions
      ),
    [preset, stats]
  );

  const tone = TONE_ACCENT[brief.overallTone];

  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "h-0.5 w-full bg-gradient-to-r",
          tone.bar
        )}
      />
      <div className="space-y-2.5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] tabular-nums text-slate-400">
            {brief.periodRange}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
              tone.pill
            )}
          >
            {brief.overallHeadline}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {brief.metrics.map((m) => (
            <MetricChip key={m.key} metric={m} />
          ))}
        </div>

        {brief.progressCounts.total > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">目标节奏</span>
            {brief.progressCounts.ahead > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/[0.08] px-1.5 py-0.5 text-[10px] text-emerald-800 ring-1 ring-emerald-500/15">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                领先 {brief.progressCounts.ahead}
              </span>
            )}
            {brief.progressCounts.onTrack > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/[0.08] px-1.5 py-0.5 text-[10px] text-indigo-800 ring-1 ring-indigo-500/15">
                <span className="h-1 w-1 rounded-full bg-indigo-500" />
                同步 {brief.progressCounts.onTrack}
              </span>
            )}
            {brief.progressCounts.behind > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/[0.08] px-1.5 py-0.5 text-[10px] text-amber-900 ring-1 ring-amber-500/15">
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                落后 {brief.progressCounts.behind}
              </span>
            )}
          </div>
        )}

        {brief.watchGoals.length > 0 && (
          <ul className="space-y-1">
            {brief.watchGoals.slice(0, 3).map((g) => (
              <li key={g.id}>
                <Link
                  href={withStatsReturn(`/goals?detail=${g.id}`)}
                  className="flex items-center justify-between gap-2 rounded-lg border-l-2 border-amber-400/70 bg-amber-500/[0.04] px-2 py-1.5 text-[11px] transition hover:bg-amber-500/[0.08]"
                >
                  <span className="min-w-0 truncate text-slate-700">
                    {g.title}
                  </span>
                  <span className="shrink-0 tabular-nums text-amber-800/90">
                    {g.tag}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="rounded-lg bg-slate-50/80 px-2.5 py-1.5 text-[11px] leading-snug text-slate-600">
          {brief.flowNote}
        </p>

        {brief.insights.length > 0 && (
          <ul className="space-y-1">
            {brief.insights.map((line) => (
              <li
                key={line}
                className="rounded-lg bg-violet-500/[0.04] px-2.5 py-1.5 text-[10px] leading-snug text-slate-600 ring-1 ring-violet-500/10"
              >
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
