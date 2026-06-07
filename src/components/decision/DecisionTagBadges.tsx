import {
  EXECUTOR_LABELS,
  HORIZON_LABELS,
  OUTCOME_LABELS,
  SOURCE_LABELS,
} from "@/lib/decision-tree/tags";
import type { DecisionRow } from "@/types/database";
import { cn } from "@/lib/utils";

const chip =
  "inline-flex h-5 min-w-[2.75rem] items-center justify-center whitespace-nowrap rounded-full px-1.5 text-[10px] font-medium leading-none ring-1 ring-inset";

function TagSlot({
  label,
  className,
  ghost,
}: {
  label: string | null;
  className?: string;
  ghost?: boolean;
}) {
  if (!label) {
    return (
      <span
        className="inline-flex h-5 min-w-[2.75rem] items-center justify-center text-[10px] text-transparent select-none"
        aria-hidden
      >
        —
      </span>
    );
  }
  return (
    <span className={cn(chip, ghost && "opacity-70", className)}>{label}</span>
  );
}

type Props = {
  row: DecisionRow;
  className?: string;
};

/**
 * 固定四列（右对齐）：周期 | 来源 | 执行 | 状态
 * 短期仅在真实选择短期时出现，且排在最左列
 */
export function DecisionTagBadges({ row, className }: Props) {
  const isAbandon = row.tag_outcome === "abandon";
  const sourceLabel = SOURCE_LABELS[row.source];
  const executorLabel = row.tag_executor
    ? EXECUTOR_LABELS[row.tag_executor]
    : null;
  const horizonLabel = row.tag_horizon
    ? HORIZON_LABELS[row.tag_horizon]
    : null;

  return (
    <div
      className={cn(
        "inline-grid grid-cols-[2.75rem_2.75rem_2.75rem_3.25rem] gap-x-1 justify-items-end",
        className
      )}
      title="周期 · 来源 · 执行 · 状态"
    >
      <TagSlot
        label={horizonLabel}
        className={
          row.tag_horizon === "short"
            ? "bg-violet-100/90 text-violet-800 ring-violet-300/80"
            : row.tag_horizon === "long"
              ? "bg-violet-50/80 text-violet-700 ring-violet-200/60"
              : undefined
        }
      />
      <TagSlot
        label={sourceLabel}
        className={
          row.source === "active"
            ? "bg-indigo-50/90 text-indigo-700 ring-indigo-200/70"
            : "bg-amber-50/90 text-amber-800 ring-amber-200/70"
        }
      />
      <TagSlot
        label={executorLabel}
        className="bg-blue-50/80 text-blue-700 ring-blue-200/60"
      />
      <TagSlot
        label={OUTCOME_LABELS[row.tag_outcome]}
        className={
          isAbandon
            ? "bg-slate-100 text-slate-500 ring-slate-300 line-through decoration-slate-500"
            : "bg-emerald-50/80 text-emerald-700 ring-emerald-200/60"
        }
      />
    </div>
  );
}
