"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createGoalChallenge,
  defaultChallengeTarget,
} from "@/lib/goals/challenges";
import type { GoalWithMeta } from "@/lib/goals/storage";

type Props = {
  goals: GoalWithMeta[];
  onCreated: () => void;
  onCancel: () => void;
};

function addDaysStr(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ChallengeCreateCard({ goals, onCreated, onCancel }: Props) {
  const eligibleGoals = useMemo(
    () =>
      goals.filter(
        (g) =>
          g.goal_type !== "pending" &&
          g.execution.key_results.some(
            (k) => k.title.trim() || k.target > 0
          )
      ),
    [goals]
  );

  const [goalId, setGoalId] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(() =>
    addDaysStr(new Date().toISOString().slice(0, 10), 9)
  );
  const [targets, setTargets] = useState<
    Record<string, { enabled: boolean; target: number }>
  >({});

  const selectedGoal = eligibleGoals.find((g) => g.id === goalId);
  const krs =
    selectedGoal?.execution.key_results.filter(
      (k) => k.title.trim() || k.target > 0
    ) ?? [];

  useEffect(() => {
    if (!goalId && eligibleGoals.length > 0) {
      setGoalId(eligibleGoals[0].id);
    }
  }, [eligibleGoals, goalId]);

  useEffect(() => {
    if (!selectedGoal) return;
    const next: Record<string, { enabled: boolean; target: number }> = {};
    for (const kr of krs) {
      next[kr.id] = {
        enabled: true,
        target: defaultChallengeTarget(kr),
      };
    }
    setTargets(next);
  }, [selectedGoal?.id, krs.length]);

  const handleCreate = () => {
    if (!goalId || !title.trim()) return;
    const selected = krs.filter((kr) => targets[kr.id]?.enabled);
    if (selected.length === 0) return;
    createGoalChallenge({
      goalId,
      title: title.trim(),
      start_date: startDate,
      due_date: endDate,
      kr_targets: selected.map((kr) => ({
        linkedKrId: kr.id,
        target: targets[kr.id]?.target ?? defaultChallengeTarget(kr),
      })),
    });
    setTitle("");
    onCreated();
    onCancel();
  };

  if (eligibleGoals.length === 0) {
    return (
      <Card className="border-violet-200 bg-violet-50/40 p-4">
        <p className="text-xs text-violet-800">
          请先创建带 KR 的近期或长期目标，再设立挑战。
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-b from-violet-50/50 to-white p-4">
      <p className="text-xs font-semibold text-violet-800">新建挑战</p>
      <p className="mt-0.5 text-[10px] text-violet-600/80">
        必须关联一个主目标；挑战打卡会同步主目标 KR 进度
      </p>

      <label className="mt-3 block text-xs text-slate-600">
        关联目标 *
        <select
          className="mt-1 w-full rounded-md border border-violet-200 bg-white px-2 py-2 text-sm"
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
        >
          {eligibleGoals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block text-xs text-slate-600">
        挑战名称 *
        <Input
          className="mt-1"
          placeholder="如：十天减脂冲刺"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-600">
          开始日期
          <Input
            type="date"
            className="mt-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-600">
          截止日期
          <Input
            type="date"
            className="mt-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      {krs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-600">
            挑战期 KR 目标量
          </p>
          <ul className="mt-2 space-y-2">
            {krs.map((kr) => (
              <li
                key={kr.id}
                className="flex flex-wrap items-center gap-2 text-xs"
              >
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={targets[kr.id]?.enabled ?? true}
                    onChange={(e) =>
                      setTargets((prev) => ({
                        ...prev,
                        [kr.id]: {
                          enabled: e.target.checked,
                          target:
                            prev[kr.id]?.target ?? defaultChallengeTarget(kr),
                        },
                      }))
                    }
                  />
                  <span className="truncate text-slate-700">
                    {kr.title.trim() || "未命名 KR"}
                  </span>
                </label>
                <Input
                  type="number"
                  min={0.01}
                  step="any"
                  className="h-8 w-24"
                  disabled={!targets[kr.id]?.enabled}
                  value={targets[kr.id]?.target ?? defaultChallengeTarget(kr)}
                  onChange={(e) =>
                    setTargets((prev) => ({
                      ...prev,
                      [kr.id]: {
                        enabled: prev[kr.id]?.enabled ?? true,
                        target: Math.max(
                          0.01,
                          Number(e.target.value) || defaultChallengeTarget(kr)
                        ),
                      },
                    }))
                  }
                />
                <span className="text-slate-400">{kr.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={!title.trim() || !goalId}
          onClick={handleCreate}
        >
          创建挑战
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>
    </Card>
  );
}
