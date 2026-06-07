"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrackProblemEditor } from "@/components/track/TrackProblemEditor";
import { TrackProblemsPanel } from "@/components/track/TrackProblemsPanel";
import { createLocalTrackProblem } from "@/lib/track/create-problem";
import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
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
  const [selected, setSelected] = useState<GraphNodeRow | null>(null);
  const [draftFocus, setDraftFocus] = useState("");
  const [draftSolution, setDraftSolution] = useState("");
  const [draftBackground, setDraftBackground] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setNodes(loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const related = nodes.filter(
    (n) =>
      n.node_type === "problem" &&
      n.anchor_type === anchorType &&
      n.anchor_id === anchorId
  );
  const openCount = related.filter((n) => !n.resolved).length;

  useEffect(() => {
    if (!selected) return;
    setDraftFocus(selected.problem_focus ?? "");
    setDraftSolution(selected.solution_approach ?? "");
    setDraftBackground(selected.background ?? "");
  }, [selected?.id]);

  const saveNode = (patch: Partial<GraphNodeRow>) => {
    if (!selected) return;
    const now = new Date().toISOString();
    const next = { ...selected, ...patch, updated_at: now };
    const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
    saveLocal(
      LOCAL_KEYS.graphNodes,
      prev.map((n) => (n.id === next.id ? next : n))
    );
    setNodes((list) => list.map((n) => (n.id === next.id ? next : n)));
    setSelected(next);
  };

  const addProblem = () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const row = createLocalTrackProblem({
        title: newTitle.trim(),
        anchorType,
        anchorId,
      });
      setNodes((list) => [...list, row]);
      setNewTitle("");
      setSelected(row);
    } finally {
      setAdding(false);
    }
  };

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
          <div className="flex gap-1.5">
            <Input
              placeholder="快速记录问题…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") addProblem();
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!newTitle.trim() || adding}
              onClick={addProblem}
              className="h-8 shrink-0 px-2 text-xs"
            >
              添加
            </Button>
          </div>

          <TrackProblemsPanel
            nodes={nodes}
            anchorMeta={new Map()}
            filter={{ type: anchorType, id: anchorId }}
            selectedId={selected?.id}
            onSelect={setSelected}
            compact
          />
          {selected && (
            <TrackProblemEditor
              node={selected}
              anchorTitle={anchorTitle}
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
          {related.length === 0 && !newTitle && (
            <p className="py-1 text-center text-[11px] text-slate-400">
              暂无问题 · 上方输入标题即可绑定到「{anchorTitle}」
            </p>
          )}
        </div>
      )}
    </div>
  );
}
