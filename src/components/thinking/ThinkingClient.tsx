"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ThinkingMapViewport } from "@/components/thinking/ThinkingMapViewport";
import { ThinkingMethodLibraryDialog } from "@/components/thinking/ThinkingMethodLibraryDialog";
import { ThinkingSeedBadge } from "@/components/thinking/ThinkingSeedBadge";
import { ThinkingVerticalTree } from "@/components/thinking/ThinkingVerticalTree";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import { ThinkingNodeInspector } from "@/components/thinking/ThinkingNodeInspector";
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
import type { ThinkingMethodId } from "@/lib/thinking/methods";
import { resolveChildMountParentId } from "@/lib/thinking/mount-parent";
import type { AddQuestionMeta, QuestionEditFocus } from "@/lib/thinking/prompt-draft";
import {
  createThoughtSession,
  deleteThoughtNode,
  deleteThoughtSession,
  getRootId,
  loadThoughtSessions,
  updateThoughtSession,
  upsertNode,
} from "@/lib/thinking/storage";
import type { ThoughtNodeEmphasis } from "@/lib/thinking/node-appearance";
import {
  getChildNodes,
  moveChildToIndex,
  toggleTextChildLayout,
} from "@/lib/thinking/text-board";
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

    if (m.inputKind === "dual") {
      const anchor = anchorText();
      const now = new Date().toISOString();
      const parent = pendingMethod.fromNodeId;
      appendNodes([
        {
          id: crypto.randomUUID(),
          type: "question",
          method: pendingMethod.methodId,
          content: `利：选择「${anchor}」的好处？`,
          parentIds: [parent],
          marksProgress: false,
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          type: "question",
          method: pendingMethod.methodId,
          content: `弊：选择「${anchor}」的代价？`,
          parentIds: [parent],
          marksProgress: false,
          createdAt: now,
        },
      ]);
      return;
    }

    if (m.inputKind === "multiline") {
      const lines = pendingMethod.draft
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return;
      const now = new Date().toISOString();
      const parent = pendingMethod.fromNodeId;
      appendNodes(
        lines.map((line) => ({
          id: crypto.randomUUID(),
          type: "question" as const,
          method: pendingMethod.methodId,
          content: line,
          parentIds: [parent],
          marksProgress: false,
          createdAt: now,
        }))
      );
      return;
    }

    const text = pendingMethod.draft.trim();
    if (!text) return;
    appendNodes([
      {
        id: crypto.randomUUID(),
        type: "question",
        method: pendingMethod.methodId,
        content: text,
        parentIds: [pendingMethod.fromNodeId],
        marksProgress: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const addAnswerNode = () => {
    if (!session || !actionNode || actionNode.type !== "question") return;
    const text = answerDraft.trim();
    if (!text) return;
    appendNodes([
      {
        id: crypto.randomUUID(),
        type: "answer",
        content: text,
        parentIds: [actionNode.id],
        marksProgress: false,
        createdAt: new Date().toISOString(),
      },
    ]);
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
    if (!text) return;

    const questionId = crypto.randomUUID();
    const answerId = crypto.randomUUID();

    const newNodes: ThoughtNode[] = [
      {
        id: questionId,
        type: "question",
        method: methodId,
        content: text,
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
      const start = meta?.selectStart ?? text.length;
      const end = meta?.selectEnd ?? text.length;
      setQuestionEditFocus({ nodeId: questionId, selectStart: start, selectEnd: end });
    }
  };

  const submitAnswerUnderQuestion = (
    questionId: string,
    text: string,
    progress: boolean
  ) => {
    if (!session) return;
    const existing = getChildNodes(session.nodes, questionId).some(
      (c) => c.type === "answer"
    );
    if (existing) return;
    appendNodes([
      {
        id: crypto.randomUUID(),
        type: "answer",
        content: text.trim(),
        parentIds: [questionId],
        marksProgress: progress,
        createdAt: new Date().toISOString(),
      },
    ]);
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

  const inspector = (
    <ThinkingNodeInspector
      bar
      actionNode={actionNode}
      selectedCount={selectedIds.size}
      editContent={editContent}
      onEditContent={setEditContent}
      onSaveContent={saveNodeContent}
      pendingMethod={pendingMethod}
      pendingDef={pendingDef}
      onStartMethod={startMethod}
      onPendingDraft={(draft) =>
        pendingMethod &&
        setPendingMethod({ ...pendingMethod, draft })
      }
      onCancelPending={() => setPendingMethod(null)}
      onAddQuestion={addQuestionNode}
      answerDraft={answerDraft}
      onAnswerDraft={setAnswerDraft}
      onSaveAnswer={addAnswerNode}
      mergeDraft={mergeDraft}
      onMergeDraft={setMergeDraft}
      onMerge={addMergeNode}
      onSetEmphasis={
        actionNode && selectedIds.size === 1
          ? (emphasis) => setNodeEmphasis(actionNode.id, emphasis)
          : undefined
      }
    />
  );

  if (!activeId || !session) {
    return (
      <div
        className="mx-auto max-w-2xl space-y-5 p-4 lg:p-6"
        onClick={() => setContextMenu(null)}
      >
        <PageHeader
          title="思考"
          description="追问、拆分、利弊、反推等方法展开思路；从左到右形成脉络，可多选合并。"
          subModule={{ label: "方法库", href: "/thinking/methods" }}
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
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-[#FAFBFC]"
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

                  {summary.conclusion && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-500">结论 · </span>
                      {summary.conclusion}
                    </p>
                  )}

                  {summary.currentQuestion && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--primary)]">
                      <span className="font-medium text-[#2563EB]/70">待答 · </span>
                      {summary.currentQuestion}
                    </p>
                  )}

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

  return (
    <div
      className={`flex h-[calc(100dvh-4.5rem)] min-h-[480px] flex-col md:h-[calc(100dvh-2rem)] ${
        editorView === "text" || editorView === "tree"
          ? "px-1 py-2 md:px-2"
          : "p-4 lg:p-6"
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
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => setMethodLibOpen(true)}
          >
            方法库
          </Button>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-[11px]">
            {(
              [
                { id: "flow" as const, label: "脉络" },
                { id: "split" as const, label: "画布+文字" },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() =>
                  setEditorView(
                    v.id === "flow"
                      ? editorView === "text"
                        ? "text"
                        : "tree"
                      : "split"
                  )
                }
                className={`rounded-md px-2.5 py-1 transition ${
                  (v.id === "flow" &&
                    (editorView === "text" || editorView === "tree")) ||
                  editorView === v.id
                    ? "bg-[var(--primary)] text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ThinkingMethodLibraryDialog
        open={methodLibOpen}
        onClose={() => setMethodLibOpen(false)}
      />

      {editorView === "split" ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <ThinkingMapViewport
            nodes={session.nodes}
            rootId={rootId}
            childOrder={session.childOrder}
            selectedIds={selectedIds}
            onSelect={selectNode}
            className="min-h-0 flex-1"
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

          <Card className="shrink-0 bg-white px-3 py-2.5">{inspector}</Card>
        </div>
      ) : editorView === "tree" ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col">
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
            onSwitchToCardView={() => setEditorView("text")}
            questionEditFocus={questionEditFocus}
            onQuestionEditFocusConsumed={() => setQuestionEditFocus(null)}
          />
          {!treeFullscreen && (
            <div className="shrink-0 px-2 py-3">
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
      ) : (
        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
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
              onSwitchToTreeView={() => setEditorView("tree")}
            />
          </div>
          <div className="shrink-0 px-2 py-3">
            <FlowAdvanceBar
              fromStage="thinking"
              toStage="decisions"
              title={session.title}
              entityId={session.id}
              compact
            />
          </div>
        </div>
      )}

      {editorView === "split" && (
        <div className="mt-2 shrink-0">
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
