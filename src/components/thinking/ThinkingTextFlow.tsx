"use client";

import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/app/canvas/ContextMenu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import {
  resolveNodeAppearance,
  type ThoughtNodeEmphasis,
} from "@/lib/thinking/node-appearance";
import { THINK_FONT_FAMILY, type ThinkingMethodId } from "@/lib/thinking/methods";
import {
  ThinkingMethodPickerDialog,
} from "@/components/thinking/ThinkingMethodPicker";
import type { MethodPickerTarget } from "@/components/thinking/ThinkingMethodPicker";
import type { AddQuestionMeta } from "@/lib/thinking/prompt-draft";
import {
  getChildNodes,
  getOrderedChildNodes,
  getTextChildLayout,
} from "@/lib/thinking/text-board";
import type { ThoughtNode, ThoughtSession } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

/** 卡片视角内容最大宽度（比导图更宽，充分利用横向空间） */
const CARD_TOPIC_MAX_CLASS = "max-w-[min(100%,56rem)]";

type Props = {
  session: ThoughtSession;
  rootId: string;
  onSaveContent: (nodeId: string, content: string) => void;
  onAddQuestion: (
    parentId: string,
    methodId: ThinkingMethodId,
    draft: string,
    meta?: AddQuestionMeta
  ) => void;
  onAddSiblingQuestion: (
    refNodeId: string,
    methodId: ThinkingMethodId,
    draft: string,
    meta?: AddQuestionMeta
  ) => void;
  onAddAnswer: (
    questionId: string,
    text: string,
    markProgress: boolean
  ) => void;
  onMergeNodes: (nodeIds: string[], content: string) => void;
  onToggleChildLayout: (parentId: string) => void;
  onMoveChildToIndex: (
    parentId: string,
    nodeId: string,
    toIndex: number
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onSwitchToTreeView?: () => void;
};

type PickerTarget = MethodPickerTarget;

type FlowContext = {
  session: ThoughtSession;
  rootId: string;
  viewRootId: string;
  onSaveContent: Props["onSaveContent"];
  onAddAnswer: Props["onAddAnswer"];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, additive: boolean) => void;
  onContextMenuNode: (e: React.MouseEvent, nodeId: string) => void;
  onOpenChildPicker: (nodeId: string) => void;
  relativeDepth: (nodeId: string) => number;
  placedConclusionIds: Set<string>;
  markConclusionPlaced: (id: string) => void;
  onToggleChildLayout: (parentId: string) => void;
  onMoveChildToIndex: (
    parentId: string,
    nodeId: string,
    toIndex: number
  ) => void;
  onDeleteNode: (nodeId: string) => void;
};

function emphasisTextClass(emphasis?: ThoughtNodeEmphasis): string {
  switch (emphasis) {
    case "text-red":
      return "text-red-600";
    case "text-blue":
      return "text-blue-600";
    case "text-amber":
      return "text-amber-600";
    default:
      return "";
  }
}

function branchChildren(
  session: ThoughtSession,
  parentId: string
): ThoughtNode[] {
  return getOrderedChildNodes(session, session.nodes, parentId).filter(
    (c) =>
      c.type !== "answer" &&
      c.type !== "conclusion" &&
      c.type !== "merge"
  );
}

function shallowestSourceId(
  nodes: ThoughtNode[],
  parentIds: string[],
  sessionRootId: string
): string {
  let best = parentIds[0];
  let bestDepth = Infinity;
  for (const id of parentIds) {
    const depth = nodePathToRoot(nodes, id, sessionRootId).length;
    if (depth < bestDepth) {
      bestDepth = depth;
      best = id;
    }
  }
  return best;
}

function topSiblingInRow(
  session: ThoughtSession,
  rowParentId: string,
  nodeId: string
): string | null {
  const siblings = branchChildren(session, rowParentId);
  const siblingIds = new Set(siblings.map((s) => s.id));
  const byId = new Map(session.nodes.map((n) => [n.id, n]));
  let cur = byId.get(nodeId);
  const visited = new Set<string>();
  while (cur && !visited.has(cur.id)) {
    visited.add(cur.id);
    if (siblingIds.has(cur.id)) return cur.id;
    const pid = cur.parentIds.find((p) => byId.has(p));
    cur = pid ? byId.get(pid) : undefined;
  }
  return null;
}

function conclusionSourceIndices(
  session: ThoughtSession,
  rowParentId: string,
  conclusion: ThoughtNode,
  siblings: ThoughtNode[]
): number[] {
  return [
    ...new Set(
      conclusion.parentIds
        .map((id) => topSiblingInRow(session, rowParentId, id))
        .filter((id): id is string => Boolean(id))
        .map((id) => siblings.findIndex((s) => s.id === id))
        .filter((i) => i >= 0)
    ),
  ].sort((a, b) => a - b);
}

function conclusionColumnSpan(
  session: ThoughtSession,
  rowParentId: string,
  conclusion: ThoughtNode,
  siblings: ThoughtNode[]
): { start: number; span: number; sourceIndices: number[] } | null {
  const sourceIndices = conclusionSourceIndices(
    session,
    rowParentId,
    conclusion,
    siblings
  );
  if (sourceIndices.length < 2) return null;
  const start = sourceIndices[0];
  const span = sourceIndices[sourceIndices.length - 1] - start + 1;
  return { start, span, sourceIndices };
}

