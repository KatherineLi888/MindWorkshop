"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TrackProblemsPanel,
  buildAnchorMetaMap,
} from "@/components/track/TrackProblemsPanel";
import {
  TrackProblemWizardDialog,
} from "@/components/track/TrackProblemWizardDialog";
import { loadTrackAnchorGroups } from "@/lib/track/anchors";
import { loadAllTrackProblems } from "@/lib/track/save-problem";
import type { GraphNodeRow } from "@/types/database";

type Props = {
  anchorType: "goal" | "decision" | "goal_kr";
  anchorId: string;
  anchorTitle: string;
};

export function AnchorTrackSection({
  anchorType,
  anchorId,
  anchorTitle,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [nodes, setNodes] = useState<GraphNodeRow[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [anchorMeta, setAnchorMeta] = useState(
    () => new Map<string, { type: "goal" | "decision" | "goal_kr"; id: string; title: string }>()
  );

  const load = useCallback(() => {
    setNodes(loadAllTrackProblems());
  }, []);

  useEffect(() => {
    load();
    loadTrackAnchorGroups().then((g) => setAnchorMeta(buildAnchorMetaMap(g)));
  }, [load]);

  const related = nodes.filter(
    (n) =>
      n.node_type === "problem" &&
      !n.archived_at &&
      n.anchor_type === anchorType &&
      n.anchor_id === anchorId
  );
  const openCount = related.filter((n) => !n.resolved).length;

  return (
    <div className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-medium text-slate-700">
          追踪问题
          {openCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              {openCount} 待处理
            </span>
          )}
        </span>
        <span className="text-[10px] text-slate-400">
          {expanded ? "收起" : `展开 (${related.length})`}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-[#EEF1F5] px-3 pb-3 pt-2">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-[10px]"
              onClick={() => setWizardOpen(true)}
            >
              + 新增问题
            </Button>
          </div>

          <TrackProblemsPanel
            nodes={nodes}
            anchorMeta={anchorMeta}
            filter={{ type: anchorType, id: anchorId }}
            onNodesChange={load}
            compact
          />

          {related.length === 0 && (
            <p className="py-1 text-center text-[11px] text-slate-400">
              暂无问题 · 点击新增绑定到「{anchorTitle}」
            </p>
          )}
        </div>
      )}

      <TrackProblemWizardDialog
        open={wizardOpen}
        preset={{ anchorType, anchorId }}
        onClose={() => setWizardOpen(false)}
        onSaved={() => {
          load();
          setWizardOpen(false);
        }}
      />
    </div>
  );
}
