"use client";

import { useState } from "react";
import { GoalKrListPreview } from "@/components/goals/GoalKrListPreview";
import { GoalSeedBadge } from "@/components/goals/GoalSeedBadge";
import { KrProgressBar, KrProgressPercent } from "@/components/goals/KrProgressBar";
import { KrQuickAddButton } from "@/components/goals/KrQuickAddButton";
import { KrRecordDialog } from "@/components/goals/KrRecordDialog";
import {
  hasManualQuantityTracking,
  patchKrRecordWithLog,
  patchQuantityRecordWithLog,
} from "@/lib/goals/record";
import { saveGoal, type GoalWithMeta } from "@/lib/goals/storage";
import { normalizeExecution } from "@/lib/goals/types";
import type { GoalChallenge } from "@/lib/goals/challenges";
import { formatPeriodRange } from "@/lib/goals/time-progress";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import { goalUnitContext } from "@/lib/goals/time-gap-units";
import { resolveProgressVisual } from "@/lib/goals/progress-visual";
import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  near: "短期",
  long: "长期",
  pending: "待定",
};

type Props = {
  goal: GoalWithMeta;
  /** 「全部」列表：标注进行中的挑战 */
  activeChallenges?: GoalChallenge[];
  expanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onOpenDetail: () => void;
  onOpenKrDetail?: (krId: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onUpdated: (goals: GoalWithMeta[]) => void;
};

export function GoalListCard({
  goal,
  activeChallenges,
  expanded,
  onToggleExpand,
  onOpenDetail,
  onOpenKrDetail,
  onContextMenu,
  onUpdated,
}: Props) {
  const [recordingKrId, setRecordingKrId] = useState<string | null>(null);
  const [expandedQualKrId, setExpandedQualKrId] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const krs = goal.execution.key_results;
  const hasKrs = krs.some((k) => k.title.trim() || k.target > 0);
  const manualQty = hasManualQuantityTracking(goal.execution);
  const recordingKr = krs.find((k) => k.id === recordingKrId);
  const period = formatPeriodRange(
    goal.execution.start_date,
    goal.execution.due_date
  );

  const persistExecution = async (execution: typeof goal.execution) => {
    setSaving(true);
    try {
      const next = await saveGoal({ ...goal, execution });
      onUpdated(next);
    } finally {
      setSaving(false);
    }
  };

  const handleKrRecord = async (krId: string, value: number) => {
    await persistExecution(
      patchKrRecordWithLog(goal.id, goal.execution, krId, value)
    );
    setRecordingKrId(null);
  };

  const toggleQualTask = async (
    krId: string,
    taskId: string,
    completed: boolean
  ) => {
    setSavingTaskId(taskId);
    try {
      const execution = normalizeExecution({
        ...goal.execution,
        key_results: goal.execution.key_results.map((kr) => {
          if (kr.id !== krId) return kr;
          const tasks = (kr.tasks ?? []).map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed,
                  completed_at: completed ? new Date().toISOString() : null,
                }
              : t
          );
          const done = tasks.filter((t) => t.completed).length;
          return {
            ...kr,
            tasks,
            current: done,
            target: Math.max(1, tasks.filter((t) => t.title.trim()).length),
          };
        }),
      });
      await persistExecution(execution);
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleQuantityAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    const atTarget =
      goal.execution.target_quantity != null &&
      goal.execution.current_quantity >= goal.execution.target_quantity;
    if (atTarget) return;
    await persistExecution(patchQuantityRecordWithLog(goal.id, goal.execution, 1));
  };

  const countLabel = hasKrs
    ? `${krs.length} 条 KR`
    : manualQty
      ? `${goal.execution.current_quantity}/${goal.execution.target_quantity}${goal.execution.quantity_unit || ""}`
      : null;

  const progressVisual = resolveProgressVisual(
    goal.progress,
    goal.execution.start_date,
    goal.execution.due_date
  );

  const longPress = useLongPress({
    onLongPress: (e) => {
      if (goal.goal_type === "pending" || goal.progress >= 100) return;
      const touch = "touches" in e && e.touches[0] ? e.touches[0] : null;
      if (!touch) return;
      onContextMenu({
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent);
    },
    onContextMenu,
  });

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] transition-colors hover:border-[#3B82F6]/40 hover:bg-white",
        saving && "opacity-80"
      )}
      {...longPress.handlers}
    >
      <div className="flex items-start gap-2 px-3 pt-3">
        <div
          className="min-w-0 flex-1"
          onContextMenu={onContextMenu}
        >
          <button
            type="button"
            onClick={() => onOpenDetail()}
            className="text-left"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-slate-900 transition hover:text-[#3B82F6]">
                {goal.title}
              </span>
              <GoalSeedBadge entityId={goal.id} title={goal.title} />
            </div>
          </button>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {period ?? "未设置周期"}
            {countLabel && (
              <span className="text-slate-400"> · {countLabel}</span>
            )}
          </p>
          {activeChallenges && activeChallenges.length > 0 && (
            <p className="mt-0.5 truncate text-[11px] text-violet-600">
              {activeChallenges.length === 1
                ? `挑战进行中：${activeChallenges[0].title}`
                : `${activeChallenges.length} 个挑战进行中`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p
            className={cn(
              "text-xl font-semibold tabular-nums leading-none",
              progressVisual.percentClass
            )}
          >
            {goal.progress}%
          </p>
          <span className="text-[10px] text-slate-400">
            {TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
          </span>
          {manualQty && (
            <button
              type="button"
              title="完成 +1"
              disabled={
                saving ||
                (goal.execution.target_quantity != null &&
                  goal.execution.current_quantity >=
                    goal.execution.target_quantity)
              }
              onClick={handleQuantityAdd}
              className={cn(
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none text-white transition active:scale-95",
                goal.execution.target_quantity != null &&
                  goal.execution.current_quantity >=
                    goal.execution.target_quantity
                  ? "cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-emerald-500 hover:bg-emerald-600"
              )}
            >
              +
            </button>
          )}
          {hasKrs && krs.length === 1 && !expanded && (
            <KrQuickAddButton
              kr={krs[0]}
              size="sm"
              className="mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  krs[0].recordMode === "count" ||
                  krs[0].recordMode === "consume"
                ) {
                  void handleKrRecord(krs[0].id, 1);
                } else {
                  setRecordingKrId(krs[0].id);
                }
              }}
            />
          )}
        </div>
      </div>

      <div className="px-3 pb-3 pt-2">
        <TimeProgressBar
          completionPercent={goal.progress}
          startDate={goal.execution.start_date}
          endDate={goal.execution.due_date}
          size="sm"
          unitContext={goalUnitContext(goal.execution)}
        />
      </div>

      {hasKrs && !expanded && krs.length === 1 && onOpenKrDetail && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenKrDetail(krs[0].id);
          }}
          className="flex w-full items-center justify-between gap-2 border-t border-[#EEF1F5] px-3 py-1.5 text-left hover:bg-white/80"
        >
          <span className="truncate text-[11px] font-medium text-slate-700">
            {krs[0].title.trim() || "KR 1"}
          </span>
          <KrProgressPercent kr={krs[0]} className="text-[11px]" />
        </button>
      )}

      {hasKrs && (
        <GoalKrListPreview
          keyResults={krs}
          expanded={expanded}
          expandedQualKrId={expandedQualKrId}
          onToggle={onToggleExpand}
          onToggleQualKr={(krId, e) => {
            e.stopPropagation();
            setExpandedQualKrId((cur) => (cur === krId ? null : krId));
          }}
          onToggleTask={(krId, taskId, completed) =>
            void toggleQualTask(krId, taskId, completed)
          }
          savingTaskId={savingTaskId}
          onOpenKr={
            onOpenKrDetail
              ? (krId, e) => {
                  e.stopPropagation();
                  onOpenKrDetail(krId);
                }
              : undefined
          }
          onRecordKr={(krId, e) => {
            e.stopPropagation();
            const kr = krs.find((k) => k.id === krId);
            if (!kr) return;
            if (kr.recordMode === "count" || kr.recordMode === "consume") {
              void handleKrRecord(krId, 1);
            } else {
              setRecordingKrId(krId);
            }
          }}
        />
      )}

      {recordingKr && (
        <KrRecordDialog
          kr={recordingKr}
          open
          onClose={() => setRecordingKrId(null)}
          onSubmit={(v) => void handleKrRecord(recordingKr.id, v)}
        />
      )}
    </li>
  );
}
