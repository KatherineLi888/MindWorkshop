"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { applyAiMutations } from "@/lib/ai/client-mutations";
import {
  normalizeAiProvider,
  type AiProvider,
} from "@/lib/ai/provider";
import type { AiMutation } from "@/lib/ai/tools";
import { clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from "@/lib/drafts/storage";
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
  const restored = loadDraft<{ messages: Message[] }>(DRAFT_KEYS.aiChat);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(restored?.messages ?? []);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) {
      saveDraft(DRAFT_KEYS.aiChat, { messages });
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--background)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">AI 助手</h1>
          <p className="text-[11px] text-slate-400">对话已自动保存</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
              onClick={() => {
                setMessages([]);
                clearDraft(DRAFT_KEYS.aiChat);
              }}
            >
              清空
            </button>
          )}
          <Link
            href="/settings"
            className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-xs text-slate-600 hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
          >
            API 设置
          </Link>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-500">开始对话</p>
            <p className="mt-2 text-xs text-slate-400">
              例如：「进行中的目标有哪些」「帮我创建目标复盘」
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 sm:max-w-[85%] ${
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
        {loading && <p className="text-xs text-slate-400">思考中…</p>}
      </div>

      <footer className="shrink-0 border-t border-[#E2E8F0] bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <Textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="输入消息…"
            className="max-h-24 min-h-[2.5rem] flex-1 resize-none py-2"
          />
          <Button
            variant="primary"
            size="sm"
            className="mb-0.5 shrink-0"
            disabled={loading || !input.trim()}
            onClick={send}
          >
            发送
          </Button>
        </div>
      </footer>
    </div>
  );
}