function findDisplayRowForConclusion(
  session: ThoughtSession,
  conclusion: ThoughtNode
): { rowParentId: string; siblings: ThoughtNode[] } | null {
  const rowParentIds = new Set<string>();
  for (const srcId of conclusion.parentIds) {
    let cur: string | undefined = srcId;
    const visited = new Set<string>();
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      const node = session.nodes.find((n) => n.id === cur);
      if (!node?.parentIds[0]) break;
      rowParentIds.add(node.parentIds[0]);
      cur = node.parentIds[0];
    }
  }
  for (const rowParentId of rowParentIds) {
    const siblings = branchChildren(session, rowParentId);
    if (
      conclusionColumnSpan(session, rowParentId, conclusion, siblings) !== null
    ) {
      return { rowParentId, siblings };
    }
  }
  return null;
}

function conclusionsForRow(
  session: ThoughtSession,
  rowParentId: string,
  siblings: ThoughtNode[]
): ThoughtNode[] {
  return session.nodes.filter(
    (n) =>
      (n.type === "conclusion" || n.type === "merge") &&
      n.parentIds.length >= 2 &&
      conclusionColumnSpan(session, rowParentId, n, siblings) !== null
  );
}

function crossLevelMergesForAnchor(
  session: ThoughtSession,
  anchorNodeId: string,
  rootId: string
): ThoughtNode[] {
  return session.nodes.filter(
    (n) =>
      (n.type === "conclusion" || n.type === "merge") &&
      n.parentIds.length >= 2 &&
      findDisplayRowForConclusion(session, n) === null &&
      shallowestSourceId(session.nodes, n.parentIds, rootId) === anchorNodeId
  );
}

function siblingRowParentId(
  session: ThoughtSession,
  node: ThoughtNode
): string | null {
  if (node.type === "topic") return node.id;
  if (
    (node.type === "conclusion" || node.type === "merge") &&
    node.parentIds.length > 1
  ) {
    return null;
  }
  const pid = node.parentIds[0];
  if (!pid) return null;
  if (branchChildren(session, pid).length >= 2) return pid;
  return null;
}

function singleAnswer(
  nodes: ThoughtNode[],
  questionId: string
): ThoughtNode | undefined {
  return getChildNodes(nodes, questionId).find((c) => c.type === "answer");
}

function nodePathToRoot(
  nodes: ThoughtNode[],
  nodeId: string,
  rootId: string
): ThoughtNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: ThoughtNode[] = [];
  const visiting = new Set<string>();
  let cur = byId.get(nodeId);
  while (cur && !visiting.has(cur.id)) {
    visiting.add(cur.id);
    path.unshift(cur);
    if (cur.id === rootId) break;
    const parent = cur.parentIds.find((p) => byId.has(p));
    cur = parent ? byId.get(parent) : undefined;
  }
  return path;
}

function nodeLabel(node: ThoughtNode): string {
  const t = node.content.trim();
  if (!t) return node.type === "topic" ? "主题" : "（空）";
  return t.length > 28 ? `${t.slice(0, 28)}…` : t;
}

function resolveMergeSelection(
  session: ThoughtSession,
  selectedIds: Set<string>
): { ok: true; ids: string[] } | { ok: false; reason: string } {
  const questions = [...selectedIds]
    .map((id) => session.nodes.find((n) => n.id === id))
    .filter((n): n is ThoughtNode => n?.type === "question");

  if (questions.length < 2) {
    return { ok: false, reason: "请 Ctrl+点击选中至少 2 个问题节点" };
  }

  return { ok: true, ids: questions.map((q) => q.id) };
}

function relativeDepthFromView(
  nodes: ThoughtNode[],
  nodeId: string,
  viewRootId: string,
  sessionRootId: string
): number {
  const path = nodePathToRoot(nodes, nodeId, sessionRootId);
  const idx = path.findIndex((n) => n.id === viewRootId);
  if (idx < 0) return Math.max(0, path.length - 1);
  return Math.max(0, path.length - 1 - idx);
}

function truncatePreview(text: string, max = 48): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "（空）";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function depthTextClass(relativeDepth: number, isTopic: boolean): string {
  if (isTopic) {
    return "px-4 py-2.5 text-center text-lg font-semibold leading-snug";
  }
  if (relativeDepth <= 0) {
    return "px-3 py-1.5 text-[15px] font-semibold leading-snug";
  }
  if (relativeDepth === 1) return "px-3 py-1.5 text-[14px] leading-snug";
  if (relativeDepth === 2) return "px-3 py-1 text-[13px] leading-snug";
  return "px-2.5 py-1 text-[12px] leading-snug";
}

/** 子节点挂载父级：回答后挂在回答下，否则挂在当前节点下 */
function childParent(
  node: ThoughtNode,
  nodes: ThoughtNode[]
): { parentId: string; parentNode: ThoughtNode } {
  if (node.type === "answer" || node.type === "topic") {
    return { parentId: node.id, parentNode: node };
  }
  if (node.type === "question") {
    const ans = singleAnswer(nodes, node.id);
    if (ans) return { parentId: ans.id, parentNode: ans };
    return { parentId: node.id, parentNode: node };
  }
  return { parentId: node.id, parentNode: node };
}

function canAddSibling(node: ThoughtNode): boolean {
  return node.type !== "answer" && node.type !== "topic";
}

function isSelectable(node: ThoughtNode): boolean {
  return node.type === "question";
}

