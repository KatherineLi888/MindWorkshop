"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FlowFunnelView } from "@/components/flow/FlowFunnelView";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function FlowFunnelModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-[#F8FAFC] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3">
          <p className="text-sm font-medium text-slate-800">流程漏斗</p>
          <div className="flex items-center gap-2">
            <Link href="/home/funnel" onClick={onClose}>
              <Button size="sm" variant="ghost">
                全屏查看
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto px-3 py-3">
          <FlowFunnelView compact showExport />
        </div>
      </div>
    </div>
  );
}
