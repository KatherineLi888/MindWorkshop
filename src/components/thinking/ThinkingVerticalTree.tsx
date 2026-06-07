"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type CSSProperties,
} from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import {
  ThinkingMethodPickerDialog,
  type MethodPickerTarget,
} from "@/components/thinking/ThinkingMethodPicker";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import { applyMethodPick } from "@/lib/thinking/apply-method-pick";
import { THINK_FONT_FAMILY, type ThinkingMethodId } from "@/lib/thinking/methods";
import { maxCharsForBranchCount } from "@/lib/thinking/tree-sibling-chars";
import {
  canAddTreeSibling,
  treeChildParent,
  treeNodeLabel,
  treeNodePathToRoot,
} from "@/lib/thinking/tree-node-actions";
import {
  THINK_TREE_PREFS_CHANGED,
  loadThinkingLayoutPrefs,
  treeLayoutConfig,
  type TreeLayoutConfig,
} from "@/lib/thinking/layout-prefs";
import type { AddQuestionMeta, QuestionEditFocus } from "@/lib/thinking/prompt-draft";
import { getOrderedChildNodes } from "@/lib/thinking/text-board";
import type { ThoughtNode, ThoughtSession } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

type Props = {
  session: ThoughtSession;
  rootId: string;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
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
  onDeleteNode: (nodeId: string) => void;
  onSwitchToCardView?: () => void;
  questionEditFocus?: QuestionEditFocus | null;
  onQuestionEditFocusConsumed?: () => void;
};

const VIEW_TOP = 24;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.85;
const ZOOM_WHEEL_STEP = 0.07;
const ZOOM_BTN_STEP = 0.12;
const LABEL_TEXT_GAP = 4;
const QA_DIVIDER_H = 1;
const QA_DIVIDER_PAD = 3;

type LayoutUnit = {
  kind: "topic" | "qa";
  question: ThoughtNode;
  answer?: ThoughtNode;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  isRoot: boolean;
  maxChars: number;
};

type LayoutEdge = { x1: number; y1: number; x2: number; y2: number };