function AutoTextarea({
  value,
  onChange,
  onBlur,
  className,
  style,
  placeholder,
  topic,
  relativeDepth = 1,
  minRows = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  topic?: boolean;
  relativeDepth?: number;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const linePx = topic ? 28 : relativeDepth <= 1 ? 26 : 24;
  const minHeightPx = minRows * linePx;
  const maxBlurHeightPx = minRows >= 2 ? minRows * linePx : undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const natural = el.scrollHeight;
    if (!focused && maxBlurHeightPx) {
      el.style.height = `${Math.min(natural, maxBlurHeightPx)}px`;
    } else {
      el.style.height = `${Math.max(natural, minHeightPx)}px`;
    }
  }, [value, topic, relativeDepth, focused, minRows, minHeightPx, maxBlurHeightPx]);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      className={cn(
        "w-full resize-none border-0 bg-transparent text-[#1E293B] outline-none shadow-none focus:border-transparent focus:ring-0",
        !focused && maxBlurHeightPx ? "overflow-hidden" : "overflow-y-hidden",
        !topic && "whitespace-pre-wrap",
        depthTextClass(relativeDepth, !!topic),
        className
      )}
      style={{ ...style, minHeight: minHeightPx }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      placeholder={placeholder}
    />
  );
}

function EditableBox({
  node,
  session,
  onSaveContent,
  onContextMenu,
  topic,
  relativeDepth,
  selected,
  onToggleSelect,
  selectable,
}: {
  node: ThoughtNode;
  session: ThoughtSession;
  onSaveContent: (nodeId: string, content: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  topic?: boolean;
  relativeDepth?: number;
  selected?: boolean;
  onToggleSelect?: (additive: boolean) => void;
  selectable?: boolean;
}) {
  const { getMethod } = useThinkingMethods();
  const appearance = resolveNodeAppearance(node, getMethod);
  const [draft, setDraft] = useState(node.content);

  useEffect(() => {
    setDraft(node.content);
  }, [node.content, node.id]);

  const commit = () => {
    const text = draft.trim();
    if (text !== node.content) onSaveContent(node.id, text || node.content);
  };

  const isTopic = topic || node.type === "topic";
  const depth =
    relativeDepth ??
    (isTopic ? 0 : node.type === "answer" ? 2 : 1);

  const minRows = isTopic
    ? 1
    : node.type === "question" || node.type === "answer"
      ? depth <= 1
        ? 2
        : 1
      : 1;

  const twoLineBox = minRows >= 2;

  const boxFill =
    isTopic
      ? "#FFFFFF"
      : node.type === "answer"
        ? "#F8FCFA"
        : appearance.methodRail
          ? appearance.fill
          : "#FAFBFC";

  return (
    <div
      className={cn(
        "group/box relative w-full min-w-0 rounded-2xl border",
        twoLineBox ? "min-h-[3.5rem]" : isTopic ? "min-h-[2.75rem]" : "min-h-[2.25rem]",
        isTopic ? cn("mx-auto w-full border-slate-300", CARD_TOPIC_MAX_CLASS) : "border-slate-200/80",
        selected && "ring-2 ring-[#3B82F6]"
      )}
      style={{
        background: boxFill,
        borderColor: isTopic ? undefined : appearance.stroke,
        fontFamily: THINK_FONT_FAMILY,
      }}
      onContextMenu={onContextMenu}
      onClick={(e) => {
        if (selectable && onToggleSelect && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onToggleSelect(true);
        }
      }}
    >
      {selectable && onToggleSelect && (
        <button
          type="button"
          title="Ctrl+点击多选"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(e.ctrlKey || e.metaKey);
          }}
          className={cn(
            "absolute top-2 left-2 z-10 flex h-4 w-4 items-center justify-center rounded border text-[9px] opacity-0 transition group-hover/box:opacity-100",
            selected
              ? "border-[#3B82F6] bg-[#3B82F6] text-white opacity-100"
              : "border-slate-300 bg-white text-slate-400 hover:border-[#3B82F6]"
          )}
        >
          {selected ? "✓" : ""}
        </button>
      )}
      {appearance.methodRail && (
        <p
          className="px-2 py-0.5 text-center text-[9px] font-medium leading-tight"
          style={{
            background: appearance.methodRail.railBg,
            color: appearance.methodRail.color,
          }}
        >
          {appearance.methodRail.label}
        </p>
      )}
      {(node.type === "conclusion" || node.type === "merge") && (
        <div className="bg-slate-50 px-2 py-0.5 text-center text-[10px] font-medium text-slate-500">
          {node.type === "conclusion" ? "结论" : "合并"}
        </div>
      )}
      <AutoTextarea
        topic={isTopic}
        relativeDepth={depth}
        minRows={minRows}
        className={cn("text-center", emphasisTextClass(node.emphasis))}
        style={{
          color: appearance.text,
          fontWeight: isTopic ? 700 : appearance.fontWeight,
        }}
        value={draft}
        onChange={setDraft}
        onBlur={commit}
        placeholder={
          isTopic
            ? "思考主题…"
            : node.type === "question" || node.type === "conclusion"
              ? "问题…"
              : "写下回答…"
        }
      />
    </div>
  );
}

function DownStemConnector({ height = 12 }: { height?: number }) {
  return (
    <div className="flex justify-center" aria-hidden>
      <div className="w-px bg-slate-300" style={{ height }} />
    </div>
  );
}

