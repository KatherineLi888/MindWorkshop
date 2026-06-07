"use client";

import { useMemo, useState } from "react";
import {
  TREE_EDGES,
  TREE_BOX_H,
  TREE_THEME,
  TREE_VIEW_H,
  TREE_VIEW_W,
  buildNodeLayout,
  edgeKey,
  getChosenEdges,
  getNodeById,
  getNodeState,
  getTrunkPalette,
  isAbandonNodeOnPath,
  isDrawableEdge,
  treeLinkPath,
  type TrunkKind,
} from "@/lib/decision-tree/tree-graph";
import {
  getStepLabel,
  getStepNotes,
  getTreeNodeLabel,
  noteStepIdForTreeNode,
  type FlowAnswers,
} from "@/lib/decision-tree/flow";

type Props = {
  answers: FlowAnswers;
  history: string[];
  currentStepId: string;
};

type NoteViewMode = "hidden" | "all" | "click";

function nodeStyles(
  trunk: TrunkKind | undefined,
  isCurrent: boolean,
  isOnPath: boolean,
  abandoned: boolean
) {
  if (abandoned) {
    return {
      fill: "#F1F3F5",
      stroke: "#CBD5E1",
      text: "#94A3B8",
    };
  }
  const p = getTrunkPalette(trunk);
  if (isCurrent) {
    return { fill: p.current, stroke: p.current, text: "#FFFFFF" };
  }
  if (isOnPath) {
    return { fill: p.fill, stroke: p.stroke, text: p.textOnPath };
  }
  return { fill: p.fillDim, stroke: "#E8ECF0", text: p.text };
}

