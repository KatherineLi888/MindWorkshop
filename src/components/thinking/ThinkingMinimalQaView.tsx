"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/input";
import { buildQaRows } from "@/lib/thinking/qa-labels";
import type { ThinkingMethodId } from "@/lib/thinking/methods";
import type { ThoughtSession } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

const DEFAULT_METHOD: ThinkingMethodId = "followup";

type Props = {
  session: ThoughtSession;
  rootId: string;
  onSaveContent: (nodeId: string, content: string) => void;
  onAddQuestion: (
    parentId: string,
    methodId: ThinkingMethodId,
    draft: string
  ) => void;
  onAddSiblingQuestion: (
    refNodeId: string,
    methodId: ThinkingMethodId,
    draft: string
  ) => void;
  onAddChildQuestion: (
    refNodeId: string,
    methodId: ThinkingMethodId,
    draft: string
  ) => void;
  onAddAnswer: (questionId: string, text: string, markProgress: boolean) => void;
  onDeleteNode: (nodeId: string) => void;
};

type MenuState = { rowId: string; x: number; y: number } | null;

export function ThinkingMinimalQaView({
  session,
  rootId,
  onSaveContent,
  onAddQuestion,
  onAddSiblingQuestion,
  onAddChildQuestion,
  onAddAnswer,
  onDeleteNode,
}: Props) {
  const rows = useMemo(
    () => buildQaRows(session, rootId),
    [session, rootId]
  );
  const [menu, setMenu] = useState<MenuState>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const ensureFirstQuestion = () => {
    if (rows.length > 0 || !rootId) return;
    onAddQuestion(rootId, DEFAULT_METHOD, "");
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 px-2 pb-6 pt-1">
      <p className="text-xs font-medium text-slate-500">建立第一个问题</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-4">
          <p className="text-sm text-slate-600">从主问题开始，写下你想厘清的第一问。</p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white"
            onClick={ensureFirstQuestion}
          >
            + 添加 A1
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.questionId}
              className="relative"
              style={{ paddingLeft: `${Math.max(0, row.depth - 1) * 14}px` }}
            >
              <div className="flex gap-2">
                <div className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-[#E8ECF0] bg-white p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 shrink-0 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#3B82F6]">
                      {row.label}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-400">问题</label>
                        <Textarea
                          rows={2}
                          className="mt-0.5 text-sm"
                          value={row.question.content}
                          placeholder="输入问题…"
                          onChange={(e) =>
                            onSaveContent(row.questionId, e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">答案</label>
                        <Textarea
                          rows={2}
                          className="mt-0.5 text-sm"
                          value={row.answer?.content ?? ""}
                          placeholder="输入回答…"
                          onChange={(e) =>
                            onAddAnswer(row.questionId, e.target.value, false)
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      title="节点操作"
                      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] text-base text-[#3B82F6] hover:bg-[#EFF6FF]"
                      onClick={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setMenu({
                          rowId: row.questionId,
                          x: Math.min(rect.left, window.innerWidth - 140),
                          y: rect.bottom + 4,
                        });
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenu({
                          rowId: row.questionId,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        if (!touch) return;
                        longPressTimer.current = setTimeout(() => {
                          setMenu({
                            rowId: row.questionId,
                            x: touch.clientX,
                            y: touch.clientY,
                          });
                        }, 480);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                      }}
                      onTouchMove={() => {
                        if (longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <button
          type="button"
          className="w-full rounded-lg border border-dashed border-[#E2E8F0] py-2 text-xs text-slate-500 hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
          onClick={() => {
            const last = rows[rows.length - 1];
            onAddSiblingQuestion(last.questionId, DEFAULT_METHOD, "");
          }}
        >
          + 添加同级问题
        </button>
      )}

      {menu && (
        <>
          <div
            className="fixed inset-0 z-[80]"
            onClick={() => setMenu(null)}
          />
          <div
            className="fixed z-[90] min-w-[9rem] rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg"
            style={{ left: menu.x, top: menu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              {
                label: "创建同级节点",
                onClick: () => {
                  onAddSiblingQuestion(menu.rowId, DEFAULT_METHOD, "");
                  setMenu(null);
                },
              },
              {
                label: "创建子节点",
                onClick: () => {
                  onAddChildQuestion(menu.rowId, DEFAULT_METHOD, "");
                  setMenu(null);
                },
              },
              {
                label: "删除当前节点",
                danger: true,
                onClick: () => {
                  if (
                    window.confirm(
                      "删除该问题将同时移除其答案与所有子节点，确定继续？"
                    )
                  ) {
                    onDeleteNode(menu.rowId);
                  }
                  setMenu(null);
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50",
                  item.danger ? "text-red-600" : "text-slate-700"
                )}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
