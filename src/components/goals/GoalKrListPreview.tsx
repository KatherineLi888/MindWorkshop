"use client";

import {
  KrProgressBar,
  KrProgressPercent,
} from "@/components/goals/KrProgressBar";
import { KrQuickAddButton } from "@/components/goals/KrQuickAddButton";
import { isQualitativeKr } from "@/lib/goals/kr-tasks";
import type { KeyResult } from "@/lib/goals/types";
import { formatKrProgressLine } from "@/lib/goals/kr-progress";
import { formatScheduleCaption } from "@/lib/goals/recurrence";
import {
  computeTimeProgress,
  formatPeriodRange,
} from "@/lib/goals/time-progress";
import { cn } from "@/lib/utils";

type Props = {
  keyResults: KeyResult[];
  expanded: boolean;
  expandedQualKrId: string | null;
  onToggle: (e: React.MouseEvent) => void;
  onToggleQualKr: (krId: string, e: React.MouseEvent) => void;
  onRecordKr: (krId: string, e: React.MouseEvent) => void;
  onOpenKr?: (krId: string, e: React.MouseEvent) => void;
  onToggleTask?: (
    krId: string,
    taskId: string,
    completed: boolean
  ) => void;
  savingTaskId?: string | null;
};

function KrCompactRow({
  kr,
  index,
  qualExpanded,
  onRecord,
  onOpen,
  onToggleQual,
  onToggleTask,
  savingTaskId,
}: {
  kr: KeyResult;
  index: number;
  qualExpanded: boolean;
  onRecord: (e: React.MouseEvent) => void;
  onOpen?: (e: React.MouseEvent) => void;
  onToggleQual: (e: React.MouseEvent) => void;
  onToggleTask?: (
    krId: string,
    taskId: string,
    completed: boolean
  ) => void;
  savingTaskId?: string | null;
}) {
  const progressLine = formatKrProgressLine(kr);
  const period = formatPeriodRange(kr.start_date, kr.due_date);
  const schedule = formatScheduleCaption(kr);
  const time = computeTimeProgress(kr.start_date, kr.due_date);
  const qualitative = isQualitativeKr(kr);
  const tasks = (kr.tasks ?? []).filter((t) => t.title.trim());
  const pending = tasks.filter((t) => !t.completed);

  const handleClick = (e: React.MouseEvent) => {
    if (qualitative) {
      onToggleQual(e);
      return;
    }
    onOpen?.(e);
  };

  return (
    <li
      className={cn(
        "rounded-md bg-[#FAFBFC] px-2 py-1.5",
        (onOpen || qualitative) && "cursor-pointer hover:bg-[#F1F5F9]"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-slate-700">
            {kr.title.trim() || `KR ${index + 1}`}
            {qualitative && (
              <span className="ml-1 text-[9px] font-normal text-violet-500">
                定性
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {schedule || period ? (
              <span>{schedule || period} · </span>
            ) : null}
            {time.status === "not_started" ? "尚未开始" : progressLine}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <KrProgressPercent kr={kr} className="text-[11px]" />
          {!qualitative && (
            <KrQuickAddButton kr={kr} size="sm" onClick={onRecord} />
          )}
        </div>
      </div>
      <div className="mt-1">
        <KrProgressBar kr={kr} size="sm" />
      </div>

      {qualitative && qualExpanded && pending.length > 0 && (
        <ul
          className="mt-1.5 space-y-1 border-t border-[#F1F5F9] pt-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {pending.map((t) => (
            <li key={t.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={false}
                disabled={savingTaskId === t.id}
                onChange={() => onToggleTask?.(kr.id, t.id, true)}
              />
              <span className="text-[10px] text-slate-700">{t.title}</span>
            </li>
          ))}
        </ul>
      )}

      {qualitative && qualExpanded && pending.length === 0 && tasks.length > 0 && (
        <p className="mt-1 border-t border-[#F1F5F9] pt-1 text-[9px] text-slate-400">
          子任务已全部完成
        </p>
      )}

      {qualitative && !qualExpanded && pending.length > 0 && (
        <p className="mt-1 text-[9px] text-slate-400">
          {pending.length} 项待完成 · 点击展开
        </p>
      )}
    </li>
  );
}

export function GoalKrListPreview({
  keyResults,
  expanded,
  expandedQualKrId,
  onToggle,
  onToggleQualKr,
  onRecordKr,
  onOpenKr,
  onToggleTask,
  savingTaskId,
}: Props) {
  if (keyResults.length === 0) return null;

  return (
    <div className="border-t border-[#EEF1F5] bg-white/70">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[10px] text-slate-500 transition hover:bg-slate-50"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block text-[8px] text-slate-400 transition-transform",
              expanded && "rotate-90"
            )}
          >
            ▶
          </span>
          {expanded
            ? "收起 KR"
            : `${keyResults.length} 条 KR · 点击展开`}
        </span>
        {!expanded && keyResults.length > 1 && (
          <span className="text-[9px] text-slate-400">展开可快捷打卡</span>
        )}
      </button>
      {expanded && (
        <ul className="space-y-1 px-2 pb-2">
          {keyResults.map((kr, i) => (
            <KrCompactRow
              key={kr.id}
              kr={kr}
              index={i}
              qualExpanded={expandedQualKrId === kr.id}
              onRecord={(e) => onRecordKr(kr.id, e)}
              onToggleQual={(e) => onToggleQualKr(kr.id, e)}
              onToggleTask={onToggleTask}
              savingTaskId={savingTaskId}
              onOpen={
                onOpenKr && !isQualitativeKr(kr)
                  ? (e) => {
                      e.stopPropagation();
                      onOpenKr(kr.id, e);
                    }
                  : undefined
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
