"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KrProgressBar, KrProgressPercent } from "@/components/goals/KrProgressBar";
import { SmartDisplay } from "@/components/goals/SmartDisplay";
import { AnchorTrackSection } from "@/components/track/AnchorTrackSection";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import {
  computeChallengeProgress,
  type GoalChallenge,
} from "@/lib/goals/challenges";
import { formatKrProgressLine } from "@/lib/goals/kr-progress";
import { type GoalWithMeta } from "@/lib/goals/storage";
import { formatPeriodRange } from "@/lib/goals/time-progress";
import { goalUnitContext } from "@/lib/goals/time-gap-units";
import type { KeyResult } from "@/lib/goals/types";

type Props = {
  challenge: GoalChallenge;
  goal: GoalWithMeta;
  onBack: () => void;
};

function challengeDisplayKr(
  kr: KeyResult,
  target: number,
  current: number
): KeyResult {
  return { ...kr, target, current };
}

export function ChallengeDetail({ challenge, goal, onBack }: Props) {
  const progress = computeChallengeProgress(challenge);
  const period = formatPeriodRange(challenge.start_date, challenge.due_date);
  const goalPeriod = formatPeriodRange(
    goal.execution.start_date,
    goal.execution.due_date
  );
  const krs = goal.execution.key_results;

  const items = challenge.kr_targets
    .map((item) => {
      const kr = krs.find((k) => k.id === item.linkedKrId);
      if (!kr) return null;
      return { item, kr };
    })
    .filter(Boolean) as {
    item: (typeof challenge.kr_targets)[0];
    kr: (typeof krs)[0];
  }[];

  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-3 p-4 lg:space-y-3 lg:p-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← 返回目标列表
      </Button>

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start lg:gap-3">
        <div className="flex min-w-0 w-full flex-col gap-2">
          <Card className="w-full border-violet-200 bg-gradient-to-b from-violet-50/50 to-white p-3">
            <p className="text-[10px] font-semibold text-violet-600">挑战目标</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
              {challenge.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {period ?? "未设置周期"}
            </p>

            <div className="mt-2">
              <p className="mb-1 text-[10px] font-medium text-violet-700">
                挑战整体进度 {progress}%
              </p>
              <TimeProgressBar
                completionPercent={progress}
                startDate={challenge.start_date}
                endDate={challenge.due_date}
                size="md"
                fullWidth
                className="[&_.bg-emerald-500]:bg-violet-500 px-0"
              />
            </div>

            <div className="mt-3 border-t border-violet-100 pt-2">
              <p className="text-[10px] font-medium text-slate-500">关联总目标</p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-slate-800">
                {goal.title}
              </p>
              <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
                总进度 {goal.progress}%
                {goalPeriod ? ` · ${goalPeriod}` : ""}
              </p>
            </div>
          </Card>

          <Card className="w-full bg-white p-3">
            <p className="text-xs font-medium text-slate-700">挑战 KR 进度</p>
            <ul className="mt-2 space-y-2">
              {items.length === 0 ? (
                <li className="text-[11px] text-slate-400">暂无挑战 KR</li>
              ) : (
                items.map(({ item, kr }, i) => {
                  const display = challengeDisplayKr(
                    kr,
                    item.target,
                    item.current
                  );
                  const label =
                    kr.calendarKeyword?.trim() ||
                    kr.title.trim() ||
                    `KR ${i + 1}`;

                  return (
                    <li
                      key={item.id}
                      className="rounded-lg border border-violet-100 bg-violet-50/20 px-2 py-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-slate-700">
                          {label}
                        </p>
                        <KrProgressPercent
                          kr={display}
                          className="text-[11px] !text-violet-600"
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {formatKrProgressLine(display)}
                      </p>
                      <KrProgressBar
                        kr={display}
                        size="sm"
                        className="mt-1 w-full [&_.bg-emerald-500]:bg-violet-500"
                      />
                    </li>
                  );
                })
              )}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 w-full space-y-2">
          <Card className="w-full border-[#E2E8F0] bg-white p-3">
            <p className="text-[10px] font-medium text-slate-500">
              主 OKR 完成情况
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-800">
              {goal.title}
            </p>
            {goalPeriod && (
              <p className="mt-0.5 text-[11px] text-slate-500">{goalPeriod}</p>
            )}
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-700">
              {goal.progress}%
            </p>
            <TimeProgressBar
              completionPercent={goal.progress}
              startDate={goal.execution.start_date}
              endDate={goal.execution.due_date}
              size="sm"
              unitContext={goalUnitContext(goal.execution)}
              className="mt-1.5"
            />
            {krs.length > 0 && (
              <ul className="mt-2 space-y-1 border-t border-[#EEF1F5] pt-2">
                {krs.map((kr, i) => (
                  <li
                    key={kr.id}
                    className="flex items-center justify-between gap-2 text-[10px] text-slate-600"
                  >
                    <span className="min-w-0 truncate">
                      {kr.title.trim() || `KR ${i + 1}`}
                    </span>
                    <KrProgressPercent kr={kr} className="text-[10px]" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-white px-3 py-2">
            <h3 className="text-xs font-medium text-slate-600">SMART 拆解</h3>
            <div className="mt-1">
              <SmartDisplay
                smart={goal.smart_current}
                compact
                collapsible={false}
              />
            </div>
          </Card>

          <AnchorTrackSection
            anchorType="goal"
            anchorId={goal.id}
            anchorTitle={goal.title}
          />
        </div>
      </div>
    </div>
  );
}
