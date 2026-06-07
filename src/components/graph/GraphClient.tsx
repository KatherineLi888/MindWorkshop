"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrackAnchorPicker } from "@/components/track/TrackAnchorPicker";
import { TrackProblemEditor } from "@/components/track/TrackProblemEditor";
import {
  TrackProblemsPanel,
  buildAnchorMetaMap,
} from "@/components/track/TrackProblemsPanel";
import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import {
  linkDecisionToTrack,
  linkGoalToTrack,
  linkInboxJumpTarget,
} from "@/lib/flow/jump-actions";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { loadTrackAnchorGroups } from "@/lib/track/anchors";
import { patchTriageTarget } from "@/lib/triage/storage";
import type { GraphNodeRow } from "@/types/database";

function hasAnchor(n: GraphNodeRow): n is GraphNodeRow & {
  anchor_type: "goal" | "decision" | "goal_kr";
  anchor_id: string;
} {
  return !!(n.anchor_type && n.anchor_id);
}

export function GraphClient() {
  const searchParams = useSearchParams();
  const [nodes, setNodes] = useState<GraphNodeRow[]>([]);
  const [selected, setSelected] = useState<GraphNodeRow | null>(null);
  const [anchorPick, setAnchorPick] = useState("");
  const [anchorMeta, setAnchorMeta] = useState(
    () =>
      new Map<
        string,
        { type: "goal" | "decision" | "goal_kr"; id: string; title: string }
      >()
  );
  const [title, setTitle] = useState("");
  const [draftFocus, setDraftFocus] = useState("");
  const [draftSolution, setDraftSolution] = useState("");
  const [draftBackground, setDraftBackground] = useState("");

  const refreshAnchors = useCallback(async () => {
    const groups = await loadTrackAnchorGroups();
    setAnchorMeta(buildAnchorMetaMap(groups));
  }, []);

  const load = useCallback(async () => {
    if (!isCloudEnabled()) {
      setNodes(loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []));
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
    const preset = searchParams.get("title");
    if (preset) setTitle(decodeURIComponent(preset));
    const bg = searchParams.get("background");
    if (bg) setDraftBackground(decodeURIComponent(bg));

    const fromGoal = searchParams.get("fromGoal");
    const fromKr = searchParams.get("fromKr");
    const fromDecision = searchParams.get("fromDecision");
    if (fromGoal) setAnchorPick(`goal:${fromGoal}`);
    if (fromKr) setAnchorPick(`goal_kr:${fromKr}`);
    if (fromDecision) setAnchorPick(`decision:${fromDecision}`);
  }, [searchParams]);

  useEffect(() => {
    if (!selected) return;
    setDraftFocus(selected.problem_focus ?? "");
    setDraftSolution(selected.solution_approach ?? "");
    setDraftBackground(selected.background ?? "");
  }, [selected?.id]);

  const problemNodes = useMemo(
    () => nodes.filter((n) => n.node_type === "problem" && hasAnchor(n)),
    [nodes]
  );

  const legacyNodes = useMemo(
    () => nodes.filter((n) => n.node_type === "problem" && !hasAnchor(n)),
    [nodes]
  );

  const saveNode = (patch: Partial<GraphNodeRow>) => {
    if (!selected) return;
    const now = new Date().toISOString();
    const next = { ...selected, ...patch, updated_at: now };
    if (!isCloudEnabled()) {
      const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
      saveLocal(
        LOCAL_KEYS.graphNodes,
        prev.map((n) => (n.id === next.id ? next : n))
      );
      setNodes((list) => list.map((n) => (n.id === next.id ? next : n)));
      setSelected(next);
    }
  };

  const addNode = async () => {
    if (!title.trim() || !anchorPick) return;
    const [anchorType, anchorId] = anchorPick.split(":") as [
      "goal" | "decision" | "goal_kr",
      string,
    ];
    const now = new Date().toISOString();
    const bgParam = searchParams.get("background");

    if (!isCloudEnabled()) {
      const row: GraphNodeRow = {
        id: crypto.randomUUID(),
        user_id: "local",
        title: title.trim(),
        node_type: "problem",
        background: bgParam ? decodeURIComponent(bgParam) : draftBackground,
        problem_focus: draftFocus.trim() || title.trim(),
        solution_approach: draftSolution.trim(),
        anchor_type: anchorType,
        anchor_id: anchorId,
        resolved: false,
        loopback_target: null,
        status: "tracking",
        position_x: 0,
        position_y: 0,
        created_at: now,
        updated_at: now,
      };

      const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
      const fromInbox = searchParams.get("fromInbox");

      if (anchorType === "goal") {
        await linkGoalToTrack(anchorId, row.id);
      } else {
        await linkDecisionToTrack(anchorId, row.id);
      }
      if (fromInbox) {
        await linkInboxJumpTarget(fromInbox, "track", "graph_node", row.id);
      }

      saveLocal(LOCAL_KEYS.graphNodes, [...prev, row]);
      setNodes([...prev, row]);
      registerFlowEntry("graph_node", row.id, "track");
      if (triageId) patchTriageTarget(triageId, "graph_node", row.id);

      setTitle("");
      setDraftFocus("");
      setDraftSolution("");
      setDraftBackground("");
      setSelected(row);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("graph_nodes").insert({
      user_id: user.id,
      title: title.trim(),
      node_type: "problem",
      status: "tracking",
      position_x: 0,
      position_y: 0,
    });
    setTitle("");
    load();
  };

  const selectedAnchorTitle =
    selected && hasAnchor(selected)
      ? anchorMeta.get(`${selected.anchor_type}:${selected.anchor_id}`)?.title
      : undefined;

  const exportRows = problemNodes.map((n) => ({
    标题: n.title,
    问题导向: n.problem_focus ?? "",
    解决思路: n.solution_approach ?? "",
    锚定类型: n.anchor_type,
    已解决: n.resolved ? "是" : "否",
    回转: n.loopback_target ?? "",
    状态: n.status,
  }));

  const canSubmit = title.trim().length > 0 && anchorPick.length > 0;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="追踪"
        description="以问题为导向：每条记录必须锚定目标或决策；可记录解决思路，未解决时可选择回转思考、决策或目标。"
        actions={
          <ExportExcelButton
            rows={exportRows}
            fileName="track.xlsx"
            sheetName="追踪"
          />
        }
      />

      {triageId && <OriginFlashPanel triageId={triageId} />}

      <Card className="bg-white p-4">
        <p className="text-xs font-medium text-slate-700">记录新问题</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          先选锚定来源，再填写问题与解决思路
        </p>

        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-medium text-slate-600">
            1. 锚定来源 <span className="text-amber-600">*</span>
          </p>
          <TrackAnchorPicker
            value={anchorPick}
            onChange={(type, id) => setAnchorPick(`${type}:${id}`)}
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-medium text-slate-600">
            2. 问题与思路
          </p>
          <Input
            placeholder="问题标题 *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="问题导向（可选，默认同标题）"
            value={draftFocus}
            onChange={(e) => setDraftFocus(e.target.value)}
          />
          <Textarea
            placeholder="解决思路（打算怎么处理、或已尝试的做法）"
            value={draftSolution}
            onChange={(e) => setDraftSolution(e.target.value)}
            rows={2}
          />
        </div>

        <div className="mt-3">
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            onClick={addNode}
          >
            + 记录问题
          </Button>
          {!anchorPick && (
            <p className="mt-1.5 text-[10px] text-amber-700">
              请先选择目标或决策作为锚定来源
            </p>
          )}
        </div>
      </Card>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">
          问题列表（按来源分组）
        </p>
        <TrackProblemsPanel
          nodes={problemNodes}
          anchorMeta={anchorMeta}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
      </div>

      {legacyNodes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 p-3">
          <p className="text-xs text-amber-800">
            有 {legacyNodes.length} 条旧记录未锚定来源，请逐条编辑并关联目标或决策。
          </p>
        </Card>
      )}

      {selected && hasAnchor(selected) && (
        <TrackProblemEditor
          node={selected}
          anchorTitle={selectedAnchorTitle}
          draftFocus={draftFocus}
          draftSolution={draftSolution}
          draftBackground={draftBackground}
          onDraftFocus={setDraftFocus}
          onDraftSolution={setDraftSolution}
          onDraftBackground={setDraftBackground}
          onSave={saveNode}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
