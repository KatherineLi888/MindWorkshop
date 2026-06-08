"use client";

import { useEffect, useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalActivityCalendar } from "@/components/goals/GoalActivityCalendar";
import { GoalDirectorySidebar } from "@/components/goals/GoalDirectorySidebar";
import { GoalExecutionPanel } from "@/components/goals/GoalExecutionPanel";
import { GoalOkrEditForm } from "@/components/goals/GoalOkrEditForm";
import { KrTaskList } from "@/components/goals/KrTaskList";
import { SmartDisplay } from "@/components/goals/SmartDisplay";
import { AnchorTrackSection } from "@/components/track/AnchorTrackSection";
import { FlowAdvanceBar } from "@/components/flow/FlowAdvanceBar";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import {
  loadGoalSmartVersions,
  saveGoal,
  type GoalWithMeta,
} from "@/lib/goals/storage";
import { isQualitativeKr } from "@/lib/goals/kr-tasks";
import { normalizeExecution, type GoalExecution } from "@/lib/goals/types";
import { formatPeriodRange } from "@/lib/goals/time-progress";
import { goalUnitContext } from "@/lib/goals/time-gap-units";
import type { SmartFields } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  goal: GoalWithMeta;
  onBack: () => void;
  onUpdated: (goals: GoalWithMeta[]) => void;
  onOpenKr: (krId: string) => void;
};

