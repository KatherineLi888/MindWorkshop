"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { ReviewDataPanel } from "@/components/review/ReviewDataPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownField } from "@/components/shared/MarkdownField";
import { Input, Textarea } from "@/components/ui/input";
import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { MODULE_INTRO } from "@/lib/module-copy";
import { PERIOD_PRESET_LABELS, formatReviewPeriodTitle } from "@/lib/review/period-labels";
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
  PeriodPreset,
  PeriodStatItem,
  PeriodStatsSnapshot,
  ReviewHighlight,
  ReviewKind,
} from "@/lib/review/types";
import { Suspense } from "react";

const KIND_LABELS: Record<ReviewKind, string> = {
  period: "周期复盘",
  goal: "目标复盘",
  event: "事件复盘",
  decision: "决策复盘",
};

const ALL_KINDS: ReviewKind[] = ["period", "goal", "event", "decision"];

const PERIOD_PRESETS: PeriodPreset[] = [
  "day",
  "week",
  "month",
  "quarter",
  "half_year",
  "year",
  "custom",
];

function ReviewNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [kind, setKind] = useState<ReviewKind | null>(null);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [goalId, setGoalId] = useState("");
  const [krId, setKrId] = useState("");
  const [krLabel, setKrLabel] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [decisionHighlights, setDecisionHighlights] = useState("");
  const [decisionGaps, setDecisionGaps] = useState("");
  const [decisionSummary, setDecisionSummary] = useState("");
  const [stats, setStats] = useState<PeriodStatsSnapshot | null>(null);
  const [statItems, setStatItems] = useState<PeriodStatItem[]>([]);
  const [selectedStatKeys, setSelectedStatKeys] = useState<Set<string>>(
    new Set()
  );
  const [highlights, setHighlights] = useState<ReviewHighlight[]>([]);
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([]);
  const [decisions, setDecisions] = useState<{ id: string; title: string }[]>(
    []
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadAllGoals().then((list) =>
      setGoals(list.map((g) => ({ id: g.id, title: g.title })))
    );
    loadAllDecisions().then((list) =>
      setDecisions(list.map((d) => ({ id: d.id, title: d.title })))
    );
  }, []);

  useEffect(() => {
    if (!editId) return;
    const record = loadReviewRecords().find((r) => r.id === editId);
    if (!record) return;
    setEditingId(record.id);
    setKind(record.kind);
    setTitle(record.title);
    setSummary(record.summary);
    setHighlights(record.highlights);
    if (record.periodPreset) setPeriodPreset(record.periodPreset);
    if (record.goalId) setGoalId(record.goalId);
    setKrId(record.krId ?? "");
    if (record.krLabel) setKrLabel(record.krLabel);
    if (record.decisionId) setDecisionId(record.decisionId);
    if (record.eventNote) setEventNote(record.eventNote ?? "");
    if (record.decisionHighlights) setDecisionHighlights(record.decisionHighlights);
    if (record.decisionGaps) setDecisionGaps(record.decisionGaps);
    if (record.decisionSummary) setDecisionSummary(record.decisionSummary);
    if (record.selectedStatKeys?.length) {
      setSelectedStatKeys(new Set(record.selectedStatKeys));
    }
  }, [editId]);

  useEffect(() => {
    if (editId) return;

    const qKind = searchParams.get("kind") as ReviewKind | null;
    const qPeriod = searchParams.get("periodPreset") as PeriodPreset | null;
    const qGoalId = searchParams.get("goalId");
    const qKrId = searchParams.get("krId");
    const qKrLabel = searchParams.get("krLabel");

    if (qKind && ALL_KINDS.includes(qKind)) {
      setKind(qKind);
    }
    if (qPeriod && PERIOD_PRESETS.includes(qPeriod)) {
      setPeriodPreset(qPeriod);
    }
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
  }, [searchParams, editId]);

  const visibleStatItems = useMemo(() => {
    if (selectedStatKeys.size === 0) return statItems;
    return statItems.filter((i) => selectedStatKeys.has(i.key));
  }, [statItems, selectedStatKeys]);

  const loadStats = useCallback(async () => {
    if (!kind || kind === "event" || kind === "decision") {
      setStats(null);
      setStatItems([]);
      return;
    }

    if (kind === "period") {
      const { start, end } = resolvePeriodRange(
        periodPreset,
        customStart,
        customEnd
      );
      const snap = await buildPeriodStats(start, end);
      setStats(snap);
      setStatItems(snap.items);
      setTitle((t) =>
        t && editingId
          ? t
          : formatReviewPeriodTitle(periodPreset, start, end)
      );
      setSelectedStatKeys((prev) =>
        prev.size > 0 ? prev : new Set(snap.items.map((i) => i.key))
      );
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
      setHighlights((prev) => (prev.length ? prev : auto));
      return;
    }

    if (kind === "goal" && goalId) {
      const items = await buildGoalReviewStats(goalId);
      setStats(null);
      setStatItems(items);
      const g = goals.find((x) => x.id === goalId);
      if (!title && g) setTitle(`目标复盘 · ${g.title}`);
      setSelectedStatKeys((prev) =>
        prev.size > 0 ? prev : new Set(items.map((i) => i.key))
      );
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
      setHighlights((prev) => (prev.length ? prev : auto));
    }
  }, [
    kind,
    periodPreset,
    customStart,
    customEnd,
    goalId,
    goals,
    title,
    editingId,
  ]);

  useEffect(() => {
    if (!kind || kind === "event" || kind === "decision") return;
    loadStats();
  }, [kind, periodPreset, goalId, loadStats]);

  const toggleStatKey = (key: string) => {
    setSelectedStatKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
    if (!kind) return;
    const goal = goals.find((g) => g.id === goalId);
    const decision = decisions.find((d) => d.id === decisionId);
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
      decisionId: kind === "decision" ? decisionId : undefined,
      decisionTitle: decision?.title,
      eventNote: kind === "event" ? eventNote : undefined,
      decisionHighlights:
        kind === "decision" ? decisionHighlights : undefined,
      decisionGaps: kind === "decision" ? decisionGaps : undefined,
      decisionSummary: kind === "decision" ? decisionSummary : undefined,
      selectedStatKeys:
        kind === "period" || kind === "goal"
          ? [...selectedStatKeys]
          : undefined,
      highlights,
      summary,
    };

    if (editingId) {
      updateReviewRecord(editingId, payload);
    } else {
      createReviewRecord(payload);
    }

    router.push("/review");
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title={editingId ? "编辑复盘" : "新建复盘"}
        description={MODULE_INTRO.review}
        actions={
          <Link
            href="/review"
            className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
          >
            返回列表
          </Link>
        }
      />

      {!kind ? (
        <Card className="bg-white p-4">
          <p className="text-xs font-medium text-slate-600">选择复盘类型</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ALL_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3 text-left transition hover:border-[#3B82F6]/40 hover:bg-white"
              >
                <p className="text-sm font-medium text-slate-800">
                  {KIND_LABELS[k]}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {k === "period" && "按时间周期回顾数据与感受"}
                  {k === "goal" && "聚焦目标与 KR 进度"}
                  {k === "event" && "围绕具体事件自由记录"}
                  {k === "decision" && "梳理决策亮点、不足与总结"}
                </p>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">{KIND_LABELS[kind]}</span>
            {!editingId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setKind(null);
                  setHighlights([]);
                  setStatItems([]);
                }}
              >
                重选类型
              </Button>
            )}
          </div>

          {kind === "period" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {PERIOD_PRESETS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={periodPreset === p ? "primary" : "ghost"}
                  onClick={() => setPeriodPreset(p)}
                >
                  {PERIOD_PRESET_LABELS[p]}
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
            </div>
          )}

          {kind === "decision" && (
            <div className="mt-3">
              <select
                className="rounded-md border border-[#E2E8F0] px-2 py-1.5 text-sm"
                value={decisionId}
                onChange={(e) => {
                  setDecisionId(e.target.value);
                  const d = decisions.find((x) => x.id === e.target.value);
                  if (d) setTitle(`决策复盘 · ${d.title}`);
                }}
              >
                <option value="">选择决策（可选）</option>
                {decisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind === "event" && (
            <div className="mt-3">
              <Input
                placeholder="事件简述（如：某次会议、某个决策结果）"
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
              />
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

          {(kind === "period" || kind === "goal") && statItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-600">
                选择统计板块
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {statItems.map((item) => {
                  const on = selectedStatKeys.has(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleStatKey(item.key)}
                      className={`rounded-full px-2.5 py-1 text-[10px] ring-1 transition ${
                        on
                          ? "bg-[#EFF6FF] text-[#1D4ED8] ring-[#BFDBFE]"
                          : "bg-white text-slate-500 ring-[#E2E8F0]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(kind === "period" || kind === "goal") &&
            visibleStatItems.length > 0 && (
              <div className="mt-4">
                <ReviewDataPanel
                  items={visibleStatItems}
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

          {kind === "decision" && (
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                决策亮点
              </label>
              <MarkdownField
                rows={3}
                value={decisionHighlights}
                onChange={setDecisionHighlights}
                placeholder="这次决策做对的地方、值得保留的做法"
              />
              <label className="block text-xs font-medium text-slate-600">
                不足与改进
              </label>
              <MarkdownField
                rows={3}
                value={decisionGaps}
                onChange={setDecisionGaps}
                placeholder="可以做得更好之处、下次想调整的点"
              />
              <label className="block text-xs font-medium text-slate-600">
                决策总结
              </label>
              <MarkdownField
                rows={3}
                value={decisionSummary}
                onChange={setDecisionSummary}
                placeholder="整体梳理与可复用的经验"
              />
            </div>
          )}

          <label className="mt-4 block text-xs font-medium text-slate-600">
            总结
          </label>
          <MarkdownField
            rows={6}
            value={summary}
            onChange={setSummary}
            placeholder="本周期/本目标最重要的收获与下一步行动（支持 Markdown）"
          />

          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" onClick={saveReview}>
              {editingId ? "更新复盘" : "保存复盘"}
            </Button>
            <Link href="/review">
              <Button size="sm" variant="ghost">
                取消
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export function ReviewNewClient() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ReviewNewContent />
    </Suspense>
  );
}
