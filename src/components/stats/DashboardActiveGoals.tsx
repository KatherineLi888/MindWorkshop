"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { withStatsReturn } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 520;

type Props = {
  goals: GoalWithMeta[];
};

function DashboardKrRow({
  kr,
  index,
  goalId,
  onLongPressKr,
}: {
  kr: KeyResult;
  index: number;
  goalId: string;
  onLongPressKr: (goalId: string, kr: KeyResult) => void;
}) {
  const progressLine = formatKrProgressLine(kr);
  const period = formatPeriodRange(kr.start_date, kr.due_date);
  const time = computeTimeProgress(kr.start_date, kr.due_date);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <li
      className="rounded-lg bg-slate-50/80 px-2.5 py-2"
      onPointerDown={() => {
        clearPress();
        longPressed.current = false;
        pressTimer.current = setTimeout(() => {
          longPressed.current = true;
          onLongPressKr(goalId, kr);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-700">
            {kr.title.trim() || `KR ${index + 1}`}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {period && <span>{period} · </span>}
            {time.status === "not_started" ? "尚未开始" : progressLine}
          </p>
        </div>
        <KrProgressPercent kr={kr} className="text-[11px]" />
      </div>
      <div className="mt-1.5">
        <KrProgressBar kr={kr} size="sm" />
      </div>
    </li>
  );
}

export function DashboardActiveGoals({ goals }: Props) {
  const router = useRouter();
  const active = goals.filter(
    (g) => g.goal_type !== "pending" && g.progress < 100
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const openGoalReview = (goalId: string, kr?: KeyResult) => {
    const params = new URLSearchParams({ goalId });
    if (kr) {
      params.set("krId", kr.id);
      const label = kr.title.trim() || `KR`;
      params.set("krLabel", label);
    }
    router.push(withStatsReturn(`/review/new?${params.toString()}`));
  };

  if (active.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        暂无进行中的主目标
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {active.map((g) => {
        const expanded = expandedId === g.id;
        const krs = g.execution.key_results;

        return (
          <li key={g.id} className="px-1 py-3 first:pt-1 last:pb-1">
            <button
              type="button"
              className="w-full text-left"
              onPointerDown={() => {
                clearPress();
                longPressed.current = false;
                pressTimer.current = setTimeout(() => {
                  longPressed.current = true;
                  openGoalReview(g.id);
                }, LONG_PRESS_MS);
              }}
              onPointerUp={clearPress}
              onPointerLeave={clearPress}
              onPointerCancel={clearPress}
              onClick={() => {
                if (longPressed.current) {
                  longPressed.current = false;
                  return;
                }
                setExpandedId((id) => (id === g.id ? null : g.id));
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-900">
                  {g.title}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    expanded
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {expanded ? "收起" : `${krs.length} KR`}
                </span>
              </div>
            </button>

            <div className="mt-2.5">
              <TimeProgressBar
                completionPercent={g.progress}
                startDate={g.execution.start_date}
                endDate={g.execution.due_date}
                size="sm"
                unitContext={goalUnitContext(g.execution)}
              />
            </div>

            {expanded && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {krs.length === 0 ? (
                  <p className="text-center text-xs text-slate-400">
                    尚未添加 KR
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {krs.map((kr, idx) => (
                      <DashboardKrRow
                        key={kr.id}
                        kr={kr}
                        index={idx}
                        goalId={g.id}
                        onLongPressKr={openGoalReview}
                      />
                    ))}
                  </ul>
                )}
                <Link
                  href={withStatsReturn(`/goals?detail=${g.id}`)}
                  className="block pt-1 text-center text-xs text-[var(--primary)] hover:underline"
                >
                  打开目标详情
                </Link>
              </div>
            )}
          </li>
        );
      })}
      <li className="px-1 pt-2">
        <p className="text-center text-[10px] text-slate-400">
          长按目标或 KR 可快速进入 OKR 复盘
        </p>
      </li>
    </ul>
  );
}