function truncateNote(text: string, max = 28) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function DecisionTreeMap({ answers, history, currentStepId }: Props) {
  const [noteMode, setNoteMode] = useState<NoteViewMode>("hidden");
  const [peekStepId, setPeekStepId] = useState<string | null>(null);

  const notes = useMemo(() => getStepNotes(answers), [answers]);
  const chosenEdges = useMemo(
    () => getChosenEdges(answers, history),
    [answers, history]
  );
  const layout = useMemo(() => buildNodeLayout(history), [history]);
  const nodesToRender = useMemo(() => Array.from(layout.values()), [layout]);

  const originTrunk = answers.origin as "active" | "passive" | undefined;
  const currentNode = layout.get(currentStepId) ?? getNodeById(currentStepId);
  const currentLabel = currentStepId
    ? getTreeNodeLabel(currentStepId)
    : null;

  const peekNote =
    peekStepId && notes[peekStepId] ? notes[peekStepId] : null;
  const peekLabel = peekStepId ? getStepLabel(peekStepId) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8ECF0]/90 bg-[#FAFBFC] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF1F5] bg-white/80 px-3.5 py-2.5">
        <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-3 rounded-full"
              style={{ background: TREE_THEME.active.current }}
            />
            主动干
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-3 rounded-full"
              style={{ background: TREE_THEME.passive.current }}
            />
            被动支
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentLabel && (
            <span className="text-[11px] text-[#64748B]">
              当前
              <span className="ml-1 rounded-md bg-[#F1F3F8] px-2 py-0.5 font-medium text-[#334155]">
                {currentLabel}
              </span>
            </span>
          )}
          <div
            className="flex rounded-lg border border-[#E8ECF0] bg-[#F8FAFC] p-0.5 text-[10px]"
            role="group"
            aria-label="备注显示方式"
          >
            {(
              [
                ["hidden", "默认隐藏"],
                ["all", "一键显示"],
                ["click", "点击查看"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setNoteMode(mode);
                  if (mode !== "click") setPeekStepId(null);
                }}
                className={`rounded-md px-2 py-1 transition-colors ${
                  noteMode === mode
                    ? "bg-white font-medium text-[#334155] shadow-sm"
                    : "text-[#94A3B8] hover:text-[#64748B]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden px-1 py-2">
        <svg
          viewBox={`0 0 ${TREE_VIEW_W} ${TREE_VIEW_H}`}
          className="w-full min-w-[520px]"
          style={{ height: "208px" }}
          role="img"
          aria-label="决策树"
        >
          <defs>
            <filter id="node-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1.5"
                floodColor="#64748B"
                floodOpacity="0.12"
              />
            </filter>
          </defs>

          <rect width={TREE_VIEW_W} height={TREE_VIEW_H} fill={TREE_THEME.canvas} />

          {TREE_EDGES.filter((e) => isDrawableEdge(e.from, e.to)).map((e) => {
            const from = layout.get(e.from);
            const to = layout.get(e.to);
            if (!from || !to) return null;

            const key = edgeKey(e.from, e.to);
            const chosen = chosenEdges.has(key);
            const palette = getTrunkPalette(e.trunk);
            const dimOpposite =
              (originTrunk === "active" && e.trunk === "passive") ||
              (originTrunk === "passive" && e.trunk === "active");
            const toAbandon = isAbandonNodeOnPath(e.to, history);

            return (
              <path
                key={key}
                d={treeLinkPath(from, to)}
                fill="none"
                stroke={chosen ? (toAbandon ? "#CBD5E1" : palette.edge) : TREE_THEME.edgeIdle}
                strokeWidth={chosen ? 1.75 : 1}
                strokeOpacity={
                  dimOpposite && !chosen ? 0.2 : chosen ? (toAbandon ? 0.7 : 0.95) : TREE_THEME.edgeIdleOpacity
                }
                strokeLinecap="round"
                strokeDasharray={toAbandon && chosen ? "4 3" : undefined}
              />
            );
          })}

          {nodesToRender.map((node) => {
            const state = getNodeState(
              node.id,
              currentStepId,
              history,
              chosenEdges
            );
            const isCurrent = state === "current";
            const isOnPath =
              state === "visited" || state === "on-path" || isCurrent;
            const abandoned = isAbandonNodeOnPath(node.id, history);
            const isConfirm = node.id === "flow_confirm";
            const dimOpposite =
              (originTrunk === "active" && node.trunk === "passive") ||
              (originTrunk === "passive" && node.trunk === "active");
            const opacity =
              dimOpposite && !isOnPath ? 0.28 : isOnPath ? 1 : 0.72;

            const noteStepId = noteStepIdForTreeNode(node.id);
            const noteText = noteStepId ? notes[noteStepId] : undefined;
            const hasNote = Boolean(noteText?.trim());
            const showNoteAll = noteMode === "all" && hasNote && noteStepId;
            const clickable =
              noteMode === "click" && hasNote && noteStepId;

            const w = node.w ?? 52;
            const styles = nodeStyles(
              node.trunk,
              isCurrent,
              isOnPath,
              abandoned
            );

            return (
              <g
                key={node.id}
                opacity={opacity}
                filter={isOnPath && !abandoned ? "url(#node-soft-shadow)" : undefined}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={w}
                  height={TREE_BOX_H}
                  rx={5}
                  fill={styles.fill}
                  stroke={
                    isConfirm && isOnPath
                      ? TREE_THEME.neutral.current
                      : styles.stroke
                  }
                  strokeWidth={isCurrent || (isConfirm && isOnPath) ? 1.5 : 1}
                  strokeDasharray={isConfirm && isOnPath ? "3 2" : undefined}
                  onClick={
                    clickable && noteStepId
                      ? () =>
                          setPeekStepId((p) =>
                            p === noteStepId ? null : noteStepId
                          )
                      : undefined
                  }
                  style={{ cursor: clickable ? "pointer" : undefined }}
                />
                <text
                  x={node.x + w / 2}
                  y={node.y + TREE_BOX_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={isCurrent ? 600 : isOnPath ? 500 : 400}
                  fill={styles.text}
                  textDecoration={abandoned ? "line-through" : undefined}
                  style={{ fontFamily: "system-ui, sans-serif", pointerEvents: "none" }}
                >
                  {getTreeNodeLabel(node.id)}
                </text>

                {hasNote && noteMode !== "hidden" && (
                  <circle
                    cx={node.x + w - 4}
                    cy={node.y + 4}
                    r={3}
                    fill={noteMode === "click" && peekStepId === noteStepId ? "#6B7FD6" : "#94A3B8"}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {showNoteAll && noteText && (
                  <text
                    x={node.x + w / 2}
                    y={node.y + TREE_BOX_H + 11}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#64748B"
                    style={{ fontFamily: "system-ui, sans-serif", pointerEvents: "none" }}
                  >
                    {truncateNote(noteText)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {noteMode === "click" && peekNote && peekLabel && (
        <div className="border-t border-[#EEF1F5] bg-white px-3.5 py-2.5">
          <p className="text-[10px] font-medium text-[#94A3B8]">
            {peekLabel} · 备注
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#475569]">{peekNote}</p>
        </div>
      )}

      {noteMode === "click" && !peekNote && (
        <p className="border-t border-[#EEF1F5] px-3.5 py-2 text-[10px] text-[#94A3B8]">
          点击带圆点的节点查看该步骤备注
        </p>
      )}
    </div>
  );
}
