"use client";

import { MarkdownPreview } from "@/app/canvas/markdown";
import { cn } from "@/lib/utils";

type Props = {
  source: string;
  className?: string;
  empty?: string;
};

/** 只读 Markdown 渲染（复盘、AI 生成内容等） */
export function MarkdownContent({ source, className, empty }: Props) {
  if (!source.trim()) {
    return empty ? (
      <p className={cn("text-xs text-slate-400", className)}>{empty}</p>
    ) : null;
  }
  return (
    <MarkdownPreview
      source={source}
      className={cn(
        "markdown-content max-w-none text-sm leading-relaxed text-slate-700",
        "[&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold",
        "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4",
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4",
        "[&_p]:my-1",
        "[&_table]:text-xs",
        className
      )}
    />
  );
}
