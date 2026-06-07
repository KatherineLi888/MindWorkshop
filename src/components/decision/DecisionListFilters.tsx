"use client";

import {
  EXECUTOR_LABELS,
  HORIZON_LABELS,
  OUTCOME_LABELS,
  type DecisionExecutorTag,
  type DecisionHorizonTag,
  type DecisionOutcomeTag,
} from "@/lib/decision-tree/tags";
import { cn } from "@/lib/utils";

export type DecisionFilterState = {
  executor: "all" | DecisionExecutorTag | "none";
  horizon: "all" | DecisionHorizonTag | "none";
  outcome: "all" | DecisionOutcomeTag;
};

export const DEFAULT_DECISION_FILTERS: DecisionFilterState = {
  executor: "all",
  horizon: "all",
  outcome: "all",
};

type Props = {
  value: DecisionFilterState;
  onChange: (next: DecisionFilterState) => void;
  /** 与工具栏同一行 */
  inline?: boolean;
};

function InlineSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-xs text-slate-700 shadow-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DecisionListFilters({ value, onChange, inline }: Props) {
  const hasFilter =
    value.executor !== "all" ||
    value.horizon !== "all" ||
    value.outcome !== "all";

  const content = (
    <>
      <InlineSelect
        label="执行"
        value={value.executor}
        onChange={(executor) =>
          onChange({
            ...value,
            executor: executor as DecisionFilterState["executor"],
          })
        }
        options={[
          { value: "all", label: "全部" },
          { value: "self", label: EXECUTOR_LABELS.self },
          { value: "delegate", label: EXECUTOR_LABELS.delegate },
          { value: "none", label: "未涉及" },
        ]}
      />
      <InlineSelect
        label="周期"
        value={value.horizon}
        onChange={(horizon) =>
          onChange({
            ...value,
            horizon: horizon as DecisionFilterState["horizon"],
          })
        }
        options={[
          { value: "all", label: "全部" },
          { value: "short", label: HORIZON_LABELS.short },
          { value: "long", label: HORIZON_LABELS.long },
          { value: "none", label: "未涉及" },
        ]}
      />
      <InlineSelect
        label="结果"
        value={value.outcome}
        onChange={(outcome) =>
          onChange({
            ...value,
            outcome: outcome as DecisionFilterState["outcome"],
          })
        }
        options={[
          { value: "all", label: "全部" },
          { value: "proceed", label: OUTCOME_LABELS.proceed },
          { value: "abandon", label: OUTCOME_LABELS.abandon },
        ]}
      />
      {hasFilter && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_DECISION_FILTERS)}
          className="text-xs text-[#3B82F6] hover:underline"
        >
          清除
        </button>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-2">{content}</div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
      )}
    >
      {content}
    </div>
  );
}

export function matchesDecisionFilters(
  row: {
    tag_executor: string | null;
    tag_horizon: string | null;
    tag_outcome: string;
  },
  filters: DecisionFilterState
): boolean {
  if (filters.executor !== "all") {
    if (filters.executor === "none") {
      if (row.tag_executor != null) return false;
    } else if (row.tag_executor !== filters.executor) return false;
  }
  if (filters.horizon !== "all") {
    if (filters.horizon === "none") {
      if (row.tag_horizon != null) return false;
    } else if (row.tag_horizon !== filters.horizon) return false;
  }
  if (filters.outcome !== "all" && row.tag_outcome !== filters.outcome) {
    return false;
  }
  return true;
}
