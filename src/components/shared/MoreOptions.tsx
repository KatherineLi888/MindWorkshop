"use client";

import { useState } from "react";

export function MoreOptions({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-[#3B82F6] hover:underline"
      >
        {open ? "收起更多选项" : "更多选项"}
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}
