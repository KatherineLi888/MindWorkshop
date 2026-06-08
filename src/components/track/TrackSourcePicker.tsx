"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { cn } from "@/lib/utils";

export type TrackSourceValue = {
  anchorType: "goal" | "decision" | "goal_kr";
  anchorId: string;
  label: string;
};

type Props = {
  value: TrackSourceValue | null;
  onChange: (v: TrackSourceValue | null) => void;
  preset?: Partial<TrackSourceValue>;
  className?: string;
};

type SourceKind = "goal" | "decision";

export function TrackSourcePicker({
  value,
  onChange,
  preset,
  className,
}: Props) {
  const [kind, setKind] = useState<SourceKind | null>(
    preset?.anchorType === "decision"
      ? "decision"
      : preset?.anchorType
        ? "goal"
        : null
  );
  const [search, setSearch] = useState("");
  const [goalId, setGoalId] = useState<string | null>(
    preset?.anchorType === "goal" ? preset.anchorId : null
  );
  const [goals, setGoals] = useState<
    Awaited<ReturnType<typeof loadAllGoals>>
  >([]);
  const [decisions, setDecisions] = useState<
    Awaited<ReturnType<typeof loadAllDecisions>>
  >([]);

  useEffect(() => {
    void loadAllGoals().then(setGoals);
    void loadAllDecisions().then(setDecisions);
  }, []);

  useEffect(() => {
    if (!preset?.anchorType || !preset.anchorId) return;
    if (preset.anchorType === "decision") {
      setKind("decision");
    } else {
      setKind("goal");
      if (preset.anchorType === "goal") setGoalId(preset.anchorId);
    }
  }, [preset?.anchorType, preset?.anchorId]);

  const filteredGoals = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...goals].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    if (!q) return list.slice(0, 30);
    return list
      .filter((g) => g.title.toLowerCase().includes(q))
      .slice(0, 30);
  }, [goals, search]);

  const filteredDecisions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = decisions
      .filter((d) => !d.archived_at)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    if (!q) return list.slice(0, 30);
    return list
      .filter((d) => d.title.toLowerCase().includes(q))
      .slice(0, 30);
  }, [decisions, search]);

  const selectedGoal = goalId ? goals.find((g) => g.id === goalId) : null;
  const krs = selectedGoal?.execution.key_results.filter(
    (k) => k.title.trim() || k.target > 0
  ) ?? [];

  const pickKind = (k: SourceKind) => {
    setKind(k);
    setSearch("");
    setGoalId(null);
    onChange(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
        {(
          [
            ["goal", "目标"],
            ["decision", "决策"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => pickKind(k)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition",
              kind === k
                ? "bg-white text-[#3B82F6] shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {kind && (
        <Input
          className="h-8 text-xs"
          placeholder={kind === "goal" ? "搜索目标…" : "搜索决策…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {kind === "goal" && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-slate-500">选择主 OKR</p>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[#EEF1F5] bg-white p-1">
            {filteredGoals.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11px] text-slate-400">
                暂无匹配目标
              </p>
            ) : (
              filteredGoals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGoalId(g.id);
                    onChange({
                      anchorType: "goal",
                      anchorId: g.id,
                      label: g.title,
                    });
                  }}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-xs transition",
                    value?.anchorType === "goal" && value.anchorId === g.id
                      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                      : goalId === g.id
                        ? "bg-[#EFF6FF] text-slate-800"
                        : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {g.title}
                  <span className="ml-1 text-[10px] text-slate-400">
                    {g.progress}%
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedGoal && krs.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-slate-500">
                可选子 KR（不选则锚定主 OKR）
              </p>
              <div className="mt-1 max-h-28 space-y-1 overflow-y-auto rounded-lg border border-[#EEF1F5] bg-white p-1">
                {krs.map((kr, i) => (
                  <button
                    key={kr.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        anchorType: "goal_kr",
                        anchorId: kr.id,
                        label: `${selectedGoal.title} · ${kr.title.trim() || `KR ${i + 1}`}`,
                      })
                    }
                    className={cn(
                      "w-full rounded-md px-2 py-1 text-left text-[11px] transition",
                      value?.anchorType === "goal_kr" &&
                        value.anchorId === kr.id
                        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {kr.title.trim() || `KR ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {kind === "decision" && (
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#EEF1F5] bg-white p-1">
          {filteredDecisions.length === 0 ? (
            <p className="px-2 py-3 text-center text-[11px] text-slate-400">
              暂无匹配决策
            </p>
          ) : (
            filteredDecisions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() =>
                  onChange({
                    anchorType: "decision",
                    anchorId: d.id,
                    label: d.title,
                  })
                }
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-xs transition",
                  value?.anchorType === "decision" && value.anchorId === d.id
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {d.title}
              </button>
            ))
          )}
        </div>
      )}

      {value && (
        <p className="text-[10px] text-emerald-700">
          已选：{value.label}
        </p>
      )}
    </div>
  );
}
