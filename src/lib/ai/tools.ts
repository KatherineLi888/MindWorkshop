import type { SupabaseClient } from "@supabase/supabase-js";
import { formatGoalDetailText } from "@/lib/ai/goal-format";
import type { ReviewKind, ReviewRecord } from "@/lib/review/types";
import type { DecisionRow, GoalRow } from "@/types/database";

export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "list_goals",
      description:
        "查询用户目标列表。用户问「有什么目标」「进行中的目标」等时必须调用，不要凭空回答。",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["in_progress", "all"],
            description: "in_progress=进行中（默认），all=全部含待定",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_goal_detail",
      description:
        "读取单个目标的完整信息：KR、子任务、SMART、进度。用户问「子项是啥」「具体要完成什么」「KR」时必须调用，禁止猜测。",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string", description: "目标 id（优先）" },
          goal_title: {
            type: "string",
            description: "目标标题关键词（无 id 时用）",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_review",
      description:
        "创建复盘记录（周期/目标/事件/决策复盘）。用户说「复盘」「创立复盘」「帮我复盘」时必须用此工具，不是 create_decision。",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["period", "goal", "event", "decision"],
            description: "goal=目标复盘（默认，对话在聊某目标时）",
          },
          title: { type: "string", description: "复盘标题" },
          goal_id: { type: "string", description: "关联目标 id（目标复盘时必填）" },
          summary: {
            type: "string",
            description: "复盘引导语或总结草稿（Markdown）",
          },
          questions: {
            type: "array",
            items: { type: "string" },
            description: "复盘问题列表，会写入复盘正文供用户填写",
          },
        },
        required: ["kind", "title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_goal",
      description: "创建新目标（不是复盘）",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          goal_type: { type: "string", enum: ["near", "long", "pending"] },
        },
        required: ["title", "goal_type"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_decision",
      description:
        "创建决策记录草稿（不是复盘！用户要复盘时禁止调用此工具）",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          source: { type: "string", enum: ["active", "passive"] },
        },
        required: ["title", "source"],
      },
    },
  },
] as const;

const GOAL_TYPE_LABEL: Record<GoalRow["goal_type"], string> = {
  near: "近期",
  long: "长期",
  pending: "待定",
};

export type AiLink = { href: string; label: string };

export type AiMutation =
  | {
      type: "create_goal";
      id: string;
      title: string;
      goal_type: GoalRow["goal_type"];
    }
  | {
      type: "create_decision";
      id: string;
      title: string;
      source: DecisionRow["source"];
    }
  | {
      type: "create_review";
      id: string;
      kind: ReviewKind;
      title: string;
      goalId?: string;
      goalTitle?: string;
      summary: string;
    };

export type ToolContext = {
  userId?: string;
  supabase?: SupabaseClient;
  localGoals?: GoalRow[];
  localReviews?: ReviewRecord[];
};

export type ToolResult = {
  content: string;
  links: AiLink[];
  mutations: AiMutation[];
};

function filterGoals(goals: GoalRow[], scope?: string): GoalRow[] {
  if (scope === "all") return goals;
  return goals.filter((g) => g.goal_type !== "pending" && g.progress < 100);
}

function formatGoals(goals: GoalRow[]): string {
  if (!goals.length) return "暂无匹配的目标。";
  return goals
    .map(
      (g) =>
        `- id=${g.id} · ${g.title}（${GOAL_TYPE_LABEL[g.goal_type]}，进度 ${g.progress}%）`
    )
    .join("\n");
}

async function loadAllGoals(ctx: ToolContext): Promise<GoalRow[]> {
  if (ctx.supabase && ctx.userId) {
    const { data } = await ctx.supabase
      .from("goals")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("updated_at", { ascending: false })
      .limit(30);
    const rows = (data as GoalRow[]) ?? [];
    if (rows.length) return rows;
  }
  return ctx.localGoals ?? [];
}

