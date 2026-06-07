"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/app/canvas/ConfirmDialog";
import { flowJumpButtonLabel } from "@/lib/flow/transitions";
import { FLOW_JUMP_TARGETS } from "@/lib/flow/transitions";
import type { FlowStage } from "@/lib/flow/types";
import { cn } from "@/lib/utils";
import { useFlowJump } from "./useFlowJump";

type Props = {
  fromStage: FlowStage;
  toStage: FlowStage;
  title: string;
  entityId: string;
  className?: string;
  /** 仅展示主按钮时不显示次要说明 */
  compact?: boolean;
};

export function FlowAdvanceBar({
  fromStage,
  toStage,
  title,
  entityId,
  className,
  compact,
}: Props) {
  const { jump, busy } = useFlowJump();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const label = flowJumpButtonLabel(fromStage, toStage);

  const handleConfirm = async () => {
    setConfirmOpen(false);
    await jump({ fromStage, toStage, title, entityId });
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => setConfirmOpen(true)}
        className={cn(
          "flex w-full items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-sm font-medium text-[#2563EB] transition hover:bg-[#DBEAFE] disabled:opacity-50",
          className
        )}
      >
        {busy ? "跳转中…" : label}
      </button>
      {!compact && (
        <p className="mt-1 text-center text-[10px] text-slate-400">
          右键可记录结果并选择其他跳转
        </p>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="确认跳转"
        message={`确定要「${label}」吗？将离开当前页面并记录流程跳转。`}
        confirmLabel="确定跳转"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

/** 获取该阶段所有可跳转目标（供右键菜单） */
export function getFlowJumpTargets(fromStage: FlowStage): FlowStage[] {
  return FLOW_JUMP_TARGETS[fromStage] ?? [];
}
