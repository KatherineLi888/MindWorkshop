"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrackProblemEditor } from "@/components/track/TrackProblemEditor";
import { anchorKey } from "@/lib/track/anchors";
import {
  archiveTrackProblem,
  deleteTrackProblem,
  updateTrackProblem,
} from "@/lib/track/save-problem";
import {
  handleLabel,
  isProblemResolved,
} from "@/lib/track/problem-status";
import { groupProblemsByAnchor, openProblemCount } from "@/lib/track/problems";
import type { GraphNodeRow } from "@/types/database";
import { cn } from "@/lib/utils";

type AnchorMeta = {
  type: "goal" | "decision" | "goal_kr";
  id: string;
  title: string;
};

type Props = {
  nodes: GraphNodeRow[];
  anchorMeta: Map<string, AnchorMeta>;
  filter?: { type: "goal" | "decision" | "goal_kr"; id: string };
  showArchived?: boolean;
  onNodesChange?: () => void;
  compact?: boolean;
  groupByAnchor?: boolean;
  emptyText?: string;
  className?: string;
};

function HandleBadge({ node }: { node: GraphNodeRow }) {
  if (isProblemResolved(node)) return null;
  const label = handleLabel(node.track_handle);
  if (!label) return null;
  const inbox = node.track_handle === "inbox";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
        inbox
          ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
          : "bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#BFDBFE]"
      )}
    >
      {label}
    </span>
  );
}

