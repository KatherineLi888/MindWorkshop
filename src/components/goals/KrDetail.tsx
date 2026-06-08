"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalActivityCalendar } from "@/components/goals/GoalActivityCalendar";
import { KrLinkedPanels } from "@/components/goals/KrLinkedPanels";
import { KrProgressBar, KrProgressPercent } from "@/components/goals/KrProgressBar";
import { KrRecordDialog } from "@/components/goals/KrRecordDialog";
import { KrTaskList } from "@/components/goals/KrTaskList";
import { isQualitativeKr } from "@/lib/goals/kr-tasks";
import {
  formatKrProgressLine,
  getKrProgressVisual,
  KR_PROGRESS_BAR,
} from "@/lib/goals/kr-progress";
import { patchKrRecordWithLog } from "@/lib/goals/record";
import { saveGoal, type GoalWithMeta } from "@/lib/goals/storage";
import {
  computeTimeProgress,
  formatPeriodRange,
} from "@/lib/goals/time-progress";
import type { KeyResult } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

type Props = {
  goal: GoalWithMeta;
  kr: KeyResult;
  onBack: () => void;
  onUpdated: (goals: GoalWithMeta[]) => void;
};

export function KrDetail({ goal, kr, onBack, onUpdated }: Props) {
  const [draftKr, setDraftKr] = useState(kr);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  useEffect(() => {
    const fresh = goal.execution.key_results.find((k) => k.id === kr.id);
    if (fresh) setDraftKr(fresh);
  }, [goal.execution, goal.updated_at, kr.id]);

  const visual = getKrProgressVisual(draftKr);
  const period = formatPeriodRange(draftKr.start_date, draftKr.due_date);
  const progressLine = formatKrProgressLine(draftKr);
  const time = computeTimeProgress(draftKr.start_date, draftKr.due_date);
  const qualitative = isQualitativeKr(draftKr);
  const atTarget =
    !qualitative &&
    draftKr.target > 0 &&
    draftKr.current >= draftKr.target &&
    !draftKr.allowExceed;

  const saveTasks = async (tasks: NonNullable<KeyResult["tasks"]>) => {
    const active = tasks.filter((t) => t.title.trim());
    const done = active.filter((t) => t.completed).length;
    const execution = {
      ...goal.execution,
      key_results: goal.execution.key_results.map((k) =>
        k.id === draftKr.id
          ? {
              ...k,
              tasks,
              current: done,
              target: Math.max(1, active.length || 1),
            }
          : k
      ),
    };
    setSaving(true);
    try {
      const saved = await saveGoal({ ...goal, execution });
      onUpdated(saved);
      const updatedKr = execution.key_results.find((k) => k.id === draftKr.id);
      if (updatedKr) setDraftKr(updatedKr);
    } finally {
      setSaving(false);
    }
  };

  const handleRecord = async (value: number) => {
    const execution = patchKrRecordWithLog(
      goal.id,
      goal.execution,
      draftKr.id,
      value
    );
    setSaving(true);
    try {
      const saved = await saveGoal({ ...goal, execution });
      onUpdated(saved);
      const updatedKr = execution.key_results.find((k) => k.id === draftKr.id);
      if (updatedKr) setDraftKr(updatedKr);
      setCalendarRefresh((n) => n + 1);
    } finally {
      setSaving(false);
      setRecording(false);
    }
  };

  const label = draftKr.title.trim() || "未命名 KR";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← 返回 {goal.title}
      </Button>

      <Card className="bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400">关键结果</p>
            <h2 className="text-lg font-medium text-slate-900">{label}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {period ?? "未设置周期"}
              {" · "}
              {time.status === "not_started" ? "尚未开始" : progressLine}
            </p>
          </div>
          <KrProgressPercent kr={draftKr} className="text-2xl" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <KrProgressBar kr={draftKr} size="md" className="flex-1" />
          {!qualitative && (
            <button
              type="button"
              title="新增记录"
              disabled={
                saving ||
                (atTarget &&
                  (draftKr.recordMode === "count" ||
                    draftKr.recordMode === "consume"))
              }
              onClick={() => setRecording(true)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base leading-none transition active:scale-95",
                atTarget &&
                  (draftKr.recordMode === "count" ||
                    draftKr.recordMode === "consume")
                  ? "cursor-not-allowed bg-slate-200 text-slate-400"
                  : visual.isOverflow
                    ? KR_PROGRESS_BAR.addBtnOverflow
                    : KR_PROGRESS_BAR.addBtn
              )}
            >
              +
            </button>
          )}
        </div>
      </Card>

      {qualitative && (
        <Card className="bg-white p-4">
          <h3 className="text-sm font-medium text-slate-800">子任务</h3>
          <p className="mt-0.5 text-[10px] text-slate-400">
            勾选完成、设置日期，进度自动同步
          </p>
          <KrTaskList
            className="mt-3"
            tasks={draftKr.tasks ?? []}
            onChange={(tasks) => void saveTasks(tasks)}
          />
        </Card>
      )}

      <GoalActivityCalendar
        goalId={goal.id}
        krId={kr.id}
        startDate={draftKr.start_date}
        endDate={draftKr.due_date}
        title="KR 完成日历"
        refreshKey={calendarRefresh}
      />

      <KrLinkedPanels
        goalId={goal.id}
        goalTitle={goal.title}
        krId={kr.id}
        krTitle={draftKr.title}
      />

      {recording && (
        <KrRecordDialog
          kr={draftKr}
          open
          onClose={() => setRecording(false)}
          onSubmit={(v) => void handleRecord(v)}
        />
      )}
    </div>
  );
}
