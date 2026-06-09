"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { applyAiMutations } from "@/lib/ai/client-mutations";
import {
  normalizeAiProvider,
  type AiProvider,
} from "@/lib/ai/provider";
import type { AiMutation } from "@/lib/ai/tools";
import { AUTH_ENABLED } from "@/lib/config";
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { loadReviewRecords } from "@/lib/review/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { GoalRow } from "@/types/database";

type Message = {
  role: "user" | "assistant";
  content: string;
  links?: { href: string; label: string }[];
};

export function AiChatClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const body: {
        message: string;
        apiKey?: string;
        apiProvider?: AiProvider;
        history?: { role: "user" | "assistant"; content: string }[];
        localGoals?: GoalRow[];
        localReviews?: ReturnType<typeof loadReviewRecords>;
      } = {
        message: userMsg,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        localGoals: loadLocal<GoalRow[]>(LOCAL_KEYS.goals, []),
        localReviews: loadReviewRecords(),
      };

      if (!AUTH_ENABLED) {
        const s = loadLocal<{
          openai_api_key?: string;
          ai_provider?: string;
        }>(LOCAL_KEYS.settings, {});
        if (s.openai_api_key) body.apiKey = s.openai_api_key;
        body.apiProvider = normalizeAiProvider(s.ai_provider);
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "请求失败");

      const mutations = (data.mutations as AiMutation[] | undefined) ?? [];
      if (mutations.length) applyAiMutations(mutations);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          links: data.links,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error
              ? e.message
              : "请在设置页配置 AI API Key 后重试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-3 lg:px-6">
        <PageHeader
          title="AI 助手"
          description="查目标、读 KR、创建复盘与决策。请先确保设置页已配置 API Key。"
          actions={
            <Link
              href="/settings"
              className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-xs text-slate-600 hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
            >
              API 设置
            </Link>
          }
        />
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 lg:px-6"
      >
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white px-4 py-10 text-center">
            <p className="text-sm text-slate-500">开始对话</p>
            <p className="mt-2 text-xs text-slate-400">
              例如：「进行中的目标有哪些」「子项是什么」「帮我创建目标复盘」
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-3xl rounded-xl px-4 py-3 ${
              msg.role === "user"
                ? "ml-auto bg-[#3B82F6] text-white"
                : "mr-auto border border-[#EEF1F5] bg-white text-[#1E293B]"
            }`}
          >
            {msg.role === "assistant" ? (
              <MarkdownContent source={msg.content} className="!text-sm" />
            ) : (
              <p className="text-sm leading-relaxed">{msg.content}</p>
            )}
            {msg.links?.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="mt-2 block text-sm text-[#3B82F6] underline"
              >
                → {l.label}
              </Link>
            ))}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-400">思考中…</p>
        )}
      </div>

      <div className="shrink-0 border-t border-[#E2E8F0] bg-white p-4 lg:px-6">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="输入指令…（Enter 发送，Shift+Enter 换行）"
            className="min-h-0 flex-1"
          />
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 self-end"
            disabled={loading || !input.trim()}
            onClick={send}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
