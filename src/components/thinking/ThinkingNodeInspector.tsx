"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import type {
  ThinkingMethodDef,
  ThinkingMethodId,
} from "@/lib/thinking/methods";
import { ThinkingNodeEmphasisPicker } from "@/components/thinking/ThinkingNodeEmphasisPicker";
import type { ThoughtNodeEmphasis } from "@/lib/thinking/node-appearance";
import type { ThoughtNode } from "@/lib/thinking/types";
import type { PendingMethod } from "@/components/thinking/thinking-editor-types";

type Props = {
  bar?: boolean;
  compact?: boolean;
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
  onSetEmphasis?: (emphasis: ThoughtNodeEmphasis | undefined) => void;
};

function MethodLibraryRow({
  methods,
  onStartMethod,
  prominent,
}: {
  methods: ReturnType<typeof useThinkingMethods>["methods"];
  onStartMethod: (id: ThinkingMethodId) => void;
  prominent?: boolean;
}) {
  return (
    <div>
      <p
        className={
          prominent
            ? "text-xs font-semibold text-slate-700"
            : "text-[10px] font-medium text-slate-500"
        }
      >
        方法库
      </p>
      <div
        className={
          prominent
            ? "mt-1.5 flex flex-wrap gap-1.5"
            : "mt-1 flex flex-wrap gap-1"
        }
      >
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.description}
            className={
              prominent
                ? "rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-[#3B82F6] hover:text-[#3B82F6]"
                : "rounded border border-[#D1DCE8] bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:border-[#94A3B8] hover:bg-[#FAFBFC]"
            }
            onClick={() => onStartMethod(m.id)}
          >
            + {m.short}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThinkingNodeInspector({
  bar,
  compact,
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
  onSetEmphasis,
}: Props) {
  const { methods, getMethod } = useThinkingMethods();
  const showMerge = selectedCount >= 2;

  if (!actionNode && !showMerge) {
    return (
      <p className="text-[10px] leading-relaxed text-slate-400">
        点击节点编辑 · 按住 Ctrl 多选 · 选 2 个以上可合并
      </p>
    );
  }

  const canShowMethods =
    actionNode &&
    (actionNode.type === "topic" ||
      actionNode.type === "answer" ||
      actionNode.type === "merge");

  if (bar) {
    return (
      <div className="space-y-2">
        {showMerge && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-2 py-1.5">
            <span className="shrink-0 text-[11px] font-medium text-[#4338CA]">
              已选 {selectedCount} 个 · 合并
            </span>
            <Input
              className="min-w-[120px] flex-1 text-xs"
              placeholder="汇总语…"
              value={mergeDraft}
              onChange={(e) => onMergeDraft(e.target.value)}
            />
            <Button size="sm" variant="primary" onClick={onMerge}>
              汇总
            </Button>
          </div>
        )}

        {actionNode && (
          <>
            {canShowMethods && (
              <MethodLibraryRow
                methods={methods}
                onStartMethod={onStartMethod}
                prominent
              />
            )}

            <div className="flex items-start gap-2">
              <Textarea
                rows={2}
                className="min-h-0 flex-1 text-sm"
                value={editContent}
                onChange={(e) => onEditContent(e.target.value)}
                placeholder="节点文字"
              />
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={onSaveContent}
              >
                保存文字
              </Button>
            </div>

            {onSetEmphasis && selectedCount === 1 && (
              <ThinkingNodeEmphasisPicker
                compact
                value={actionNode.emphasis}
                onChange={onSetEmphasis}
              />
            )}

            {pendingMethod && pendingDef && (
              <div className="rounded-lg border border-[#D1DCE8] bg-white p-2">
                <p className="text-xs font-medium text-slate-700">
                  {pendingDef.label}
                </p>
                <Textarea
                  className="mt-1 bg-white text-xs"
                  rows={pendingDef.inputKind === "multiline" ? 3 : 2}
                  value={pendingMethod.draft}
                  onChange={(e) => onPendingDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                      onAddQuestion();
                    }
                  }}
                  placeholder="Enter 添加 · Shift+Enter 换行"
                />
                <div className="mt-1.5 flex gap-1">
                  <Button size="sm" variant="primary" onClick={onAddQuestion}>
                    添加
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onCancelPending}>
                    取消
                  </Button>
                </div>
              </div>
            )}

            {actionNode.type === "question" && (
              <div className="flex items-start gap-2">
                <Textarea
                  rows={2}
                  className="min-h-0 flex-1 text-sm"
                  placeholder="写下回答…"
                  value={answerDraft}
                  onChange={(e) => onAnswerDraft(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="primary"
                  className="shrink-0"
                  disabled={!answerDraft.trim()}
                  onClick={onSaveAnswer}
                >
                  保存回答
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {showMerge && (
        <div className="rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] p-2">
          <p className="text-[10px] font-medium text-[#4338CA]">
            已选 {selectedCount} 个节点 · 合并
          </p>
          <Input
            className="mt-1.5 text-xs"
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
      )}

      {actionNode && (
        <>
          <p className="text-[10px] text-slate-400">
            {actionNode.type === "topic" && "起点 · 主题"}
            {actionNode.type === "question" &&
              actionNode.method &&
              `${getMethod(actionNode.method).label} · 待回答`}
            {actionNode.type === "answer" && "我的回答"}
            {actionNode.type === "merge" && "合并汇总"}
          </p>

          <Textarea
            rows={compact ? 2 : 2}
            className="text-xs"
            value={editContent}
            onChange={(e) => onEditContent(e.target.value)}
            placeholder="节点文字"
          />
          <Button size="sm" variant="secondary" onClick={onSaveContent}>
            保存文字
          </Button>

          {onSetEmphasis && selectedCount === 1 && (
            <ThinkingNodeEmphasisPicker
              compact={compact}
              value={actionNode.emphasis}
              onChange={onSetEmphasis}
            />
          )}

          {canShowMethods && (
            <MethodLibraryRow
              methods={methods}
              onStartMethod={onStartMethod}
            />
          )}

          {pendingMethod && pendingDef && (
            <div className="rounded-lg border border-[#D1DCE8] bg-white p-2">
              <p className="text-[10px] font-medium text-slate-700">
                {pendingDef.label}
              </p>
              <Textarea
                className="mt-1 bg-white text-xs"
                rows={pendingDef.inputKind === "multiline" ? 4 : 2}
                value={pendingMethod.draft}
                onChange={(e) => onPendingDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.ctrlKey &&
                    !e.metaKey
                  ) {
                    e.preventDefault();
                    onAddQuestion();
                  }
                }}
                placeholder="Enter 添加 · Shift+Enter 换行"
              />
              <div className="mt-1.5 flex gap-1">
                <Button size="sm" variant="primary" onClick={onAddQuestion}>
                  添加
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelPending}>
                  取消
                </Button>
              </div>
            </div>
          )}

          {actionNode.type === "question" && (
            <div className="rounded-lg border border-[#E8ECF0] bg-white p-2">
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="写下回答…"
                value={answerDraft}
                onChange={(e) => onAnswerDraft(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                className="mt-1 w-full"
                disabled={!answerDraft.trim()}
                onClick={onSaveAnswer}
              >
                保存回答
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
