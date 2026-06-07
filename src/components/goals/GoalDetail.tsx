"use client";

import { useEffect, useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoalActivityCalendar } from "@/components/goals/GoalActivityCalendar";
import { GoalExecutionPanel } from "@/components/goals/GoalExecutionPanel";
import { GoalOkrEditForm } from "@/components/goals/GoalOkrEditForm";
import { GoalSeedBadge } from "@/components/goals/GoalSeedBadge";
import { SmartDisplay } from "@/components/goals/SmartDisplay";
import { AnchorTrackSection } from "@/components/track/AnchorTrackSection";
import { FlowAdvanceBar } from "@/components/flow/FlowAdvanceBar";
import {
  loadGoalSmartVersions,
  saveGoal,
  type GoalWithMeta,
} from "@/lib/goals/storage";
import { normalizeExecution, type GoalExecution } from "@/lib/goals/types";
import { formatPeriodRange } from "@/lib/goals/time-progress";
import { goalUnitContext } from "@/lib/goals/time-gap-units";
import { resolveProgressVisual } from "@/lib/goals/progress-visual";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
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

  const progressVisual = resolveProgressVisual(
    draft.progress,
    draft.execution.start_date,
    draft.execution.due_date
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← 返回目标列表
      </Button>

      <Card
        className="bg-white"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setHeaderMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium text-slate-900">
                {draft.title}
              </h2>
              <GoalSeedBadge entityId={draft.id} title={draft.title} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {periodLabel ?? "未设置周期"}
            </p>
          </div>
          <p
            className={cn(
              "shrink-0 text-2xl font-semibold tabular-nums",
              progressVisual.percentClass
            )}
          >
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
            size="md"
            unitContext={goalUnitContext(draft.execution)}
            className="mt-3"
          />
        )}
      </Card>

      <GoalActivityCalendar
        goalId={draft.id}
        startDate={draft.execution.start_date}
        endDate={draft.execution.due_date}
        title="OKR 完成日历"
        aggregateSubKrs
        refreshKey={calendarRefresh}
      />

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

      <Card className="bg-white p-4">
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
        />
      </Card>

      <Card className="bg-white px-3 py-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium text-slate-500">SMART 拆解</h3>
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
          <div className="space-y-3">
            {versions.map((v, i) => (
              <div key={i}>
                <p className="mb-1 text-[10px] text-slate-400">
                  版本 {i + 1}
                  {i === versions.length - 1 ? " · 当前" : ""}
                </p>
                <SmartDisplay smart={v} compact collapsible defaultCollapsed />
              </div>
            ))}
          </div>
        ) : (
          <SmartDisplay
            smart={draft.smart_current}
            compact
            collapsible
            defaultCollapsed
          />
        )}
      </Card>

      <AnchorTrackSection
        anchorType="goal"
        anchorId={draft.id}
        anchorTitle={draft.title}
      />

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
  );
}
