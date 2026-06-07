"use client";

import { useState } from "react";
import { buildDecisionChoiceRecords } from "@/lib/decision-tree/path-display";
import type { FlowAnswers } from "@/lib/decision-tree/flow";
import { cn } from "@/lib/utils";

type Props = {
  answers: FlowAnswers;
  title?: string;
  /** 详情页：默认折叠、双列网格 */
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function DecisionChoiceLog({
  answers,
  title = "决策记录",
  collapsible = false,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen || !collapsible);
  const records = buildDecisionChoiceRecords(answers);
  if (records.length === 0) return null;

  const grid = (
    <ul
      className={cn(
        "gap-2",
        collapsible
          ? "grid sm:grid-cols-2"
          : "mt-2 space-y-2.5"
      )}
    >
      {records.map((r) => (
        <li
          key={r.stepId}
          className="flex gap-2 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] px-2.5 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400">{r.context}</p>
            <p className="mt-0.5 text-sm font-medium leading-snug text-slate-800">
              {r.choice}
            </p>
            {r.flowNote && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                <span className="text-slate-400">旁注：</span>
                {r.flowNote}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  if (!collapsible) {
    return (
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        {grid}
      </div>
    );
  }

  return (
    <div className="border-t border-[#EEF1F5] pt-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-xs font-medium text-slate-600">{title}</span>
        <span className="text-[10px] text-slate-400">
          {records.length} 步 · {open ? "收起" : "展开"}
        </span>
      </button>
      {open && <div className="mt-2">{grid}</div>}
    </div>
  );
}
