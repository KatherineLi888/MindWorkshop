"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncSessionToCookies } from "@/lib/auth/sync-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }

      if (!data.session) {
        setInfo(
          "注册成功。你的项目若开启了「邮箱确认」，请先打开邮件中的链接，再回到登录页登录。"
        );
        return;
      }

      await syncSessionToCookies(data.session);

      if (data.user) {
        await supabase.from("user_settings").upsert({
          user_id: data.user.id,
          display_name: email.split("@")[0],
        });
      }

      const { onAccountLogin } = await import("@/lib/migrate/local-to-cloud");
      await onAccountLogin();

      router.push("/decisions");
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-sm bg-white">
        <h1 className="text-xl font-semibold">注册思绪工坊</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="密码（至少6位）"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          {info && <p className="text-xs text-[#F59E0B]">{info}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "注册中…" : "注册"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          <Link href="/login" className="text-[#3B82F6]">
            返回登录
          </Link>
        </p>
      </Card>
    </div>
  );
}
