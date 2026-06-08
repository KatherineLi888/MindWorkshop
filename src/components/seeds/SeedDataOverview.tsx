"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  computeSeedOverviewStats,
  PHASE_ICONS,
} from "@/lib/seeds/overview-stats";
import type { IdeaSeed } from "@/lib/seeds/types";

type Props = {
  seeds: IdeaSeed[];
};

function StatLine({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-600">
      <span className="text-base leading-none" aria-hidden>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <span className="font-semibold tabular-nums text-slate-800">{value}</span>
    </div>
  );
}

export function SeedDataOverview({ seeds }: Props) {
  const stats = useMemo(() => computeSeedOverviewStats(seeds), [seeds]);

  return (
    <Card className="border-[#E8ECF0] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">数据概览</h2>
      <p className="mt-0.5 text-[10px] text-slate-400">全局汇总</p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-lime-100 bg-lime-50/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-lime-800">
            <span>{PHASE_ICONS.sprouting}</span>
            萌芽中
            <span className="ml-auto tabular-nums text-lime-700">
              {stats.sprouting.total}
            </span>
          </p>
          <div className="mt-2 space-y-1.5">
            <StatLine
              icon="📅"
              label="今日新增"
              value={stats.sprouting.todayNew}
            />
            <StatLine
              icon="🕐"
              label="近期新增"
              value={stats.sprouting.recentNew}
            />
            <StatLine
              icon="➡️"
              label="流转至生长中"
              value={stats.sprouting.toGrowing}
            />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <span>{PHASE_ICONS.growing}</span>
            生长中
            <span className="ml-auto tabular-nums text-emerald-700">
              {stats.growing.total}
            </span>
          </p>
          <div className="mt-2 space-y-1.5">
            <StatLine
              icon="✨"
              label="近期新增"
              value={stats.growing.recentNew}
            />
            <StatLine
              icon="↗️"
              label="流转至其他/归档"
              value={stats.growing.toOtherOrArchive}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span>{PHASE_ICONS.archived}</span>
            已归档
            <span className="ml-auto tabular-nums text-slate-600">
              {stats.archived.total}
            </span>
          </p>
          <div className="mt-2 space-y-1.5">
            <StatLine
              icon="📦"
              label="累计归档"
              value={stats.archived.total}
            />
            <StatLine
              icon="🕐"
              label="近期归档"
              value={stats.archived.recentArchived}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
