"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CLOUD_SYNCED_EVENT } from "@/lib/cloud-sync-events";
import { PageHeader } from "@/components/layout/PageHeader";
import { FlowListContextMenu } from "@/components/flow/FlowListContextMenu";
import {
  linkDecisionToGoal,
  linkInboxJumpTarget,
  linkTrackToGoal,
} from "@/lib/flow/jump-actions";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import { GoalListCard } from "@/components/goals/GoalListCard";
import { ChallengeCreateCard } from "@/components/goals/ChallengeCreateCard";
import { ChallengeListCard } from "@/components/goals/ChallengeListCard";
import { loadGoalChallenges, isChallengeActive, type GoalChallenge } from "@/lib/goals/challenges";
import { SmartWizard } from "@/components/goals/SmartWizard";
import { GoalDetail } from "@/components/goals/GoalDetail";
import { KrDetail } from "@/components/goals/KrDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { cn, formatDate } from "@/lib/utils";
import {
  buildNewGoal,
  buildPendingGoal,
  loadAllGoals,
  persistNewGoal,
  type GoalWithMeta,
} from "@/lib/goals/storage";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import type { SmartFields } from "@/types/database";

type Filter = "active" | "all" | "near" | "long" | "pending" | "challenge";

function isGoalActive(g: GoalWithMeta): boolean {
  return g.goal_type !== "pending" && g.progress < 100;
}

