"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { DecisionTreeMap } from "./DecisionTreeMap";
import { DecisionWrapUp } from "./DecisionWrapUp";
import {
  buildPathSummary,
  getStep,
  getStepNotes,
  initialStepId,
  nextStepId,
  resolveFinalAction,
  stepAllowsNotes,
  withStepNote,
  type FlowAnswers,
} from "@/lib/decision-tree/flow";

type Props = {
  title: string;
  onComplete: (payload: {
    answers: FlowAnswers;
    pathSummary: string;
    finalAction: string;
    source: "active" | "passive";
    manual_conclusion: string;
    manual_goal: string;
  }) => void;
  onCancel: () => void;
};

export function DecisionFlow({ title, onComplete, onCancel }: Props) {
  const [history, setHistory] = useState<string[]>([initialStepId()]);
  const [answers, setAnswers] = useState<FlowAnswers>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingComplete, setPendingComplete] = useState<{
    answers: FlowAnswers;
    pathSummary: string;
    finalAction: string;
    source: "active" | "passive";
  } | null>(null);

  const stepId = history[history.length - 1];
  const step = getStep(stepId, answers);

  useEffect(() => {
    setNoteDraft(getStepNotes(answers)[stepId] ?? "");
  }, [stepId, answers]);

  const advance = (patch: FlowAnswers) => {
    const withNote = stepAllowsNotes(stepId)
      ? withStepNote({ ...answers, ...patch }, stepId, noteDraft)
      : { ...answers, ...patch };

    setAnswers(withNote);
    const next = nextStepId(stepId, withNote);

    if (next === "DONE") {
      const source = withNote.origin === "passive" ? "passive" : "active";
      setPendingComplete({
        answers: { ...withNote, flow_ok: true },
        pathSummary: buildPathSummary(withNote),
        finalAction: resolveFinalAction(withNote, stepId),
        source,
      });
      return;
    }

    setHistory((h) => [...h, next]);
  };

  const goBack = () => {
    if (history.length <= 1) return;
    const prevStep = history[history.length - 2];
    setHistory((h) => h.slice(0, -1));
    setNoteDraft(getStepNotes(answers)[prevStep] ?? "");
  };

  if (pendingComplete) {
    return (
      <DecisionWrapUp
        title={title}
        answers={pendingComplete.answers}
        suggestedConclusion={pendingComplete.finalAction}
        onSubmit={({ manual_conclusion, manual_goal }) =>
          onComplete({ ...pendingComplete, manual_conclusion, manual_goal })
        }
        onBack={() => setPendingComplete(null)}
      />
    );
  }

  if (!step) return null;

  const showNotes = stepAllowsNotes(step.id);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Card className="shrink-0 bg-white">
        <p className="text-xs text-slate-400">{title}</p>
        <h2 className="mt-2 text-lg font-medium leading-snug">{step.question}</h2>

        {showNotes && (
          <div className="mt-4">
            <label className="text-xs text-slate-500">本步备注（可选）</label>
            <Textarea
              className="mt-1 min-h-[72px] text-sm"
              placeholder="记录你的判断依据、顾虑或补充说明…"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className="mt-6 space-y-2">
          {step.type === "choice" &&
            step.options?.map((opt) => {
              const selected = answers[step.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => advance({ [step.id]: opt.value })}
                  className={`flex min-h-[44px] w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    selected
                      ? "border-[#3B82F6] bg-blue-50 text-blue-800"
                      : "border-[#E2E8F0] bg-white hover:border-[#3B82F6] hover:bg-blue-50/30"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

          {step.type === "multi" && (
            <>
              {step.options?.map((opt) => {
                const sel = (answers[step.id] as string[]) || [];
                const on = sel.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const next = on
                        ? sel.filter((v) => v !== opt.value)
                        : [...sel, opt.value];
                      setAnswers((a) => ({ ...a, [step.id]: next }));
                    }}
                    className={`flex min-h-[44px] w-full items-center rounded-xl border px-4 py-3 text-left text-sm ${
                      on
                        ? "border-[#3B82F6] bg-blue-50/60 text-blue-800"
                        : "border-[#E2E8F0] bg-white"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {opt.label}
                  </button>
                );
              })}
              <p className="text-xs text-slate-400">
                不勾选任何项并确认，视为放弃此事。
              </p>
              <Button
                variant="primary"
                className="mt-2 w-full"
                onClick={() =>
                  advance({
                    [step.id]: (answers[step.id] as string[]) || [],
                  })
                }
              >
                确认选择
              </Button>
            </>
          )}

          {step.type === "project_node" && (
            <>
              {step.projectNodes?.map((n) => {
                const selected = answers.project_node === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      const patch = { project_node: n.id };
                      if (n.id === "evaluate") {
                        advance(patch);
                      } else {
                        setAnswers((a) =>
                          withStepNote({ ...a, ...patch }, stepId, noteDraft)
                        );
                      }
                    }}
                    className={`flex min-h-[44px] w-full items-center rounded-xl border px-4 py-3 text-left text-sm ${
                      selected
                        ? "border-[#3B82F6] bg-blue-50"
                        : "border-[#E2E8F0] bg-white hover:border-[#3B82F6]"
                    }`}
                  >
                    {n.label}
                  </button>
                );
              })}
              {answers.project_node &&
                answers.project_node !== "evaluate" && (
                  <p className="text-xs text-slate-400">
                    已记录「
                    {
                      step.projectNodes?.find(
                        (n) => n.id === answers.project_node
                      )?.label
                    }
                    」，可继续选其他节点；选「效果评估」进入下一步。
                  </p>
                )}
            </>
          )}

          {step.type === "terminal" && (
            <div
              className={`rounded-xl border p-4 ${
                step.abandon
                  ? "border-slate-200 bg-slate-50"
                  : "border-[#E2E8F0] bg-[#F8FAFC]"
              }`}
            >
              <p
                className={`text-sm ${
                  step.abandon
                    ? "text-slate-500 line-through decoration-slate-400"
                    : "text-slate-700"
                }`}
              >
                {step.question}
              </p>
              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => advance({})}
              >
                下一步 · 确认感受
              </Button>
            </div>
          )}

          {step.type === "confirm_flow" && (
            <div className="rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] p-4">
              <p className="text-sm text-slate-600">
                请凭直觉确认：这个方向让你充满能量，还是感到沉重？（放弃类决策也建议做一次内心确认）
              </p>
              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => advance({ flow_ok: true })}
              >
                我确认 OK
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-t border-[#E2E8F0] pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={history.length <= 1}
          >
            上一步
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel} className="ml-auto">
            取消
          </Button>
        </div>
      </Card>

      <DecisionTreeMap
        answers={answers}
        history={history}
        currentStepId={stepId}
      />
    </div>
  );
}
