"use client";

import { useState } from "react";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
};

/** 可编辑 Markdown 字段：编辑 / 预览切换 */
export function MarkdownField({
  value,
  onChange,
  rows = 4,
  placeholder,
  className,
}: Props) {
  const [preview, setPreview] = useState(false);

  return (
    <div className={cn("rounded-lg border border-[#E2E8F0] bg-white", className)}>
      <div className="flex items-center justify-between border-b border-[#EEF1F5] px-2 py-1">
        <span className="text-[10px] text-slate-400">支持 Markdown</span>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="rounded px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
        >
          {preview ? "编辑" : "预览"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-[4rem] p-3">
          <MarkdownContent source={value} empty="（空）" className="!text-xs" />
        </div>
      ) : (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
        />
      )}
    </div>
  );
}
