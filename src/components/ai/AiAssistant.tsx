"use client";

import { useState } from "react";
import { AUTH_ENABLED } from "@/lib/config";
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string; links?: { href: string; label: string }[] };

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const body: { message: string; apiKey?: string } = { message: userMsg };
      if (!AUTH_ENABLED) {
        const s = loadLocal<{ openai_api_key?: string }>(LOCAL_KEYS.settings, {});
        if (s.openai_api_key) body.apiKey = s.openai_api_key;
      }
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "请求失败");
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
              : "请在设置页配置 OpenAI API Key 后重试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-lg md:bottom-6"
        aria-label="AI 助手"
      >
        AI
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[min(420px,60vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl md:bottom-24">
          <div className="border-b border-[#E2E8F0] px-4 py-3">
            <p className="text-sm font-medium">AI 助手</p>
            <p className="text-[10px] text-slate-400">对话驱动创建与查询</p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400">
                例如：「帮我创建一个近期目标：三个月内完成产品 MVP」
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "ml-8 bg-[#3B82F6] text-white"
                    : "mr-4 bg-[#F8FAFC] text-[#1E293B]"
                }`}
              >
                {msg.content}
                {msg.links?.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="mt-1 block text-[#3B82F6] underline"
                    onClick={() => setOpen(false)}
                  >
                    → {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-[#E2E8F0] p-2">
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入指令…"
              className="mb-2"
            />
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              disabled={loading}
              onClick={send}
            >
              {loading ? "思考中…" : "发送"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
