"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThinkingMapViewport } from "@/components/thinking/ThinkingMapViewport";
import { ThinkingMethodLibraryDialog } from "@/components/thinking/ThinkingMethodLibraryDialog";
import { ThinkingSeedBadge } from "@/components/thinking/ThinkingSeedBadge";
import { ThinkingVerticalTree } from "@/components/thinking/ThinkingVerticalTree";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import { ThinkingNodeEditPanel } from "@/components/thinking/ThinkingNodeEditPanel";
import { ThinkingRootEditor } from "@/components/thinking/ThinkingRootEditor";
import { ThinkingTextFlow } from "@/components/thinking/ThinkingTextFlow";
import type { PendingMethod } from "@/components/thinking/thinking-editor-types";
import { PageHeader } from "@/components/layout/PageHeader";
import { FlowAdvanceBar } from "@/components/flow/FlowAdvanceBar";
import { FlowListContextMenu } from "@/components/flow/FlowListContextMenu";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import { summarizeThoughtSession } from "@/lib/thinking/session-summary";
import { ConfirmDialog } from "@/app/canvas/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyMethodPick } from "@/lib/thinking/apply-method-pick";
import {
  dualQuestionPlaceholderHints,
  multilinePlaceholderHints,
  patternToPlaceholderHint,
} from "@/lib/thinking/question-placeholder";
import type { ThinkingMethodId } from "@/lib/thinking/methods";
import { resolveChildMountParentId } from "@/lib/thinking/mount-parent";
import type { AddQuestionMeta, QuestionEditFocus } from "@/lib/thinking/prompt-draft";
import {
  createThoughtSession,
  deleteThoughtNode,
  deleteThoughtSession,
  fillOrCreateAnswer,
  getRootId,
  loadThoughtSessions,
  updateThoughtSession,
  upsertNode,
} from "@/lib/thinking/storage";
import type { ThoughtNodeEmphasis } from "@/lib/thinking/node-appearance";
import { moveChildToIndex, toggleTextChildLayout } from "@/lib/thinking/text-board";
import type {
  ThinkingEditorView,
  ThoughtNode,
  ThoughtSession,
} from "@/lib/thinking/types";
import { formatDate } from "@/lib/utils";