/** 悬停时在节点右侧显示 +，用于添加子分支 */
function NodeWithSideAdd({
  children,
  onAdd,
  showAdd = true,
}: {
  children: React.ReactNode;
  onAdd: () => void;
  showAdd?: boolean;
}) {
  return (
    <div className="group/add relative w-full min-w-0 overflow-visible">
      {children}
      {showAdd && (
        <button
          type="button"
          title="添加子节点"
          onClick={onAdd}
          className="pointer-events-none absolute top-1/2 left-full z-10 ml-1.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-sm leading-none text-slate-600 opacity-0 transition hover:bg-slate-300 group-hover/add:pointer-events-auto group-hover/add:opacity-100"
        >
          +
        </button>
      )}
    </div>
  );
}

/** 有子分支则展开 */
function BranchTail({
  mountNode,
  ctx,
  onOpenPicker,
}: {
  mountNode: ThoughtNode;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  const kids = branchChildren(ctx.session, mountNode.id);
  if (kids.length === 0) return null;
  return (
    <ChildStack
      parentId={mountNode.id}
      parentNode={mountNode}
      ctx={ctx}
      onOpenPicker={onOpenPicker}
    />
  );
}

function AddAnswerPanel({
  questionId,
  onAddAnswer,
}: {
  questionId: string;
  onAddAnswer: Props["onAddAnswer"];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-0.5 w-full rounded-md border border-dashed border-emerald-200 py-1 text-[11px] text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-50"
      >
        + 写下回答
      </button>
    );
  }

  return (
    <div className="mt-0.5 w-full rounded-lg border border-[#A7F3D0] bg-[#F0FDF4] p-2">
      <p className="text-xs font-medium text-emerald-800">回答（每题仅一条）</p>
      <Textarea
        className="mt-1 text-sm"
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        placeholder="你的回答…"
      />
      <div className="mt-1.5 flex gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={!draft.trim()}
          onClick={() => {
            onAddAnswer(questionId, draft, false);
            setOpen(false);
            setDraft("");
          }}
        >
          保存
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          取消
        </Button>
      </div>
    </div>
  );
}

