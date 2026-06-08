"use client";

import { GoalSeedBadge } from "@/components/goals/GoalSeedBadge";
import { KrProgressPercent } from "@/components/goals/KrProgressBar";
import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import { isQualitativeKr } from "@/lib/goals/kr-tasks";
import type { GoalWithMeta } from "@/lib/goals/storage";
import type { KeyResult } from "@/lib/goals/types";
import { goalUnitContext } from "@/lib/goals/time-gap-units";
import { cn } from "@/lib/utils";

type Props = {
  goal: GoalWithMeta;
  selectedKrId: string | null;
  onSelectKr: (krId: string | null) => void;
};

function KrDirectoryRow({
  kr,
  index,
  selected,
  onSelect,
}: {
  kr: KeyResult;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const qualitative = isQualitativeKr(kr);
  const tasks = (kr.tasks ?? []).filter((t) => t.title.trim());
  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-2 py-1.5 text-left transition",
        selected
          ? "border-[#3B82F6] bg-[#EFF6FF]"
          : "border-transparent bg-white hover:border-[#E2E8F0] hover:bg-[#FAFBFC]"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-800">
          {kr.title.trim() || `KR ${index + 1}`}
        </p>
        <KrProgressPercent kr={kr} className="text-[10px]" />
      </div>
      {qualitative && tasks.length > 0 && (
        <p className="mt-0.5 text-[9px] text-slate-400">
          {pending.length > 0
            ? `${pending.length} 项待完成`
            : `${done.length} 项已完成`}
        </p>
      )}
    </button>
  );
}

/** 电脑端左侧：主 OKR + 级联 KR 目录 */
export function GoalDirectorySidebar({
  goal,
  selectedKrId,
  onSelectKr,
}: Props) {
  const krs = goal.execution.key_results;

  return (
    <aside className="flex w-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      <div className="shrink-0 border-b border-[#F1F5F9] px-3 pt-2 pb-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <p className="line-clamp-2 text-sm font-semibold text-slate-900">
            {goal.title}
          </p>
          <GoalSeedBadge entityId={goal.id} title={goal.title} />
        </div>
        <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
          总进度 {goal.progress}%
        </p>
      </div>

      <div className="shrink-0 border-b border-[#F1F5F9] px-0 pb-2 pt-1">
        <TimeProgressBar
          completionPercent={goal.progress}
          startDate={goal.execution.start_date}
          endDate={goal.execution.due_date}
          size="md"
          unitContext={goalUnitContext(goal.execution)}
          fullWidth
          className="w-full px-0"
        />
      </div>

      <div className="min-h-0 max-h-[min(12rem,36vh)] overflow-y-auto px-1.5 py-1">
        {krs.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-slate-400">
            暂无 KR
          </p>
        ) : (
          <ul className="space-y-1">
            {krs.map((kr, i) => (
              <li key={kr.id}>
                <KrDirectoryRow
                  kr={kr}
                  index={i}
                  selected={selectedKrId === kr.id}
                  onSelect={() =>
                    onSelectKr(selectedKrId === kr.id ? null : kr.id)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
