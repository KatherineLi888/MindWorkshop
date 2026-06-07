import { NextResponse } from "next/server";
import OpenAI from "openai";
import { AUTH_ENABLED } from "@/lib/config";

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_goal",
      description: "创建目标",
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
      description: "创建决策记录草稿",
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
  {
    type: "function" as const,
    function: {
      name: "list_goals",
      description: "列出用户目标",
      parameters: { type: "object", properties: {} },
    },
  },
];

export async function POST(req: Request) {
  const { message, apiKey: clientKey } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "消息为空" }, { status: 400 });
  }

  let apiKey =
    (typeof clientKey === "string" ? clientKey : undefined) ||
    process.env.OPENAI_API_KEY;

  if (AUTH_ENABLED) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const { data: settings } = await supabase
      .from("user_settings")
      .select("openai_api_key")
      .eq("user_id", user.id)
      .maybeSingle();
    apiKey = settings?.openai_api_key || apiKey;
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "请在设置页填入 OpenAI API Key" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });
  const links: { href: string; label: string }[] = [];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "你是思绪工坊助手。用简洁中文回复。需要创建或查询时用 function calling。创建后告知用户并给出可点击路径。",
      },
      { role: "user", content: message },
    ],
    tools: TOOLS,
    tool_choice: "auto",
  });

  const choice = completion.choices[0];
  let reply =
    choice.message?.content ||
    "已完成操作。";

  const toolCalls = choice.message?.tool_calls;
  if (toolCalls?.length) {
    for (const tc of toolCalls) {
      const fn = tc.function;
      const args = JSON.parse(fn.arguments || "{}");
      if (fn.name === "create_goal" && AUTH_ENABLED) {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data } = await supabase
          .from("goals")
          .insert({
            user_id: user.id,
            title: args.title,
            goal_type: args.goal_type,
            smart_current: {},
          })
          .select("id")
          .single();
        if (data) {
          links.push({ href: `/goals?id=${data.id}`, label: `目标：${args.title}` });
          reply = `已创建目标「${args.title}」。请前往 SMART 向导完善。`;
        }
      }
      if (fn.name === "create_decision" && AUTH_ENABLED) {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data } = await supabase
          .from("decisions")
          .insert({
            user_id: user.id,
            title: args.title,
            source: args.source,
            path_summary: "AI 创建草稿",
            final_action: "待完成决策树",
            flow_state: {},
          })
          .select("id")
          .single();
        if (data) {
          links.push({
            href: `/decisions?id=${data.id}`,
            label: `决策：${args.title}`,
          });
          reply = `已创建决策草稿「${args.title}」，请打开完成决策树。`;
        }
      }
      if (fn.name === "list_goals" && AUTH_ENABLED) {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: goals } = await supabase
          .from("goals")
          .select("title, goal_type")
          .eq("user_id", user.id)
          .limit(10);
        reply = goals?.length
          ? `你的目标：\n${goals.map((g) => `- ${g.title}（${g.goal_type}）`).join("\n")}`
          : "暂无目标。";
      }
    }
  }

  return NextResponse.json({ reply, links });
}
