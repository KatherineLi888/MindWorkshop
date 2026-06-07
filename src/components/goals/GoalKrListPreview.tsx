"use client";

import {
  KrProgressBar,
  KrProgressPercent,
} from "@/components/goals/KrProgressBar";
import { KrQuickAddButton } from "@/components/goals/KrQuickAddButton";
import type { KeyResult } from "@/lib/goals/types";
import { formatKrProgressLine } from "@/lib/goals/kr-progress";
import {
  computeTimeProgress,
  formatPeriodRange,
} from "@/lib/goals/time-progress";
import { cn } from "@/lib/utils";

type Props = {
  keyResults: KeyResult[];
  expanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onRecordKr: (krId: string, e: React.MouseEvent) => void;
  onOpenKr?: (krId: string, e: React.MouseEvent) => void;
};

function KrCompactRow({
  kr,
  index,
  onRecord,
  onOpen,
}: {
  kr: KeyResult;
  index: number;
  onRecord: (e: React.MouseEvent) => void;
  onOpen?: (e: React.MouseEvent) => void;
}) {
  const progressLine = formatKrProgressLine(kr);
  const period = formatPeriodRange(kr.start_date, kr.due_date);
  const time = computeTimeProgress(kr.start_date, kr.due_date);

  return (
    <li
      className={cn(
        "rounded-md bg-[#FAFBFC] px-2 py-1.5",
        onOpen && "cursor-pointer hover:bg-[#F1F5F9]"
      )}
      onClick={onOpen}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-slate-700">
            {kr.title.trim() || `KR ${index + 1}`}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {period && <span>{period} · </span>}
            {time.status === "not_started" ? "尚未开始" : progressLine}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <KrProgressPercent kr={kr} className="text-[11px]" />
          <KrQuickAddButton kr={kr} size="sm" onClick={onRecord} />
        </div>
      </div>
      <div className="mt-1">
        <KrProgressBar kr={kr} size="sm" />
      </div>
    </li>
  );
}

export function GoalKrListPreview({
  keyResults,
  expanded,
  onToggle,
  onRecordKr,
  onOpenKr,
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
              onRecord={(e) => onRecordKr(kr.id, e)}
              onOpen={
                onOpenKr
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