export function ThinkingClient() {
  const { getMethod } = useThinkingMethods();
  const [sessions, setSessions] = useState<ThoughtSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ThoughtSession | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    session: ThoughtSession;
    x: number;
    y: number;
  } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastFocusedId, setLastFocusedId] = useState("");
  const [pendingMethod, setPendingMethod] = useState<PendingMethod | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [mergeDraft, setMergeDraft] = useState("");
  const [editContent, setEditContent] = useState("");
  const [methodLibOpen, setMethodLibOpen] = useState(false);
  const [treeFullscreen, setTreeFullscreen] = useState(false);
  const [questionEditFocus, setQuestionEditFocus] =
    useState<QuestionEditFocus | null>(null);
  const undoStackRef = useRef<ThoughtSession[]>([]);
  const searchParams = useSearchParams();

  const refresh = useCallback(() => {
    setSessions(loadThoughtSessions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sid = searchParams.get("session");
    if (!sid || activeId === sid) return;
    const target = sessions.find((s) => s.id === sid);
    if (target) openSession(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sessions]);

  const session = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  const triageId =
    searchParams.get("triage") || session?.sourceTriageId || null;

  const rootId = session ? getRootId(session) : "";

  const actionNode = useMemo(() => {
    if (!session) return null;
    if (lastFocusedId && selectedIds.has(lastFocusedId)) {
      return session.nodes.find((n) => n.id === lastFocusedId) ?? null;
    }
    if (selectedIds.size === 1) {
      const id = [...selectedIds][0];
      return session.nodes.find((n) => n.id === id) ?? null;
    }
    return null;
  }, [session, lastFocusedId, selectedIds]);

  const openSession = (s: ThoughtSession) => {
    const rid = getRootId(s);
    setActiveId(s.id);
    setPendingMethod(null);
    setAnswerDraft("");
    if (rid) {
      setSelectedIds(new Set([rid]));
      setLastFocusedId(rid);
      const root = s.nodes.find((n) => n.id === rid);
      setEditContent(root?.content ?? "");
    } else {
      setSelectedIds(new Set());
      setLastFocusedId("");
      setEditContent("");
    }
  };

  useEffect(() => {
    if (!actionNode) return;
    setEditContent(actionNode.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionNode?.id, activeId]);

  const persist = (next: ThoughtSession, options?: { skipUndo?: boolean }) => {
    if (
      !options?.skipUndo &&
      session &&
      session.id === next.id &&
      session !== next
    ) {
      undoStackRef.current.push(structuredClone(session));
      if (undoStackRef.current.length > 100) {
        undoStackRef.current.shift();
      }
    }
    const all = updateThoughtSession(next);
    setSessions(all);
  };

  const undoSession = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    const all = updateThoughtSession(prev);
    setSessions(all);
  }, []);

  useEffect(() => {
    undoStackRef.current = [];
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoSession();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, undoSession]);

  const selectNode = (id: string, additive: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(additive ? prev : []);
      if (next.has(id) && additive) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastFocusedId(id);
    const node = session?.nodes.find((n) => n.id === id);
    if (node) setEditContent(node.content);
    setPendingMethod(null);
    setAnswerDraft("");
  };

  const anchorText = () => {
    if (!session || !actionNode) return "";
    return actionNode.content.slice(0, 16) || session.title.slice(0, 12);
  };

  const startMethod = (methodId: ThinkingMethodId) => {
    if (!session || !actionNode) return;
    const parentId = resolveChildMountParentId(session, actionNode);
    applyMethodPick(parentId, methodId, getMethod(methodId), submitQuestionUnderParent);
    setPendingMethod(null);
  };

  const appendNodes = (newNodes: ThoughtNode[]) => {
    if (!session) return;
    let next = session;
    for (const node of newNodes) {
      next = upsertNode(next, node);
    }
    persist(next);
    const last = newNodes[newNodes.length - 1];
    if (last) {
      setSelectedIds(new Set([last.id]));
      setEditContent(last.content);
    }
    setPendingMethod(null);
  };

  const addQuestionNode = () => {
    if (!session || !pendingMethod) return;
    const m = getMethod(pendingMethod.methodId);
    const parent = pendingMethod.fromNodeId;

    if (m.inputKind === "dual") {
      dualQuestionPlaceholderHints().forEach((hint, i) => {
        submitQuestionUnderParent(parent, pendingMethod.methodId, "", {
          skipFocus: i > 0,
          placeholderHint: hint,
        });
      });
      setPendingMethod(null);
      return;
    }

    if (m.inputKind === "multiline") {
      multilinePlaceholderHints(m).forEach((hint, i) => {
        submitQuestionUnderParent(parent, pendingMethod.methodId, "", {
          skipFocus: i > 0,
          placeholderHint: hint,
        });
      });
      setPendingMethod(null);
      return;
    }

    submitQuestionUnderParent(parent, pendingMethod.methodId, "", {
      placeholderHint: patternToPlaceholderHint(m.promptPattern),
    });
    setPendingMethod(null);
  };

  const addAnswerNode = () => {
    if (!session || !actionNode || actionNode.type !== "question") return;
    const text = answerDraft.trim();
    if (!text) return;
    persist(fillOrCreateAnswer(session, actionNode.id, text, false));
    setAnswerDraft("");
  };

  const addMergeNode = () => {
    if (!session || selectedIds.size < 2) return;
    const text = mergeDraft.trim() || "综合以上分支，继续推进…";
    appendNodes([
      {
        id: crypto.randomUUID(),
        type: "merge",
        content: text,
        parentIds: [...selectedIds],
        marksProgress: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setMergeDraft("");
  };

  const saveNodeContent = () => {
    if (!session || !actionNode) return;
    persist(
      upsertNode(session, {
        ...actionNode,
        content: editContent.trim() || actionNode.content,
      })
    );
  };

  const setNodeEmphasis = (
    nodeId: string,
    emphasis: ThoughtNodeEmphasis | undefined
  ) => {
    if (!session) return;
    const node = session.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const next = { ...node };
    if (emphasis) next.emphasis = emphasis;
    else delete next.emphasis;
    persist(upsertNode(session, next));
  };

  const createSession = () => {
    if (!newTitle.trim()) return;
    const s = createThoughtSession(newTitle.trim());
    registerFlowEntry("thinking_session", s.id, "thinking");
    refresh();
    openSession(s);
    setNewTitle("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const all = deleteThoughtSession(deleteTarget.id);
    setSessions(all);
    if (activeId === deleteTarget.id) {
      setActiveId(null);
      setSelectedIds(new Set());
    }
    setDeleteTarget(null);
  };

  const pendingDef = pendingMethod
    ? getMethod(pendingMethod.methodId)
    : null;

  const editorView: ThinkingEditorView = session?.editorView ?? "text";

  const setEditorView = (view: ThinkingEditorView) => {
    if (!session) return;
    persist({ ...session, editorView: view });
  };

  const handleToggleTextLayout = (parentId: string) => {
    if (!session) return;
    persist(toggleTextChildLayout(session, parentId));
  };

  const handleMoveChildToIndex = (
    parentId: string,
    nodeId: string,
    toIndex: number
  ) => {
    if (!session) return;
    persist(moveChildToIndex(session, parentId, nodeId, toIndex));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!session) return;
    const next = deleteThoughtNode(session, nodeId);
    persist(next);
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(nodeId);
      return n;
    });
    if (lastFocusedId === nodeId) {
      const rid = getRootId(next);
      setLastFocusedId(rid);
      const root = next.nodes.find((n) => n.id === rid);
      setEditContent(root?.content ?? "");
    }
  };

  const updateNodeContent = (nodeId: string, content: string) => {
    if (!session) return;
    const node = session.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    persist(upsertNode(session, { ...node, content }));
  };

  const submitQuestionUnderParent = (
    parentId: string,
    methodId: ThinkingMethodId,
    draft: string,
    meta?: AddQuestionMeta
  ) => {
    if (!session) return;
    const parentNode = session.nodes.find((n) => n.id === parentId);
    if (!parentNode) return;
    const now = new Date().toISOString();

    const text = draft.trim();

    const questionId = crypto.randomUUID();
    const answerId = crypto.randomUUID();

    const newNodes: ThoughtNode[] = [
      {
        id: questionId,
        type: "question",
        method: methodId,
        content: text,
        placeholderHint: meta?.placeholderHint,
        parentIds: [parentId],
        marksProgress: false,
        createdAt: now,
      },
      {
        id: answerId,
        type: "answer",
        content: "",
        parentIds: [questionId],
        marksProgress: false,
        createdAt: now,
      },
    ];

    let next = session;
    for (const node of newNodes) {
      next = upsertNode(next, node);
    }
    persist(next);
    setSelectedIds(new Set([questionId]));
    setEditContent(text);
    if (!meta?.skipFocus) {
      setQuestionEditFocus({ nodeId: questionId, selectStart: 0, selectEnd: 0 });
    }
  };

  const submitAnswerUnderQuestion = (
    questionId: string,
    text: string,
    progress: boolean
  ) => {
    if (!session) return;
    persist(fillOrCreateAnswer(session, questionId, text, progress));
  };

  const submitSiblingQuestion = (
    refNodeId: string,
    methodId: ThinkingMethodId,
    draft: string,
    meta?: AddQuestionMeta
  ) => {
    if (!session) return;
    const refNode = session.nodes.find((n) => n.id === refNodeId);
    if (!refNode) return;
    const parentId =
      refNode.type === "topic"
        ? refNode.id
        : refNode.parentIds[0];
    if (!parentId) return;
    submitQuestionUnderParent(parentId, methodId, draft, meta);
  };

  const submitMergeUnderText = (nodeIds: string[], content: string) => {
    if (!session || nodeIds.length < 2) return;
    const newNode: ThoughtNode = {
      id: crypto.randomUUID(),
      type: "conclusion",
      content: content.trim() || "综合以上分支，继续推进…",
      parentIds: nodeIds,
      marksProgress: false,
      createdAt: new Date().toISOString(),
    };
    persist(upsertNode(session, newNode));
  };

  if (!activeId || !session) {
    return (
      <div
        className="mx-auto max-w-2xl space-y-4 p-4 lg:p-5"
        onClick={() => setContextMenu(null)}
      >
        <PageHeader
          title="思考"
          description="追问、拆分、利弊、反推等方法展开思路；从左到右形成脉络，可多选合并。"
          actions={
            <Link
              href="/thinking/methods"
              className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
            >
              方法库
            </Link>
          }
        />

        <Card className="bg-white">
          <label className="text-xs font-medium text-slate-600">
            新建思考主题
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder="例如：是否要考研？"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createSession()}
            />
            <Button
              variant="primary"
              onClick={createSession}
              disabled={!newTitle.trim()}
            >
              开始思考
            </Button>
          </div>
        </Card>

        <ul className="space-y-2">
          {sessions.map((s) => {
            const summary = summarizeThoughtSession(s);
            return (
            <li key={s.id}>
              <Card className="bg-white p-0">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left transition-colors hover:bg-[#FAFBFC]"
                  onClick={() => openSession(s)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ session: s, x: e.clientX, y: e.clientY });
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {s.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {summary.stageLabel}
                    </span>
                  </div>

                  {summary.currentQuestion ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      <span className="text-slate-500">待答 · </span>
                      {summary.currentQuestion}
                    </p>
                  ) : summary.conclusion ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      <span className="text-slate-500">结论 · </span>
                      {summary.conclusion}
                    </p>
                  ) : null}

                  <p className="mt-2 text-[10px] text-slate-400">
                    {s.nodes.length} 个节点 · {formatDate(s.updatedAt)}
                  </p>
                </button>
              </Card>
            </li>
          );
          })}
          {sessions.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-400">
              还没有思考记录，先写下你想厘清的问题
            </p>
          )}
        </ul>

        <p className="text-center text-[10px] text-slate-400">
          右键可删除或跳入下一环节
        </p>

        {contextMenu && (
          <FlowListContextMenu
            fromStage="thinking"
            title={contextMenu.session.title}
            entityId={contextMenu.session.id}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            extraItems={[
              {
                type: "action",
                label: "删除思考",
                danger: true,
                onClick: () => setDeleteTarget(contextMenu.session),
              },
            ]}
          />
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          title="确认删除"
          message={
            deleteTarget
              ? `确定删除思考「${deleteTarget.title}」吗？删除后可在设置 → 最近删除中恢复（保留 7 天）。`
              : ""
          }
          confirmLabel="确定删除"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  const isFlowView = editorView === "text" || editorView === "tree";
  const rootNode = session.nodes.find((n) => n.id === rootId) ?? null;

  const handleFlowNodeClick = (nodeId: string) => {
    selectNode(nodeId, false);
  };

  const clearFlowPanel = () => {
    setSelectedIds(new Set());
    setLastFocusedId("");
    setEditContent("");
    setPendingMethod(null);
    setAnswerDraft("");
  };

  const flowPanelProps = {
    actionNode,
    selectedCount: selectedIds.size,
    editContent,
    onEditContent: setEditContent,
    onSaveContent: saveNodeContent,
    pendingMethod,
    pendingDef,
    onStartMethod: startMethod,
    onPendingDraft: (draft: string) =>
      pendingMethod &&
      setPendingMethod({ ...pendingMethod, draft }),
    onCancelPending: () => setPendingMethod(null),
    onAddQuestion: addQuestionNode,
    answerDraft,
    onAnswerDraft: setAnswerDraft,
    onSaveAnswer: addAnswerNode,
    mergeDraft,
    onMergeDraft: setMergeDraft,
    onMerge: addMergeNode,
    onDeleteNode: actionNode
      ? () => handleDeleteNode(actionNode.id)
      : undefined,
    onClose: clearFlowPanel,
  };

  const viewTabClass = (active: boolean) =>
    `rounded-md px-2.5 py-1 transition ${
      active
        ? "bg-[var(--primary)] text-white"
        : "text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div
      className={`flex min-h-[480px] flex-col md:h-[calc(100dvh-2rem)] ${
        isFlowView ? "px-1 py-1.5 md:px-2" : "p-3 lg:p-4"
      }`}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
          ← 列表
        </Button>
        <div className="flex min-w-0 items-center gap-1.5">
          <h1 className="truncate text-lg font-semibold text-slate-900">
            {session.title}
          </h1>
          <ThinkingSeedBadge
            entityId={session.id}
            title={session.title}
            sourceTriageId={triageId}
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() =>
                setEditorView(editorView === "split" ? "text" : editorView)
              }
              className={viewTabClass(isFlowView)}
            >
              脉络
            </button>
            <button
              type="button"
              onClick={() => setEditorView("split")}
              className={viewTabClass(editorView === "split")}
            >
              画布+文字
            </button>
          </div>
          {isFlowView && (
            <div className="flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setEditorView("text")}
                className={viewTabClass(editorView === "text")}
              >
                卡片视角
              </button>
              <button
                type="button"
                onClick={() => setEditorView("tree")}
                className={viewTabClass(editorView === "tree")}
              >
                导图视角
              </button>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => setMethodLibOpen(true)}
          >
            方法库
          </Button>
        </div>
      </div>

      <ThinkingMethodLibraryDialog
        open={methodLibOpen}
        onClose={() => setMethodLibOpen(false)}
      />

      {editorView === "split" ? (
        <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden md:flex-row">
          <ThinkingMapViewport
            nodes={session.nodes}
            rootId={rootId}
            childOrder={session.childOrder}
            selectedIds={selectedIds}
            onSelect={selectNode}
            className="min-h-[36%] shrink-0 md:min-h-0 md:flex-1"
            lastFocusedId={lastFocusedId}
            editorHud={{
              actionNode,
              selectedCount: selectedIds.size,
              pendingMethod,
              pendingDef,
              onStartMethod: startMethod,
              onPendingDraft: (draft) =>
                pendingMethod &&
                setPendingMethod({ ...pendingMethod, draft }),
              onCancelPending: () => setPendingMethod(null),
              onAddQuestion: addQuestionNode,
              answerDraft,
              onAnswerDraft: setAnswerDraft,
              onSaveAnswer: addAnswerNode,
              mergeDraft,
              onMergeDraft: setMergeDraft,
              onMerge: addMergeNode,
            }}
            onSetEmphasis={setNodeEmphasis}
          />

          <div className="flex min-h-0 min-w-0 flex-col justify-center border-[var(--border)] md:w-[30%] md:shrink-0 md:border-l md:pl-2">
            {rootNode && (
              <ThinkingRootEditor
                node={rootNode}
                onSave={updateNodeContent}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-1 flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="min-h-0 flex-1 overflow-auto">
            {editorView === "tree" ? (
              <ThinkingVerticalTree
                session={session}
                rootId={rootId}
                fullscreen={treeFullscreen}
                onToggleFullscreen={() => setTreeFullscreen((v) => !v)}
                onSaveContent={updateNodeContent}
                onAddQuestion={submitQuestionUnderParent}
                onAddSiblingQuestion={submitSiblingQuestion}
                onAddAnswer={submitAnswerUnderQuestion}
                onDeleteNode={handleDeleteNode}
                useEditPanel
                activeNodeId={lastFocusedId || null}
                onNodeClick={handleFlowNodeClick}
                questionEditFocus={questionEditFocus}
                onQuestionEditFocusConsumed={() =>
                  setQuestionEditFocus(null)
                }
              />
            ) : (
              <ThinkingTextFlow
                session={session}
                rootId={rootId}
                onSaveContent={updateNodeContent}
                onAddQuestion={submitQuestionUnderParent}
                onAddSiblingQuestion={submitSiblingQuestion}
                onAddAnswer={submitAnswerUnderQuestion}
                onMergeNodes={submitMergeUnderText}
                onToggleChildLayout={handleToggleTextLayout}
                onMoveChildToIndex={handleMoveChildToIndex}
                onDeleteNode={handleDeleteNode}
                useEditPanel
                activeNodeId={lastFocusedId || null}
                onNodeClick={handleFlowNodeClick}
              />
            )}
          </div>

          <ThinkingNodeEditPanel {...flowPanelProps} />

          {actionNode && (
            <ThinkingNodeEditPanel {...flowPanelProps} mobile />
          )}
        </div>
      )}

      {!(editorView === "tree" && treeFullscreen) && (
        <div className="mt-1.5 shrink-0 px-1">
          <FlowAdvanceBar
            fromStage="thinking"
            toStage="decisions"
            title={session.title}
            entityId={session.id}
            compact
          />
        </div>
      )}
    </div>
  );
}
