"use client";

import type { KeyResult } from "@/lib/goals/types";
import { getKrProgressVisual, KR_PROGRESS_BAR } from "@/lib/goals/kr-progress";
import { cn } from "@/lib/utils";

type Props = {
  kr: KeyResult;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
};

export function KrQuickAddButton({
  kr,
  onClick,
  size = "md",
  className,
  disabled: disabledProp,
}: Props) {
  const visual = getKrProgressVisual(kr);
  const atTarget =
    kr.target > 0 && kr.current >= kr.target && !kr.allowExceed;
  const disabled =
    disabledProp ||
    (atTarget && (kr.recordMode === "count" || kr.recordMode === "consume"));
  const dim = size === "sm" ? "h-5 w-5 text-xs" : "h-6 w-6 text-sm";

  return (
    <button
      type="button"
      title="新增记录"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full leading-none transition active:scale-95",
        dim,
        disabled
          ? "cursor-not-allowed bg-slate-200 text-slate-400"
          : visual.isOverflow
            ? KR_PROGRESS_BAR.addBtnOverflow
            : KR_PROGRESS_BAR.addBtn,
        className
      )}
    >
      +
    </button>
  );
}