type ColumnLayout = {
  units: LayoutUnit[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  anchorBottom: number;
  anchorX: number;
};

function clampZoom(scale: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

function panAnchoredOnRoot(
  rootUnit: LayoutUnit,
  scale: number,
  viewportW: number,
  top = VIEW_TOP
) {
  const rootCenterX = rootUnit.x + rootUnit.w / 2;
  return {
    x: viewportW / 2 - rootCenterX * scale,
    y: top - rootUnit.y * scale,
  };
}

function clampTreePan(
  pan: { x: number; y: number },
  scale: number,
  rootUnit: LayoutUnit,
  layout: { width: number; height: number },
  viewW: number,
  viewH: number
) {
  if (viewW <= 0 || viewH <= 0) return pan;
  let { x, y } = pan;
  const rootCx = rootUnit.x + rootUnit.w / 2;
  const rootY = rootUnit.y;
  const centerX = viewW / 2;
  const maxXDrift = viewW * 0.16;
  const minRootY = 6;
  const maxRootY = Math.max(minRootY + 24, viewH * 0.26);

  const rootScreenX = x + rootCx * scale;
  const rootScreenY = y + rootY * scale;

  if (rootScreenX < centerX - maxXDrift) {
    x = centerX - maxXDrift - rootCx * scale;
  }
  if (rootScreenX > centerX + maxXDrift) {
    x = centerX + maxXDrift - rootCx * scale;
  }
  if (rootScreenY < minRootY) y = minRootY - rootY * scale;
  if (rootScreenY > maxRootY) y = maxRootY - rootY * scale;

  const pad = 28;
  const minX = viewW - pad - layout.width * scale;
  const maxX = pad;
  const minY = viewH - pad - layout.height * scale;
  const maxY = pad;
  if (x < minX) x = minX;
  if (x > maxX) x = maxX;
  if (y < minY) y = minY;
  if (y > maxY) y = maxY;

  return { x, y };
}

function useTreeLayoutConfig(): TreeLayoutConfig {
  const [cfg, setCfg] = useState(() => treeLayoutConfig(loadThinkingLayoutPrefs()));

  useEffect(() => {
    const refresh = () => setCfg(treeLayoutConfig(loadThinkingLayoutPrefs()));
    window.addEventListener(THINK_TREE_PREFS_CHANGED, refresh);
    return () => window.removeEventListener(THINK_TREE_PREFS_CHANGED, refresh);
  }, []);

  return cfg;
}

function branchChildren(session: ThoughtSession, parentId: string) {
  return getOrderedChildNodes(session, session.nodes, parentId).filter(
    (c) =>
      c.type !== "answer" && c.type !== "merge" && c.type !== "conclusion"
  );
}

function getAnswer(session: ThoughtSession, questionId: string) {
  return getOrderedChildNodes(session, session.nodes, questionId).find(
    (c) => c.type === "answer"
  );
}

function mountParentId(session: ThoughtSession, node: ThoughtNode): string {
  if (node.type === "topic") return node.id;
  const answer =
    node.type === "question" ? getAnswer(session, node.id) : undefined;
  return answer?.id ?? node.id;
}

function adaptiveBodyWidth(
  text: string,
  cfg: TreeLayoutConfig,
  maxChars: number
): number {
  const len = Math.max(2, (text.trim() || "占位").length);
  const lines = Math.min(2, Math.max(1, Math.ceil(len / maxChars)));
  const cols =
    lines === 1 ? Math.min(maxChars, Math.max(4, len)) : maxChars;
  return cols * cfg.charWidthPx;
}

function rowHeight(
  text: string,
  cfg: TreeLayoutConfig,
  maxChars: number
): number {
  const len = Math.max(2, (text.trim() || "占位").length);
  const lines = Math.min(2, Math.max(1, Math.ceil(len / maxChars)));
  return lines * cfg.lineHeightPx;
}

function measureUnit(
  question: ThoughtNode,
  answer: ThoughtNode | undefined,
  isRoot: boolean,
  cfg: TreeLayoutConfig,
  maxChars: number
): { w: number; h: number } {
  const hasBadge =
    !isRoot && question.type === "question" && Boolean(question.method);
  const topPad = cfg.paddingY + (hasBadge ? cfg.methodTopPad : 0);
  const bottomPad = cfg.paddingY;

  if (isRoot || question.type === "topic") {
    const bodyW = adaptiveBodyWidth(question.content, cfg, maxChars);
    let h = rowHeight(question.content, cfg, maxChars) + topPad + bottomPad;
    if (cfg.unitMinHeightPx > 0) h = Math.max(h, cfg.unitMinHeightPx);
    return { w: bodyW + cfg.paddingX * 2, h };
  }

  const qRowH = rowHeight(question.content, cfg, maxChars);
  const qBodyW = adaptiveBodyWidth(question.content, cfg, maxChars);
  if (!answer) {
    let h = topPad + qRowH + bottomPad;
    if (cfg.unitMinHeightPx > 0) h = Math.max(h, cfg.unitMinHeightPx);
    return {
      w: qBodyW + cfg.paddingX * 2,
      h,
    };
  }

  const aRowH = rowHeight(answer.content, cfg, maxChars);
  const combinedBodyW = Math.max(
    qBodyW,
    adaptiveBodyWidth(answer.content, cfg, maxChars)
  );
  let h =
    topPad +
    qRowH +
    QA_DIVIDER_PAD +
    QA_DIVIDER_H +
    QA_DIVIDER_PAD +
    aRowH +
    bottomPad;
  if (cfg.unitMinHeightPx > 0) h = Math.max(h, cfg.unitMinHeightPx);
  return {
    w: combinedBodyW + cfg.paddingX * 2,
    h,
  };
}

function layoutColumn(
  node: ThoughtNode,
  session: ThoughtSession,
  depth: number,
  topY: number,
  isRoot: boolean,
  cfg: TreeLayoutConfig,
  rowSiblingCount = 1
): ColumnLayout {
  const answer =
    node.type === "question" ? getAnswer(session, node.id) : undefined;
  const mountId = answer?.id ?? node.id;
  const branches = branchChildren(session, mountId);
  const maxChars = maxCharsForBranchCount(rowSiblingCount, cfg.maxChars);

  const unitSize = measureUnit(node, answer, isRoot, cfg, maxChars);
  const unitY = topY;

  const childLayouts: ColumnLayout[] = [];
  let childrenRowW = 0;
  const sibGap = cfg.branchGap;
  if (branches.length > 0) {
    for (const child of branches) {
      const cl = layoutColumn(
        child,
        session,
        depth + 1,
        0,
        false,
        cfg,
        branches.length
      );
      childLayouts.push(cl);
      childrenRowW += cl.width + sibGap;
    }
    childrenRowW -= sibGap;
  }

  const selfStackH = unitSize.h;
  const childrenY =
    topY + selfStackH + (branches.length > 0 ? cfg.childVerticalGap : 0);
  const columnW = Math.max(unitSize.w, childrenRowW);
  const unitX = (columnW - unitSize.w) / 2;

  const units: LayoutUnit[] = [
    {
      kind: isRoot || node.type === "topic" ? "topic" : "qa",
      question: node,
      answer,
      x: unitX,
      y: unitY,
      w: unitSize.w,
      h: unitSize.h,
      depth,
      isRoot,
      maxChars,
    },
  ];

  const edges: LayoutEdge[] = [];
  const anchorX = columnW / 2;
  const anchorBottom = unitY + unitSize.h;

  let cursorX = (columnW - childrenRowW) / 2;
  let maxChildBottom = childrenY;

  for (const cl of childLayouts) {
    const offsetX = cursorX;
    for (const u of cl.units) {
      units.push({
        ...u,
        x: u.x + offsetX,
        y: u.y + childrenY,
      });
    }
    for (const e of cl.edges) {
      edges.push({
        x1: e.x1 + offsetX,
        y1: e.y1 + childrenY,
        x2: e.x2 + offsetX,
        y2: e.y2 + childrenY,
      });
    }
    const childTopY = cl.units.reduce((min, u) => Math.min(min, u.y), Infinity);
    edges.push({
      x1: anchorX,
      y1: anchorBottom,
      x2: offsetX + cl.anchorX,
      y2: childrenY + childTopY,
    });
    maxChildBottom = Math.max(maxChildBottom, childrenY + cl.height);
    cursorX += cl.width + sibGap;
  }

  const height = branches.length > 0 ? maxChildBottom - topY : selfStackH;

  return {
    units,
    edges,
    width: columnW,
    height,
    anchorBottom: branches.length > 0 ? maxChildBottom : anchorBottom,
    anchorX,
  };
}

function StraightEdge({ edge }: { edge: LayoutEdge }) {
  return (
    <line
      x1={edge.x1}
      y1={edge.y1}
      x2={edge.x2}
      y2={edge.y2}
      stroke="#CBD5E1"
      strokeWidth={1}
    />
  );
}

function CompactRowInput({
  value,
  onChange,
  onBlur,
  placeholder,
  textColor,
  cfg,
  bodyWidth,
  maxChars,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  textColor?: string;
  cfg: TreeLayoutConfig;
  bodyWidth: number;
  maxChars: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const minH = cfg.lineHeightPx;
  const maxH = cfg.lineHeightPx * 2;
  const maxW = maxChars * cfg.charWidthPx;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const natural = el.scrollHeight;
    if (!focused) {
      el.style.height = `${Math.min(Math.max(natural, minH), maxH)}px`;
    } else {
      el.style.height = `${Math.max(natural, minH)}px`;
    }
  }, [value, focused, minH, maxH]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      placeholder={placeholder}
      className={cn(
        "block w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-left text-[13px] outline-none",
        !focused && "max-h-9",
        className
      )}
      style={{
        width: bodyWidth,
        maxWidth: maxW,
        minHeight: minH,
        lineHeight: `${cfg.lineHeightPx}px`,
        color: textColor,
        fontFamily: THINK_FONT_FAMILY,
      }}
    />
  );
}

function labelIndent(cfg: TreeLayoutConfig): number {
  return cfg.labelWidth + LABEL_TEXT_GAP;
}

/** 标签对齐首行单行区域；首行在标签后，换行与标签左缘对齐 */
function LabeledRowInput({
  label,
  variant,
  value,
  onChange,
  onBlur,
  placeholder,
  cfg,
  bodyWidth,
  maxChars,
  className,
  focusSelection,
  onFocusSelectionApplied,
}: {
  label: string;
  variant: "question" | "answer";
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  cfg: TreeLayoutConfig;
  bodyWidth: number;
  maxChars: number;
  className?: string;
  focusSelection?: { start: number; end: number } | null;
  onFocusSelectionApplied?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const minH = cfg.lineHeightPx;
  const maxH = cfg.lineHeightPx * 2;
  const indent = labelIndent(cfg);
  const textColor =
    variant === "question" ? cfg.questionTextColor : cfg.answerTextColor;
  const linePx = cfg.lineHeightPx;

  useLayoutEffect(() => {
    if (!focusSelection || !ref.current) return;
    const el = ref.current;
    el.focus();
    const start = Math.min(focusSelection.start, value.length);
    const end = Math.min(focusSelection.end, value.length);
    el.setSelectionRange(start, end);
    onFocusSelectionApplied?.();
  }, [focusSelection, onFocusSelectionApplied, value.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const natural = el.scrollHeight;
    if (!focused) {
      el.style.height = `${Math.min(Math.max(natural, minH), maxH)}px`;
    } else {
      el.style.height = `${Math.max(natural, minH)}px`;
    }
  }, [value, focused, minH, maxH]);

  return (
    <div className="relative w-full" style={{ width: bodyWidth }}>
      <RowBadge
        label={label}
        variant={variant}
        cfg={cfg}
        className="absolute left-0 z-[1]"
        style={{
          top: linePx / 2,
          transform: "translateY(-50%)",
        }}
      />
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur();
        }}
        placeholder={placeholder}
        className={cn(
          "block w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-left text-[13px] outline-none",
          !focused && "max-h-9",
          className
        )}
        style={{
          textIndent: indent,
          maxWidth: maxChars * cfg.charWidthPx,
          minHeight: minH,
          lineHeight: `${cfg.lineHeightPx}px`,
          color: textColor,
          fontFamily: THINK_FONT_FAMILY,
        }}
      />
    </div>
  );
}

