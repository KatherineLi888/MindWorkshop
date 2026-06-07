"use client";

import { buildDecisionChoiceRecords } from "@/lib/decision-tree/path-display";
import type { FlowAnswers } from "@/lib/decision-tree/flow";
import { DecisionChoiceLog } from "@/components/decision/DecisionChoiceLog";

type Props = {
  answers: FlowAnswers;
  /** 列表卡片用紧凑样式 */
  compact?: boolean;
};

export function DecisionPathTrail({ answers, compact }: Props) {
  const records = buildDecisionChoiceRecords(answers);
  if (records.length === 0) return null;

  if (!compact) {
    return <DecisionChoiceLog answers={answers} title="决策记录" />;
  }

  return (
    <div className="mt-3 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {records.map((r, i) => (
          <span key={r.stepId} className="inline-flex items-center text-[11px]">
            <span className="font-medium text-slate-700">{r.choice}</span>
            {i < records.length - 1 && (
              <span className="mx-1 text-slate-300">→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