export function GoalsClient() {
  const [goals, setGoals] = useState<GoalWithMeta[]>([]);
  const [filter, setFilter] = useState<Filter>("active");
  const [wizard, setWizard] = useState<{ title: string; type: "near" | "long" } | null>(
    null
  );
  const [newTitle, setNewTitle] = useState("");
  const [detail, setDetail] = useState<GoalWithMeta | null>(null);
  const [detailKrId, setDetailKrId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    goal: GoalWithMeta;
    x: number;
    y: number;
  } | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState(false);
  const [expandedKrGoals, setExpandedKrGoals] = useState<Set<string>>(new Set());
  const [challenges, setChallenges] = useState<GoalChallenge[]>([]);
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(
    new Set()
  );
  const [showChallengeCreate, setShowChallengeCreate] = useState(false);
  const searchParams = useSearchParams();
  const triageId = searchParams.get("triage");

  const refreshChallenges = useCallback(() => {
    setChallenges(
      loadGoalChallenges().sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    );
  }, []);

  const load = useCallback(async () => {
    setGoals(await loadAllGoals());
    refreshChallenges();
  }, [refreshChallenges]);

  useEffect(() => {
    load();
    const onSync = () => void load();
    window.addEventListener(CLOUD_SYNCED_EVENT, onSync);
    const onVisible = () => {
      if (document.visibilityState === "visible" && isCloudEnabled()) {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    if (!isCloudEnabled()) {
      return () => {
        window.removeEventListener(CLOUD_SYNCED_EVENT, onSync);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }
    const supabase = createClient();
    const ch = supabase
      .channel("goals")
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () =>
        load()
      )
      .subscribe();
    return () => {
      window.removeEventListener(CLOUD_SYNCED_EVENT, onSync);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(ch);
    };
  }, [load]);

  useEffect(() => {
    if (!detail) return;
    const fresh = goals.find((g) => g.id === detail.id);
    if (fresh) setDetail(fresh);
  }, [goals, detail?.id]);

  useEffect(() => {
    const detailId = searchParams.get("detail");
    if (detailId && goals.length) {
      const g = goals.find((x) => x.id === detailId);
      if (g) setDetail(g);
    }
    const presetTitle = searchParams.get("title");
    if (presetTitle) {
      setNewTitle(decodeURIComponent(presetTitle));
    }
    if (searchParams.get("pending") === "1" && presetTitle) {
      setFilter("pending");
      setPendingPrompt(true);
    }
    const goalType = searchParams.get("type");
    if (presetTitle && (goalType === "near" || goalType === "long")) {
      setWizard({
        title: decodeURIComponent(presetTitle),
        type: goalType,
      });
    }
  }, [searchParams, goals]);

  const createPendingGoal = async () => {
    if (!newTitle.trim()) return;
    await persistNewGoal(buildPendingGoal(newTitle.trim()));
    setNewTitle("");
    setPendingPrompt(false);
    setFilter("pending");
    const next = await loadAllGoals();
    setGoals(next);
  };

  const filtered = goals.filter((g) => {
    if (filter === "all" || filter === "challenge" || filter === "active") {
      if (filter === "all") return true;
      if (filter === "active") return isGoalActive(g);
      return false;
    }
    return g.goal_type === filter;
  });

  const challengeRows = challenges
    .map((ch) => {
      const goal = goals.find((g) => g.id === ch.goalId);
      return goal ? { challenge: ch, goal } : null;
    })
    .filter(Boolean) as { challenge: GoalChallenge; goal: GoalWithMeta }[];

  const activeChallengeRows = challengeRows.filter((r) =>
    isChallengeActive(r.challenge)
  );

  const activeChallengeGoalIds = new Set(
    activeChallengeRows.map((r) => r.goal.id)
  );

  const activeGoalsExcludingChallengeLinked = goals.filter(
    (g) => isGoalActive(g) && !activeChallengeGoalIds.has(g.id)
  );

  const activeChallengesByGoalId = new Map<string, GoalChallenge[]>();
  for (const ch of challenges) {
    if (!isChallengeActive(ch)) continue;
    const list = activeChallengesByGoalId.get(ch.goalId) ?? [];
    list.push(ch);
    activeChallengesByGoalId.set(ch.goalId, list);
  }

  const renderChallengeCard = (row: {
    challenge: GoalChallenge;
    goal: GoalWithMeta;
  }) => (
    <ChallengeListCard
      key={row.challenge.id}
      challenge={row.challenge}
      goal={row.goal}
      expanded={expandedChallenges.has(row.challenge.id)}
      onToggleExpand={(e) => {
        e.stopPropagation();
        setExpandedChallenges((prev) => {
          const next = new Set(prev);
          if (next.has(row.challenge.id)) next.delete(row.challenge.id);
          else next.add(row.challenge.id);
          return next;
        });
      }}
      onOpenGoal={() => {
        setDetailKrId(null);
        setDetail(row.goal);
      }}
      onGoalUpdated={setGoals}
      onChallengeUpdated={refreshChallenges}
    />
  );

  const renderGoalCard = (
    g: GoalWithMeta,
    opts?: { showChallengeHint?: boolean }
  ) => (
    <GoalListCard
      key={g.id}
      goal={g}
      activeChallenges={
        opts?.showChallengeHint
          ? activeChallengesByGoalId.get(g.id)
          : undefined
      }
      expanded={expandedKrGoals.has(g.id)}
      onToggleExpand={(e) => {
        e.stopPropagation();
        setExpandedKrGoals((prev) => {
          const next = new Set(prev);
          if (next.has(g.id)) next.delete(g.id);
          else next.add(g.id);
          return next;
        });
      }}
      onOpenDetail={() => {
        setDetailKrId(null);
        setDetail(g);
      }}
      onOpenKrDetail={(krId) => {
        setDetail(g);
        setDetailKrId(krId);
      }}
      onContextMenu={(e) => {
        if (g.goal_type === "pending" || g.progress >= 100) return;
        e.preventDefault();
        setContextMenu({ goal: g, x: e.clientX, y: e.clientY });
      }}
      onUpdated={setGoals}
    />
  );

  const onSmartDone = async (smart: SmartFields, versions: SmartFields[]) => {
    if (!wizard) return;
    const row = buildNewGoal({
      title: wizard.title,
      goal_type: wizard.type,
      smart,
      versions: versions.length ? versions : [smart],
    });
    const title = wizard.title;
    const type = wizard.type;
    await persistNewGoal(row);
    registerFlowEntry("goal", row.id, "goals");
    const fromDecision = searchParams.get("fromDecision");
    const fromInbox = searchParams.get("fromInbox");
    const fromTrack = searchParams.get("fromTrack");
    if (fromDecision) {
      await linkDecisionToGoal(fromDecision, row.id);
    } else if (fromTrack) {
      await linkTrackToGoal(fromTrack, row.id);
    } else if (fromInbox) {
      await linkInboxJumpTarget(fromInbox, "goals", "goal", row.id);
    }
    setWizard(null);
    setNewTitle("");
    const next = await loadAllGoals();
    setGoals(next);
    const created =
      next.find((g) => g.title === title && g.goal_type === type) ?? next[0];
    if (created) setDetail(created);
  };

  const exportRows = filtered.map((g) => ({
    名称: g.title,
    类型: g.goal_type,
    进度: `${g.progress}%`,
    开始日期: g.execution.start_date ?? "",
    截止日期: g.execution.due_date ?? "",
    目标量: g.execution.target_quantity ?? "",
    已完成: g.execution.current_quantity,
    单位: g.execution.quantity_unit,
    KR数量: g.execution.key_results.length,
    SMART摘要: g.smart_current?.specific?.slice(0, 80) ?? "",
    创建日期: formatDate(g.created_at),
  }));

  if (wizard) {
    return (
      <div className="p-4 lg:p-6">
        <SmartWizard
          title={wizard.title}
          goalType={wizard.type}
          onComplete={onSmartDone}
          onCancel={() => setWizard(null)}
        />
      </div>
    );
  }

  const detailKr =
    detail && detailKrId
      ? (detail.execution.key_results.find((k) => k.id === detailKrId) ??
        null)
      : null;

  if (detail && detailKr) {
    return (
      <div className="p-4 lg:p-6">
        <KrDetail
          goal={detail}
          kr={detailKr}
          onBack={() => setDetailKrId(null)}
          onUpdated={(next) => {
            setGoals(next);
            const updated = next.find((g) => g.id === detail.id);
            if (updated) setDetail(updated);
          }}
        />
      </div>
    );
  }

  if (detail) {
    return (
      <div className="p-4 lg:p-6">
        <GoalDetail
          goal={detail}
          onBack={() => {
            setDetail(null);
            setDetailKrId(null);
          }}
          onOpenKr={setDetailKrId}
          onUpdated={(next) => {
            setGoals(next);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-2xl space-y-4 p-4 lg:p-6"
      onClick={() => setContextMenu(null)}
    >
      <PageHeader
        title="目标管理"
        description={
          filter === "challenge"
            ? "短期挑战关联主目标；打卡同步主 KR 进度。"
            : filter === "active"
              ? "进行中的挑战优先展示；已关联的主目标仅在挑战卡片内标注，不重复列出。"
              : "点击目标进入详情；列表右侧可查看总进度并快捷打卡。"
        }
        secondaryLink={{ label: "收集箱 →", href: "/inbox" }}
        actions={
          filter !== "challenge" && filter !== "active" ? (
            <ExportExcelButton
              rows={exportRows}
              fileName="goals.xlsx"
              sheetName="目标"
            />
          ) : undefined
        }
      />

      {triageId && <OriginFlashPanel triageId={triageId} />}

      {pendingPrompt && newTitle.trim() && (
        <Card className="border-amber-200/60 bg-amber-50/50">
          <p className="text-xs text-amber-800">
            来自收集箱：「{newTitle}」可先存为待定目标，决策后再完善 SMART。
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="primary" onClick={createPendingGoal}>
              确认创立待定目标
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPendingPrompt(false)}
            >
              稍后
            </Button>
          </div>
        </Card>
      )}

      <div className="flex gap-1 overflow-x-auto">
        {(
          [
            ["active", "进行中"],
            ["all", "全部"],
            ["near", "近期"],
            ["long", "长期"],
            ["pending", "待定"],
            ["challenge", "挑战"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setFilter(k);
              if (k !== "challenge") setShowChallengeCreate(false);
            }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs transition",
              filter === k
                ? k === "challenge"
                  ? "bg-violet-600 text-white"
                  : "bg-[#3B82F6] text-white"
                : k === "challenge"
                  ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                  : "bg-[#F8FAFC] text-slate-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filter === "active" ? (
        <ul className="space-y-2">
          {activeChallengeRows.map(renderChallengeCard)}
          {activeGoalsExcludingChallengeLinked.map((g) => renderGoalCard(g))}
          {activeChallengeRows.length === 0 &&
            activeGoalsExcludingChallengeLinked.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-400">
              暂无进行中的目标或挑战
            </p>
          )}
        </ul>
      ) : filter === "challenge" ? (
        <>
          {showChallengeCreate ? (
            <ChallengeCreateCard
              goals={goals}
              onCreated={refreshChallenges}
              onCancel={() => setShowChallengeCreate(false)}
            />
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              onClick={() => setShowChallengeCreate(true)}
            >
              + 新建挑战
            </Button>
          )}
          <ul className="space-y-2">
            {challengeRows.map(renderChallengeCard)}
            {challengeRows.length === 0 && !showChallengeCreate && (
              <p className="py-12 text-center text-sm text-violet-400/80">
                暂无挑战 · 点击上方新建并关联主目标
              </p>
            )}
          </ul>
        </>
      ) : (
        <>
      <Card className="bg-white">
        <label className="text-xs text-slate-500">目标标题 *</label>
        <Input
          className="mt-1"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="须经决策后再设立"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            disabled={!newTitle.trim()}
            onClick={() => setWizard({ title: newTitle.trim(), type: "near" })}
          >
            新建近期目标
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!newTitle.trim()}
            onClick={() => setWizard({ title: newTitle.trim(), type: "long" })}
          >
            新建长期目标
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!newTitle.trim()}
            onClick={createPendingGoal}
          >
            新建待定目标
          </Button>
        </div>
      </Card>

      <ul className="space-y-2">
        {filtered.map((g) =>
          renderGoalCard(g, { showChallengeHint: filter === "all" })
        )}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">暂无目标</p>
        )}
      </ul>

      <p className="text-center text-[10px] text-slate-400">
        右键可跳入下一环节
      </p>

      {contextMenu && (
        <FlowListContextMenu
          fromStage="goals"
          title={contextMenu.goal.title}
          entityId={contextMenu.goal.id}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
        </>
      )}
    </div>
  );
}
