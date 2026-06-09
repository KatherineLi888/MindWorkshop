"use client";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

/** 页面右上角新建按钮（与目标/决策模块统一） */
export function HeaderAddButton({ title, onClick, className }: Props) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-lg text-[#3B82F6] shadow-sm transition hover:border-[#3B82F6]/40 hover:bg-[#EFF6FF]",
        className
      )}
    >
      +
    </button>
  );
}
