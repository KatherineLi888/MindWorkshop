"use client";

import { useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import type { ContextMenuItem } from "@/app/canvas/ContextMenu";
import { Card } from "@/components/ui/card";
import { KrProgressBar, KrProgressPercent } from "@/components/goals/KrProgressBar";
import { KrQuickAddButton } from "@/components/goals/KrQuickAddButton";
import { KrRecordDialog } from "@/components/goals/KrRecordDialog";
import { useLongPress } from "@/hooks/useLongPress";
import {
  collectOverdueGoalGroups,
  type OverdueGoalGroup,
  type OverdueQualTaskRow,
  type OverdueQuantRow,
} from "@/lib/goals/overdue-items";
import {
  deleteQualTask,
  moveKrToToday,
  moveQualTaskToToday,
  patchKrSchedule,
  patchQualTask,
} from "@/lib/goals/task-mutations";
import { patchKrRecordWithLog } from "@/lib/goals/record";
import {
  formatOverdueLabel,
  formatScheduleCaption,
} from "@/lib/goals/recurrence";
import { saveGoal, type GoalWithMeta } from "@/lib/goals/storage";
import { normalizeExecution } from "@/lib/goals/types";
import {
  collectTodayGoalGroups,
  todayIso,
  type TodayGoalGroup,
  type TodayQualTaskRow,
} from "@/lib/goals/today-items";
import { cn } from "@/lib/utils";

type Props = {
  goals: GoalWithMeta[];
  onUpdated: (goals: GoalWithMeta[]) => void;
  onOpenGoal?: (goal: GoalWithMeta, krId?: string) => void;
};

type TaskMenuTarget =
  | { kind: "qual"; row: OverdueQualTaskRow; x: number; y: number }
  | { kind: "quant"; row: OverdueQuantRow; x: number; y: number };

type DateEditTarget =
  | { kind: "qual"; goalId: string; krId: string; taskId: string; value: string }
  | { kind: "quant"; goalId: string; krId: string; value: string };

async function toggleQualTask(
  goals: GoalWithMeta[],
  row: TodayQualTaskRow | OverdueQualTaskRow,
  completed: boolean
): Promise<GoalWithMeta[]> {
  const goal = goals.find((g) => g.id === row.goalId);
  if (!goal) return goals;
  const execution = normalizeExecution({
    ...goal.execution,
    key_results: goal.execution.key_results.map((kr) => {
      if (kr.id !== row.krId) return kr;
      const tasks = (kr.tasks ?? []).map((t) =>
        t.id === row.task.id
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
  return saveGoal({ ...goal, execution });
}

function openTaskMenu(
  e: React.MouseEvent | React.TouchEvent,
  target: Omit<TaskMenuTarget, "x" | "y">
): TaskMenuTarget {
  const clientX =
    "clientX" in e ? e.clientX : e.touches[0]?.clientX ?? 0;
  const clientY =
    "clientY" in e ? e.clientY : e.touches[0]?.clientY ?? 0;
  return { ...target, x: clientX, y: clientY } as TaskMenuTarget;
}

function TodaySection({
  groups,
  goals,
  onUpdated,
  onOpenGoal,
}: {
  groups: TodayGoalGroup[];
  goals: GoalWithMeta[];
  onUpdated: (g: GoalWithMeta[]) => void;
  onOpenGoal?: (goal: GoalWithMeta, krId?: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [recordingKrId, setRecordingKrId] = useState<string | null>(null);

  const toggleTask = async (row: TodayQualTaskRow) => {
    setSavingId(row.task.id);
    try {
      const next = await toggleQualTask(goals, row, !row.task.completed);
      onUpdated(next);
    } finally {
      setSavingId(null);
    }
  };

  const recordQuant = async (goalId: string, krId: string, value: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    setSavingId(krId);
    try {
      const execution = patchKrRecordWithLog(
        goal.id,
        goal.execution,
        krId,
        value
      );
      const next = await saveGoal({ ...goal, execution });
      onUpdated(next);
    } finally {
      setSavingId(null);
      setRecordingKrId(null);
    }
  };

  const recordingKr = recordingKrId
    ? goals
        .flatMap((g) => g.execution.key_results)
        .find((k) => k.id === recordingKrId)
    : null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-left"
      >
        <span className="text-xs font-medium text-slate-700">
          今日任务
          <span className="ml-2 font-normal text-slate-400">
            {groups.reduce((n, g) => n + g.quant.length + g.qual.length, 0)} 项
          </span>
        </span>
        <span className="text-[10px] text-slate-400">
          {collapsed ? "展开" : "收起"}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              今天没有待办项
            </p>
          ) : (
            groups.map((group) => (
              <Card key={group.goalId} className="overflow-hidden bg-white p-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-[#EEF1F5] px-3 py-2 text-left hover:bg-slate-50/80"
                  onClick={() => {
                    const g = goals.find((x) => x.id === group.goalId);
                    if (g) onOpenGoal?.(g);
                  }}
                >
                  <span className="truncate text-sm font-medium text-slate-900">
                    {group.goalTitle}
                  </span>
                  {onOpenGoal && (
                    <span className="shrink-0 text-[10px] text-[#3B82F6]">
                      详情
                    </span>
                  )}
                </button>

                {group.quant.length > 0 && (
                  <ul className="divide-y divide-[#EEF1F5]">
                    {group.quant.map((row) => {
                      const caption = formatScheduleCaption(row.kr);
                      return (
                        <li
                          key={row.kr.id}
                          className="flex items-center gap-2 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-800">
                              {row.kr.title.trim() || row.label}
                              <span className="ml-1 text-[10px] font-normal text-emerald-600">
                                定量
                              </span>
                            </p>
                            {caption && (
                              <p className="text-[10px] text-slate-400">
                                {caption}
                              </p>
                            )}
                            <KrProgressBar
                              kr={row.kr}
                              size="sm"
                              className="mt-1 max-w-[12rem]"
                            />
                          </div>
                          <KrQuickAddButton
                            kr={row.kr}
                            size="sm"
                            disabled={savingId === row.kr.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                row.kr.recordMode === "count" ||
                                row.kr.recordMode === "consume"
                              ) {
                                void recordQuant(row.goalId, row.kr.id, 1);
                              } else {
                                setRecordingKrId(row.kr.id);
                              }
                            }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}

                {group.qual.length > 0 && (
                  <ul className="divide-y divide-[#EEF1F5]">
                    {group.qual.map((row) => {
                      const caption = formatScheduleCaption(row.task);
                      return (
                        <li
                          key={row.task.id}
                          className="flex items-start gap-2 px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={row.task.completed}
                            disabled={savingId === row.task.id}
                            onChange={() => void toggleTask(row)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-800">
                              {row.task.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {row.krTitle}
                              <span className="ml-1 text-violet-500">定性</span>
                              {caption ? ` · ${caption}` : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {recordingKr && (
        <KrRecordDialog
          kr={recordingKr}
          open
          onClose={() => setRecordingKrId(null)}
          onSubmit={(v) => {
            const g = goals.find((goal) =>
              goal.execution.key_results.some((k) => k.id === recordingKr.id)
            );
            if (g) void recordQuant(g.id, recordingKr.id, v);
          }}
        />
      )}
    </div>
  );
}

function OverdueSection({
  groups,
  goals,
  onUpdated,
  onOpenGoal,
}: {
  groups: OverdueGoalGroup[];
  goals: GoalWithMeta[];
  onUpdated: (g: GoalWithMeta[]) => void;
  onOpenGoal?: (goal: GoalWithMeta, krId?: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<TaskMenuTarget | null>(null);
  const [dateEdit, setDateEdit] = useState<DateEditTarget | null>(null);
  const [recordingKrId, setRecordingKrId] = useState<string | null>(null);
  const today = todayIso();

  const run = async (id: string, fn: () => Promise<GoalWithMeta[]>) => {
    setSavingId(id);
    try {
      onUpdated(await fn());
    } finally {
      setSavingId(null);
    }
  };

  const toggleTask = async (row: OverdueQualTaskRow) => {
    await run(row.task.id, () =>
      toggleQualTask(goals, row, !row.task.completed)
    );
  };

  const recordQuant = async (goalId: string, krId: string, value: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    await run(krId, async () => {
      const execution = patchKrRecordWithLog(
        goal.id,
        goal.execution,
        krId,
        value
      );
      return saveGoal({ ...goal, execution });
    });
    setRecordingKrId(null);
  };

  const handleMoveToToday = async (target: TaskMenuTarget) => {
    if (target.kind === "qual") {
      const { row } = target;
      await run(row.task.id, () =>
        moveQualTaskToToday(goals, row.goalId, row.krId, row.task.id, today)
      );
    } else {
      const { row } = target;
      await run(row.kr.id, () =>
        moveKrToToday(goals, row.goalId, row.kr.id, today)
      );
    }
  };

  const handleAbandon = async (target: TaskMenuTarget) => {
    if (target.kind === "qual") {
      const { row } = target;
      if (
        !window.confirm(`放弃并删除「${row.task.title}」？此操作不可撤销。`)
      ) {
        return;
      }
      await run(row.task.id, () =>
        deleteQualTask(goals, row.goalId, row.krId, row.task.id)
      );
    } else {
      const { row } = target;
      if (
        !window.confirm(
          `放弃「${row.kr.title.trim() || row.label}」的逾期跟进？将从今天重新计期。`
        )
      ) {
        return;
      }
      await run(row.kr.id, () =>
        moveKrToToday(goals, row.goalId, row.kr.id, today)
      );
    }
  };

  const startDateEdit = (target: TaskMenuTarget) => {
    if (target.kind === "qual") {
      setDateEdit({
        kind: "qual",
        goalId: target.row.goalId,
        krId: target.row.krId,
        taskId: target.row.task.id,
        value: target.row.task.due_date ?? target.row.overdueDate,
      });
    } else {
      setDateEdit({
        kind: "quant",
        goalId: target.row.goalId,
        krId: target.row.kr.id,
        value: target.row.kr.due_date ?? target.row.overdueDate,
      });
    }
  };

  const saveDateEdit = async () => {
    if (!dateEdit) return;
    if (dateEdit.kind === "qual") {
      await run(dateEdit.taskId, () =>
        patchQualTask(goals, dateEdit.goalId, dateEdit.krId, dateEdit.taskId, {
          due_date: dateEdit.value || null,
        })
      );
    } else {
      await run(dateEdit.krId, () =>
        patchKrSchedule(goals, dateEdit.goalId, dateEdit.krId, {
          due_date: dateEdit.value || null,
        })
      );
    }
    setDateEdit(null);
  };

  const menuItems = (target: TaskMenuTarget): ContextMenuItem[] => [
    {
      type: "action",
      label: "调整到今天",
      onClick: () => void handleMoveToToday(target),
    },
    {
      type: "action",
      label: "修改时间",
      onClick: () => startDateEdit(target),
    },
    { type: "separator" },
    {
      type: "action",
      label: target.kind === "qual" ? "放弃该任务" : "放弃逾期跟进",
      danger: true,
      onClick: () => void handleAbandon(target),
    },
  ];

  const recordingKr = recordingKrId
    ? goals
        .flatMap((g) => g.execution.key_results)
        .find((k) => k.id === recordingKrId)
    : null;

  const total = groups.reduce(
    (n, g) => n + g.quant.length + g.qual.length,
    0
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between rounded-lg border border-amber-200/80 bg-amber-50/40 px-3 py-2 text-left"
      >
        <span className="text-xs font-medium text-amber-900">
          过期任务
          <span className="ml-2 font-normal text-amber-700/70">{total} 项</span>
        </span>
        <span className="text-[10px] text-amber-600/80">
          {collapsed ? "展开" : "收起"}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              没有逾期未完成的任务
            </p>
          ) : (
            groups.map((group) => (
              <Card
                key={group.goalId}
                className="overflow-hidden border-amber-100 bg-white p-0"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-amber-50 px-3 py-2 text-left hover:bg-amber-50/30"
                  onClick={() => {
                    const g = goals.find((x) => x.id === group.goalId);
                    if (g) onOpenGoal?.(g);
                  }}
                >
                  <span className="truncate text-sm font-medium text-slate-900">
                    {group.goalTitle}
                  </span>
                  {onOpenGoal && (
                    <span className="shrink-0 text-[10px] text-[#3B82F6]">
                      详情
                    </span>
                  )}
                </button>

                {group.quant.map((row) => (
                  <OverdueQuantRowItem
                    key={row.kr.id}
                    row={row}
                    saving={savingId === row.kr.id}
                    editingDate={
                      dateEdit?.kind === "quant" &&
                      dateEdit.krId === row.kr.id
                        ? dateEdit
                        : null
                    }
                    onDateChange={(value) =>
                      setDateEdit((cur) =>
                        cur?.kind === "quant" && cur.krId === row.kr.id
                          ? { ...cur, value }
                          : cur
                      )
                    }
                    onSaveDate={() => void saveDateEdit()}
                    onCancelDate={() => setDateEdit(null)}
                    onOpenMenu={(e) =>
                      setMenu(openTaskMenu(e, { kind: "quant", row }))
                    }
                    onRecord={(e) => {
                      e.stopPropagation();
                      if (
                        row.kr.recordMode === "count" ||
                        row.kr.recordMode === "consume"
                      ) {
                        void recordQuant(row.goalId, row.kr.id, 1);
                      } else {
                        setRecordingKrId(row.kr.id);
                      }
                    }}
                  />
                ))}

                {group.qual.map((row) => (
                  <OverdueQualRowItem
                    key={row.task.id}
                    row={row}
                    saving={savingId === row.task.id}
                    editingDate={
                      dateEdit?.kind === "qual" &&
                      dateEdit.taskId === row.task.id
                        ? dateEdit
                        : null
                    }
                    onToggle={() => void toggleTask(row)}
                    onDateChange={(value) =>
                      setDateEdit((cur) =>
                        cur?.kind === "qual" && cur.taskId === row.task.id
                          ? { ...cur, value }
                          : cur
                      )
                    }
                    onSaveDate={() => void saveDateEdit()}
                    onCancelDate={() => setDateEdit(null)}
                    onOpenMenu={(e) =>
                      setMenu(openTaskMenu(e, { kind: "qual", row }))
                    }
                  />
                ))}
              </Card>
            ))
          )}
          <p className="text-center text-[10px] text-slate-400">
            电脑右键 · 手机长按任务可快捷操作
          </p>
        </div>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu)}
          onClose={() => setMenu(null)}
        />
      )}

      {recordingKr && (
        <KrRecordDialog
          kr={recordingKr}
          open
          onClose={() => setRecordingKrId(null)}
          onSubmit={(v) => {
            const g = goals.find((goal) =>
              goal.execution.key_results.some((k) => k.id === recordingKr.id)
            );
            if (g) void recordQuant(g.id, recordingKr.id, v);
          }}
        />
      )}
    </div>
  );
}

function OverdueQualRowItem({
  row,
  saving,
  editingDate,
  onToggle,
  onDateChange,
  onSaveDate,
  onCancelDate,
  onOpenMenu,
}: {
  row: OverdueQualTaskRow;
  saving: boolean;
  editingDate: DateEditTarget | null;
  onToggle: () => void;
  onDateChange: (value: string) => void;
  onSaveDate: () => void;
  onCancelDate: () => void;
  onOpenMenu: (e: React.MouseEvent | React.TouchEvent) => void;
}) {
  const longPress = useLongPress({
    onLongPress: onOpenMenu,
    onContextMenu: (e) => onOpenMenu(e),
  });

  return (
    <div
      className={cn(
        "flex items-start gap-2 border-t border-amber-50 px-3 py-2",
        saving && "opacity-70"
      )}
      {...longPress.handlers}
    >
      <input
        type="checkbox"
        className="mt-0.5"
        checked={row.task.completed}
        disabled={saving}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-800">{row.task.title}</p>
        <p className="text-[10px] text-amber-700">
          应完成于 {formatOverdueLabel(row.overdueDate)}
          <span className="ml-1 text-violet-500">· 定性</span>
          <span className="text-slate-400"> · {row.krTitle}</span>
        </p>
        {editingDate && (
          <div
            className="mt-2 flex flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="date"
              value={editingDate.value}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded border border-[#E2E8F0] px-2 py-1 text-xs"
            />
            <button
              type="button"
              className="text-[10px] text-[#3B82F6] hover:underline"
              onClick={onSaveDate}
            >
              保存
            </button>
            <button
              type="button"
              className="text-[10px] text-slate-400 hover:underline"
              onClick={onCancelDate}
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OverdueQuantRowItem({
  row,
  saving,
  editingDate,
  onDateChange,
  onSaveDate,
  onCancelDate,
  onOpenMenu,
  onRecord,
}: {
  row: OverdueQuantRow;
  saving: boolean;
  editingDate: DateEditTarget | null;
  onDateChange: (value: string) => void;
  onSaveDate: () => void;
  onCancelDate: () => void;
  onOpenMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  onRecord: (e: React.MouseEvent) => void;
}) {
  const longPress = useLongPress({
    onLongPress: onOpenMenu,
    onContextMenu: (e) => onOpenMenu(e),
  });
  const caption = formatScheduleCaption(row.kr);

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-amber-50 px-3 py-2",
        saving && "opacity-70"
      )}
      {...longPress.handlers}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-800">
          {row.kr.title.trim() || row.label}
          <span className="ml-1 text-[10px] font-normal text-emerald-600">
            定量
          </span>
        </p>
        <p className="text-[10px] text-amber-700">
          应完成于 {formatOverdueLabel(row.overdueDate)}
        </p>
        {caption && (
          <p className="text-[10px] text-slate-400">{caption}</p>
        )}
        <KrProgressBar kr={row.kr} size="sm" className="mt-1 max-w-[12rem]" />
        {editingDate && (
          <div
            className="mt-2 flex flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="date"
              value={editingDate.value}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded border border-[#E2E8F0] px-2 py-1 text-xs"
            />
            <button
              type="button"
              className="text-[10px] text-[#3B82F6] hover:underline"
              onClick={onSaveDate}
            >
              保存
            </button>
            <button
              type="button"
              className="text-[10px] text-slate-400 hover:underline"
              onClick={onCancelDate}
            >
              取消
            </button>
          </div>
        )}
      </div>
      <KrQuickAddButton
        kr={row.kr}
        size="sm"
        disabled={saving}
        onClick={onRecord}
      />
    </div>
  );
}

export function GoalsTaskViews({ goals, onUpdated, onOpenGoal }: Props) {
  const todayGroups = collectTodayGoalGroups(goals);
  const overdueGroups = collectOverdueGoalGroups(goals);

  return (
    <div className="space-y-4">
      <TodaySection
        groups={todayGroups}
        goals={goals}
        onUpdated={onUpdated}
        onOpenGoal={onOpenGoal}
      />
      <OverdueSection
        groups={overdueGroups}
        goals={goals}
        onUpdated={onUpdated}
        onOpenGoal={onOpenGoal}
      />
    </div>
  );
}
