"use client";

import { useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import { Button } from "@/components/ui/button";
import {
  formatKrProgressLine,
  getKrProgressVisual,
  KR_PROGRESS_BAR,
  KR_RECORD_MODE_LABELS,
  redistributeKrWeights,
  unitLabel,
} from "@/lib/goals/kr-progress";
import { Input } from "@/components/ui/input";
import { KrRecordDialog } from "@/components/goals/KrRecordDialog";
import { patchKrRecordWithLog } from "@/lib/goals/record";
import type { GoalExecution, KeyResult, KrRecordMode } from "@/lib/goals/types";
import { KrProgressBar, KrProgressPercent } from "@/components/goals/KrProgressBar";
import {
  formatPeriodRange,
  computeTimeProgress,
} from "@/lib/goals/time-progress";
import { KrTaskList } from "@/components/goals/KrTaskList";
import { RecurrenceFields } from "@/components/goals/RecurrenceFields";
import { isQualitativeKr } from "@/lib/goals/kr-tasks";
import { cn } from "@/lib/utils";

type Props = {
  goalId: string;
  goalTitle: string;
  execution: GoalExecution;
  onChange: (next: GoalExecution) => void;
  onSave: (execution: GoalExecution) => void | Promise<void>;
  onSaveRecord?: (execution: GoalExecution) => void | Promise<void>;
  onOpenKr?: (krId: string) => void;
  onActivityLogged?: () => void;
  saving?: boolean;
  compact?: boolean;
};

function newKr(kind: "quantitative" | "qualitative" = "quantitative"): KeyResult {
  return {
    id: crypto.randomUUID(),
    title: "",
    krKind: kind,
    tasks: kind === "qualitative" ? [] : undefined,
    target: 1,
    current: 0,
    unit: kind === "qualitative" ? "项" : "次",
    weight: 0,
    recordMode: "count",
    start_date: null,
    due_date: null,
    baseline: null,
    valueDirection: "up",
  };
}

function QuantityRow({
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
  unitEditable,
}: {
  label: string;
  value: number;
  unit: string;
  onValueChange: (n: number) => void;
  onUnitChange?: (u: string) => void;
  unitEditable?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="w-[4.5rem] shrink-0 text-xs text-slate-500">{label}</span>
      <Input
        type="number"
        step="any"
        min={0}
        className="h-8 w-24"
        value={value}
        onChange={(e) =>
          onValueChange(Math.max(0, Number(e.target.value) || 0))
        }
      />
      {unitEditable ? (
        <Input
          className="h-8 w-16"
          placeholder="单位"
          value={unit}
          onChange={(e) => onUnitChange?.(e.target.value)}
        />
      ) : (
        <span className="text-xs text-slate-600">{unit || "—"}</span>
      )}
    </div>
  );
}

function KrPreviewCard({
  kr,
  index,
  onRecord,
  onEdit,
  onRemove,
  onOpenDetail,
  isLast,
}: {
  kr: KeyResult;
  index: number;
  onRecord: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onOpenDetail?: () => void;
  isLast?: boolean;
}) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const visual = getKrProgressVisual(kr);
  const progressLine = formatKrProgressLine(kr);
  const period = formatPeriodRange(kr.start_date, kr.due_date);
  const time = computeTimeProgress(kr.start_date, kr.due_date);
  const qualitative = isQualitativeKr(kr);
  const atTarget =
    !qualitative &&
    kr.target > 0 &&
    kr.current >= kr.target &&
    !kr.allowExceed;

  return (
    <li
      className={cn(
        "px-2 py-2 transition-colors hover:bg-[#FAFBFC]",
        !isLast && "border-b border-[#EEF1F5]",
        onOpenDetail && "cursor-pointer"
      )}
      onClick={onOpenDetail}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {kr.title.trim() || `KR ${index + 1}`}
            {qualitative && (
              <span className="ml-1 text-[10px] font-normal text-violet-600">
                定性
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {period && <span>{period} · </span>}
            {time.status === "not_started" ? "尚未开始" : progressLine}
          </p>
        </div>
        <KrProgressPercent kr={kr} className="text-lg" />
      </div>

      <div className="mt-1.5 flex w-full items-center gap-1.5">
        <KrProgressBar kr={kr} size="md" className="min-w-0 flex-1" />
        {!qualitative && (
          <button
            type="button"
            title="新增记录"
            disabled={
              atTarget &&
              (kr.recordMode === "count" || kr.recordMode === "consume")
            }
            onClick={(e) => {
              e.stopPropagation();
              onRecord();
            }}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm leading-none transition active:scale-95",
              atTarget &&
                (kr.recordMode === "count" || kr.recordMode === "consume")
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
      {qualitative && (kr.tasks ?? []).filter((t) => t.title.trim() && !t.completed).length > 0 && (
        <p className="mt-1 text-[10px] text-slate-400">
          {(kr.tasks ?? []).filter((t) => t.completed).length}/
          {(kr.tasks ?? []).filter((t) => t.title.trim()).length} 任务已完成
        </p>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { type: "action", label: "编辑", onClick: onEdit },
            { type: "separator" },
            {
              type: "action",
              label: "删除",
              danger: true,
              onClick: onRemove,
            },
          ]}
        />
      )}
    </li>
  );
}

function KrEditForm({
  kr,
  index,
  weightSum,
  onUpdate,
  onRemove,
  onDone,
}: {
  kr: KeyResult;
  index: number;
  weightSum: number;
  onUpdate: (patch: Partial<KeyResult>) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const modes: KrRecordMode[] = ["set", "accumulate", "count", "consume"];
  const qualitative = isQualitativeKr(kr);

  const syncQualitativeMetrics = (tasks: KeyResult["tasks"]) => {
    const active = (tasks ?? []).filter((t) => t.title.trim());
    const done = active.filter((t) => t.completed).length;
    onUpdate({
      tasks,
      current: done,
      target: Math.max(1, active.length || 1),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#3B82F6]">
          编辑 KR {index + 1}
        </span>
        <button
          type="button"
          className="text-[10px] text-red-500 hover:underline"
          onClick={onRemove}
        >
          删除
        </button>
      </div>

      <Input
        className="mt-2"
        placeholder="关键结果描述"
        value={kr.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
      />

      <div className="mt-2 flex rounded-lg border border-[#E2E8F0] p-0.5 text-[10px]">
        <button
          type="button"
          onClick={() =>
            onUpdate({
              krKind: "quantitative",
              tasks: undefined,
              unit: kr.unit === "项" ? "次" : kr.unit,
            })
          }
          className={cn(
            "flex-1 rounded-md py-1.5",
            !qualitative
              ? "bg-[#3B82F6] text-white"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          定量 KR
        </button>
        <button
          type="button"
          onClick={() =>
            onUpdate({
              krKind: "qualitative",
              tasks: kr.tasks ?? [],
              unit: "项",
              recordMode: "count",
            })
          }
          className={cn(
            "flex-1 rounded-md py-1.5",
            qualitative
              ? "bg-violet-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          定性 KR（任务清单）
        </button>
      </div>

      <label className="mt-2 block text-xs text-slate-500">
        日历展示关键词
        <Input
          className="mt-1"
          placeholder="如：上肢 → 日历显示「上肢 3次」"
          value={kr.calendarKeyword ?? ""}
          onChange={(e) =>
            onUpdate({ calendarKeyword: e.target.value.trim() || undefined })
          }
        />
        <span className="mt-0.5 block text-[10px] text-slate-400">
          打卡后在完成日历中的简短标识，留空则用 KR 名称
        </span>
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-500">
          权重 %
          <Input
            type="number"
            min={0}
            max={100}
            className="mt-1"
            value={kr.weight}
            onChange={(e) =>
              onUpdate({
                weight: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
              })
            }
          />
        </label>
      </div>

      <div className="mt-2">
        <p className="mb-1 text-xs text-slate-500">周期与重复</p>
        <RecurrenceFields
          startDate={kr.start_date ?? null}
          dueDate={kr.due_date ?? null}
          recurrence={kr.recurrence}
          onStartDate={(v) => onUpdate({ start_date: v })}
          onDueDate={(v) => onUpdate({ due_date: v })}
          onRecurrence={(v) => onUpdate({ recurrence: v })}
        />
      </div>

      {qualitative ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-slate-600">子任务分解</p>
          <KrTaskList
            tasks={kr.tasks ?? []}
            onChange={(tasks) => syncQualitativeMetrics(tasks)}
          />
        </div>
      ) : (
        <QuantityRow
          label="目标"
          value={kr.target}
          unit={kr.unit}
          unitEditable
          onValueChange={(n) => onUpdate({ target: Math.max(0.01, n) })}
          onUnitChange={(u) => onUpdate({ unit: u })}
        />
      )}

      {!qualitative && kr.recordMode === "set" && kr.valueDirection === "down" && (
        <div className="mt-2">
          <QuantityRow
            label="起始值"
            value={kr.baseline ?? kr.current}
            unit={unitLabel(kr)}
            onValueChange={(n) => onUpdate({ baseline: n })}
          />
        </div>
      )}

      {!qualitative && (
        <>
      <p className="mt-3 text-xs font-medium text-slate-600">记录方式</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              const patch: Partial<KeyResult> = { recordMode: mode };
              if (mode === "count" || mode === "consume") {
                patch.unit = kr.unit.trim() || "次";
              }
              if (mode === "set") {
                patch.valueDirection = kr.valueDirection ?? "up";
              }
              onUpdate(patch);
            }}
            className={cn(
              "rounded-lg border px-2 py-2 text-left text-[10px] transition",
              kr.recordMode === mode
                ? "border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]"
                : "border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <span className="font-medium">{KR_RECORD_MODE_LABELS[mode].label}</span>
            <span className="mt-0.5 block text-slate-400">
              {KR_RECORD_MODE_LABELS[mode].hint}
            </span>
          </button>
        ))}
      </div>

      {kr.recordMode === "set" && (
        <div className="mt-2 flex rounded-lg border border-[#E2E8F0] p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => onUpdate({ valueDirection: "up" })}
            className={cn(
              "flex-1 rounded-md py-1",
              kr.valueDirection === "up"
                ? "bg-[#3B82F6] text-white"
                : "text-slate-600"
            )}
          >
            数值越大越接近目标
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                valueDirection: "down",
                baseline: kr.baseline ?? kr.current,
              })
            }
            className={cn(
              "flex-1 rounded-md py-1",
              kr.valueDirection === "down"
                ? "bg-[#3B82F6] text-white"
                : "text-slate-600"
            )}
          >
            数值越小越接近目标
          </button>
        </div>
      )}

      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={kr.allowExceed ?? false}
          onChange={(e) => onUpdate({ allowExceed: e.target.checked })}
        />
        <span className="text-[11px] leading-snug text-slate-600">
          <span className="font-medium text-slate-700">允许超出目标</span>
          <span className="mt-0.5 block text-slate-400">
            开启后可继续累加；超出 100% 时进度条显示彩蛋色
          </span>
        </span>
      </label>
        </>
      )}

      {weightSum !== 100 && (
        <p className="mt-2 text-[10px] text-amber-600">
          全部 KR 权重建议合计 100%（当前 {weightSum}%）
        </p>
      )}

      <Button type="button" size="sm" variant="ghost" className="mt-1" onClick={onDone}>
        完成编辑
      </Button>
    </div>
  );
}

export function GoalExecutionPanel({
  goalId,
  goalTitle,
  execution,
  onChange,
  onSave,
  onSaveRecord,
  onOpenKr,
  onActivityLogged,
  saving,
  compact,
}: Props) {
  const [dirty, setDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const weightSum = execution.key_results.reduce(
    (acc, k) => acc + Math.max(0, k.weight),
    0
  );

  const recordingKr = execution.key_results.find((k) => k.id === recordingId);

  const patch = (next: GoalExecution) => {
    onChange(next);
    setDirty(true);
    setSaveError(null);
  };

  const updateKr = (id: string, patchKr: Partial<KeyResult>) => {
    patch({
      ...execution,
      key_results: execution.key_results.map((k) =>
        k.id === id ? { ...k, ...patchKr } : k
      ),
    });
  };

  const addKr = () => {
    const kr = newKr();
    const next = redistributeKrWeights([...execution.key_results, kr]);
    patch({ ...execution, key_results: next });
    setEditingId(kr.id);
  };

  const removeKr = (id: string) => {
    const remaining = execution.key_results.filter((k) => k.id !== id);
    patch({
      ...execution,
      key_results:
        remaining.length > 0 ? redistributeKrWeights(remaining) : remaining,
    });
    if (editingId === id) setEditingId(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await onSave(execution);
      setDirty(false);
      setEditingId(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存失败，请重试");
    }
  };

  const handleRecord = async (krId: string, value: number) => {
    const next = patchKrRecordWithLog(goalId, execution, krId, value);
    onChange(next);
    setSaveError(null);
    try {
      if (onSaveRecord) await onSaveRecord(next);
      else await onSave(next);
      onActivityLogged?.();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "记录保存失败");
    }
  };

  return (
    <div className={cn("w-full space-y-2", compact && "space-y-1.5")}>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div>
          <h3 className={cn("font-semibold text-slate-800", compact ? "text-xs" : "text-sm")}>
            关键结果
          </h3>
          {!compact && (
            <p className="text-[10px] text-slate-400">
              进度条 + 记录 · 右键编辑
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {execution.key_results.length > 1 && weightSum !== 100 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                patch({
                  ...execution,
                  key_results: redistributeKrWeights(execution.key_results),
                })
              }
            >
              平均分配权重
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => addKr()}
          >
            + 定量 KR
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-violet-700"
            onClick={() => {
              const kr = newKr("qualitative");
              const next = redistributeKrWeights([
                ...execution.key_results,
                kr,
              ]);
              patch({ ...execution, key_results: next });
              setEditingId(kr.id);
            }}
          >
            + 定性 KR
          </Button>
        </div>
      </div>

      {execution.key_results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E2E8F0] px-4 py-10 text-center text-sm text-slate-400">
          添加关键结果后，将在此直接看到每条 KR 的完成进度
        </p>
      ) : (
        <ul className="w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          {execution.key_results.map((kr, i) =>
            editingId === kr.id ? (
              <li
                key={kr.id}
                className={cn(
                  "border-b border-[#E2E8F0] bg-[#F8FAFC] last:border-b-0",
                  compact ? "p-2" : "p-3"
                )}
              >
                <KrEditForm
                  kr={kr}
                  index={i}
                  weightSum={weightSum}
                  onUpdate={(p) => updateKr(kr.id, p)}
                  onRemove={() => removeKr(kr.id)}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <KrPreviewCard
                key={kr.id}
                kr={kr}
                index={i}
                isLast={i === execution.key_results.length - 1}
                onOpenDetail={onOpenKr ? () => onOpenKr(kr.id) : undefined}
                onRecord={() => setRecordingId(kr.id)}
                onEdit={() => setEditingId(kr.id)}
                onRemove={() => removeKr(kr.id)}
              />
            )
          )}
        </ul>
      )}

      {saveError && <p className="text-xs text-red-600">{saveError}</p>}

      {(dirty || editingId) && (
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
        >
          {saving ? "保存中…" : "保存 KR 设置"}
        </Button>
      )}

      {recordingKr && (
        <KrRecordDialog
          kr={recordingKr}
          open
          onClose={() => setRecordingId(null)}
          onSubmit={(v) => void handleRecord(recordingKr.id, v)}
        />
      )}
    </div>
  );
}
