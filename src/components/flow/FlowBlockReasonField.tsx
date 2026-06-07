"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setFlowBlockReason } from "@/lib/flow/progress-storage";
import type { FlowStage } from "@/lib/flow/types";
import { cn } from "@/lib/utils";

type Props = {
  entityType: string;
  entityId: string;
  stage: FlowStage;
  initialReason?: string | null;
  initialPending?: boolean;
  onSaved?: () => void;
  className?: string;
};

export function FlowBlockReasonField({
  entityType,
  entityId,
  stage,
  initialReason = null,
  initialPending = false,
  onSaved,
  className,
}: Props) {
  const [reason, setReason] = useState(initialReason ?? "");
  const [pending, setPending] = useState(initialPending);
  const [open, setOpen] = useState(false);

  const statusLabel = pending
    ? "待定"
    : reason.trim()
      ? reason.trim()
      : "未填写";

  const save = (opts: { blockPending: boolean; blockReason?: string }) => {
    setFlowBlockReason({
      entityType,
      entityId,
      stage,
      blockReason: opts.blockReason ?? reason,
      blockPending: opts.blockPending,
    });
    setPending(opts.blockPending);
    if (opts.blockReason !== undefined) setReason(opts.blockReason);
    setOpen(false);
    onSaved?.();
  };

  return (
    <div className={cn("text-[10px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-slate-400 hover:text-slate-600"
      >
        未推进原因：{" "}
        <span
          className={cn(
            pending && "text-amber-600",
            !pending && reason.trim() && "text-slate-600"
          )}
        >
          {statusLabel}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-[#E2E8F0] bg-white p-2">
          <Input
            className="text-xs"
            placeholder="为什么还没进入下一步？"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => save({ blockPending: false, blockReason: reason })}
            >
              保存
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => save({ blockPending: true, blockReason: "" })}
            >
              待定
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
