"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { DecisionChoiceLog } from "@/components/decision/DecisionChoiceLog";
import { DecisionTreeMap } from "@/components/decision/DecisionTreeMap";
import { rebuildHistoryFromAnswers, type FlowAnswers } from "@/lib/decision-tree/flow";

type Props = {
  title: string;
  answers: FlowAnswers;
  suggestedConclusion: string;
  onSubmit: (payload: { manual_conclusion: string; manual_goal: string }) => void;
  onBack: () => void;
};

export function DecisionWrapUp({
  title,
  answers,
  suggestedConclusion,
  onSubmit,
  onBack,
}: Props) {
  const [conclusion, setConclusion] = useState(suggestedConclusion);
  const [goal, setGoal] = useState("");
  const history = rebuildHistoryFromAnswers(answers);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Card className="bg-white">
        <p className="text-xs text-slate-400">收尾 · {title}</p>
        <h2 className="mt-2 text-lg font-medium">写下你的结论与目标</h2>
        <p className="mt-1 text-xs text-slate-500">
          列表中将显示你手写的结论与目标；下方为本次完整决策过程供核对。
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-slate-600">
            结论 *
            <Textarea
              className="mt-1"
              rows={3}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="这件事最终怎么定？例如：放弃 / 本周自己完成初稿…"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            目标
            <Textarea
              className="mt-1"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="希望达成的具体目标（可选）"
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            disabled={!conclusion.trim()}
            onClick={() =>
              onSubmit({
                manual_conclusion: conclusion.trim(),
                manual_goal: goal.trim(),
              })
            }
          >
            保存并完成
          </Button>
          <Button variant="ghost" onClick={onBack}>
            返回修改
          </Button>
        </div>
      </Card>

      <Card className="bg-white">
        <DecisionChoiceLog answers={answers} />
      </Card>

      <DecisionTreeMap
        answers={answers}
        history={history}
        currentStepId=""
      />
    </div>
  );
}
