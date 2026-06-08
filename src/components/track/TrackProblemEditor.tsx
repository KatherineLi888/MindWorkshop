"use client";

import Link from "next/link";
import { FlowAdvanceButton } from "@/components/flow/FlowAdvanceButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { FLOW_STAGE_LABELS } from "@/lib/flow/types";
import type { TrackHandleMode } from "@/lib/track/problem-status";
import type { GraphNodeRow, TrackLoopbackTarget } from "@/types/database";
import { cn } from "@/lib/utils";

const LOOPBACK_OPTIONS: { value: TrackLoopbackTarget; label: string }[] = [
  { value: "thinking", label: FLOW_STAGE_LABELS.thinking },
  { value: "decisions", label: FLOW_STAGE_LABELS.decisions },
  { value: "goals", label: FLOW_STAGE_LABELS.goals },
  { value: "home", label: "首页" },
];

type Props = {
  node: GraphNodeRow;
  anchorTitle?: string;
  draftFocus: string;
  draftSolution: string;
  draftPlan: string;
  onDraftFocus: (v: string) => void;
  onDraftSolution: (v: string) => void;
  onDraftPlan: (v: string) => void;
  onSave: (patch: Partial<GraphNodeRow>) => void;
  onClose: () => void;
};

export function TrackProblemEditor({
  node,
  anchorTitle,
  draftFocus,
  draftSolution,
  draftPlan,
  onDraftFocus,
  onDraftSolution,
  onDraftPlan,
  onSave,
  onClose,
}: Props) {
  const resolved = !!node.resolved;
  const needsLoopback =
    !resolved && !!node.loopback_target && node.loopback_target !== "home";

  const persistFields = () => {
    onSave({
      problem_focus: draftFocus,
      solution_approach: draftSolution,
      resolution_plan: draftPlan,
      title: draftFocus.trim().slice(0, 80),
    });
  };

  const setResolved = (next: boolean) => {
    onSave({
      resolved: next,
      track_handle: next ? null : node.track_handle ?? "immediate",
      loopback_target: next ? null : node.loopback_target,
      status: next ? "ongoing" : "tracking",
    });
  };

  const setHandle = (handle: TrackHandleMode) => {
    onSave({ track_handle: handle, resolved: false });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[10px] text-slate-500">
          锚定 ·{" "}
          {node.anchor_type === "goal"
            ? "目标"
            : node.anchor_type === "goal_kr"
              ? "KR"
              : "决策"}
          {anchorTitle ? `：${anchorTitle}` : ""}
        </p>
        <Link
          href={
            node.anchor_type === "goal"
              ? `/goals?detail=${node.anchor_id}`
              : `/decisions`
          }
          className="text-[10px] text-[#1D4ED8] hover:underline"
        >
          查看来源
        </Link>
      </div>

      <label className="block text-[10px] font-medium text-slate-600">
        问题概括
      </label>
      <Textarea
        value={draftFocus}
        onChange={(e) => onDraftFocus(e.target.value)}
        rows={2}
        className="text-xs"
        placeholder="一句话描述当前遇到的问题"
      />

      <label className="block text-[10px] font-medium text-slate-600">
        个人想法/方案
      </label>
      <Textarea
        value={draftSolution}
        onChange={(e) => onDraftSolution(e.target.value)}
        rows={2}
        className="text-xs"
        placeholder="针对问题的思路、初步做法"
      />

      <label className="block text-[10px] font-medium text-slate-600">
        后续解决规划
      </label>
      <Textarea
        value={draftPlan}
        onChange={(e) => onDraftPlan(e.target.value)}
        rows={2}
        className="text-xs"
        placeholder="整体解决思路与执行计划"
      />

      <div className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2.5 space-y-2">
        <p className="text-[10px] font-medium text-slate-600">办结状态</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setResolved(false)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px]",
              !resolved
                ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
            )}
          >
            待跟进
          </button>
          <button
            type="button"
            onClick={() => setResolved(true)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px]",
              resolved
                ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
            )}
          >
            已解决
          </button>
        </div>

        {!resolved && (
          <>
            <p className="text-[10px] font-medium text-slate-600">归类</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setHandle("inbox")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px]",
                  node.track_handle === "inbox"
                    ? "bg-slate-200 text-slate-800"
                    : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
                )}
              >
                收集箱
              </button>
              <button
                type="button"
                onClick={() => setHandle("immediate")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px]",
                  node.track_handle === "immediate"
                    ? "bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#BFDBFE]"
                    : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
                )}
              >
                立即处理
              </button>
            </div>
          </>
        )}

        {!resolved && (
          <div className="border-t border-[#EEF1F5] pt-2">
            <p className="text-[10px] font-medium text-slate-600">流转目标</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSave({ loopback_target: null })}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  !node.loopback_target
                    ? "bg-slate-200 text-slate-800"
                    : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
                )}
              >
                仅做记录
              </button>
              {LOOPBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSave({ loopback_target: opt.value })}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    node.loopback_target === opt.value
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                      : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {needsLoopback && node.loopback_target && (
        <div className="flex flex-wrap items-center gap-2">
          <FlowAdvanceButton
            fromStage="track"
            toStage={
              node.loopback_target as "thinking" | "decisions" | "goals"
            }
            title={node.problem_focus || node.title}
            entityId={node.id}
            variant="primary"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          取消
        </Button>
        <Button size="sm" variant="primary" onClick={persistFields}>
          保存
        </Button>
      </div>
    </div>
  );
}
