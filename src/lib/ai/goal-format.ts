import { normalizeExecution } from "@/lib/goals/types";
import type { GoalRow } from "@/types/database";

const GOAL_TYPE_LABEL: Record<GoalRow["goal_type"], string> = {
  near: "近期",
  long: "长期",
  pending: "待定",
};

export function formatGoalDetailText(goal: GoalRow): string {
  const execution = normalizeExecution(goal.execution);
  const lines: string[] = [];

  lines.push(`目标：${goal.title}`);
  lines.push(`id：${goal.id}`);
  lines.push(`类型：${GOAL_TYPE_LABEL[goal.goal_type]}`);
  lines.push(`进度：${goal.progress ?? 0}%`);

  const smart = goal.smart_current;
  if (smart && Object.values(smart).some((v) => v?.trim())) {
    lines.push("SMART：");
    if (smart.specific?.trim()) lines.push(`- 具体：${smart.specific}`);
    if (smart.measurable?.trim()) lines.push(`- 可衡量：${smart.measurable}`);
    if (smart.achievable?.trim()) lines.push(`- 可实现：${smart.achievable}`);
    if (smart.relevant?.trim()) lines.push(`- 相关：${smart.relevant}`);
    if (smart.timeBound?.trim()) lines.push(`- 时限：${smart.timeBound}`);
  }

  const krs = execution.key_results.filter(
    (kr) => kr.title.trim() || kr.target > 0 || (kr.tasks?.length ?? 0) > 0
  );

  if (!krs.length) {
    lines.push("\n关键结果 / 子项：暂无（目标尚未拆解 KR 或任务）");
    return lines.join("\n");
  }

  lines.push(`\n关键结果 / 子项（${krs.length} 个）：`);
  krs.forEach((kr, idx) => {
    const pct =
      kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0;
    const kind = kr.krKind === "qualitative" ? "定性" : "定量";
    lines.push(
      `\n${idx + 1}. ${kr.title || "未命名 KR"}（${kind}，${kr.current}/${kr.target}${kr.unit ? ` ${kr.unit}` : ""}，${pct}%）`
    );

    const tasks = (kr.tasks ?? []).filter((t) => t.title.trim());
    if (tasks.length) {
      lines.push("   子任务：");
      for (const t of tasks) {
        lines.push(`   - ${t.completed ? "✓" : "○"} ${t.title}`);
      }
    }
  });

  return lines.join("\n");
}
