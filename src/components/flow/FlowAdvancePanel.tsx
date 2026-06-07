"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/app/canvas/ConfirmDialog";
import {
  FLOW_JUMP_TARGETS,
  flowJumpButtonLabel,
} from "@/lib/flow/transitions";
import type { FlowStage } from "@/lib/flow/types";
import { cn } from "@/lib/utils";
import { useFlowJump } from "./useFlowJump";

type Props = {
  fromStage: FlowStage;
  title: string;
  entityId: string;
  className?: string;
  /** 限定可选目标；默认取该阶段全部可跳目标 */
  toStages?: FlowStage[];
};

export function FlowAdvancePanel({
  fromStage,
  title,
  entityId,
  className,
  toStages,
}: Props) {
  const { jump, busy } = useFlowJump();
  const [pending, setPending] = useState<FlowStage | null>(null);

  const targets = toStages ?? FLOW_JUMP_TARGETS[fromStage] ?? [];
  if (targets.length === 0) return null;

  const pendingLabel = pending
    ? flowJumpButtonLabel(fromStage, pending)
    : "";

  const handleConfirm = async () => {
    if (!pending) return;
    const stage = pending;
    setPending(null);
    await jump({ fromStage, toStage: stage, title, entityId });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4",
        className
      )}
    >
      <p className="text-xs font-medium text-slate-700">流程推进</p>
      <p className="mt-0.5 text-[10px] text-slate-400">
        确认本环节已完成，选择要跳入的下一环节
      </p>
      <div className="mt-3 space-y-2">
        {targets.map((toStage) => {
          const label = flowJumpButtonLabel(fromStage, toStage);
          return (
            <button
              key={toStage}
              type="button"
              disabled={busy}
              onClick={() => setPending(toStage)}
              className="flex w-full items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-sm font-medium text-[#2563EB] transition hover:bg-[#DBEAFE] disabled:opacity-50"
            >
              {label}
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={pending != null}
        title="确认跳转"
        message={`确定要「${pendingLabel}」吗？将离开当前页面并记录流程跳转。`}
        confirmLabel="确定跳转"
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
