"use client";

import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import { applyMethodPick } from "@/lib/thinking/apply-method-pick";
import type { ThinkingMethodId } from "@/lib/thinking/methods";
import type { AddQuestionMeta } from "@/lib/thinking/prompt-draft";
import type { ThoughtNode } from "@/lib/thinking/types";

export type MethodPickerTarget = {
  mode: "child" | "sibling";
  refNodeId: string;
  parentId: string;
  parentNode: ThoughtNode;
};

type AddQuestionFn = (
  parentId: string,
  methodId: ThinkingMethodId,
  draft: string,
  meta?: AddQuestionMeta
) => void;

export function ThinkingMethodPicker({
  target,
  onAddQuestion,
  onAddSiblingQuestion,
  onClose,
  compact,
}: {
  target: MethodPickerTarget;
  onAddQuestion: AddQuestionFn;
  onAddSiblingQuestion: (
    refNodeId: string,
    methodId: ThinkingMethodId,
    draft: string,
    meta?: AddQuestionMeta
  ) => void;
  onClose: () => void;
  compact?: boolean;
}) {
  const { methods, getMethod } = useThinkingMethods();

  const pickMethod = (id: ThinkingMethodId) => {
    const m = getMethod(id);
    const onAdd: AddQuestionFn = (parentId, methodId, draft, meta) => {
      if (target.mode === "child") {
        onAddQuestion(parentId, methodId, draft, meta);
      } else {
        onAddSiblingQuestion(target.refNodeId, methodId, draft, meta);
      }
    };
    applyMethodPick(target.parentId, id, m, onAdd);
    onClose();
  };

  return (
    <div
      className={
        compact
          ? "min-w-[10rem] rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-lg"
          : "w-full rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-sm"
      }
    >
      <p
        className={
          compact
            ? "mb-1.5 text-[10px] text-slate-400"
            : "mb-2 text-xs font-medium text-slate-600"
        }
      >
        {target.mode === "child" ? "添加子节点" : "添加同级节点"} · 选择方法
      </p>
      <div
        className={
          compact
            ? "flex max-w-[14rem] flex-wrap gap-1"
            : "flex flex-wrap gap-1.5"
        }
      >
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pickMethod(m.id)}
            className={
              compact
                ? "rounded-md border border-[#E2E8F0] px-2 py-0.5 text-[10px] text-slate-700 hover:border-[#3B82F6] hover:text-[#3B82F6]"
                : "rounded-lg border border-[#E2E8F0] px-3 py-1 text-xs font-medium text-slate-700 hover:border-[#3B82F6] hover:text-[#3B82F6]"
            }
          >
            {m.short}
          </button>
        ))}
      </div>
      {!compact && (
        <button
          type="button"
          className="mt-2 w-full text-center text-xs text-slate-400 hover:underline"
          onClick={onClose}
        >
          取消
        </button>
      )}
    </div>
  );
}

export function ThinkingMethodPickerDialog({
  target,
  onAddQuestion,
  onAddSiblingQuestion,
  onClose,
}: {
  target: MethodPickerTarget;
  onAddQuestion: AddQuestionFn;
  onAddSiblingQuestion: (
    refNodeId: string,
    methodId: ThinkingMethodId,
    draft: string,
    meta?: AddQuestionMeta
  ) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <ThinkingMethodPicker
          target={target}
          onAddQuestion={onAddQuestion}
          onAddSiblingQuestion={onAddSiblingQuestion}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
