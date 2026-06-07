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

/** 未推进原因的颜色：当前节点绿色，待定琥珀，已填原因蓝色，未填灰色 */
function badgeColors(pending: boolean, reason: string) {
  if (pending) {
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-400",
    };
  }
  if (reason.trim()) {
    return {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
      dot: "bg-sky-400",
    };
  }
  return {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  };
}

export function FlowBlockReasonBadge({
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
      : "推进中";

  const colors = badgeColors(pending, reason);

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
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 transition hover:opacity-80",
          colors.bg,
          colors.border,
          colors.text
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
        <span className="truncate">
          {pending ? "未推进 · 待定" : reason.trim() ? `未推进 · ${statusLabel}` : "当前节点 · 推进中"}
        </span>
      </button>

      {open && (
        <div
          className="mt-2 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
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
