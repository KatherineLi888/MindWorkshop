import { NextResponse } from "next/server";
import type OpenAI from "openai";
import { buildAiContextSnapshot } from "@/lib/ai/context";
import {
  aiKeyMissingMessage,
  aiModelFor,
  createAiClient,
  normalizeAiProvider,
  resolveEnvApiKey,
  type AiProvider,
} from "@/lib/ai/provider";
import {
  AI_SYSTEM_PROMPT,
  AI_TOOLS,
  executeAiTool,
  type AiLink,
  type AiMutation,
} from "@/lib/ai/tools";
import { AUTH_ENABLED } from "@/lib/config";
import type { ReviewRecord } from "@/lib/review/types";
import type { GoalRow } from "@/types/database";

type HistoryMessage = { role: "user" | "assistant"; content: string };

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY = 24;

export async function POST(req: Request) {
  const body = await req.json();
  const message = body.message as string | undefined;
  const clientKey = body.apiKey as string | undefined;
  const clientProvider = body.apiProvider as string | undefined;
  const history = (body.history as HistoryMessage[] | undefined) ?? [];
  const localGoals = (body.localGoals as GoalRow[] | undefined) ?? [];
  const localReviews = (body.localReviews as ReviewRecord[] | undefined) ?? [];

  if (!message?.trim()) {
    return NextResponse.json({ error: "消息为空" }, { status: 400 });
  }

  let provider: AiProvider = normalizeAiProvider(clientProvider);
  let apiKey =
    (typeof clientKey === "string" && clientKey.trim() ? clientKey : undefined) ||
    resolveEnvApiKey(provider);

  let userId: string | null = null;
  let supabase: Awaited<
    ReturnType<(typeof import("@/lib/supabase/server"))["createClient"]>
  > | null = null;

  if (AUTH_ENABLED) {
    const { createClient } = await import("@/lib/supabase/server");
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    userId = user.id;
    const { data: settings } = await supabase
      .from("user_settings")
      .select("openai_api_key, ai_provider")
      .eq("user_id", user.id)
      .maybeSingle();
    provider = normalizeAiProvider(settings?.ai_provider ?? provider);
    apiKey =
      settings?.openai_api_key ||
      resolveEnvApiKey(provider) ||
      apiKey;
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: aiKeyMissingMessage(provider) },
      { status: 400 }
    );
  }

  const client = createAiClient(apiKey, provider);
  const links: AiLink[] = [];
  const mutations: AiMutation[] = [];

  const contextSnapshot = await buildAiContextSnapshot({
    userId: userId ?? undefined,
    supabase: supabase ?? undefined,
    localGoals,
    localReviews,
  });

  const prior = history
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-MAX_HISTORY);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${AI_SYSTEM_PROMPT}\n\n## 当前数据快照\n${contextSnapshot}`,
    },
    ...prior.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message.trim() },
  ];

  let reply = "抱歉，我暂时无法回答。";
  let toolsRan = false;

  const toolCtx = {
    userId: userId ?? undefined,
    supabase: supabase ?? undefined,
    localGoals,
    localReviews,
  };

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await client.chat.completions.create({
      model: aiModelFor(provider),
      messages,
      tools: [...AI_TOOLS],
      tool_choice: "auto",
    });

    const choice = completion.choices[0]?.message;
    if (!choice) break;

    const toolCalls = choice.tool_calls;
    if (!toolCalls?.length) {
      if (!toolsRan) {
        reply = choice.content?.trim() || reply;
      }
      break;
    }

    toolsRan = true;
    messages.push(choice);

    for (const tc of toolCalls) {
      if (tc.type !== "function") continue;
      const fn = tc.function;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(fn.arguments || "{}");
      } catch {
        args = {};
      }

      const result = await executeAiTool(fn.name, args, toolCtx);
      links.push(...result.links);
      mutations.push(...result.mutations);

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result.content,
      });
    }
  }

  if (toolsRan) {
    const final = await client.chat.completions.create({
      model: aiModelFor(provider),
      messages,
    });
    reply = final.choices[0]?.message?.content?.trim() || reply;
  }

  const claimsCreated = /已创建|已帮你创建|创建成功|已创立/.test(reply);
  const didCreate = mutations.length > 0;
  if (claimsCreated && !didCreate) {
    reply +=
      "\n\n⚠️ 本次可能未真正写入系统。请再说一次具体操作（如「帮我创建目标复盘」），我会执行创建。";
  }

  return NextResponse.json({ reply, links, mutations });
}
