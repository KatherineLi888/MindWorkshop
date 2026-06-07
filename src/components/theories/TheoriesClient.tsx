"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { theoryDisplayTitle } from "@/lib/theories/helpers";
import {
  THEORY_INTENT_LABELS,
  THEORY_STATUS_COLORS,
  THEORY_STATUS_LABELS,
} from "@/lib/theories/labels";
import type { TheoryIntent, TheoryStatus } from "@/lib/theories/types";
import { useTheories } from "./TheoriesContext";

const STATUS_FILTER: (TheoryStatus | "all" | "active")[] = [
  "all",
  "active",
  "captured",
  "verifying",
  "validated",
  "refuted",
  "promoted",
];

const ACTIVE_STATUSES: TheoryStatus[] = ["captured", "verifying", "validated"];

export function TheoriesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const triageId = searchParams.get("triage");
  const triageTitle = searchParams.get("title");
  const { theories, addTheory } = useTheories();

  const [statusFilter, setStatusFilter] = useState<
    TheoryStatus | "all" | "active"
  >("active");
  const [creating, setCreating] = useState(Boolean(triageTitle));
  const [title, setTitle] = useState(triageTitle ?? "");
  const [statement, setStatement] = useState("");
  const [source, setSource] = useState("");
  const [intent, setIntent] = useState<TheoryIntent>("observe");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return theories;
    if (statusFilter === "active") {
      return theories.filter((t) => ACTIVE_STATUSES.includes(t.status));
    }
    return theories.filter((t) => t.status === statusFilter);
  }, [theories, statusFilter]);

  const handleCreate = () => {
    if (!statement.trim()) return;
    const created = addTheory({
      title: title.trim() || statement.trim().slice(0, 36),
      statement: statement.trim(),
      source: source.trim(),
      intent,
    });
    setCreating(false);
    setTitle("");
    setStatement("");
    setSource("");
    router.push(`/theories/${created.id}`);
  };

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <PageHeader
        title="理论库"
        description="收录待验证的道理与 SOP 假设。验证充分后可升格为模型库中的结构化框架。"
        subModule={{ label: "模型", href: "/models" }}
        actions={
          <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
            + 收录理论
          </Button>
        }
      />

      {triageId && <OriginFlashPanel triageId={triageId} />}

      {triageTitle && !creating && (
        <p className="text-xs text-slate-500">
          梳理主题：
          <span className="font-medium text-slate-700">{triageTitle}</span>
        </p>
      )}

      {creating && (
        <Card className="space-y-3 bg-white p-4">
          <p className="text-xs font-medium text-slate-600">收录新理论</p>
          <Input
            placeholder="标题（可选，默认同核心表述）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            rows={3}
            placeholder="核心表述 * — 例如：先拆解问题，再选工具，最后复盘"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
          <Input
            placeholder="出处（课、书、老师…）"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(["observe", "execute"] as TheoryIntent[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setIntent(k)}
                className={`rounded-lg px-2.5 py-1 text-[10px] ${
                  intent === k
                    ? "bg-[#EEF2FF] text-[#4338CA]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {THEORY_INTENT_LABELS[k]}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              取消
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!statement.trim()}
              onClick={handleCreate}
            >
              保存
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-1">
        {STATUS_FILTER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-2.5 py-1 text-[10px] ${
              statusFilter === s
                ? "bg-[#EEF2FF] text-[#4338CA]"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {s === "all"
              ? "全部"
              : s === "active"
                ? "进行中"
                : THEORY_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">
          {theories.length === 0
            ? "还没有理论。听课、读书听到的一句话，都可以先收进来。"
            : "当前筛选下暂无条目"}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li key={t.id}>
              <Link href={`/theories/${t.id}`}>
                <Card className="bg-white p-3 transition hover:ring-1 hover:ring-[#6366F1]/30">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {theoryDisplayTitle(t)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {t.statement}
                      </p>
                      {t.source && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          出处 · {t.source}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${THEORY_STATUS_COLORS[t.status]}`}
                      >
                        {THEORY_STATUS_LABELS[t.status]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {THEORY_INTENT_LABELS[t.intent]}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
