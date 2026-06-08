"use client";

import { ThinkingNodeInspector } from "@/components/thinking/ThinkingNodeInspector";
import type { PendingMethod } from "@/components/thinking/thinking-editor-types";
import type { ThoughtNodeEmphasis } from "@/lib/thinking/node-appearance";
import type { ThinkingMethodId } from "@/lib/thinking/methods";
import type { ThinkingMethodDef } from "@/lib/thinking/methods";
import type { ThoughtNode } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

type Props = {
  actionNode: ThoughtNode | null;
  selectedCount: number;
  editContent: string;
  onEditContent: (v: string) => void;
  onSaveContent: () => void;
  pendingMethod: PendingMethod | null;
  pendingDef: ThinkingMethodDef | null;
  onStartMethod: (id: ThinkingMethodId) => void;
  onPendingDraft: (draft: string) => void;
  onCancelPending: () => void;
  onAddQuestion: () => void;
  answerDraft: string;
  onAnswerDraft: (v: string) => void;
  onSaveAnswer: () => void;
  mergeDraft: string;
  onMergeDraft: (v: string) => void;
  onMerge: () => void;
  onDeleteNode?: () => void;
  onClose?: () => void;
  mobile?: boolean;
  className?: string;
};

const NODE_TYPE_LABEL: Record<string, string> = {
  topic: "主题",
  question: "问题",
  answer: "回答",
  conclusion: "结论",
  merge: "合并",
};

export function ThinkingNodeEditPanel({
  actionNode,
  selectedCount,
  editContent,
  onEditContent,
  onSaveContent,
  pendingMethod,
  pendingDef,
  onStartMethod,
  onPendingDraft,
  onCancelPending,
  onAddQuestion,
  answerDraft,
  onAnswerDraft,
  onSaveAnswer,
  mergeDraft,
  onMergeDraft,
  onMerge,
  onDeleteNode,
  onClose,
  mobile,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-[#E2E8F0] bg-white",
        mobile
          ? "fixed inset-x-0 bottom-0 z-40 max-h-[55dvh] rounded-t-xl border-t shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
          : "hidden w-72 border-l md:flex md:max-h-full",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#F1F5F9] px-3 py-2">
        <p className="text-xs font-medium text-slate-700">
          {actionNode
            ? `编辑 · ${NODE_TYPE_LABEL[actionNode.type] ?? "节点"}`
            : "节点编辑"}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            关闭
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ThinkingNodeInspector
          bar
          actionNode={actionNode}
          selectedCount={selectedCount}
          editContent={editContent}
          onEditContent={onEditContent}
          onSaveContent={onSaveContent}
          pendingMethod={pendingMethod}
          pendingDef={pendingDef}
          onStartMethod={onStartMethod}
          onPendingDraft={onPendingDraft}
          onCancelPending={onCancelPending}
          onAddQuestion={onAddQuestion}
          answerDraft={answerDraft}
          onAnswerDraft={onAnswerDraft}
          onSaveAnswer={onSaveAnswer}
          mergeDraft={mergeDraft}
          onMergeDraft={onMergeDraft}
          onMerge={onMerge}
        />

        {actionNode && actionNode.type !== "topic" && onDeleteNode && (
          <button
            type="button"
            onClick={onDeleteNode}
            className="mt-3 w-full rounded-lg border border-red-100 py-1.5 text-[11px] text-red-600 transition hover:bg-red-50"
          >
            删除此节点
          </button>
        )}
      </div>
    </aside>
  );
}
