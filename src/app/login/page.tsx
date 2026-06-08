"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncSessionToCookies } from "@/lib/auth/sync-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/decisions";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(
          err.message.includes("Invalid login")
            ? "邮箱或密码错误"
            : err.message
        );
        return;
      }
      if (!data.session) {
        setError("未获取到登录会话，请确认邮箱是否已验证");
        return;
      }
      await syncSessionToCookies(data.session);
      const { onAccountLogin } = await import("@/lib/migrate/local-to-cloud");
      await onAccountLogin();
      router.push(next);
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm bg-white">
      <Logo variant="lockup" className="h-9" />
      <p className="mt-3 text-sm text-slate-500">登录以同步你的数据</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </Button>
        <p className="text-right">
          <Link href="/forgot-password" className="text-xs text-[#3B82F6]">
            忘记密码？
          </Link>
        </p>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">
        没有账号？{" "}
        <Link href="/register" className="text-[#3B82F6]">
          注册
        </Link>
      </p>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
        若刚注册无法登录：请到 Supabase 控制台关闭「Confirm email」，或先点击邮件中的确认链接。
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Suspense fallback={<p className="text-sm text-slate-400">加载中…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
