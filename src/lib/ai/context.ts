import { formatGoalDetailText } from "@/lib/ai/goal-format";
import type { ReviewRecord } from "@/lib/review/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoalRow } from "@/types/database";

const GOAL_TYPE_LABEL: Record<GoalRow["goal_type"], string> = {
  near: "近期",
  long: "长期",
  pending: "待定",
};

function filterInProgress(goals: GoalRow[]): GoalRow[] {
  return goals.filter((g) => g.goal_type !== "pending" && g.progress < 100);
}

async function loadGoals(
  userId: string | undefined,
  supabase: SupabaseClient | undefined,
  localGoals: GoalRow[]
): Promise<GoalRow[]> {
  if (supabase && userId) {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(30);
    return (data as GoalRow[]) ?? [];
  }
  return localGoals;
}

export async function buildAiContextSnapshot(input: {
  userId?: string;
  supabase?: SupabaseClient;
  localGoals?: GoalRow[];
  localReviews?: ReviewRecord[];
}): Promise<string> {
  const goals = await loadGoals(
    input.userId,
    input.supabase,
    input.localGoals ?? []
  );
  const inProgress = filterInProgress(goals);
  const lines: string[] = [];

  if (inProgress.length) {
    lines.push("### 进行中目标");
    for (const g of inProgress.slice(0, 5)) {
      lines.push(
        `- id=${g.id} · ${g.title}（${GOAL_TYPE_LABEL[g.goal_type]}，${g.progress}%）`
      );
      const krs = g.execution?.key_results ?? [];
      const named = krs.filter(
        (kr) => kr.title?.trim() || (kr.tasks?.length ?? 0) > 0
      );
      if (named.length) {
        lines.push(
          `  KR：${named.map((kr) => kr.title || "未命名").join("、")}`
        );
      }
    }
    if (inProgress.length === 1) {
      lines.push("\n### 当前焦点目标详情");
      lines.push(formatGoalDetailText(inProgress[0]!));
    }
  } else {
    lines.push("### 进行中目标：暂无");
  }

  const reviews = (input.localReviews ?? []).slice(0, 5);
  if (reviews.length) {
    lines.push("\n### 最近复盘");
    for (const r of reviews) {
      lines.push(`- [${r.kind}] ${r.title}（id=${r.id}）`);
    }
  }

  lines.push(
    "\n说明：以上为快照；用户追问细节时仍须调用 get_goal_detail / list_goals，不得编造。"
  );

  return lines.join("\n");
}
