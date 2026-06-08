"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncSessionToCookies } from "@/lib/auth/sync-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(presetEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<"otp" | "link">("otp");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setMode("link");
    });
  }, []);

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "recovery",
      });
      if (verifyErr) {
        setError(verifyErr.message);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await syncSessionToCookies(session);
      setInfo("密码已更新，正在跳转…");
      router.push("/home");
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "重置失败");
    } finally {
      setLoading(false);
    }
  };

  const submitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) await syncSessionToCookies(session);
      setInfo("密码已更新，正在跳转…");
      router.push("/home");
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "重置失败");
    } finally {
      setLoading(false);
    }
  };

  const isLinkMode = mode === "link";

  return (
    <Card className="w-full max-w-sm bg-white">
      <h1 className="text-xl font-semibold">设置新密码</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isLinkMode
          ? "你已通过邮件链接验证，请设置新密码"
          : "输入邮件中的验证码和新密码"}
      </p>

      <form
        onSubmit={isLinkMode ? submitLink : submitOtp}
        className="mt-6 space-y-3"
      >
        {!isLinkMode && (
          <>
            <Input
              type="email"
              placeholder="注册邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="text"
              inputMode="numeric"
              placeholder="邮件验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </>
        )}
        <Input
          type="password"
          placeholder="新密码（至少6位）"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="确认新密码"
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {info && <p className="text-xs text-emerald-600">{info}</p>}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "保存中…" : "保存新密码"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/login" className="text-[#3B82F6]">
          返回登录
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Suspense fallback={<p className="text-sm text-slate-400">加载中…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