function MethodAddPanel({
  parentId,
  onAddQuestion,
  onOpenChange,
}: {
  parentId: string;
  onAddQuestion: Props["onAddQuestion"];
  onOpenChange?: (open: boolean) => void;
}) {
  const { methods, getMethod } = useThinkingMethods();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const setOpenBoth = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenBoth(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pickMethod = (id: ThinkingMethodId) => {
    applyMethodPick(parentId, id, getMethod(id), onAddQuestion);
    setOpenBoth(false);
  };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2"
    >
      <button
        type="button"
        title="添加子节点"
        onClick={() => setOpenBoth(!open)}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/95 text-sm leading-none text-slate-600 opacity-0 shadow-sm transition hover:bg-slate-300 group-hover/box:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
      >
        +
      </button>

      {open && (
        <div className="absolute left-1/2 top-[calc(100%+6px)] z-40 min-w-[10rem] -translate-x-1/2 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-lg">
          <p className="mb-1.5 text-[10px] text-slate-400">选择方法</p>
          <div className="flex max-w-[14rem] flex-wrap gap-1">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMethod(m.id)}
                className="rounded-md border border-[#E2E8F0] px-2 py-0.5 text-[10px] text-slate-700 hover:border-[#3B82F6] hover:text-[#3B82F6]"
              >
                {m.short}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RowBadge({
  label,
  variant,
  cfg,
  className,
  style,
}: {
  label: string;
  variant: "question" | "answer";
  cfg: TreeLayoutConfig;
  className?: string;
  style?: CSSProperties;
}) {
  const isQ = variant === "question";
  return (
    <span
      className={cn(
        "shrink-0 rounded border px-1 py-px text-[8px] leading-none font-semibold",
        className
      )}
      style={{
        width: cfg.labelWidth,
        textAlign: "center",
        background: isQ ? cfg.questionBadgeBg : cfg.answerBadgeBg,
        borderColor: isQ ? cfg.questionBadgeBorder : cfg.answerBadgeBorder,
        color: isQ ? cfg.questionBadgeText : cfg.answerBadgeText,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function TreeUnitBox({
  unit,
  session,
  cfg,
  onSaveContent,
  onAddQuestion,
  questionEditFocus,
  onQuestionEditFocusConsumed,
  onContextMenu,
}: {
  unit: LayoutUnit;
  session: ThoughtSession;
  cfg: TreeLayoutConfig;
  onSaveContent: (id: string, content: string) => void;
  onAddQuestion: Props["onAddQuestion"];
  questionEditFocus?: QuestionEditFocus | null;
  onQuestionEditFocusConsumed?: () => void;
  onContextMenu: (e: ReactMouseEvent, nodeId: string) => void;
}) {
  const { getMethod } = useThinkingMethods();
  const [qDraft, setQDraft] = useState(unit.question.content);
  const [aDraft, setADraft] = useState(unit.answer?.content ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setQDraft(unit.question.content);
  }, [unit.question.id, unit.question.content]);

  useEffect(() => {
    setADraft(unit.answer?.content ?? "");
  }, [unit.answer?.id, unit.answer?.content]);

  const commitQ = () => {
    const t = qDraft.trim();
    if (t !== unit.question.content) {
      onSaveContent(unit.question.id, t || unit.question.content);
    }
  };

  const commitA = () => {
    if (!unit.answer) return;
    const t = aDraft.trim();
    if (t !== unit.answer.content) {
      onSaveContent(unit.answer.id, t || unit.answer.content);
    }
  };

  const isTopic = unit.kind === "topic";
  const hasMethod =
    unit.question.type === "question" && Boolean(unit.question.method);
  const methodDef =
    hasMethod && unit.question.method
      ? getMethod(unit.question.method)
      : null;
  const canAddChild = isTopic || unit.question.type === "question";
  const maxChars = unit.maxChars;

  const qTextW = adaptiveBodyWidth(qDraft, cfg, maxChars);
  const aTextW = unit.answer ? adaptiveBodyWidth(aDraft, cfg, maxChars) : 0;
  const bodyW = isTopic
    ? qTextW
    : Math.max(
        qTextW,
        aTextW,
        adaptiveBodyWidth(unit.question.content, cfg, maxChars)
      );

  const liveSize = measureUnit(
    { ...unit.question, content: qDraft },
    unit.answer ? { ...unit.answer, content: aDraft } : undefined,
    unit.isRoot,
    cfg,
    maxChars
  );
  const boxW = Math.max(unit.w, liveSize.w);
  const boxH = Math.max(unit.h, liveSize.h);
  const boxLeft = unit.x + (unit.w - boxW) / 2;

  const topPad = cfg.paddingY + (hasMethod ? cfg.methodTopPad : 0);
  const questionFocusSelection =
    questionEditFocus?.nodeId === unit.question.id
      ? {
          start: questionEditFocus.selectStart,
          end: questionEditFocus.selectEnd,
        }
      : null;

  return (
    <div
      className={cn(
        "group/box pointer-events-auto absolute rounded-2xl border border-slate-200/50 bg-[#F3F4F6]",
        pickerOpen && "z-30"
      )}
      style={{
        left: boxLeft,
        top: unit.y,
        width: boxW,
        minHeight: boxH,
        paddingLeft: cfg.paddingX,
        paddingRight: cfg.paddingX,
        paddingBottom: cfg.paddingY,
        paddingTop: topPad,
        fontFamily: THINK_FONT_FAMILY,
      }}
      onContextMenu={(e) => onContextMenu(e, unit.question.id)}
    >
      {methodDef && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded px-1 py-px text-[8px] leading-none font-medium whitespace-nowrap text-white"
          style={{
            background: methodDef.color,
            border: `1px solid ${methodDef.color}`,
          }}
        >
          {methodDef.short}
        </span>
      )}

      <div
        className="flex h-full flex-col justify-start"
        style={{
          minHeight:
            cfg.unitMinHeightPx > 0
              ? Math.max(0, cfg.unitMinHeightPx - topPad - cfg.paddingY)
              : undefined,
        }}
      >
        {isTopic ? (
          <CompactRowInput
            value={qDraft}
            onChange={setQDraft}
            onBlur={commitQ}
            placeholder="思考主题…"
            textColor="#0F172A"
            cfg={cfg}
            bodyWidth={bodyW}
            maxChars={maxChars}
            className="text-[14px] font-semibold"
          />
        ) : (
          <div className="flex w-full flex-col">
            <LabeledRowInput
              label="问题"
              variant="question"
              value={qDraft}
              onChange={setQDraft}
              onBlur={commitQ}
              placeholder="问题…"
              cfg={cfg}
              bodyWidth={bodyW}
              maxChars={maxChars}
              focusSelection={questionFocusSelection}
              onFocusSelectionApplied={onQuestionEditFocusConsumed}
            />
            {unit.answer && (
              <>
                <div
                  className="w-full shrink-0 bg-slate-500"
                  style={{
                    height: QA_DIVIDER_H,
                    marginTop: QA_DIVIDER_PAD,
                    marginBottom: QA_DIVIDER_PAD,
                  }}
                  aria-hidden
                />
                <LabeledRowInput
                  label="回答"
                  variant="answer"
                  value={aDraft}
                  onChange={setADraft}
                  onBlur={commitA}
                  placeholder="回答…"
                  cfg={cfg}
                  bodyWidth={bodyW}
                  maxChars={maxChars}
                  className="text-[12px]"
                />
              </>
            )}
          </div>
        )}
      </div>

      {canAddChild && (
        <MethodAddPanel
          parentId={mountParentId(session, unit.question)}
          onAddQuestion={onAddQuestion}
          onOpenChange={setPickerOpen}
        />
      )}
    </div>
  );
}

function TreeCanvas({
  session,
  sessionRootId,
  viewRootId,
  onViewRootChange,
  onSaveContent,
  onAddQuestion,
  onAddSiblingQuestion,
  onDeleteNode,
  questionEditFocus,
  onQuestionEditFocusConsumed,
}: {
  session: ThoughtSession;
  sessionRootId: string;
  viewRootId: string;
  onViewRootChange: (id: string) => void;
  onSaveContent: (id: string, content: string) => void;
  onAddQuestion: Props["onAddQuestion"];
  onAddSiblingQuestion: Props["onAddSiblingQuestion"];
  onDeleteNode: (nodeId: string) => void;
  questionEditFocus?: QuestionEditFocus | null;
  onQuestionEditFocusConsumed?: () => void;
}) {
  const cfg = useTreeLayoutConfig();
  const viewRoot = session.nodes.find((n) => n.id === viewRootId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: VIEW_TOP });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [panInitialized, setPanInitialized] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [pickerTarget, setPickerTarget] = useState<MethodPickerTarget | null>(
    null
  );

  const isSessionRoot = viewRootId === sessionRootId;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      setViewportW(el.clientWidth);
      setViewportH(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!viewRoot) return null;
    const asTopicRoot = isSessionRoot && viewRoot.type === "topic";
    return layoutColumn(viewRoot, session, 0, 0, asTopicRoot, cfg);
  }, [viewRoot, session, cfg, isSessionRoot]);

  const rootUnit = layout?.units[0];

  const applyZoom = useCallback(
    (nextScale: number) => {
      const el = viewportRef.current;
      if (!el || !rootUnit || !layout) return;
      const z = clampZoom(nextScale);
      setScale(z);
      setPan(
        clampTreePan(
          panAnchoredOnRoot(rootUnit, z, el.clientWidth),
          z,
          rootUnit,
          layout,
          el.clientWidth,
          el.clientHeight
        )
      );
    },
    [rootUnit, layout]
  );

  const resetTreeView = useCallback(() => {
    const el = viewportRef.current;
    if (!el || !rootUnit || !layout) return;
    setScale(1);
    setPan(
      clampTreePan(
        panAnchoredOnRoot(rootUnit, 1, el.clientWidth),
        1,
        rootUnit,
        layout,
        el.clientWidth,
        el.clientHeight
      )
    );
  }, [rootUnit, layout]);

  useLayoutEffect(() => {
    setScale(1);
    setPanInitialized(false);
  }, [session.id, viewRootId]);

  useLayoutEffect(() => {
    if (!layout || !rootUnit || !viewportRef.current || panInitialized) return;
    const vp = viewportRef.current;
    setPan(
      clampTreePan(
        panAnchoredOnRoot(rootUnit, 1, vp.clientWidth),
        1,
        rootUnit,
        layout,
        vp.clientWidth,
        vp.clientHeight
      )
    );
    setPanInitialized(true);
  }, [layout, rootUnit, panInitialized]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!rootUnit || !layout) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_WHEEL_STEP : ZOOM_WHEEL_STEP;
      applyZoom(scale + delta);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoom, layout, rootUnit, scale]);

  const canvasSize = useMemo(() => {
    if (!layout) return { w: 800, h: 600 };
    const w = Math.max(viewportW || 800, layout.width + 120);
    return {
      w,
      h: Math.max(600, layout.height + 120),
    };
  }, [layout, viewportW]);

  const openChildPicker = useCallback(
    (nodeId: string) => {
      const node = session.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const { parentId, parentNode } = treeChildParent(node, session.nodes);
      setPickerTarget({
        mode: "child",
        refNodeId: nodeId,
        parentId,
        parentNode,
      });
    },
    [session.nodes]
  );

  const openSiblingPicker = useCallback(
    (nodeId: string) => {
      const node = session.nodes.find((n) => n.id === nodeId);
      if (!node || !canAddTreeSibling(node)) return;
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
    },
    [session.nodes]
  );

  const handleNodeContextMenu = useCallback(
    (e: ReactMouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    },
    []
  );

  const contextNode = contextMenu
    ? session.nodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  const breadcrumb =
    !isSessionRoot && viewRoot
      ? treeNodePathToRoot(session.nodes, viewRootId, sessionRootId)
      : null;

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest("textarea") ||
        target.closest("button") ||
        target.closest('[class*="group/box"]')
      ) {
        return;
      }
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pan.x, pan.y]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging || !rootUnit || !layout) return;
      const el = viewportRef.current;
      if (!el) return;
      const next = {
        x: dragStart.current.panX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.clientY - dragStart.current.y),
      };
      setPan(
        clampTreePan(
          next,
          scale,
          rootUnit,
          layout,
          el.clientWidth,
          el.clientHeight
        )
      );
    },
    [dragging, rootUnit, layout, scale]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [dragging]
  );

  if (!viewRoot || !layout) return null;

  return (
    <>
      {breadcrumb && breadcrumb.length > 1 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[#E2E8F0] bg-white/95 px-3 py-1.5 text-[10px] text-slate-500">
          {breadcrumb.map((n, i) => (
            <span key={n.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300">/</span>}
              <button
                type="button"
                className={cn(
                  "max-w-[8rem] truncate hover:text-[#3B82F6]",
                  n.id === viewRootId && "font-medium text-slate-800"
                )}
                onClick={() => onViewRootChange(n.id)}
              >
                {treeNodeLabel(n)}
              </button>
            </span>
          ))}
          <button
            type="button"
            className="ml-2 text-[#3B82F6] hover:underline"
            onClick={() => onViewRootChange(sessionRootId)}
          >
            返回全文脉络
          </button>
        </div>
      )}

      <div
        ref={viewportRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden bg-[#FAFBFC]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-white/95 p-0.5 text-[10px] text-slate-600 shadow-sm">
          <button
            type="button"
            title="缩小"
            className="pointer-events-auto rounded px-2 py-1 hover:bg-slate-100"
            onClick={() => applyZoom(scale - ZOOM_BTN_STEP)}
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            title="放大"
            className="pointer-events-auto rounded px-2 py-1 hover:bg-slate-100"
            onClick={() => applyZoom(scale + ZOOM_BTN_STEP)}
          >
            +
          </button>
          <button
            type="button"
            title="重置视图"
            className="pointer-events-auto rounded px-2 py-1 hover:bg-slate-100"
            onClick={resetTreeView}
          >
            重置
          </button>
        </div>
        <div
          className="relative"
          style={{
            width: canvasSize.w,
            height: canvasSize.h,
            minWidth: "100%",
            minHeight: "100%",
          }}
        >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={Math.max(layout.width, canvasSize.w)}
            height={layout.height}
          >
            {layout.edges.map((edge, i) => (
              <StraightEdge key={i} edge={edge} />
            ))}
          </svg>

          <div
            className="relative"
            style={{
              width: Math.max(layout.width, canvasSize.w),
              height: layout.height,
            }}
          >
            {layout.units.map((unit) => (
              <TreeUnitBox
                key={
                  unit.answer
                    ? `${unit.question.id}-${unit.answer.id}`
                    : unit.question.id
                }
                unit={unit}
                session={session}
                cfg={cfg}
                onSaveContent={onSaveContent}
                onAddQuestion={onAddQuestion}
                questionEditFocus={questionEditFocus}
                onQuestionEditFocusConsumed={onQuestionEditFocusConsumed}
                onContextMenu={handleNodeContextMenu}
              />
            ))}
          </div>
        </div>
      </div>
      </div>

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
          items={[
            ...(contextNode.type !== "topic" && contextNode.id !== viewRootId
              ? [
                  {
                    type: "action" as const,
                    label: "进入此节点",
                    onClick: () => onViewRootChange(contextNode.id),
                  },
                ]
              : []),
            ...(!isSessionRoot
              ? [
                  {
                    type: "action" as const,
                    label: "返回全文脉络",
                    onClick: () => onViewRootChange(sessionRootId),
                  },
                ]
              : []),
            ...((contextNode.type !== "topic" && contextNode.id !== viewRootId) ||
            !isSessionRoot
              ? [{ type: "separator" as const }]
              : []),
            {
              type: "action" as const,
              label: "添加子节点",
              onClick: () => openChildPicker(contextMenu.nodeId),
            },
            ...(canAddTreeSibling(contextNode)
              ? [
                  {
                    type: "action" as const,
                    label: "添加同级节点",
                    onClick: () => openSiblingPicker(contextMenu.nodeId),
                  },
                ]
              : []),
            ...(contextNode.type !== "topic"
              ? [
                  { type: "separator" as const },
                  {
                    type: "action" as const,
                    label: "删除此节点",
                    danger: true,
                    onClick: () => {
                      onDeleteNode(contextMenu.nodeId);
                      if (viewRootId === contextMenu.nodeId) {
                        onViewRootChange(sessionRootId);
                      }
                    },
                  },
                ]
              : []),
          ]}
        />
      )}
    </>
  );
}

