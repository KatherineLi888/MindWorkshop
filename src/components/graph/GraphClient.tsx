"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrackProblemsPanel,
  buildAnchorMetaMap,
} from "@/components/track/TrackProblemsPanel";
import {
  TrackProblemWizardDialog,
  type TrackWizardPreset,
} from "@/components/track/TrackProblemWizardDialog";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { MODULE_INTRO } from "@/lib/module-copy";
import { Button } from "@/components/ui/button";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import { loadTrackAnchorGroups } from "@/lib/track/anchors";
import { isProblemActive, isProblemResolved } from "@/lib/track/problem-status";
import { loadAllTrackProblems } from "@/lib/track/save-problem";
import type { GraphNodeRow } from "@/types/database";

function hasAnchor(n: GraphNodeRow): boolean {
  return !!(n.anchor_type && n.anchor_id);
}

export function GraphClient() {
  const searchParams = useSearchParams();
  const [nodes, setNodes] = useState<GraphNodeRow[]>([]);
  const [anchorMeta, setAnchorMeta] = useState(
    () =>
      new Map<
        string,
        { type: "goal" | "decision" | "goal_kr"; id: string; title: string }
      >()
  );
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPreset, setWizardPreset] = useState<TrackWizardPreset>({});
  const [showArchived, setShowArchived] = useState(false);

  const refreshAnchors = useCallback(async () => {
    const groups = await loadTrackAnchorGroups();
    setAnchorMeta(buildAnchorMetaMap(groups));
  }, []);

  const load = useCallback(async () => {
    if (!isCloudEnabled()) {
      setNodes(loadAllTrackProblems());
      await refreshAnchors();
      return;
    }
    const supabase = createClient();
    const { data: n } = await supabase.from("graph_nodes").select("*");
    setNodes((n as GraphNodeRow[]) ?? []);
    await refreshAnchors();
  }, [refreshAnchors]);

  useEffect(() => {
    load();
  }, [load]);

  const triageId = searchParams.get("triage");

  useEffect(() => {
    const fromGoal = searchParams.get("fromGoal");
    const fromKr = searchParams.get("fromKr");
    const fromDecision = searchParams.get("fromDecision");
    if (searchParams.get("new") === "1") {
      setWizardOpen(true);
    } else if (fromGoal || fromKr || fromDecision) {
      setWizardPreset({
        anchorType: fromKr
          ? "goal_kr"
          : fromGoal
            ? "goal"
            : "decision",
        anchorId: (fromKr || fromGoal || fromDecision)!,
      });
      setWizardOpen(true);
    }
  }, [searchParams]);

  const problemNodes = useMemo(
    () => nodes.filter((n) => n.node_type === "problem" && hasAnchor(n)),
    [nodes]
  );

  const activeProblems = useMemo(
    () =>
      problemNodes.filter(
        (n) =>
          isProblemActive(n) && (showArchived || !n.archived_at)
      ),
    [problemNodes, showArchived]
  );

  const resolvedProblems = useMemo(
    () =>
      problemNodes.filter(
        (n) =>
          isProblemResolved(n) && (showArchived || !n.archived_at)
      ),
    [problemNodes, showArchived]
  );

  const legacyNodes = useMemo(
    () => nodes.filter((n) => n.node_type === "problem" && !hasAnchor(n)),
    [nodes]
  );

  const exportRows = problemNodes.map((n) => ({
    问题概括: n.problem_focus ?? "",
    个人想法: n.solution_approach ?? "",
    解决规划: n.resolution_plan ?? "",
    锚定类型: n.anchor_type,
    办结状态: n.resolved ? "已解决" : "待跟进",
    归类: n.resolved ? "" : n.track_handle === "inbox" ? "收集箱" : "立即处理",
    回转: n.loopback_target ?? "",
    状态: n.status,
  }));

  const openWizard = (preset?: TrackWizardPreset) => {
    setWizardPreset(preset ?? {});
    setWizardOpen(true);
  };

  const refreshList = () => {
    if (!isCloudEnabled()) {
      setNodes(loadAllTrackProblems());
    } else {
      void load();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:max-w-4xl lg:p-6">
      <PageHeader
        title="问题追踪"
        description={MODULE_INTRO.graph}
        actions={
          <div className="flex items-center gap-2">
            <ExportExcelButton
              rows={exportRows}
              fileName="track.xlsx"
              sheetName="追踪"
            />
            <button
              type="button"
              title="新增问题"
              onClick={() => openWizard()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-lg text-[#3B82F6] shadow-sm transition hover:border-[#3B82F6]/40 hover:bg-[#EFF6FF]"
            >
              +
            </button>
          </div>
        }
      />

      <TrackProblemWizardDialog
        open={wizardOpen}
        preset={wizardPreset}
        onClose={() => setWizardOpen(false)}
        onSaved={refreshList}
      />

      {triageId && <OriginFlashPanel triageId={triageId} />}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          待跟进 {activeProblems.length} 条 · 已解决 {resolvedProblems.length} 条
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[10px]"
          onClick={() => setShowArchived((s) => !s)}
        >
          {showArchived ? "隐藏归档" : "显示归档"}
        </Button>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F5] pb-1.5">
          <h2 className="text-sm font-semibold text-slate-800">进行中的问题</h2>
          <span className="text-[10px] text-slate-400">{activeProblems.length} 条</span>
        </div>
        <TrackProblemsPanel
          nodes={activeProblems}
          anchorMeta={anchorMeta}
          showArchived={showArchived}
          onNodesChange={refreshList}
          emptyText="暂无待跟进问题"
        />
      </section>

      <section className="space-y-2 pt-2">
        <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F5] pb-1.5">
          <h2 className="text-sm font-semibold text-slate-800">已解决的问题</h2>
          <span className="text-[10px] text-slate-400">{resolvedProblems.length} 条</span>
        </div>
        <TrackProblemsPanel
          nodes={resolvedProblems}
          anchorMeta={anchorMeta}
          showArchived={showArchived}
          onNodesChange={refreshList}
          emptyText="暂无已解决问题"
        />
      </section>

      {legacyNodes.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs text-amber-800">
          有 {legacyNodes.length} 条旧记录未锚定来源，请编辑后重新关联。
        </p>
      )}
    </div>
  );
}
