"use client";

import { useState } from "react";
import { KrProgressBar, KrProgressPercent } from "@/components/goals/KrProgressBar";
import { KrQuickAddButton } from "@/components/goals/KrQuickAddButton";
import { KrRecordDialog } from "@/components/goals/KrRecordDialog";
import {
  bumpChallengeItem,
  computeChallengeProgress,
  deleteGoalChallenge,
  recordDeltaForKr,
  updateGoalChallenge,
  type GoalChallenge,
} from "@/lib/goals/challenges";
import { patchKrRecordWithLog } from "@/lib/goals/record";
import { resolveProgressVisual } from "@/lib/goals/progress-visual";
import { saveGoal, type GoalWithMeta } from "@/lib/goals/storage";
import { formatKrProgressLine } from "@/lib/goals/kr-progress";
import {
  computeTimeProgress,
  formatPeriodRange,
} from "@/lib/goals/time-progress";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import type { KeyResult } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

type Props = {
  challenge: GoalChallenge;
  goal: GoalWithMeta;
  expanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onOpenGoal: () => void;
  onGoalUpdated: (goals: GoalWithMeta[]) => void;
  onChallengeUpdated: () => void;
};

function challengeDisplayKr(kr: KeyResult, target: number, current: number): KeyResult {
  return { ...kr, target, current };
}

export function ChallengeListCard({
  challenge,
  goal,
  expanded,
  onToggleExpand,
  onOpenGoal,
  onGoalUpdated,
  onChallengeUpdated,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState<{
    itemId: string;
    kr: KeyResult;
  } | null>(null);

  const krs = goal.execution.key_results;
  const progress = computeChallengeProgress(challenge);
  const period = formatPeriodRange(challenge.start_date, challenge.due_date);
  const progressVisual = resolveProgressVisual(
    progress,
    challenge.start_date,
    challenge.due_date
  );
  const goalProgressVisual = resolveProgressVisual(
    goal.progress,
    goal.execution.start_date,
    goal.execution.due_date
  );

  const items = challenge.kr_targets
    .map((item) => {
      const kr = krs.find((k) => k.id === item.linkedKrId);
      if (!kr) return null;
      return { item, kr };
    })
    .filter(Boolean) as { item: (typeof challenge.kr_targets)[0]; kr: KeyResult }[];

  const handleRecord = async (itemId: string, value: number) => {
    const row = items.find((x) => x.item.id === itemId);
    if (!row) return;
    const { item, kr } = row;

    setSaving(true);
    try {
      const execution = patchKrRecordWithLog(
        goal.id,
        goal.execution,
        kr.id,
        value
      );
      const delta = recordDeltaForKr(kr, value);
      const nextCh = bumpChallengeItem(challenge, itemId, delta);
      updateGoalChallenge(nextCh);
      const saved = await saveGoal({ ...goal, execution });
      onGoalUpdated(saved);
      onChallengeUpdated();
    } finally {
      setSaving(false);
      setRecording(null);
    }
  };

  const countLabel = `${items.length} 条 KR`;

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border-2 border-violet-300 bg-gradient-to-b from-violet-50/40 to-white shadow-sm ring-1 ring-violet-100 transition-colors hover:border-violet-400 hover:shadow-md",
        saving && "opacity-80"
      )}
    >
      <div className="flex items-start gap-2 px-3 pt-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              挑战
            </span>
            <span className="text-sm font-medium text-slate-900">
              {challenge.title}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {period ?? "未设置周期"}
            <span className="text-slate-400"> · {countLabel}</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGoal();
            }}
            className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px]"
          >
            <span className="text-violet-500">关联</span>
            <span className="max-w-[8rem] truncate font-medium text-slate-700 hover:text-violet-700">
              {goal.title}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">主目标</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                goalProgressVisual.percentClass
              )}
            >
              {goal.progress}%
            </span>
          </button>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p
            className={cn(
              "text-xl font-semibold tabular-nums leading-none",
              progressVisual.percentClass === "text-slate-600"
                ? "text-violet-600"
                : progressVisual.percentClass
            )}
          >
            {progress}%
          </p>
          <button
            type="button"
            title="删除挑战"
            className="text-[10px] text-slate-300 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              deleteGoalChallenge(challenge.id);
              onChallengeUpdated();
            }}
          >
            删除
          </button>
          {items.length === 1 && !expanded && (
            <KrQuickAddButton
              kr={challengeDisplayKr(
                items[0].kr,
                items[0].item.target,
                items[0].item.current
              )}
              size="sm"
              className="mt-0.5 !bg-violet-500 hover:!bg-violet-600"
              onClick={(e) => {
                e.stopPropagation();
                const { kr, item } = items[0];
                if (
                  kr.recordMode === "count" ||
                  kr.recordMode === "consume"
                ) {
                  void handleRecord(item.id, 1);
                } else {
                  setRecording({ itemId: item.id, kr });
                }
              }}
            />
          )}
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        <TimeProgressBar
          completionPercent={progress}
          startDate={challenge.start_date}
          endDate={challenge.due_date}
          size="sm"
          className="[&_.bg-emerald-500]:bg-violet-500"
        />
      </div>

      {items.length > 0 && (
        <div className="border-t border-violet-100 bg-white/60">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[10px] text-slate-500 transition hover:bg-violet-50/50"
          >
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-block text-[8px] text-violet-400 transition-transform",
                  expanded && "rotate-90"
                )}
              >
                ▶
              </span>
              {expanded
                ? "收起 KR"
                : `${items.length} 条 KR · 点击展开`}
            </span>
            {!expanded && items.length > 1 && (
              <span className="text-[9px] text-violet-400">展开可快捷打卡</span>
            )}
          </button>
          {expanded && (
            <ul className="space-y-1 px-2 pb-2">
              {items.map(({ item, kr }, index) => {
                const display = challengeDisplayKr(
                  kr,
                  item.target,
                  item.current
                );
                const progressLine = formatKrProgressLine(display);
                const krPeriod = formatPeriodRange(
                  challenge.start_date,
                  challenge.due_date
                );
                const time = computeTimeProgress(
                  challenge.start_date,
                  challenge.due_date
                );
                const done =
                  item.target > 0 && item.current >= item.target;
                const label =
                  kr.calendarKeyword?.trim() ||
                  kr.title.trim() ||
                  `KR ${index + 1}`;

                return (
                  <li
                    key={item.id}
                    className="rounded-md border border-violet-100 bg-violet-50/30 px-2 py-1.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-slate-700">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {krPeriod && <span>{krPeriod} · </span>}
                          {time.status === "not_started"
                            ? "尚未开始"
                            : progressLine}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <KrProgressPercent
                          kr={display}
                          className="text-[11px] !text-violet-600"
                        />
                        <button
                          type="button"
                          disabled={saving || done}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              kr.recordMode === "count" ||
                              kr.recordMode === "consume"
                            ) {
                              void handleRecord(item.id, 1);
                            } else {
                              setRecording({ itemId: item.id, kr });
                            }
                          }}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white",
                            done
                              ? "cursor-not-allowed bg-slate-200 text-slate-400"
                              : "bg-violet-500 hover:bg-violet-600"
                          )}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <KrProgressBar kr={display} size="sm" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {recording && (
        <KrRecordDialog
          kr={recording.kr}
          open
          onClose={() => setRecording(null)}
          onSubmit={(v) => void handleRecord(recording.itemId, v)}
        />
      )}
    </li>
  );
}