export function GoalDetail({ goal, onBack, onUpdated, onOpenKr }: Props) {
  const [draft, setDraft] = useState(goal);
  const [versions, setVersions] = useState<SmartFields[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarRefresh, setCalendarRefresh] = useState(0);
  const [headerMenu, setHeaderMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editingOkr, setEditingOkr] = useState(false);
  const [selectedKrId, setSelectedKrId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(goal);
  }, [goal.id, goal.updated_at]);

  useEffect(() => {
    loadGoalSmartVersions(goal.id).then((v) => {
      if (v.length) setVersions(v);
      else if (goal.smart_versions?.length) setVersions(goal.smart_versions);
      else setVersions([goal.smart_current]);
    });
  }, [goal.id, goal.smart_current, goal.smart_versions]);

  const persistGoal = async (next: GoalWithMeta) => {
    const normalized = normalizeExecution(next.execution);
    const saved = await saveGoal({
      ...next,
      execution: normalized,
    });
    const updated = saved.find((g) => g.id === goal.id);
    if (!updated) {
      throw new Error("未找到该目标，请返回列表后重试");
    }
    onUpdated(saved);
    setDraft(updated);
    return updated;
  };

  const persistExecution = async (execution: GoalExecution) => {
    await persistGoal({ ...draft, execution });
  };

  const handleSaveExecution = async (execution: GoalExecution) => {
    setSaving(true);
    try {
      await persistExecution(execution);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRecord = async (execution: GoalExecution) => {
    setSaving(true);
    try {
      await persistExecution(execution);
    } finally {
      setSaving(false);
    }
  };

  const saveOkrEdit = async () => {
    setSaving(true);
    try {
      await persistGoal(draft);
      setEditingOkr(false);
    } finally {
      setSaving(false);
    }
  };

  const periodLabel = formatPeriodRange(
    draft.execution.start_date,
    draft.execution.due_date
  );

  const selectedKr = selectedKrId
    ? draft.execution.key_results.find((k) => k.id === selectedKrId)
    : null;

  const saveSelectedKrTasks = async (
    tasks: import("@/lib/goals/types").KrTask[]
  ) => {
    if (!selectedKr) return;
    const krs = draft.execution.key_results.map((k) =>
      k.id === selectedKr.id ? { ...k, tasks } : k
    );
    await handleSaveExecution({ ...draft.execution, key_results: krs });
  };

  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-3 p-4 lg:space-y-3 lg:p-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← 返回目标列表
      </Button>

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start lg:gap-3">
        <div className="flex min-w-0 w-full flex-col gap-1.5 lg:sticky lg:top-4 lg:self-stretch">
          <GoalDirectorySidebar
            goal={draft}
            selectedKrId={selectedKrId}
            onSelectKr={setSelectedKrId}
          />
          <Card className="hidden w-full bg-white px-1.5 py-1.5 lg:block">
            <GoalExecutionPanel
              goalId={draft.id}
              goalTitle={draft.title}
              execution={draft.execution}
              onChange={(execution) =>
                setDraft((d) => ({ ...d, execution }))
              }
              onSave={handleSaveExecution}
              onSaveRecord={handleSaveRecord}
              onOpenKr={onOpenKr}
              onActivityLogged={() => setCalendarRefresh((n) => n + 1)}
              saving={saving}
              compact
            />
          </Card>
        </div>

        <div className="min-w-0 w-full space-y-2">
          <Card
            className={cn("bg-white p-3", !editingOkr && "lg:hidden")}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHeaderMenu({ x: e.clientX, y: e.clientY });
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 lg:hidden">
                <h2 className="text-base font-medium text-slate-900">
                  {draft.title}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {periodLabel ?? "未设置周期"}
                </p>
              </div>
              <p className="shrink-0 text-xl font-semibold tabular-nums text-slate-700 lg:hidden">
                {draft.progress}%
              </p>
            </div>

            {editingOkr ? (
              <GoalOkrEditForm
                draft={draft}
                onChange={setDraft}
                onSave={saveOkrEdit}
                onCancel={() => {
                  setDraft(goal);
                  setEditingOkr(false);
                }}
                saving={saving}
              />
            ) : (
              <TimeProgressBar
                completionPercent={draft.progress}
                startDate={draft.execution.start_date}
                endDate={draft.execution.due_date}
                size="sm"
                unitContext={goalUnitContext(draft.execution)}
                className={cn("mt-2 lg:hidden", !editingOkr && "lg:mt-0")}
              />
            )}
          </Card>

          {selectedKr && isQualitativeKr(selectedKr) && (
            <Card className="bg-white p-3">
              <p className="text-xs font-medium text-slate-700">
                {selectedKr.title.trim() || "定性 KR"} · 子任务
              </p>
              <KrTaskList
                className="mt-2"
                tasks={selectedKr.tasks ?? []}
                onChange={(tasks) => void saveSelectedKrTasks(tasks)}
              />
            </Card>
          )}

          <GoalActivityCalendar
            goalId={draft.id}
            startDate={draft.execution.start_date}
            endDate={draft.execution.due_date}
            title="OKR 月度日历"
            aggregateSubKrs
            refreshKey={calendarRefresh}
            defaultExpanded
            monthOnly
          />

          <Card className="bg-white px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-slate-600">SMART 拆解</h3>
              {versions.length > 1 && (
                <button
                  type="button"
                  className="text-[10px] text-[#3B82F6] hover:underline"
                  onClick={() => setShowHistory((s) => !s)}
                >
                  {showHistory ? "当前版" : `历史 (${versions.length})`}
                </button>
              )}
            </div>
            {showHistory ? (
              <div className="space-y-2">
                {versions.map((v, i) => (
                  <div key={i}>
                    <p className="mb-0.5 text-[10px] text-slate-400">
                      版本 {i + 1}
                      {i === versions.length - 1 ? " · 当前" : ""}
                    </p>
                    <SmartDisplay smart={v} compact collapsible={false} />
                  </div>
                ))}
              </div>
            ) : (
              <SmartDisplay smart={draft.smart_current} compact collapsible={false} />
            )}
          </Card>

          <AnchorTrackSection
            anchorType="goal"
            anchorId={draft.id}
            anchorTitle={draft.title}
          />

          <div className="lg:hidden">
            <Card className="bg-white p-2">
              <GoalExecutionPanel
                goalId={draft.id}
                goalTitle={draft.title}
                execution={draft.execution}
                onChange={(execution) =>
                  setDraft((d) => ({ ...d, execution }))
                }
                onSave={handleSaveExecution}
                onSaveRecord={handleSaveRecord}
                onOpenKr={onOpenKr}
                onActivityLogged={() => setCalendarRefresh((n) => n + 1)}
                saving={saving}
                compact
              />
            </Card>
          </div>

          {draft.goal_type !== "pending" && draft.progress < 100 && (
            <FlowAdvanceBar
              fromStage="goals"
              toStage="track"
              title={draft.title}
              entityId={draft.id}
              compact
            />
          )}
        </div>
      </div>

      {headerMenu && (
        <ContextMenu
          x={headerMenu.x}
          y={headerMenu.y}
          onClose={() => setHeaderMenu(null)}
          items={[
            {
              type: "action",
              label: "编辑 OKR",
              onClick: () => setEditingOkr(true),
            },
          ]}
        />
      )}
    </div>
  );
}