function ConclusionConnectors({
  sourceIndices,
  total,
}: {
  sourceIndices: number[];
  total: number;
}) {
  const centers = sourceIndices.map((i) => ((i + 0.5) / total) * 100);
  const mid =
    ((Math.min(...sourceIndices) + Math.max(...sourceIndices) + 1) / 2 / total) *
    100;

  return (
    <svg
      className="pointer-events-none mb-0.5 h-5 w-full text-slate-300"
      preserveAspectRatio="none"
    >
      {centers.map((x, i) => (
        <line
          key={i}
          x1={`${x}%`}
          y1="0"
          x2={`${mid}%`}
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

function CrossLevelBrace({ count }: { count: number }) {
  if (count < 2) {
    return <div className="mx-auto h-4 w-px bg-slate-400" />;
  }
  return (
    <div className="relative mx-auto w-full max-w-4xl px-2 sm:px-4">
      <div className="flex justify-between">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div className="h-3 w-px bg-slate-400" />
          </div>
        ))}
      </div>
      <svg
        className="mx-auto mt-0 block h-5 w-20 text-slate-400"
        viewBox="0 0 80 20"
        aria-hidden
      >
        <path
          d="M 4 0 L 4 10 Q 4 18 40 18 Q 76 18 76 10 L 76 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

function InlineCrossMerge({
  conclusion,
  ctx,
  onOpenPicker,
}: {
  conclusion: ThoughtNode;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  ctx.markConclusionPlaced(conclusion.id);

  const sources = conclusion.parentIds
    .map((id) => ctx.session.nodes.find((n) => n.id === id))
    .filter((n): n is ThoughtNode => n?.type === "question");

  if (sources.length < 2) return null;

  return (
    <div className="group/node mt-2 w-full">
      <div className="flex flex-wrap justify-center gap-1">
        {sources.map((s) => (
          <span
            key={s.id}
            title={s.content.trim() || "（空）"}
            className="max-w-full truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
          >
            {truncatePreview(s.content, 28)}
          </span>
        ))}
      </div>
      <CrossLevelBrace count={sources.length} />
      <EditableBox
        node={conclusion}
        session={ctx.session}
        onSaveContent={ctx.onSaveContent}
        relativeDepth={ctx.relativeDepth(conclusion.id)}
        onContextMenu={(e) => ctx.onContextMenuNode(e, conclusion.id)}
      />
      <BranchTail
        mountNode={conclusion}
        ctx={ctx}
        onOpenPicker={onOpenPicker}
      />
    </div>
  );
}

function VerticalConclusionBand({
  conclusion,
  siblings,
  ctx,
  onOpenPicker,
}: {
  conclusion: ThoughtNode;
  siblings: ThoughtNode[];
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  ctx.markConclusionPlaced(conclusion.id);

  const rowParentId = siblings[0]?.parentIds[0] ?? "";
  const sourceIndices = conclusionSourceIndices(
    ctx.session,
    rowParentId,
    conclusion,
    siblings
  );
  const sources = sourceIndices
    .map((i) => siblings[i])
    .filter((n): n is ThoughtNode => Boolean(n));

  if (sources.length < 2) return null;

  return (
    <div className="group/node mt-2 w-full border-t border-dashed border-slate-200 pt-2">
      <p className="mb-1 text-[10px] text-slate-400">汇合自</p>
      <div className="flex flex-wrap gap-1">
        {sources.map((s) => (
          <span
            key={s.id}
            className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
          >
            {truncatePreview(s.content, 24)}
          </span>
        ))}
      </div>
      <CrossLevelBrace count={sources.length} />
      <EditableBox
        node={conclusion}
        session={ctx.session}
        onSaveContent={ctx.onSaveContent}
        relativeDepth={ctx.relativeDepth(conclusion.id)}
        onContextMenu={(e) => ctx.onContextMenuNode(e, conclusion.id)}
      />
      <BranchTail
        mountNode={conclusion}
        ctx={ctx}
        onOpenPicker={onOpenPicker}
      />
    </div>
  );
}

function SiblingColumn({
  node,
  index,
  siblingCount,
  horizontal,
  draggingId,
  dropIndex,
  onDragStart,
  ctx,
  onOpenPicker,
}: {
  node: ThoughtNode;
  index: number;
  siblingCount: number;
  horizontal: boolean;
  draggingId: string | null;
  dropIndex: number | null;
  onDragStart: (nodeId: string) => void;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 basis-0 flex-col transition-shadow",
        siblingCount >= 2 && "touch-none select-none",
        draggingId === node.id && "opacity-45",
        dropIndex === index &&
          draggingId &&
          draggingId !== node.id &&
          "rounded ring-2 ring-[#3B82F6] ring-offset-1"
      )}
      onPointerDown={(e) => {
        if (siblingCount < 2 || e.button !== 0) return;
        clearPress();
        pressTimer.current = setTimeout(() => {
          onDragStart(node.id);
        }, 420);
      }}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
    >
      <QuestionColumn node={node} ctx={ctx} onOpenPicker={onOpenPicker} />
    </div>
  );
}

function ConclusionBand({
  conclusion,
  siblings,
  rowParentId,
  ctx,
  onOpenPicker,
}: {
  conclusion: ThoughtNode;
  siblings: ThoughtNode[];
  rowParentId: string;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  ctx.markConclusionPlaced(conclusion.id);

  const spanInfo = conclusionColumnSpan(
    ctx.session,
    rowParentId,
    conclusion,
    siblings
  );
  if (!spanInfo) return null;

  const { start, span, sourceIndices } = spanInfo;
  const total = siblings.length;
  const before = start;
  const after = total - start - span;

  return (
    <div className="mt-2 flex w-full flex-row flex-nowrap">
      {before > 0 && (
        <div className="shrink-0" style={{ flex: before }} aria-hidden />
      )}
      <div
        className="group/node min-w-0 shrink-0"
        style={{ flex: span }}
      >
        <ConclusionConnectors
          sourceIndices={sourceIndices}
          total={total}
        />
        <EditableBox
          node={conclusion}
          session={ctx.session}
          onSaveContent={ctx.onSaveContent}
          relativeDepth={ctx.relativeDepth(conclusion.id)}
          onContextMenu={(e) => ctx.onContextMenuNode(e, conclusion.id)}
        />
        <BranchTail
          mountNode={conclusion}
          ctx={ctx}
          onOpenPicker={onOpenPicker}
        />
      </div>
      {after > 0 && (
        <div className="shrink-0" style={{ flex: after }} aria-hidden />
      )}
    </div>
  );
}

/**
 * 同级子节点可左右并列或上下排列；嵌套子层在母列内部再均分。
 */
function ChildStack({
  parentId,
  parentNode,
  ctx,
  onOpenPicker,
}: {
  parentId: string;
  parentNode: ThoughtNode;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  const siblings = branchChildren(ctx.session, parentId);
  const conclusions = conclusionsForRow(ctx.session, parentId, siblings);
  const count = siblings.length;
  const layout = getTextChildLayout(ctx.session, parentId, count);
  const horizontal = layout === "split";
  const rowRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dropIndexRef = useRef<number | null>(null);
  dropIndexRef.current = dropIndex;

  const resolveDropIndex = (clientX: number, clientY: number): number => {
    const row = rowRef.current;
    if (!row) return 0;
    const cols = [...row.children] as HTMLElement[];
    for (let i = 0; i < cols.length; i++) {
      const rect = cols[i].getBoundingClientRect();
      if (horizontal) {
        if (clientX < rect.left + rect.width / 2) return i;
      } else if (clientY < rect.top + rect.height / 2) {
        return i;
      }
    }
    return Math.max(0, cols.length - 1);
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      setDropIndex(resolveDropIndex(e.clientX, e.clientY));
    };
    const onUp = () => {
      const target = dropIndexRef.current;
      const dragId = draggingId;
      if (target !== null && dragId) {
        const fromIdx = siblings.findIndex((s) => s.id === dragId);
        if (fromIdx >= 0 && target !== fromIdx) {
          ctx.onMoveChildToIndex(parentId, dragId, target);
        }
      }
      setDraggingId(null);
      setDropIndex(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [draggingId, parentId, siblings, ctx]);

  if (count === 0) return null;

  return (
    <div className="mt-1 w-full">
      {draggingId && count >= 2 && (
        <p className="mb-1 text-[10px] text-[#3B82F6]">
          长按后拖动到目标位置，松手完成排序
        </p>
      )}
      <DownStemConnector />
      <div
        ref={rowRef}
        className={cn(
          "relative w-full",
          horizontal
            ? "flex flex-row flex-nowrap items-start gap-[5%]"
            : "flex flex-col gap-2.5"
        )}
      >
        {horizontal && count > 1 && (
          <div className="pointer-events-none absolute top-0 right-[5%] left-[5%] h-px bg-slate-300" />
        )}
        {siblings.map((node, index) => (
          <div
            key={node.id}
            className={cn(
              horizontal
                ? "flex min-w-0 flex-1 basis-0 flex-col"
                : "w-full"
            )}
          >
            {horizontal && count > 1 && (
              <div className="mx-auto mb-0.5 h-3 w-px shrink-0 bg-slate-300" />
            )}
            <SiblingColumn
              node={node}
              index={index}
              siblingCount={count}
              horizontal={horizontal}
              draggingId={draggingId}
              dropIndex={dropIndex}
              onDragStart={setDraggingId}
              ctx={ctx}
              onOpenPicker={onOpenPicker}
            />
          </div>
        ))}
      </div>

      {conclusions.map((c) =>
        horizontal ? (
          <ConclusionBand
            key={c.id}
            conclusion={c}
            siblings={siblings}
            rowParentId={parentId}
            ctx={ctx}
            onOpenPicker={onOpenPicker}
          />
        ) : (
          <VerticalConclusionBand
            key={c.id}
            conclusion={c}
            siblings={siblings}
            ctx={ctx}
            onOpenPicker={onOpenPicker}
          />
        )
      )}
    </div>
  );
}

function QuestionColumn({
  node,
  ctx,
  onOpenPicker,
}: {
  node: ThoughtNode;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
}) {
  const answer = singleAnswer(ctx.session.nodes, node.id);
  const crossMerges = crossLevelMergesForAnchor(
    ctx.session,
    node.id,
    ctx.rootId
  ).filter((c) => !ctx.placedConclusionIds.has(c.id));

  return (
    <div className="flex w-full min-w-0 flex-col">
      <NodeWithSideAdd
        onAdd={() => onOpenPicker(node.id)}
        showAdd={!answer}
      >
        <EditableBox
          node={node}
          session={ctx.session}
          onSaveContent={ctx.onSaveContent}
          relativeDepth={ctx.relativeDepth(node.id)}
          selectable={isSelectable(node)}
          selected={ctx.selectedIds.has(node.id)}
          onToggleSelect={(additive) => ctx.onToggleSelect(node.id, additive)}
          onContextMenu={(e) => ctx.onContextMenuNode(e, node.id)}
        />
      </NodeWithSideAdd>
      {answer ? (
        <div className="mt-1 w-full">
          <NodeWithSideAdd onAdd={() => onOpenPicker(answer.id)}>
            <EditableBox
              node={answer}
              session={ctx.session}
              onSaveContent={ctx.onSaveContent}
              relativeDepth={ctx.relativeDepth(answer.id)}
              onContextMenu={(e) => ctx.onContextMenuNode(e, answer.id)}
            />
          </NodeWithSideAdd>
          <BranchTail
            mountNode={answer}
            ctx={ctx}
            onOpenPicker={onOpenPicker}
          />
        </div>
      ) : (
        node.type === "question" && (
          <>
            <AddAnswerPanel
              questionId={node.id}
              onAddAnswer={ctx.onAddAnswer}
            />
            <BranchTail
              mountNode={node}
              ctx={ctx}
              onOpenPicker={onOpenPicker}
            />
          </>
        )
      )}

      {crossMerges.map((c) => (
        <InlineCrossMerge
          key={c.id}
          conclusion={c}
          ctx={ctx}
          onOpenPicker={onOpenPicker}
        />
      ))}
    </div>
  );
}

function BreadcrumbBar({
  path,
  onNavigate,
  onExitFocus,
}: {
  path: ThoughtNode[];
  onNavigate: (nodeId: string) => void;
  onExitFocus: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <button
        type="button"
        className="rounded px-1.5 py-0.5 hover:bg-slate-100 hover:text-[#3B82F6]"
        onClick={onExitFocus}
      >
        全文脉络
      </button>
      {path.map((n, i) => (
        <span key={n.id} className="flex items-center gap-1">
          <span className="text-slate-300">/</span>
          <button
            type="button"
            className={cn(
              "max-w-[12rem] truncate rounded px-1.5 py-0.5 hover:bg-slate-100 hover:text-[#3B82F6]",
              i === path.length - 1 && "font-medium text-slate-700"
            )}
            onClick={() => onNavigate(n.id)}
          >
            {nodeLabel(n)}
          </button>
        </span>
      ))}
    </div>
  );
}

function FocusSingleView({
  nodeId,
  ctx,
  onOpenPicker,
  onFocusChange,
  onExitFocus,
}: {
  nodeId: string;
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
  onFocusChange: (ids: string[]) => void;
  onExitFocus: () => void;
}) {
  const node = ctx.session.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const path = nodePathToRoot(ctx.session.nodes, nodeId, ctx.rootId);

  return (
    <div className="w-full">
      <BreadcrumbBar
        path={path}
        onNavigate={(id) => onFocusChange([id])}
        onExitFocus={onExitFocus}
      />
      {node.type === "answer" ? (
        <>
          <div className="group/node w-full">
            <EditableBox
              node={node}
              session={ctx.session}
              onSaveContent={ctx.onSaveContent}
              relativeDepth={ctx.relativeDepth(node.id)}
              onContextMenu={(e) => ctx.onContextMenuNode(e, node.id)}
            />
            <BranchTail
              mountNode={node}
              ctx={ctx}
              onOpenPicker={onOpenPicker}
            />
          </div>
        </>
      ) : node.type === "topic" ? (
        <>
          <div className="group/node w-full">
            <EditableBox
              node={node}
              session={ctx.session}
              onSaveContent={ctx.onSaveContent}
              onContextMenu={(e) => ctx.onContextMenuNode(e, node.id)}
              topic
              relativeDepth={0}
            />
            <BranchTail
              mountNode={node}
              ctx={ctx}
              onOpenPicker={onOpenPicker}
            />
          </div>
        </>
      ) : (
        <QuestionColumn
          node={node}
          ctx={ctx}
          onOpenPicker={onOpenPicker}
        />
      )}
    </div>
  );
}

function columnFlowContext(base: FlowContext, columnRootId: string): FlowContext {
  return {
    ...base,
    viewRootId: columnRootId,
    relativeDepth: (nodeId) =>
      relativeDepthFromView(
        base.session.nodes,
        nodeId,
        columnRootId,
        base.rootId
      ),
  };
}

function FocusMultiView({
  nodeIds,
  ctx,
  onOpenPicker,
  onExitFocus,
}: {
  nodeIds: string[];
  ctx: FlowContext;
  onOpenPicker: (nodeId: string) => void;
  onExitFocus: () => void;
}) {
  const nodes = nodeIds
    .map((id) => ctx.session.nodes.find((n) => n.id === id))
    .filter((n): n is ThoughtNode => Boolean(n));

  return (
    <div className="w-full">
      <BreadcrumbBar path={[]} onNavigate={() => {}} onExitFocus={onExitFocus} />
      <p className="mb-2 text-xs text-slate-500">
        同时进入 {nodes.length} 个节点
      </p>
      <div className="flex w-full flex-row flex-nowrap items-start gap-1.5">
        {nodes.map((node) => {
          const colCtx = columnFlowContext(ctx, node.id);
          return (
            <div key={node.id} className="min-w-0 flex-1 basis-0">
              <QuestionColumn
                node={node}
                ctx={colCtx}
                onOpenPicker={onOpenPicker}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildContextMenuItems(opts: {
  node: ThoughtNode;
  nodeId: string;
  session: ThoughtSession;
  selectedIds: Set<string>;
  focusIds: string[] | null;
  onFocus: (ids: string[]) => void;
  onExitFocus: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onToggleLayout: (parentId: string) => void;
  onMerge: () => void;
  onDelete: () => void;
}): ContextMenuItem[] {
  const {
    node,
    session,
    selectedIds,
    focusIds,
    onFocus,
    onExitFocus,
    onAddChild,
    onAddSibling,
    onToggleLayout,
    onMerge,
    onDelete,
  } = opts;
  const items: ContextMenuItem[] = [];
  const isTopic = node.type === "topic";

  const nav: ContextMenuItem[] = [];
  if (!isTopic) {
    nav.push({ type: "action", label: "进入此节点", onClick: () => onFocus([node.id]) });
  }
  if (focusIds) {
    nav.push({ type: "action", label: "返回全文脉络", onClick: onExitFocus });
  }
  if (selectedIds.size >= 2) {
    nav.push({
      type: "action",
      label: `进入所选（${selectedIds.size}）`,
      onClick: () => onFocus([...selectedIds]),
    });
  }
  if (nav.length) items.push(...nav);

  const edit: ContextMenuItem[] = [
    { type: "action", label: "添加子节点", onClick: onAddChild },
  ];
  if (canAddSibling(node)) {
    edit.push({ type: "action", label: "添加同级节点", onClick: onAddSibling });
  }
  const layoutParent = siblingRowParentId(session, node);
  if (layoutParent) {
    const count = branchChildren(session, layoutParent).length;
    const layout = getTextChildLayout(session, layoutParent, count);
    edit.push({
      type: "action",
      label:
        layout === "split" ? "子节点改为上下排列" : "子节点改为左右并列",
      onClick: () => onToggleLayout(layoutParent),
    });
  }
  if (edit.length) {
    if (items.length) items.push({ type: "separator" });
    items.push(...edit);
  }

  if (selectedIds.size >= 2) {
    items.push({ type: "separator" });
    items.push({
      type: "action",
      label: "合并生成结论",
      onClick: onMerge,
    });
  }

  if (!isTopic) {
    items.push({ type: "separator" });
    items.push({
      type: "action",
      label: "删除此节点",
      danger: true,
      onClick: onDelete,
    });
  }

  return items;
}

export function ThinkingTextFlow({
  session,
  rootId,
  onSaveContent,
  onAddQuestion,
  onAddSiblingQuestion,
  onAddAnswer,
  onMergeNodes,
  onToggleChildLayout,
  onMoveChildToIndex,
  onDeleteNode,
  onSwitchToTreeView,
}: Props) {
  const root = session.nodes.find((n) => n.id === rootId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [focusIds, setFocusIds] = useState<string[] | null>(null);
  const [mergeDraft, setMergeDraft] = useState("");
  const [mergeHint, setMergeHint] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  if (!root) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">暂无思考内容</p>
    );
  }

  const toggleSelect = (id: string, additive: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (additive) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const openChildPicker = (nodeId: string) => {
    const node = session.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const { parentId, parentNode } = childParent(node, session.nodes);
    setPickerTarget({
      mode: "child",
      refNodeId: nodeId,
      parentId,
      parentNode,
    });
  };

  const openSiblingPicker = (nodeId: string) => {
    const node = session.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const siblingParentId =
      node.type === "topic" ? node.id : node.parentIds[0];
    if (!siblingParentId) return;
    const siblingParentNode = session.nodes.find(
      (n) => n.id === siblingParentId
    );
    if (!siblingParentNode) return;
    setPickerTarget({
      mode: "sibling",
      refNodeId: nodeId,
      parentId: siblingParentId,
      parentNode: siblingParentNode,
    });
  };

  const openContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleMerge = () => {
    const resolved = resolveMergeSelection(session, selectedIds);
    if (!resolved.ok) {
      setMergeHint(resolved.reason);
      return;
    }
    onMergeNodes(
      resolved.ids,
      mergeDraft.trim() || "综合以上分支，继续推进…"
    );
    setSelectedIds(new Set());
    setMergeDraft("");
    setMergeHint(null);
  };

  const viewRootId =
    focusIds?.length === 1 ? focusIds[0] : rootId;
  const placedConclusionIds = new Set<string>();

  const ctx: FlowContext = {
    session,
    rootId,
    viewRootId,
    onSaveContent,
    onAddAnswer,
    selectedIds,
    onToggleSelect: toggleSelect,
    onContextMenuNode: openContextMenu,
    onOpenChildPicker: openChildPicker,
    relativeDepth: (nodeId) =>
      relativeDepthFromView(session.nodes, nodeId, viewRootId, rootId),
    placedConclusionIds,
    markConclusionPlaced: (id) => {
      placedConclusionIds.add(id);
    },
    onToggleChildLayout,
    onMoveChildToIndex,
    onDeleteNode,
  };

  const contextNode = contextMenu
    ? session.nodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  const topicBranches = branchChildren(session, root.id);
  const hasBranches = topicBranches.length > 0;

  return (
    <div className="relative w-full min-w-0 px-0.5 sm:px-2 md:px-4 lg:px-6">
      {onSwitchToTreeView && (
        <div className="pointer-events-none sticky top-2 z-40 mb-2 flex justify-end">
          <button
            type="button"
            onClick={onSwitchToTreeView}
            className="pointer-events-auto rounded-lg border border-[#E2E8F0] bg-white/95 px-2.5 py-1 text-[10px] text-slate-600 shadow-sm hover:bg-slate-50"
          >
            导图视角
          </button>
        </div>
      )}
      {selectedIds.size >= 2 && !focusIds && (
        <div className="sticky top-0 z-30 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#EFF6FF]/95 px-3 py-2 backdrop-blur-sm">
          <span className="text-xs text-slate-600">
            已选 {selectedIds.size} 个节点
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setFocusIds([...selectedIds])}
          >
            进入所选
          </Button>
          <input
            className="min-w-[140px] flex-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs"
            placeholder="结论汇总…"
            value={mergeDraft}
            onChange={(e) => setMergeDraft(e.target.value)}
          />
          <Button size="sm" variant="primary" onClick={handleMerge}>
            合并生成结论
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedIds(new Set());
              setMergeHint(null);
            }}
          >
            取消
          </Button>
        </div>
      )}

      {mergeHint && (
        <p className="mb-2 text-xs text-amber-700">{mergeHint}</p>
      )}

      {focusIds?.length === 1 ? (
        <FocusSingleView
          nodeId={focusIds[0]}
          ctx={ctx}
          onOpenPicker={openChildPicker}
          onFocusChange={setFocusIds}
          onExitFocus={() => setFocusIds(null)}
        />
      ) : focusIds && focusIds.length > 1 ? (
        <FocusMultiView
          nodeIds={focusIds}
          ctx={ctx}
          onOpenPicker={openChildPicker}
          onExitFocus={() => setFocusIds(null)}
        />
      ) : (
        <div
          className={cn(
            "flex w-full flex-col gap-2",
            !hasBranches && "min-h-[40vh] justify-center"
          )}
        >
          <div className={cn("group/node mx-auto w-full", CARD_TOPIC_MAX_CLASS)}>
            <NodeWithSideAdd onAdd={() => openChildPicker(root.id)}>
              <EditableBox
                node={root}
                session={session}
                onSaveContent={onSaveContent}
                onContextMenu={(e) => openContextMenu(e, root.id)}
                topic
                relativeDepth={0}
              />
            </NodeWithSideAdd>
            <BranchTail
              mountNode={root}
              ctx={ctx}
              onOpenPicker={openChildPicker}
            />
          </div>
        </div>
      )}

      {pickerTarget && (
        <ThinkingMethodPickerDialog
          target={pickerTarget}
          onAddQuestion={onAddQuestion}
          onAddSiblingQuestion={onAddSiblingQuestion}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {contextMenu && contextNode && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={buildContextMenuItems({
            node: contextNode,
            nodeId: contextMenu.nodeId,
            session,
            selectedIds,
            focusIds,
            onFocus: setFocusIds,
            onExitFocus: () => setFocusIds(null),
            onAddChild: () => openChildPicker(contextMenu.nodeId),
            onAddSibling: () => openSiblingPicker(contextMenu.nodeId),
            onToggleLayout: onToggleChildLayout,
            onMerge: handleMerge,
            onDelete: () => {
              onDeleteNode(contextMenu.nodeId);
              if (focusIds?.includes(contextMenu.nodeId)) {
                setFocusIds(null);
              }
              setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(contextMenu.nodeId);
                return next;
              });
            },
          })}
        />
      )}
    </div>
  );
}
