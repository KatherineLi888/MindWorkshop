"use client";

import { useState } from "react";
import Link from "next/link";
import {
  KrProgressBar,
  KrProgressPercent,
} from "@/components/goals/KrProgressBar";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import { formatKrProgressLine } from "@/lib/goals/kr-progress";
import { goalUnitContext } from "@/lib/goals/time-gap-units";
import {
  computeTimeProgress,
  formatPeriodRange,
} from "@/lib/goals/time-progress";
import type { GoalWithMeta } from "@/lib/goals/storage";
import type { KeyResult } from "@/lib/goals/types";
type Props = {
  goals: GoalWithMeta[];
};

function DashboardKrRow({ kr, index }: { kr: KeyResult; index: number }) {
  const progressLine = formatKrProgressLine(kr);
  const period = formatPeriodRange(kr.start_date, kr.due_date);
  const time = computeTimeProgress(kr.start_date, kr.due_date);

  return (
    <li className="rounded-md bg-[#FAFBFC] px-2 py-1.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-slate-700">
            {kr.title.trim() || `KR ${index + 1}`}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {period && <span>{period} · </span>}
            {time.status === "not_started" ? "尚未开始" : progressLine}
          </p>
        </div>
        <KrProgressPercent kr={kr} className="text-[11px]" />
      </div>
      <div className="mt-1">
        <KrProgressBar kr={kr} size="sm" />
      </div>
    </li>
  );
}

export function DashboardActiveGoals({ goals }: Props) {
  const active = goals.filter(
    (g) => g.goal_type !== "pending" && g.progress < 100
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-700">进行中目标</h2>
      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E2E8F0] bg-white py-8 text-center text-xs text-slate-400">
          暂无进行中的主目标
        </p>
      ) : (
        <ul className="space-y-2">
          {active.map((g) => {
            const expanded = expandedId === g.id;
            const krs = g.execution.key_results;

            return (
              <li
                key={g.id}
                className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] transition-colors hover:border-[#3B82F6]/30 hover:bg-white"
              >
                <button
                  type="button"
                  className="w-full px-3 pt-3 text-left"
                  onClick={() =>
                    setExpandedId((id) => (id === g.id ? null : g.id))
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                      {g.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {expanded ? "收起 KR" : `${krs.length} 条 KR`}
                    </span>
                  </div>
                </button>

                <div className="px-3 pb-3 pt-1">
                  <TimeProgressBar
                    completionPercent={g.progress}
                    startDate={g.execution.start_date}
                    endDate={g.execution.due_date}
                    size="sm"
                    unitContext={goalUnitContext(g.execution)}
                  />
                </div>

                {expanded && (
                  <div className="border-t border-[#EEF1F5] bg-white/80 px-2 pb-2 pt-1">
                    {krs.length === 0 ? (
                      <p className="py-2 text-center text-[10px] text-slate-400">
                        尚未添加 KR
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {krs.map((kr, idx) => (
                          <DashboardKrRow key={kr.id} kr={kr} index={idx} />
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/goals?detail=${g.id}`}
                      className="mt-2 block text-center text-[10px] text-[#3B82F6] hover:underline"
                    >
                      打开目标详情 →
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
