import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import type { KeyResult } from "./types";

export type ChallengeKrTarget = {
  id: string;
  linkedKrId: string;
  /** 挑战期内该 KR 的目标量 */
  target: number;
  current: number;
};

export type GoalChallenge = {
  id: string;
  goalId: string;
  title: string;
  start_date: string;
  due_date: string;
  kr_targets: ChallengeKrTarget[];
  created_at: string;
  updated_at: string;
};

export function loadGoalChallenges(): GoalChallenge[] {
  return loadLocal<GoalChallenge[]>(LOCAL_KEYS.goalChallenges, []);
}

export function saveGoalChallenges(list: GoalChallenge[]) {
  saveLocal(LOCAL_KEYS.goalChallenges, list);
}

export function challengesForGoal(goalId: string): GoalChallenge[] {
  return loadGoalChallenges()
    .filter((c) => c.goalId === goalId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export function computeChallengeProgress(ch: GoalChallenge): number {
  const valid = ch.kr_targets.filter((t) => t.target > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce(
    (acc, t) => acc + Math.min(100, Math.round((t.current / t.target) * 100)),
    0
  );
  return Math.round(sum / valid.length);
}

/** 挑战是否仍在进行中 */
export function isChallengeActive(ch: GoalChallenge): boolean {
  return computeChallengeProgress(ch) < 100;
}

function recordDeltaForKr(kr: KeyResult, inputValue: number): number {
  if (kr.recordMode === "count" || kr.recordMode === "consume") return 1;
  if (kr.recordMode === "accumulate") return inputValue;
  return inputValue;
}

export { recordDeltaForKr };

export function updateGoalChallenge(ch: GoalChallenge): GoalChallenge[] {
  const prev = loadGoalChallenges();
  const next = prev.map((c) => (c.id === ch.id ? ch : c));
  saveGoalChallenges(next);
  return next;
}

export function bumpChallengeItem(
  challenge: GoalChallenge,
  targetItemId: string,
  delta: number
): GoalChallenge {
  return {
    ...challenge,
    updated_at: new Date().toISOString(),
    kr_targets: challenge.kr_targets.map((t) =>
      t.id === targetItemId
        ? { ...t, current: Math.max(0, t.current + delta) }
        : t
    ),
  };
}

export function createGoalChallenge(input: {
  goalId: string;
  title: string;
  start_date: string;
  due_date: string;
  kr_targets: { linkedKrId: string; target: number }[];
}): GoalChallenge[] {
  const now = new Date().toISOString();
  const ch: GoalChallenge = {
    id: crypto.randomUUID(),
    goalId: input.goalId,
    title: input.title.trim(),
    start_date: input.start_date,
    due_date: input.due_date,
    kr_targets: input.kr_targets.map((t) => ({
      id: crypto.randomUUID(),
      linkedKrId: t.linkedKrId,
      target: Math.max(0.01, t.target),
      current: 0,
    })),
    created_at: now,
    updated_at: now,
  };
  const prev = loadGoalChallenges();
  const next = [ch, ...prev];
  saveGoalChallenges(next);
  return next;
}

export function deleteGoalChallenge(challengeId: string): GoalChallenge[] {
  const next = loadGoalChallenges().filter((c) => c.id !== challengeId);
  saveGoalChallenges(next);
  return next;
}

/** 构建新挑战时从主目标 KR 复制默认目标（可再编辑） */
export function defaultChallengeTarget(kr: KeyResult): number {
  return kr.target > 0 ? kr.target : 1;
}
