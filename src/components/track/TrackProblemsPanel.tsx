"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { anchorKey } from "@/lib/track/anchors";
import {
  groupProblemsByAnchor,
  openProblemCount,
} from "@/lib/track/problems";
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
  selectedId?: string | null;
  onSelect: (node: GraphNodeRow) => void;
  compact?: boolean;
  className?: string;
};

function ProblemRow({
  node,
  selected,
  onSelect,
}: {
  node: GraphNodeRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-left transition",
        selected
          ? "border-[#F59E0B] bg-amber-50/60"
          : "border-[#EEF1F5] bg-white hover:border-amber-200"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{node.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
            node.resolved
              ? "bg-emerald-50 text-emerald-700"
              : node.loopback_target
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600"
          )}
        >
          {node.resolved
            ? "已解决"
            : node.loopback_target
              ? "待回转"
              : "跟进中"}
        </span>
      </div>
      {node.problem_focus && node.problem_focus !== node.title && (
        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
          {node.problem_focus}
        </p>
      )}
      {node.solution_approach && (
        <p className="mt-1 line-clamp-2 text-[10px] text-slate-400">
          思路：{node.solution_approach}
        </p>
      )}
    </button>
  );
}

export function TrackProblemsPanel({
  nodes,
  anchorMeta,
  filter,
  selectedId,
  onSelect,
  compact = false,
  className,
}: Props) {
  const problems = useMemo(() => {
    const list = nodes.filter((n) => n.node_type === "problem");
    if (!filter) return list;
    return list.filter(
      (n) => n.anchor_type === filter.type && n.anchor_id === filter.id
    );
  }, [nodes, filter]);

  const grouped = useMemo(() => groupProblemsByAnchor(problems), [problems]);

  const sections = useMemo(() => {
    const keys = [...grouped.keys()];
    return keys
      .map((key) => {
        const items = grouped.get(key) ?? [];
        const meta = anchorMeta.get(key);
        return {
          key,
          meta,
          items,
          open: openProblemCount(items),
        };
      })
      .sort((a, b) => b.open - a.open || b.items.length - a.items.length);
  }, [grouped, anchorMeta]);

  if (!problems.length) {
    return (
      <Card className={cn("bg-white p-4", className)}>
        <p className="text-center text-sm text-slate-400">
          {filter ? "该来源下暂无追踪问题" : "暂无追踪问题，请先选择来源并记录"}
        </p>
      </Card>
    );
  }

  if (filter || compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {problems.map((n) => (
          <ProblemRow
            key={n.id}
            node={n}
            selected={selectedId === n.id}
            onSelect={() => onSelect(n)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {sections.map(({ key, meta, items, open }) => (
        <Card key={key} className="bg-white p-3">
          <div className="flex items-center justify-between gap-2">
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
                  {open} 待处理
                </span>
              )}
              共 {items.length} 条
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {items.map((n) => (
              <ProblemRow
                key={n.id}
                node={n}
                selected={selectedId === n.id}
                onSelect={() => onSelect(n)}
              />
            ))}
          </div>
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
