"use client";

import { useEffect, useRef, useState } from "react";
import { THINK_FONT_FAMILY } from "@/lib/thinking/methods";
import type { ThoughtNode } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

type Props = {
  node: ThoughtNode;
  onSave: (nodeId: string, content: string) => void;
  className?: string;
};

/** 画布+文字视图：仅保留主题文本输入 */
export function ThinkingRootEditor({ node, onSave, className }: Props) {
  const [draft, setDraft] = useState(node.content);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(node.content);
  }, [node.id, node.content]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`;
  }, [draft]);

  const commit = () => {
    const text = draft.trim();
    if (text !== node.content) onSave(node.id, text || node.content);
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <p className="mb-1 shrink-0 text-[10px] font-medium text-slate-400">
        思考主题
      </p>
      <textarea
        ref={ref}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-base font-semibold leading-snug text-slate-800 outline-none focus:border-[#93C5FD] focus:ring-1 focus:ring-[#BFDBFE]"
        style={{ fontFamily: THINK_FONT_FAMILY }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder="思考主题…"
      />
      <p className="mt-1.5 shrink-0 text-[10px] text-slate-400">
        脉络与节点在画布中编辑；此处仅编辑主题文字。
      </p>
    </div>
  );
}
