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

import { ChallengeDetail } from "@/components/goals/ChallengeDetail";

import { NewGoalDialog } from "@/components/goals/NewGoalDialog";

import { loadGoalChallenges, isChallengeActive, type GoalChallenge } from "@/lib/goals/challenges";

import { SmartWizard } from "@/components/goals/SmartWizard";

import { GoalDetail } from "@/components/goals/GoalDetail";

import { KrDetail } from "@/components/goals/KrDetail";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

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

import { GoalsTaskViews } from "@/components/goals/GoalsTaskViews";

import {
  TrackProblemWizardDialog,
  type TrackWizardPreset,
} from "@/components/track/TrackProblemWizardDialog";

import type { SmartFields } from "@/types/database";



type Filter = "today" | "active" | "all" | "challenge";



function isGoalActive(g: GoalWithMeta): boolean {

  return g.goal_type !== "pending" && g.progress < 100;

}



const FILTER_TABS: { key: Filter; label: string }[] = [

  { key: "today", label: "今日任务" },

  { key: "active", label: "进行中" },

  { key: "all", label: "全部" },

  { key: "challenge", label: "挑战" },

];



export function GoalsClient() {

  const [goals, setGoals] = useState<GoalWithMeta[]>([]);

  const [filter, setFilter] = useState<Filter>("today");

  const [wizard, setWizard] = useState<{ title: string; type: "near" | "long" } | null>(

    null

  );

  const [newTitle, setNewTitle] = useState("");

  const [showNewDialog, setShowNewDialog] = useState(false);

  const [trackWizardOpen, setTrackWizardOpen] = useState(false);

  const [trackPreset, setTrackPreset] = useState<TrackWizardPreset>({});

  const [detail, setDetail] = useState<GoalWithMeta | null>(null);

  const [detailKrId, setDetailKrId] = useState<string | null>(null);

  const [challengeDetail, setChallengeDetail] = useState<{

    challenge: GoalChallenge;

    goal: GoalWithMeta;

  } | null>(null);

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

    if (!challengeDetail) return;

    const freshGoal = goals.find((g) => g.id === challengeDetail.goal.id);

    const freshCh = challenges.find((c) => c.id === challengeDetail.challenge.id);

    if (freshGoal && freshCh) {

      setChallengeDetail({ challenge: freshCh, goal: freshGoal });

    }

  }, [goals, challenges, challengeDetail?.challenge.id, challengeDetail?.goal.id]);



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

    const row = buildPendingGoal(newTitle.trim());

    const id = await persistNewGoal(row);

    if (!id) return;

    registerFlowEntry("goal", id, "goals");

    setNewTitle("");

    setPendingPrompt(false);

    setShowNewDialog(false);

    const next = await loadAllGoals();

    setGoals(next);

  };



  const filtered = goals.filter((g) => {

    if (filter === "all") return true;

    if (filter === "active") return isGoalActive(g);

    return true;

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



  const activeGoals = goals.filter(isGoalActive);

  const activeChallengeGoalIds = new Set(

    activeChallengeRows.map((r) => r.goal.id)

  );

  const activeGoalsWithoutChallenge = activeGoals.filter(

    (g) => !activeChallengeGoalIds.has(g.id)

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

      onOpenChallenge={() => setChallengeDetail(row)}

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

    const savedId = await persistNewGoal(row);

    if (!savedId) return;

    registerFlowEntry("goal", savedId, "goals");

    const fromDecision = searchParams.get("fromDecision");

    const fromInbox = searchParams.get("fromInbox");

    const fromTrack = searchParams.get("fromTrack");

    if (fromDecision) {

      await linkDecisionToGoal(fromDecision, savedId);

    } else if (fromTrack) {

      await linkTrackToGoal(fromTrack, savedId);

    } else if (fromInbox) {

      await linkInboxJumpTarget(fromInbox, "goals", "goal", savedId);

    }

    setWizard(null);

    setNewTitle("");

    setShowNewDialog(false);

    const next = await loadAllGoals();

    setGoals(next);

    const created = next.find((g) => g.id === savedId) ?? next[0];

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



  if (challengeDetail) {

    return (

      <ChallengeDetail

        challenge={challengeDetail.challenge}

        goal={challengeDetail.goal}

        onBack={() => setChallengeDetail(null)}

      />

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



  const filterDescription: Record<Filter, string> = {

    today: "今日待办与逾期未完成任务；过期项可右键或长按快捷调整。",

    active: "进行中的目标与挑战；有关联挑战的主目标以挑战卡片展示，不再重复列出。",

    all: "全部目标一览；点击标题进入详情。",

    challenge: "短期挑战关联主目标；打卡同步主 KR 进度。",

  };



  return (

    <div

      className="mx-auto max-w-3xl space-y-4 p-4 lg:max-w-4xl lg:p-6"

      onClick={() => {

        setContextMenu(null);

        if (showNewDialog) setShowNewDialog(false);

      }}

    >

      <PageHeader

        title="目标管理"

        description={filterDescription[filter]}

        secondaryLink={{ label: "收集箱 →", href: "/inbox" }}

        actions={

          <div className="flex items-center gap-2">

            {filter === "all" && (

              <ExportExcelButton

                rows={exportRows}

                fileName="goals.xlsx"

                sheetName="目标"

              />

            )}

            <button

              type="button"

              title="新建目标"

              onClick={(e) => {

                e.stopPropagation();

                setShowNewDialog(true);

              }}

              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-lg text-[#3B82F6] shadow-sm transition hover:border-[#3B82F6]/40 hover:bg-[#EFF6FF]"

            >

              +

            </button>

          </div>

        }

      />



      <NewGoalDialog

        open={showNewDialog}

        title={newTitle}

        onTitleChange={setNewTitle}

        onNear={() => {

          if (!newTitle.trim()) return;

          setShowNewDialog(false);

          setWizard({ title: newTitle.trim(), type: "near" });

        }}

        onLong={() => {

          if (!newTitle.trim()) return;

          setShowNewDialog(false);

          setWizard({ title: newTitle.trim(), type: "long" });

        }}

        onClose={() => setShowNewDialog(false)}

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



      <div className="flex gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">

        {FILTER_TABS.map(({ key, label }) => (

          <button

            key={key}

            type="button"

            onClick={() => {

              setFilter(key);

              if (key !== "active" && key !== "challenge") setShowChallengeCreate(false);

            }}

            className={cn(

              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",

              filter === key

                ? key === "challenge"

                  ? "bg-white text-violet-600 shadow-sm"

                  : "bg-white text-[#3B82F6] shadow-sm"

                : key === "challenge"

                  ? "text-violet-600 hover:text-violet-800"

                  : "text-slate-600 hover:text-slate-800"

            )}

          >

            {label}

          </button>

        ))}

      </div>



      {filter === "today" ? (

        <GoalsTaskViews

          goals={goals}

          onUpdated={setGoals}

          onOpenGoal={(g, krId) => {

            setDetail(g);

            setDetailKrId(krId ?? null);

          }}

        />

      ) : filter === "active" ? (

        <ul className="space-y-2">

          {activeChallengeRows.map(renderChallengeCard)}

          {activeGoalsWithoutChallenge.map((g) => renderGoalCard(g))}

          {activeGoalsWithoutChallenge.length === 0 &&

            activeChallengeRows.length === 0 && (

            <p className="py-12 text-center text-sm text-slate-400">

              暂无进行中的目标

            </p>

          )}

        </ul>

      ) : filter === "challenge" ? (

        <>

          {showChallengeCreate ? (

            <ChallengeCreateCard

              goals={goals}

              onCreated={() => {

                refreshChallenges();

                setShowChallengeCreate(false);

              }}

              onCancel={() => setShowChallengeCreate(false)}

            />

          ) : (

            <div className="flex justify-end">

              <Button

                size="sm"

                variant="secondary"

                className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"

                onClick={() => setShowChallengeCreate(true)}

              >

                + 新建挑战

              </Button>

            </div>

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

        <ul className="space-y-2">

          {filtered.map((g) =>

            renderGoalCard(g, { showChallengeHint: true })

          )}

          {filtered.length === 0 && (

            <p className="py-12 text-center text-sm text-slate-400">暂无目标</p>

          )}

        </ul>

      )}



      {filter !== "today" && (

        <p className="text-center text-[10px] text-slate-400">

          右键可跳入下一环节

        </p>

      )}



      <TrackProblemWizardDialog

        open={trackWizardOpen}

        preset={trackPreset}

        onClose={() => setTrackWizardOpen(false)}

        onSaved={() => setTrackWizardOpen(false)}

      />



      {contextMenu && (

        <FlowListContextMenu

          fromStage="goals"

          title={contextMenu.goal.title}

          entityId={contextMenu.goal.id}

          x={contextMenu.x}

          y={contextMenu.y}

          onClose={() => setContextMenu(null)}

          onAddTrack={() => {

            setTrackPreset({

              anchorType: "goal",

              anchorId: contextMenu.goal.id,

            });

            setTrackWizardOpen(true);

            setContextMenu(null);

          }}

        />

      )}

    </div>

  );

}

