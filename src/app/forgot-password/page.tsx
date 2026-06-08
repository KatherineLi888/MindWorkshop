"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${origin}/reset-password` }
      );
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-sm bg-white">
        <h1 className="text-xl font-semibold">找回密码</h1>
        <p className="mt-1 text-sm text-slate-500">
          输入注册邮箱，我们将发送验证码或重置链接
        </p>

        {sent ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-emerald-700">
              邮件已发送至 <strong>{email}</strong>。请查收验证码，或点击邮件中的链接。
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
              <Button variant="primary" className="w-full">
                输入验证码并重置密码
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Input
              type="email"
              placeholder="注册邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "发送中…" : "发送重置邮件"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
          <Link href="/login" className="text-[#3B82F6]">
            返回登录
          </Link>
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          若使用验证码：请在 Supabase 控制台将「重置密码」邮件模板改为 OTP 模式。
        </p>
      </Card>
    </div>
  );
}