export function ThinkingVerticalTree({
  session,
  rootId,
  fullscreen,
  onToggleFullscreen,
  onSaveContent,
  onAddQuestion,
  onAddSiblingQuestion,
  onDeleteNode,
  onSwitchToCardView,
  questionEditFocus,
  onQuestionEditFocusConsumed,
}: Props) {
  const [viewRootId, setViewRootId] = useState(rootId);

  useEffect(() => {
    setViewRootId(rootId);
  }, [session.id, rootId]);

  const viewToolbar = (
    <div className="flex items-center gap-1.5">
      {onSwitchToCardView && (
        <button
          type="button"
          onClick={onSwitchToCardView}
          className="rounded-lg border border-[#E2E8F0] bg-white/95 px-2.5 py-1 text-[10px] text-slate-600 shadow-sm hover:bg-slate-50"
        >
          卡片视角
        </button>
      )}
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="rounded-lg border border-[#E2E8F0] bg-white/95 px-2.5 py-1 text-[10px] text-slate-600 shadow-sm hover:bg-slate-50"
        >
          {fullscreen ? "退出全屏" : "全屏"}
        </button>
      )}
    </div>
  );

  const canvas = (
    <TreeCanvas
      session={session}
      sessionRootId={rootId}
      viewRootId={viewRootId}
      onViewRootChange={setViewRootId}
      onSaveContent={onSaveContent}
      onAddQuestion={onAddQuestion}
      onAddSiblingQuestion={onAddSiblingQuestion}
      onDeleteNode={onDeleteNode}
      questionEditFocus={questionEditFocus}
      onQuestionEditFocusConsumed={onQuestionEditFocusConsumed}
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] px-4 py-2">
          <p className="text-sm font-medium text-slate-800">{session.title}</p>
          {viewToolbar}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{canvas}</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute top-2 right-2 z-30 flex justify-end">
        <div className="pointer-events-auto">{viewToolbar}</div>
      </div>
      {canvas}
    </div>
  );
}
