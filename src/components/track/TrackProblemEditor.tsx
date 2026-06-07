"use client";

import Link from "next/link";
import { FlowAdvanceButton } from "@/components/flow/FlowAdvanceButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { FLOW_STAGE_LABELS } from "@/lib/flow/types";
import type { GraphNodeRow, TrackLoopbackTarget } from "@/types/database";

const LOOPBACK_OPTIONS: { value: TrackLoopbackTarget; label: string }[] = [
  { value: "thinking", label: FLOW_STAGE_LABELS.thinking },
  { value: "decisions", label: FLOW_STAGE_LABELS.decisions },
  { value: "goals", label: FLOW_STAGE_LABELS.goals },
];

type Props = {
  node: GraphNodeRow;
  anchorTitle?: string;
  draftFocus: string;
  draftSolution: string;
  draftBackground: string;
  onDraftFocus: (v: string) => void;
  onDraftSolution: (v: string) => void;
  onDraftBackground: (v: string) => void;
  onSave: (patch: Partial<GraphNodeRow>) => void;
  onClose: () => void;
};

export function TrackProblemEditor({
  node,
  anchorTitle,
  draftFocus,
  draftSolution,
  draftBackground,
  onDraftFocus,
  onDraftSolution,
  onDraftBackground,
  onSave,
  onClose,
}: Props) {
  const resolved = !!node.resolved;
  const needsLoopback = !resolved && !!node.loopback_target;

  return (
    <Card className="bg-white p-4">
      <SeedLinkPanel
        entityType="graph_node"
        entityId={node.id}
        title={node.problem_focus || node.title}
        stage="track"
        className="mb-3"
      />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-900">{node.title}</h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            锚定 ·{" "}
            {node.anchor_type === "goal"
              ? "目标"
              : node.anchor_type === "goal_kr"
                ? "KR"
                : "决策"}
            {anchorTitle ? `：${anchorTitle}` : ""}
          </p>
        </div>
        <Link
          href={
            node.anchor_type === "goal"
              ? `/goals?detail=${node.anchor_id}`
              : `/decisions`
          }
          className="text-xs text-[#1D4ED8] hover:underline"
        >
          查看来源
        </Link>
      </div>

      <label className="mt-3 block text-xs font-medium text-slate-600">
        问题导向
      </label>
      <Input
        value={draftFocus}
        onChange={(e) => onDraftFocus(e.target.value)}
        onBlur={() => onSave({ problem_focus: draftFocus })}
        placeholder="当前要推进或复盘的核心问题"
      />

      <label className="mt-3 block text-xs font-medium text-slate-600">
        解决思路
      </label>
      <Textarea
        value={draftSolution}
        onChange={(e) => onDraftSolution(e.target.value)}
        onBlur={() => onSave({ solution_approach: draftSolution })}
        rows={3}
        placeholder="打算怎么处理、或已尝试的做法"
      />

      <label className="mt-3 block text-xs font-medium text-slate-600">
        简要背景（可选）
      </label>
      <Textarea
        value={draftBackground}
        onChange={(e) => onDraftBackground(e.target.value)}
        onBlur={() => onSave({ background: draftBackground })}
        rows={2}
      />

      <div className="mt-4 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-3">
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={resolved}
            onChange={(e) => {
              const next = e.target.checked;
              onSave({
                resolved: next,
                loopback_target: next ? null : node.loopback_target,
                status: next ? "ongoing" : "tracking",
              });
            }}
          />
          <span className="text-xs text-slate-700">
            已解决，不影响整体进程
            <span className="mt-0.5 block text-[10px] text-slate-400">
              勾选后仅作记录，无需回转
            </span>
          </span>
        </label>

        {!resolved && (
          <div className="mt-3 border-t border-[#EEF1F5] pt-3">
            <p className="text-[10px] font-medium text-slate-600">
              未解决 · 是否需要回转？
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSave({ loopback_target: null })}
                className={`rounded-full px-2.5 py-1 text-[10px] ${
                  !node.loopback_target
                    ? "bg-slate-200 text-slate-800"
                    : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
                }`}
              >
                暂不回转，先记录
              </button>
              {LOOPBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSave({ loopback_target: opt.value })}
                  className={`rounded-full px-2.5 py-1 text-[10px] ${
                    node.loopback_target === opt.value
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                      : "bg-white text-slate-500 ring-1 ring-[#E2E8F0]"
                  }`}
                >
                  回转到{opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {needsLoopback && node.loopback_target && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium text-amber-700">
            执行回转
          </span>
          <FlowAdvanceButton
            fromStage="track"
            toStage={node.loopback_target}
            title={node.problem_focus || node.title}
            entityId={node.id}
            variant="primary"
          />
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>
          关闭
        </Button>
      </div>
    </Card>
  );
}
