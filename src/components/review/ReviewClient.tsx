"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { ReviewDataPanel } from "@/components/review/ReviewDataPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { loadAllGoals } from "@/lib/goals/storage";
import {
  buildGoalReviewStats,
  buildPeriodStats,
  resolvePeriodRange,
} from "@/lib/review/period-stats";
import {
  createReviewRecord,
  loadReviewRecords,
  updateReviewRecord,
} from "@/lib/review/storage";
import type {
  PeriodStatItem,
  PeriodStatsSnapshot,
  ReviewHighlight,
  ReviewKind,
  ReviewRecord,
} from "@/lib/review/types";
import { formatDate } from "@/lib/utils";
import { Suspense } from "react";

const KIND_LABELS: Record<ReviewKind, string> = {
  period: "周期复盘",
  goal: "目标复盘",
  event: "事件复盘",
};

// 内部组件，使用 useSearchParams
function ReviewContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [kind, setKind] = useState<ReviewKind>("period");
  const [periodPreset, setPeriodPreset] = useState<
    "day" | "week" | "month" | "custom"
  >("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [goalId, setGoalId] = useState("");
  const [krId, setKrId] = useState("");
  const [krLabel, setKrLabel] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [stats, setStats] = useState<PeriodStatsSnapshot | null>(null);
  const [statItems, setStatItems] = useState<PeriodStatItem[]>([]);
  const [highlights, setHighlights] = useState<ReviewHighlight[]>([]);
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refreshRecords = useCallback(() => {
    setRecords(loadReviewRecords());
  }, []);

  useEffect(() => {
    refreshRecords();
    loadAllGoals().then((list) =>
      setGoals(list.map((g) => ({ id: g.id, title: g.title })))
    );
  }, [refreshRecords]);

  useEffect(() => {
    const qGoalId = searchParams.get("goalId");
    const qKrId = searchParams.get("krId");
    const qKrLabel = searchParams.get("krLabel");
    if (qGoalId) {
      setKind("goal");
      setGoalId(qGoalId);
      if (qKrId) setKrId(qKrId);
      if (qKrLabel) {
        const label = decodeURIComponent(qKrLabel);
        setKrLabel(label);
        setTitle((t) => t || `KR 复盘 · ${label}`);
      }
    }
  }, [searchParams]);

  const loadStats = useCallback(async () => {
    if (kind === "period") {
      const { start, end, label } = resolvePeriodRange(
        periodPreset,
        customStart,
        customEnd
      );
      const snap = await buildPeriodStats(start, end);
      setStats(snap);
      setStatItems(snap.items);
      if (!title) setTitle(`${label}复盘`);
      const auto = snap.items
        .filter((i) => i.anomaly)
        .map((i) => ({
          id: crypto.randomUUID(),
          statKey: i.key,
          statLabel: i.label,
          statValue: i.value,
          anomaly: true,
          reflection: "",
        }));
      setHighlights(auto);
      return;
    }

    if (kind === "goal" && goalId) {
      const items = await buildGoalReviewStats(goalId);
      setStats(null);
      setStatItems(items);
      const g = goals.find((x) => x.id === goalId);
      if (!title && g) setTitle(`目标复盘 · ${g.title}`);
      const auto = items
        .filter((i) => i.anomaly)
        .map((i) => ({
          id: crypto.randomUUID(),
          statKey: i.key,
          statLabel: i.label,
          statValue: i.value,
          anomaly: true,
          reflection: "",
        }));
      setHighlights(auto);
      return;
    }

    setStats(null);
    setStatItems([]);
    setHighlights([]);
  }, [kind, periodPreset, customStart, customEnd, goalId, goals, title]);

  useEffect(() => {
    if (kind === "event") return;
    loadStats();
  }, [kind, periodPreset, goalId, loadStats]);

  const toggleHighlight = (item: PeriodStatItem) => {
    setHighlights((prev) => {
      const exists = prev.find((h) => h.statKey === item.key);
      if (exists) return prev.filter((h) => h.statKey !== item.key);
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          statKey: item.key,
          statLabel: item.label,
          statValue: item.value,
          anomaly: item.anomaly,
          reflection: "",
        },
      ];
    });
  };

  const saveReview = () => {
    const goal = goals.find((g) => g.id === goalId);
    const payload = {
      kind,
      title: title.trim() || KIND_LABELS[kind],
      periodPreset: kind === "period" ? periodPreset : undefined,
      periodStart: stats?.periodStart,
      periodEnd: stats?.periodEnd,
      goalId: kind === "goal" ? goalId : undefined,
      goalTitle: goal?.title,
      krId: kind === "goal" && krId ? krId : undefined,
      krLabel: kind === "goal" ? krLabel : undefined,
      eventNote: kind === "event" ? eventNote : undefined,
      highlights,
      summary,
    };

    if (editingId) {
      updateReviewRecord(editingId, payload);
    } else {
      createReviewRecord(payload);
    }

    setTitle("");
    setSummary("");
    setHighlights([]);
    setEditingId(null);
    refreshRecords();
  };

  const openRecord = (r: ReviewRecord) => {
    setEditingId(r.id);
    setKind(r.kind);
    setTitle(r.title);
    setSummary(r.summary);
    setHighlights(r.highlights);
    if (r.periodPreset) setPeriodPreset(r.periodPreset);
    if (r.goalId) setGoalId(r.goalId);
    setKrId(r.krId ?? "");
    if (r.krLabel) setKrLabel(r.krLabel);
    if (r.eventNote) setEventNote(r.eventNote ?? "");
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="复盘"
        description="周期、目标或事件三个维度；左侧看数据、右侧写关联感受，一眼对齐异常与反思。"
      />

      <Card className="bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {(["period", "goal", "event"] as ReviewKind[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={kind === k ? "primary" : "secondary"}
              onClick={() => {
                setKind(k);
                setEditingId(null);
                setHighlights([]);
              }}
            >
              {KIND_LABELS[k]}
            </Button>
          ))}
        </div>

        {kind === "period" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(["day", "week", "month", "custom"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={periodPreset === p ? "primary" : "ghost"}
                onClick={() => setPeriodPreset(p)}
              >
                {p === "day"
                  ? "今日"
                  : p === "week"
                    ? "近 7 天"
                    : p === "month"
                      ? "近 30 天"
                      : "自定义"}
              </Button>
            ))}
            {periodPreset === "custom" && (
              <>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-36"
                />
                <span className="text-xs text-slate-400">至</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-36"
                />
              </>
            )}
          </div>
        )}

        {kind === "goal" && (
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              className="rounded-md border border-[#E2E8F0] px-2 py-1.5 text-sm"
              value={goalId}
              onChange={(e) => {
                setGoalId(e.target.value);
                setKrId("");
                setKrLabel("");
              }}
            >
              <option value="">选择目标</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <Input
              placeholder="聚焦哪条 KR（可选）"
              value={krLabel}
              onChange={(e) => {
                setKrLabel(e.target.value);
                if (!e.target.value.trim()) setKrId("");
              }}
              className="max-w-xs"
            />
            {krId && (
              <span className="self-center text-[10px] text-emerald-600">
                已绑定 KR
              </span>
            )}
          </div>
        )}

        {kind === "event" && (
          <div className="mt-3">
            <Input
              placeholder="事件简述（如：某次会议、某个决策结果）"
              value={eventNote}
              onChange={(e) => setEventNote(e.target.value)}
            />
            <p className="mt-2 text-[10px] text-slate-400">
              事件类复盘暂以自由记录为主；后续可关联具体决策/追踪节点。
            </p>
          </div>
        )}

        <div className="mt-3">
          <Input
            placeholder="复盘标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {editingId && (
          <SeedLinkPanel
            entityType="review_record"
            entityId={editingId}
            title={title}
            stage="review"
            className="mt-3"
          />
        )}

        {kind !== "event" && statItems.length > 0 && (
          <div className="mt-4">
            <ReviewDataPanel
              items={statItems}
              funnel={stats?.funnel}
              highlights={highlights}
              onHighlightChange={(id, reflection) =>
                setHighlights((prev) =>
                  prev.map((h) => (h.id === id ? { ...h, reflection } : h))
                )
              }
              onToggleHighlight={toggleHighlight}
            />
          </div>
        )}

        <label className="mt-4 block text-xs font-medium text-slate-600">
          总结
        </label>
        <Textarea
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="本周期/本目标最重要的收获与下一步行动"
        />

        <div className="mt-3 flex gap-2">
          <Button variant="primary" size="sm" onClick={saveReview}>
            {editingId ? "更新复盘" : "保存复盘"}
          </Button>
          {editingId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setHighlights([]);
                setSummary("");
              }}
            >
              取消编辑
            </Button>
          )}
        </div>
      </Card>

      <section>
        <p className="text-xs font-medium text-slate-600">历史复盘</p>
        <ul className="mt-2 space-y-2">
          {records.length === 0 && (
            <li className="text-xs text-slate-400">暂无记录</li>
          )}
          {records.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => openRecord(r)}
                className="w-full rounded-lg border border-[#EEF1F5] bg-white px-3 py-2 text-left hover:bg-[#FAFBFC]"
              >
                <span className="text-[10px] text-slate-400">
                  {KIND_LABELS[r.kind]} · {formatDate(r.updatedAt)}
                </span>
                <p className="text-sm font-medium text-slate-800">{r.title}</p>
                {r.highlights.length > 0 && (
                  <p className="mt-0.5 text-[10px] text-[#1D4ED8]">
                    关联 {r.highlights.length} 个数据点
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// 外层包裹 Suspense，修复部署报错
export function ReviewClient() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}