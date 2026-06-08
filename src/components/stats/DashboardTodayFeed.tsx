"use client";

import Link from "next/link";
import { loadThoughtSessions } from "@/lib/thinking/storage";
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
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <h3 className="text-xs font-medium text-slate-600">{title}</h3>
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
        <p className="rounded-lg border border-dashed border-[#E2E8F0] py-6 text-center text-[10px] text-slate-400">
          {empty}
        </p>
      );
    }
    return (
      <ul className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={
              i < items.length - 1 ? "border-b border-[#EEF1F5]" : undefined
            }
          >
            <Link
              href={item.href}
              className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-[#FAFBFC]"
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
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">思考 & 决策</h2>
      <div className="flex flex-col gap-4">
        <FeedSection title="新增思考" empty="本时段暂无新增思考">
          {renderList(
            thinking.map((s) => ({
              id: s.id,
              title: s.title,
              time: s.updatedAt,
              href: "/thinking",
            })),
            "本时段暂无新增思考"
          )}
        </FeedSection>
        <FeedSection title="新增决策" empty="本时段暂无新增决策">
          {renderList(
            decisions.map((d) => ({
              id: d.id,
              title: d.title,
              time: d.updated_at,
              href: "/decisions",
            })),
            "本时段暂无新增决策"
          )}
        </FeedSection>
      </div>
    </section>
  );
}