function ProblemRow({
  node,
  anchorTitle,
  onNodesChange,
}: {
  node: GraphNodeRow;
  anchorTitle?: string;
  onNodesChange?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftFocus, setDraftFocus] = useState(node.problem_focus ?? "");
  const [draftSolution, setDraftSolution] = useState(
    node.solution_approach ?? ""
  );
  const [draftPlan, setDraftPlan] = useState(node.resolution_plan ?? "");

  const savePatch = (patch: Partial<GraphNodeRow>) => {
    updateTrackProblem(node.id, patch);
    onNodesChange?.();
  };

  const summary = node.problem_focus || node.title;
  const resolved = isProblemResolved(node);

  return (
    <div
      className={cn(
        "rounded-lg border transition",
        expanded
          ? resolved
            ? "border-emerald-200 bg-emerald-50/20"
            : "border-amber-200 bg-amber-50/30"
          : resolved
            ? "border-[#EEF1F5] bg-white hover:border-emerald-200"
            : node.track_handle === "inbox"
              ? "border-l-4 border-[#EEF1F5] border-l-slate-300 bg-white hover:border-amber-200"
              : "border-l-4 border-[#EEF1F5] border-l-[#93C5FD] bg-white hover:border-amber-200"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">{summary}</p>
          {anchorTitle && (
            <p className="mt-0.5 text-[10px] text-slate-400">{anchorTitle}</p>
          )}
          {!expanded && node.solution_approach && (
            <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">
              {node.solution_approach}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <HandleBadge node={node} />
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              node.archived_at
                ? "bg-slate-100 text-slate-500"
                : resolved
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
            )}
          >
            {node.archived_at
              ? "已归档"
              : resolved
                ? "已解决"
                : "待跟进"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#EEF1F5] px-3 pb-3 pt-2">
          {!editing ? (
            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <p className="text-[10px] font-medium text-slate-500">问题概括</p>
                <p className="mt-0.5">{node.problem_focus || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500">
                  个人想法/方案
                </p>
                <p className="mt-0.5 whitespace-pre-wrap">
                  {node.solution_approach || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500">
                  后续解决规划
                </p>
                <p className="mt-0.5 whitespace-pre-wrap">
                  {node.resolution_plan || "—"}
                </p>
              </div>
              {!resolved && node.track_handle && (
                <p className="text-[10px] text-slate-500">
                  归类：{handleLabel(node.track_handle)}
                </p>
              )}
              {node.loopback_target && !resolved && (
                <p className="text-[10px] text-amber-700">
                  流转目标：{node.loopback_target}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => {
                    setDraftFocus(node.problem_focus ?? "");
                    setDraftSolution(node.solution_approach ?? "");
                    setDraftPlan(node.resolution_plan ?? "");
                    setEditing(true);
                  }}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => {
                    archiveTrackProblem(node.id, !node.archived_at);
                    onNodesChange?.();
                  }}
                >
                  {node.archived_at ? "取消归档" : "归档"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] text-red-500 hover:text-red-600"
                  onClick={() => {
                    if (!confirm("确定删除该问题记录？")) return;
                    deleteTrackProblem(node.id);
                    onNodesChange?.();
                  }}
                >
                  删除
                </Button>
              </div>
            </div>
          ) : (
            <TrackProblemEditor
              node={node}
              anchorTitle={anchorTitle}
              draftFocus={draftFocus}
              draftSolution={draftSolution}
              draftPlan={draftPlan}
              onDraftFocus={setDraftFocus}
              onDraftSolution={setDraftSolution}
              onDraftPlan={setDraftPlan}
              onSave={(patch) => {
                savePatch(patch);
                setEditing(false);
              }}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function TrackProblemsPanel({
  nodes,
  anchorMeta,
  filter,
  showArchived = false,
  onNodesChange,
  compact = false,
  groupByAnchor = false,
  emptyText,
  className,
}: Props) {
  const problems = useMemo(() => {
    let list = nodes.filter((n) => n.node_type === "problem");
    if (!showArchived) {
      list = list.filter((n) => !n.archived_at);
    }
    if (filter) {
      list = list.filter(
        (n) => n.anchor_type === filter.type && n.anchor_id === filter.id
      );
    }
    return list.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [nodes, filter, showArchived]);

  const grouped = useMemo(() => groupProblemsByAnchor(problems), [problems]);

  const sections = useMemo(() => {
    const keys = [...grouped.keys()];
    return keys
      .map((key) => {
        const items = grouped.get(key) ?? [];
        const meta = anchorMeta.get(key);
        return { key, meta, items, open: openProblemCount(items) };
      })
      .sort((a, b) => b.open - a.open || b.items.length - a.items.length);
  }, [grouped, anchorMeta]);

  if (!problems.length) {
    return (
      <Card className={cn("bg-white p-5", className)}>
        <p className="text-center text-sm text-slate-400">
          {emptyText ??
            (filter ? "该来源下暂无问题" : "暂无问题记录 · 点击右上角新增")}
        </p>
      </Card>
    );
  }

  const renderRow = (n: GraphNodeRow) => {
    const meta =
      n.anchor_type && n.anchor_id
        ? anchorMeta.get(anchorKey(n.anchor_type, n.anchor_id))
        : undefined;
    return (
      <ProblemRow
        key={n.id}
        node={n}
        anchorTitle={meta?.title}
        onNodesChange={onNodesChange}
      />
    );
  };

  if (filter || compact || !groupByAnchor) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {problems.map(renderRow)}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {sections.map(({ key, meta, items, open }) => (
        <Card key={key} className="bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">
              {meta?.type === "goal"
                ? "◎"
                : meta?.type === "goal_kr"
                  ? "▸"
                  : "◇"}{" "}
              {meta?.title ?? key}
            </p>
            <span className="text-[10px] text-slate-400">
              {open > 0 && (
                <span className="mr-1 font-medium text-amber-700">
                  {open} 待跟进
                </span>
              )}
              {items.length} 条
            </span>
          </div>
          <div className="space-y-1.5">{items.map(renderRow)}</div>
        </Card>
      ))}
    </div>
  );
}

export function buildAnchorMetaMap(
  groups: {
    ongoingGoals: { type: "goal"; id: string; title: string }[];
    ongoingKrs: { type: "goal_kr"; id: string; title: string }[];
    recentDecisions: { type: "decision"; id: string; title: string }[];
    moreGoals: { type: "goal"; id: string; title: string }[];
    moreKrs: { type: "goal_kr"; id: string; title: string }[];
    moreDecisions: { type: "decision"; id: string; title: string }[];
  }
): Map<string, AnchorMeta> {
  const map = new Map<string, AnchorMeta>();
  const all = [
    ...groups.ongoingGoals,
    ...groups.ongoingKrs,
    ...groups.recentDecisions,
    ...groups.moreGoals,
    ...groups.moreKrs,
    ...groups.moreDecisions,
  ];
  for (const o of all) {
    map.set(anchorKey(o.type, o.id), {
      type: o.type,
      id: o.id,
      title: o.title,
    });
  }
  return map;
}
