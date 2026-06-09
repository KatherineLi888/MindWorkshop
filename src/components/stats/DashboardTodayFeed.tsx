"use client";

import Link from "next/link";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { withStatsReturn } from "@/lib/navigation/return-to";
import { formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/lib/stats/aggregate";
import { matchesTimeFilter } from "@/lib/stats/time-range";
import type { ViewTimeScope } from "@/lib/stats/dashboard-views";

type Props = {
  stats: DashboardStats;
  scope: ViewTimeScope;
};

function FeedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <h3 className="text-xs font-medium text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

export function DashboardTodayFeed({ stats, scope }: Props) {
  const filter = {
    timeRange: scope.timeRange ?? "today",
    timeFrom: scope.timeFrom,
    timeTo: scope.timeTo,
  };

  const thinking = loadThoughtSessions()
    .filter(
      (s) =>
        matchesTimeFilter(s.createdAt, filter) ||
        matchesTimeFilter(s.updatedAt, filter)
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 12);

  const decisions = stats.raw.decisions
    .filter((d) => !d.archived_at)
    .filter(
      (d) =>
        matchesTimeFilter(d.created_at, filter) ||
        matchesTimeFilter(d.updated_at, filter)
    )
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 12);

  const renderList = (
    items: { id: string; title: string; time: string; href: string }[],
    empty: string
  ) => {
    if (!items.length) {
      return (
        <p className="py-6 text-center text-xs text-slate-400">{empty}</p>
      );
    }
    return (
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={withStatsReturn(item.href)}
              className="flex items-center justify-between gap-2 py-2.5 text-xs transition hover:text-[var(--primary)]"
            >
              <span className="min-w-0 truncate text-slate-800">
                {item.title}
              </span>
              <span className="shrink-0 text-[10px] text-slate-400">
                {formatDate(item.time)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
      <FeedSection title="今日思考">
        {renderList(
          thinking.map((s) => ({
            id: s.id,
            title: s.title,
            time: s.updatedAt,
            href: `/thinking?session=${s.id}`,
          })),
          "今日暂无思考"
        )}
      </FeedSection>
      <FeedSection title="今日决策">
        {renderList(
          decisions.map((d) => ({
            id: d.id,
            title: d.title,
            time: d.updated_at,
            href: `/decisions?detail=${d.id}`,
          })),
          "今日暂无决策"
        )}
      </FeedSection>
    </div>
  );
}