async function resolveGoal(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<GoalRow | null> {
  const goalId = String(args.goal_id ?? "").trim();
  const goalTitle = String(args.goal_title ?? "").trim();
  const goals = await loadAllGoals(ctx);

  if (goalId) {
    return goals.find((g) => g.id === goalId) ?? null;
  }

  if (goalTitle) {
    const exact = goals.find((g) => g.title === goalTitle);
    if (exact) return exact;
    const partial = goals.filter((g) => g.title.includes(goalTitle));
    if (partial.length === 1) return partial[0]!;
    if (partial.length > 1) {
      return null;
    }
  }

  const inProgress = filterGoals(goals);
  if (inProgress.length === 1) return inProgress[0]!;

  return null;
}

function buildReviewSummary(summary: string, questions?: string[]): string {
  const parts: string[] = [];
  if (summary.trim()) parts.push(summary.trim());
  if (questions?.length) {
    parts.push(
      "## 复盘问题\n" +
        questions.map((q, i) => `${i + 1}. ${q.trim()}`).join("\n")
    );
  }
  return parts.join("\n\n") || "（待填写复盘内容）";
}

export async function executeAiTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const links: AiLink[] = [];
  const mutations: AiMutation[] = [];

  if (name === "list_goals") {
    const scope = (args.scope as string) || "in_progress";
    const goals = await loadAllGoals(ctx);
    const filtered = filterGoals(goals, scope);
    return {
      content: formatGoals(filtered),
      links,
      mutations,
    };
  }

  if (name === "get_goal_detail") {
    const goals = await loadAllGoals(ctx);
    const goal = await resolveGoal(args, ctx);

    if (!goal && String(args.goal_title ?? "").trim()) {
      const partial = goals.filter((g) =>
        g.title.includes(String(args.goal_title))
      );
      if (partial.length > 1) {
        return {
          content: `找到多个匹配目标，请指定 goal_id：\n${formatGoals(partial)}`,
          links,
          mutations,
        };
      }
    }

    if (!goal) {
      return {
        content:
          "未找到目标。请先 list_goals 获取 id，或提供准确的 goal_title。",
        links,
        mutations,
      };
    }

    return {
      content: formatGoalDetailText(goal),
      links: [{ href: `/goals?detail=${goal.id}`, label: `打开目标：${goal.title}` }],
      mutations,
    };
  }

  if (name === "create_review") {
    const kind = (args.kind as ReviewKind) || "goal";
    const title = String(args.title ?? "").trim();
    const goalId = String(args.goal_id ?? "").trim() || undefined;
    const questions = Array.isArray(args.questions)
      ? (args.questions as string[]).filter((q) => q.trim())
      : undefined;
    const summary = buildReviewSummary(
      String(args.summary ?? ""),
      questions
    );

    if (!title) {
      return { content: "创建失败：复盘标题为空", links, mutations };
    }

    let goalTitle: string | undefined;
    if (goalId) {
      const goals = await loadAllGoals(ctx);
      goalTitle = goals.find((g) => g.id === goalId)?.title;
    }

    const id = crypto.randomUUID();
    mutations.push({
      type: "create_review",
      id,
      kind,
      title,
      goalId,
      goalTitle,
      summary,
    });
    links.push({
      href: `/review/new?edit=${id}`,
      label: `复盘：${title}`,
    });

    const kindLabel: Record<ReviewKind, string> = {
      period: "周期复盘",
      goal: "目标复盘",
      event: "事件复盘",
      decision: "决策复盘",
    };

    return {
      content: `已成功创建${kindLabel[kind]}「${title}」。问题已写入复盘正文，请点击链接打开填写。`,
      links,
      mutations,
    };
  }

  if (name === "create_goal") {
    const title = String(args.title ?? "").trim();
    const goal_type = args.goal_type as GoalRow["goal_type"];
    if (!title) {
      return { content: "创建失败：标题为空", links, mutations };
    }

    const id = crypto.randomUUID();

    if (ctx.supabase && ctx.userId) {
      const { data, error } = await ctx.supabase
        .from("goals")
        .insert({
          user_id: ctx.userId,
          title,
          goal_type,
          smart_current: {},
        })
        .select("id")
        .single();
      if (error || !data) {
        return {
          content: `创建目标失败：${error?.message ?? "未知错误"}`,
          links,
          mutations,
        };
      }
      links.push({ href: `/goals?id=${data.id}`, label: `目标：${title}` });
      return {
        content: `已创建目标「${title}」（${GOAL_TYPE_LABEL[goal_type]}），请前往 SMART 向导完善。`,
        links,
        mutations,
      };
    }

    mutations.push({ type: "create_goal", id, title, goal_type });
    links.push({ href: `/goals?id=${id}`, label: `目标：${title}` });
    return {
      content: `已创建目标「${title}」（${GOAL_TYPE_LABEL[goal_type]}），请前往 SMART 向导完善。`,
      links,
      mutations,
    };
  }

  if (name === "create_decision") {
    const title = String(args.title ?? "").trim();
    const source = args.source as DecisionRow["source"];
    if (!title) {
      return { content: "创建失败：标题为空", links, mutations };
    }

    const id = crypto.randomUUID();

    if (ctx.supabase && ctx.userId) {
      const { data, error } = await ctx.supabase
        .from("decisions")
        .insert({
          user_id: ctx.userId,
          title,
          source,
          path_summary: "AI 创建草稿",
          final_action: "待完成决策树",
          flow_state: {},
        })
        .select("id")
        .single();
      if (error || !data) {
        return {
          content: `创建决策失败：${error?.message ?? "未知错误"}`,
          links,
          mutations,
        };
      }
      links.push({ href: `/decisions?id=${data.id}`, label: `决策：${title}` });
      return {
        content: `已创建决策草稿「${title}」，请打开完成决策树。`,
        links,
        mutations,
      };
    }

    mutations.push({ type: "create_decision", id, title, source });
    links.push({ href: `/decisions?id=${id}`, label: `决策：${title}` });
    return {
      content: `已创建决策草稿「${title}」，请打开完成决策树。`,
      links,
      mutations,
    };
  }

  return { content: `未知工具：${name}`, links, mutations };
}

export const AI_SYSTEM_PROMPT = `你是思绪工坊 AI 助手，嵌入在个人目标管理应用「思绪工坊」中。用简洁、有帮助的中文回复，使用 Markdown 列表与粗体。

## 能力边界
- 你只能基于系统快照与工具返回的数据回答，不能编造目标/KR/复盘内容
- 用户只有一个或少量进行中目标时，优先围绕该目标回答，并主动引用 KR 名称与进度

## 数据查询（有疑必查）
- 目标列表 → list_goals
- KR、子项、子任务、要完成什么 → get_goal_detail（传 goal_id 或标题）
- 快照不够新或用户质疑时，重新调用工具，不要用旧记忆

## 创建（必须调工具，禁止空口说已创建）
- 「复盘」→ create_review（不是 create_decision）
- 「决策」→ create_decision
- 「目标」→ create_goal
- 创建复盘：title 清晰，questions 放入对话中整理的引导问题

## 回复风格
- 先给结论，再列要点；KR/进度用「- **名称** — 进度/状态」列表，不用表格
- 理解追问：「有啥」「子项呢」「然后呢」承接上一轮话题
- 工具成功后告知用户点击链接继续填写`;
