"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  TrackSourcePicker,
  type TrackSourceValue,
} from "@/components/track/TrackSourcePicker";
import { jumpFromTrack } from "@/lib/flow/jump-actions";
import { FLOW_STAGE_LABELS } from "@/lib/flow/types";
import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { saveTrackProblem } from "@/lib/track/save-problem";
import type { TrackHandleMode } from "@/lib/track/problem-status";
import type { GraphNodeRow, TrackLoopbackTarget } from "@/types/database";
import { cn } from "@/lib/utils";

export type TrackWizardPreset = {
  anchorType?: "goal" | "decision" | "goal_kr";
  anchorId?: string;
};

const FLOW_OPTIONS: { value: TrackLoopbackTarget; label: string }[] = [
  { value: "home", label: "首页" },
  { value: "thinking", label: FLOW_STAGE_LABELS.thinking },
  { value: "decisions", label: FLOW_STAGE_LABELS.decisions },
  { value: "goals", label: FLOW_STAGE_LABELS.goals },
];

const TOTAL_STEPS = 6;

type Props = {
  open: boolean;
  preset?: TrackWizardPreset;
  onClose: () => void;
  onSaved?: (row: GraphNodeRow) => void;
};

export function TrackProblemWizardDialog({
  open,
  preset,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<TrackSourceValue | null>(null);
  const [problemFocus, setProblemFocus] = useState("");
  const [solutionApproach, setSolutionApproach] = useState("");
  const [resolutionPlan, setResolutionPlan] = useState("");
  const [flowMode, setFlowMode] = useState<"local" | "flow">("local");
  const [flowTarget, setFlowTarget] = useState<TrackLoopbackTarget>("thinking");
  const [resolved, setResolved] = useState(false);
  const [trackHandle, setTrackHandle] = useState<TrackHandleMode>("immediate");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSource(null);
    setProblemFocus("");
    setSolutionApproach("");
    setResolutionPlan("");
    setFlowMode("local");
    setFlowTarget("thinking");
    setResolved(false);
    setTrackHandle("immediate");

    if (!preset?.anchorType || !preset.anchorId) return;
    void (async () => {
      if (preset.anchorType === "decision") {
        const decisions = await loadAllDecisions();
        const d = decisions.find((x) => x.id === preset.anchorId);
        if (d) {
          setSource({
            anchorType: "decision",
            anchorId: d.id,
            label: d.title,
          });
        }
        return;
      }
      const goals = await loadAllGoals();
      if (preset.anchorType === "goal") {
        const g = goals.find((x) => x.id === preset.anchorId);
        if (g) {
          setSource({
            anchorType: "goal",
            anchorId: g.id,
            label: g.title,
          });
        }
        return;
      }
      if (preset.anchorType === "goal_kr") {
        for (const g of goals) {
          const kr = g.execution.key_results.find(
            (k) => k.id === preset.anchorId
          );
          if (kr) {
            setSource({
              anchorType: "goal_kr",
              anchorId: kr.id,
              label: `${g.title} · ${kr.title.trim() || "KR"}`,
            });
            break;
          }
        }
      }
    })();
  }, [open, preset?.anchorType, preset?.anchorId]);

  if (!open) return null;

  const canStep1 = !!source;
  const canStep2 =
    problemFocus.trim().length > 0 &&
    solutionApproach.trim().length > 0 &&
    resolutionPlan.trim().length > 0;
  const canStep3 = flowMode === "local" || !!flowTarget;
  const canStep4 = true;
  const canStep5 = resolved || !!trackHandle;

  const goNext = () => {
    if (step === 4 && resolved) {
      setStep(6);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    if (step === 6 && resolved) {
      setStep(4);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    if (!source || !canStep2) return;
    setSaving(true);
    try {
      const row = await saveTrackProblem({
        problemFocus: problemFocus.trim(),
        solutionApproach: solutionApproach.trim(),
        resolutionPlan: resolutionPlan.trim(),
        anchorType: source.anchorType,
        anchorId: source.anchorId,
        loopbackTarget: flowMode === "flow" ? flowTarget : null,
        resolved,
        trackHandle: resolved ? null : trackHandle,
      });
      onSaved?.(row);
      onClose();

      if (!resolved && flowMode === "flow" && flowTarget) {
        if (flowTarget === "home") {
          router.push("/home");
        } else {
          const { href } = await jumpFromTrack({
            nodeId: row.id,
            title: row.problem_focus || row.title,
            toStage: flowTarget,
          });
          router.push(href);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const stepLabel =
    step === 1
      ? "选择来源"
      : step === 2
        ? "内容填写"
        : step === 3
          ? "流转方式"
          : step === 4
            ? "办结状态"
            : step === 5
              ? "归类选择"
              : "确认提交";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-10 sm:pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">新增问题追踪</h3>
            <p className="text-[10px] text-slate-400">
              步骤 {step} / {TOTAL_STEPS} · {stepLabel}
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          {step === 1 && (
            <TrackSourcePicker
              value={source}
              onChange={setSource}
              preset={preset}
            />
          )}

          {step === 2 && (
            <>
              <label className="block text-[10px] text-slate-500">
                问题概括
                <Textarea
                  className="mt-0.5 text-xs"
                  rows={2}
                  placeholder="一句话描述当前遇到的问题"
                  value={problemFocus}
                  onChange={(e) => setProblemFocus(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="block text-[10px] text-slate-500">
                个人想法/方案
                <Textarea
                  className="mt-0.5 text-xs"
                  rows={2}
                  placeholder="针对问题的思路、初步做法"
                  value={solutionApproach}
                  onChange={(e) => setSolutionApproach(e.target.value)}
                />
              </label>
              <label className="block text-[10px] text-slate-500">
                后续解决规划
                <Textarea
                  className="mt-0.5 text-xs"
                  rows={2}
                  placeholder="整体解决思路与执行计划"
                  value={resolutionPlan}
                  onChange={(e) => setResolutionPlan(e.target.value)}
                />
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setFlowMode("local")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                    flowMode === "local"
                      ? "border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]"
                      : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                  )}
                >
                  仅做记录
                  <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                    只在问题追踪列表归档，不发起跳转
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlowMode("flow")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                    flowMode === "flow"
                      ? "border-amber-400 bg-amber-50 text-amber-900"
                      : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                  )}
                >
                  发起新一轮流程流转
                  <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                    保存后跳转至选定模块继续推进
                  </span>
                </button>
              </div>
              {flowMode === "flow" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {FLOW_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFlowTarget(opt.value)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] transition",
                        flowTarget === opt.value
                          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500">
                无论是否流转，均需选择办结状态
              </p>
              <button
                type="button"
                onClick={() => setResolved(false)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                  !resolved
                    ? "border-amber-400 bg-amber-50 text-amber-900"
                    : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                )}
              >
                待跟进
                <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                  问题未解决，需持续追踪
                </span>
              </button>
              <button
                type="button"
                onClick={() => setResolved(true)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                  resolved
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                    : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                )}
              >
                已解决
                <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                  问题处理完毕，归档结束追踪
                </span>
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500">待跟进问题的处理方式</p>
              <button
                type="button"
                onClick={() => setTrackHandle("inbox")}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                  trackHandle === "inbox"
                    ? "border-slate-400 bg-slate-50 text-slate-800"
                    : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                )}
              >
                放入收集箱
                <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                  暂存，暂不主动处理
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTrackHandle("immediate")}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                  trackHandle === "immediate"
                    ? "border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]"
                    : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                )}
              >
                立即处理
                <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                  纳入当前待办，优先跟进
                </span>
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-2 text-xs text-slate-700">
              <p>
                <span className="text-slate-400">来源 · </span>
                {source?.label}
              </p>
              <p>
                <span className="text-slate-400">问题 · </span>
                {problemFocus}
              </p>
              <p>
                <span className="text-slate-400">流转 · </span>
                {flowMode === "local"
                  ? "仅做记录"
                  : `跳转至${FLOW_OPTIONS.find((o) => o.value === flowTarget)?.label}`}
              </p>
              <p>
                <span className="text-slate-400">状态 · </span>
                {resolved ? "已解决" : "待跟进"}
              </p>
              {!resolved && (
                <p>
                  <span className="text-slate-400">归类 · </span>
                  {trackHandle === "inbox" ? "收集箱" : "立即处理"}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 border-t border-[#EEF1F5] px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={step === 1 || saving}
            onClick={goBack}
          >
            上一步
          </Button>
          {step < TOTAL_STEPS ? (
            <Button
              size="sm"
              variant="primary"
              disabled={
                (step === 1 && !canStep1) ||
                (step === 2 && !canStep2) ||
                (step === 3 && !canStep3) ||
                (step === 4 && !canStep4) ||
                (step === 5 && !canStep5)
              }
              onClick={goNext}
            >
              下一步
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              disabled={saving || !canStep2}
              onClick={() => void submit()}
            >
              {saving ? "保存中…" : "提交保存"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
