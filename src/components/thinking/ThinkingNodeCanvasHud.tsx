"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import type {
  ThinkingMethodDef,
  ThinkingMethodId,
} from "@/lib/thinking/methods";
import type { NodeLayout } from "@/lib/thinking/layout";
import type { ThoughtNode } from "@/lib/thinking/types";
import type { PendingMethod } from "@/components/thinking/thinking-editor-types";

export type CanvasHudEditorProps = {
  actionNode: ThoughtNode | null;
  nodeLayout: NodeLayout | null;
  selectedCount: number;
  canAddMethod: boolean;
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
};

type Panel = "idle" | "methods" | "prompt" | "answer" | "merge";

export function ThinkingNodeCanvasHud({
  actionNode,
  nodeLayout,
  selectedCount,
  canAddMethod,
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
}: CanvasHudEditorProps) {
  const { methods } = useThinkingMethods();
  const [panel, setPanel] = useState<Panel>("idle");

  useEffect(() => {
    setPanel("idle");
  }, [actionNode?.id]);

  if (!nodeLayout && selectedCount < 2) return null;

  const showMerge = selectedCount >= 2;
  const layout = nodeLayout;

  const stop = (e: React.PointerEvent) => e.stopPropagation();

  if (showMerge) {
    return (
      <div
        data-thinking-hud
        className="absolute z-30 w-[200px] rounded-xl border border-[#C7D2FE] bg-white p-2 shadow-lg"
        style={{
          left: layout ? layout.x + layout.w + 10 : 120,
          top: layout ? layout.y : 80,
        }}
        onPointerDown={stop}
      >
        <p className="text-[10px] font-medium text-[#4338CA]">
          已选 {selectedCount} 个 · Ctrl 多选
        </p>
        <Textarea
          className="mt-1 text-xs"
          rows={2}
          placeholder="汇总语…"
          value={mergeDraft}
          onChange={(e) => onMergeDraft(e.target.value)}
        />
        <Button
          size="sm"
          variant="primary"
          className="mt-1.5 w-full"
          onClick={onMerge}
        >
          汇总到下一步
        </Button>
      </div>
    );
  }

  if (!actionNode || !layout) return null;

  const isQuestion = actionNode.type === "question";
  const activePanel: Panel = pendingMethod
    ? "prompt"
    : isQuestion && (panel === "answer" || answerDraft)
      ? "answer"
      : panel;

  return (
    <div
      data-thinking-hud
      className="absolute z-30 flex items-start gap-1"
      style={{
        left: layout.x + layout.w + 8,
        top: layout.y,
      }}
      onPointerDown={stop}
    >
      {canAddMethod && activePanel === "idle" && !isQuestion && (
        <button
          type="button"
          title="添加思考方法"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C7D2FE] bg-white text-lg font-medium text-[#4F46E5] shadow-md hover:bg-[#EEF2FF]"
          onClick={() => setPanel("methods")}
        >
          +
        </button>
      )}

      {isQuestion && activePanel !== "prompt" && activePanel !== "methods" && (
        <button
          type="button"
          title="回答"
          className="flex h-8 shrink-0 items-center justify-center rounded-full border border-[#A7F3D0] bg-white px-2.5 text-[10px] font-medium text-[#059669] shadow-md hover:bg-[#ECFDF5]"
          onClick={() => setPanel("answer")}
        >
          回答
        </button>
      )}

      {activePanel === "methods" && (
        <div className="w-[200px] rounded-xl border border-[#E8ECF0] bg-white p-2 shadow-lg">
          <p className="mb-1.5 text-[10px] font-medium text-slate-600">
            选择方法
          </p>
          <div className="flex flex-wrap gap-1">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                className="rounded border border-[#D1DCE8] bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:border-[#94A3B8]"
                onClick={() => {
                  onStartMethod(m.id);
                  setPanel("prompt");
                }}
              >
                {m.short}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-1.5 text-[10px] text-slate-400 hover:underline"
            onClick={() => setPanel("idle")}
          >
            取消
          </button>
        </div>
      )}

      {activePanel === "prompt" && pendingMethod && pendingDef && (
        <div className="w-[220px] rounded-xl border border-[#D1DCE8] bg-white p-2 shadow-lg">
          <p className="text-[10px] font-medium text-slate-700">
            {pendingDef.label}
          </p>
          <Textarea
            className="mt-1 text-xs"
            rows={pendingDef.inputKind === "multiline" ? 4 : 2}
            value={pendingMethod.draft}
            onChange={(e) => onPendingDraft(e.target.value)}
            autoFocus
          />
          <div className="mt-1.5 flex gap-1">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onAddQuestion();
                setPanel("idle");
              }}
            >
              添加
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onCancelPending();
                setPanel("idle");
              }}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {activePanel === "answer" && isQuestion && (
        <div className="w-[220px] rounded-xl border border-[#E8ECF0] bg-white p-2 shadow-lg">
          <p className="text-[10px] font-medium text-slate-600">写下回答</p>
          <Textarea
            className="mt-1 text-xs"
            rows={3}
            value={answerDraft}
            onChange={(e) => onAnswerDraft(e.target.value)}
            autoFocus
          />
          <Button
            size="sm"
            variant="primary"
            className="mt-1 w-full"
            disabled={!answerDraft.trim()}
            onClick={() => {
              onSaveAnswer();
              setPanel("idle");
            }}
          >
            保存回答
          </Button>
        </div>
      )}
    </div>
  );
}
