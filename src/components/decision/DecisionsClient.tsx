"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeaderAddButton } from "@/components/layout/HeaderAddButton";
import { MODULE_INTRO } from "@/lib/module-copy";
import { pinDecisionToDashboard } from "@/lib/stats/pin-to-dashboard";
import { AUTH_ENABLED } from "@/lib/config";
import { computeDecisionTags } from "@/lib/decision-tree/tags";
import { SOURCE_LABELS } from "@/lib/decision-tree/tags";
import { DecisionDetailView } from "@/components/decision/DecisionDetailView";
import {
  buildDecisionRow,
  loadAllDecisions,
  persistDecision,
  saveDecisionDraft,
  setDecisionArchived,
} from "@/lib/decisions/storage";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import { DecisionFlow } from "@/components/decision/DecisionFlow";
import { type FlowAnswers } from "@/lib/decision-tree/flow";
import { DecisionListCard } from "@/components/decision/DecisionListCard";
import {
  DecisionListFilters,
  DEFAULT_DECISION_FILTERS,
  matchesDecisionFilters,
  type DecisionFilterState,
} from "@/components/decision/DecisionListFilters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { LinkEntityDialog } from "@/components/shared/LinkEntityDialog";
import { FlowListContextMenu } from "@/components/flow/FlowListContextMenu";
import {
  TrackProblemWizardDialog,
  type TrackWizardPreset,
} from "@/components/track/TrackProblemWizardDialog";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import {
  linkInboxJumpTarget,
  linkThinkingToDecision,
  linkTrackToDecision,
} from "@/lib/flow/jump-actions";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import { endSeedForEntity } from "@/lib/seeds/lifecycle";
import { patchTriageTarget } from "@/lib/triage/storage";
import { formatDate } from "@/lib/utils";
import type { DecisionRow } from "@/types/database";

type Props = {
  /** 仅显示已归档 */
  archiveBox?: boolean;
  /** 嵌入总归档箱，不重复页头 */
  embeddedInArchive?: boolean;
};

export function DecisionsClient({
  archiveBox = false,
  embeddedInArchive = false,
}: Props) {
  const [list, setList] = useState<DecisionRow[]>([]);
  const [mode, setMode] = useState<"list" | "new" | "flow">("list");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState<DecisionRow | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [filters, setFilters] = useState<DecisionFilterState>(
    DEFAULT_DECISION_FILTERS
  );
  const [contextMenu, setContextMenu] = useState<{
    row: DecisionRow;
    x: number;
    y: number;
  } | null>(null);
  const [trackWizardOpen, setTrackWizardOpen] = useState(false);
  const [trackPreset, setTrackPreset] = useState<TrackWizardPreset>({});
  const [flowDraftId, setFlowDraftId] = useState(() => crypto.randomUUID());
  const searchParams = useSearchParams();
  const triageId = searchParams.get("triage");

  const load = useCallback(async () => {
    let data = await loadAllDecisions();
    const toArchive = data.filter(
      (d) => !d.archived_at && d.tag_outcome === "abandon"
    );
    for (const d of toArchive) {
      data = await setDecisionArchived(d.id, true);
    }
    setList(data);
  }, []);

  useEffect(() => {
    load();
    if (!isCloudEnabled()) return;
    const supabase = createClient();
    const ch = supabase
      .channel("decisions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "decisions" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  useEffect(() => {
    const isNew = searchParams.get("new");
    const presetTitle = searchParams.get("title");
    if (isNew === "1") {
      setMode("new");
      if (presetTitle) {
        setTitle(decodeURIComponent(presetTitle));
      }
    }
  }, [searchParams]);

  const pool = useMemo(
    () =>
      list.filter((d) => {
        if (d.flow_confirmed === false) return false;
        return archiveBox ? d.archived_at != null : d.archived_at == null;
      }),
    [list, archiveBox]
  );

  const filtered = useMemo(() => {
    const matched = pool.filter((d) => matchesDecisionFilters(d, filters));
    if (archiveBox) return matched;
    return matched.sort((a, b) => {
      const aAbandon = a.tag_outcome === "abandon" ? 1 : 0;
      const bAbandon = b.tag_outcome === "abandon" ? 1 : 0;
      if (aAbandon !== bAbandon) return aAbandon - bAbandon;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [pool, filters, archiveBox]);

  const archiveCount = useMemo(
    () => list.filter((d) => d.archived_at != null).length,
    [list]
  );

  const startFlow = () => {
    if (!title.trim()) return;
    setFlowDraftId(crypto.randomUUID());
    setMode("flow");
  };

  const autosaveFlowDraft = async (answers: FlowAnswers) => {
    if (!title.trim()) return;
    let userId = "local";
    if (isCloudEnabled()) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
    }
    const source =
      answers.origin === "passive" ? ("passive" as const) : ("active" as const);
    try {
      await saveDecisionDraft({
        id: flowDraftId,
        user_id: userId,
        title: title.trim(),
        answers,
        source,
      });
    } catch {
      /* 草稿保存失败不阻断流程 */
    }
  };

  const saveDecision = async (payload: {
    answers: FlowAnswers;
    pathSummary: string;
    finalAction: string;
    source: "active" | "passive";
    manual_conclusion: string;
    manual_goal: string;
  }) => {
    const tags = computeDecisionTags(payload.answers);
    const row = buildDecisionRow({
      id: flowDraftId,
      user_id: "local",
      title: title.trim(),
      source: payload.source,
      pathSummary: payload.pathSummary,
      finalAction: payload.finalAction,
      answers: payload.answers,
      tags,
      manual_conclusion: payload.manual_conclusion,
      manual_goal: payload.manual_goal,
    });

    registerFlowEntry("decision", row.id, "decisions");

    const fromThinking = searchParams.get("fromThinking");
    const fromInbox = searchParams.get("fromInbox");
    const fromTrack = searchParams.get("fromTrack");
    if (fromThinking) {
      await linkThinkingToDecision(fromThinking, row.id);
    } else if (fromTrack) {
      await linkTrackToDecision(fromTrack, row.id);
    } else if (fromInbox) {
      await linkInboxJumpTarget(fromInbox, "decisions", "decision", row.id);
    }

    if (tags.tag_outcome === "abandon") {
      endSeedForEntity("decision", row.id, "在决策环节放弃");
      row.archived_at = new Date().toISOString();
    }

    try {
      if (isCloudEnabled()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        row.user_id = user.id;
      }
      row.flow_confirmed = true;
      const savedId = await persistDecision(row);
      if (triageId) patchTriageTarget(triageId, "decision", savedId);
      setTitle("");
      setMode("list");
      setFlowDraftId(crypto.randomUUID());
      await load();
    } catch {
      /* 保存失败时保留流程状态 */
    }
  };

  const toggleArchive = async (id: string, archive: boolean) => {
    const next = await setDecisionArchived(id, archive);
    setList(next);
    setContextMenu(null);
    if (detail?.id === id) {
      const u = next.find((d) => d.id === id);
      if (u) setDetail(u);
    }
  };

  const exportRows = filtered.map((d) => ({
    标题: d.title,
    来源: SOURCE_LABELS[d.source],
    结论: d.manual_conclusion ?? "",
    目标: d.manual_goal ?? "",
    自己做: d.tag_executor === "self" ? "是" : "",
    别人做: d.tag_executor === "delegate" ? "是" : "",
    短期: d.tag_horizon === "short" ? "是" : "",
    长期: d.tag_horizon === "long" ? "是" : "",
    结果: d.tag_outcome === "abandon" ? "放弃" : "正常进行",
    路径摘要: d.path_summary,
    最终行动: d.final_action,
    创建时间: formatDate(d.created_at),
  }));

  if (mode === "flow" && !archiveBox) {
    return (
      <div className="flex h-[calc(100dvh-5rem)] min-h-0 flex-col p-4 lg:h-[calc(100dvh-2rem)] lg:p-6">
        <DecisionFlow
          title={title}
          onComplete={saveDecision}
          onAutosave={autosaveFlowDraft}
          onCancel={() => setMode("new")}
        />
      </div>
    );
  }

  if (detail) {
    return (
      <>
        <DecisionDetailView
          detail={detail}
          archiveBox={archiveBox}
          onBack={() => setDetail(null)}
          onArchive={(archive) => toggleArchive(detail.id, archive)}
          onLink={() => setLinkOpen(true)}
          onUpdated={(next) => {
            setList(next);
            const u = next.find((d) => d.id === detail.id);
            if (u) setDetail(u);
          }}
        />
        <LinkEntityDialog
          open={linkOpen}
          fromType="decision"
          fromId={detail.id}
          onClose={() => setLinkOpen(false)}
        />
      </>
    );
  }

  const listContent = (
    <>
      {!archiveBox && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8ECF0] bg-[#F8FAFC] px-3 py-2">
          <DecisionListFilters
            value={filters}
            onChange={setFilters}
            inline
          />
          {mode === "new" && (
            <Button variant="ghost" size="sm" onClick={() => setMode("list")}>
              取消新建
            </Button>
          )}
        </div>
      )}

      {archiveBox && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E8ECF0] bg-[#F8FAFC] px-3 py-2">
          <DecisionListFilters
            value={filters}
            onChange={setFilters}
            inline
          />
        </div>
      )}

      <p className="text-xs text-slate-400">
        {filtered.length} 条
        {archiveBox ? "已归档决策" : "决策"}
        {!archiveBox && " · 右键可归档或跳转"}
      </p>

      <ul className="mx-auto w-full max-w-2xl space-y-2">
        {filtered.map((d) => (
          <li key={d.id}>
            <DecisionListCard
              row={d}
              onClick={() => setDetail(d)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ row: d, x: e.clientX, y: e.clientY });
              }}
            />
          </li>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#FAFBFC] py-16 text-center">
            <p className="text-sm text-slate-500">
              {archiveBox
                ? "该栏目暂无归档"
                : pool.length === 0
                  ? "暂无决策，点击右上角 + 开始"
                  : "没有符合筛选条件的决策"}
            </p>
          </div>
        )}
      </ul>
    </>
  );

  if (embeddedInArchive && !detail) {
    return (
      <div className="space-y-4" onClick={() => setContextMenu(null)}>
        {listContent}
        <TrackProblemWizardDialog
          open={trackWizardOpen}
          preset={trackPreset}
          onClose={() => setTrackWizardOpen(false)}
          onSaved={() => setTrackWizardOpen(false)}
        />

        {contextMenu && (
          <DecisionContextMenu
            archiveBox={archiveBox}
            contextMenu={contextMenu}
            onUnarchive={() => toggleArchive(contextMenu.row.id, false)}
            onArchive={() => toggleArchive(contextMenu.row.id, true)}
            onClose={() => setContextMenu(null)}
            onAddTrack={() => {
              setTrackPreset({
                anchorType: "decision",
                anchorId: contextMenu.row.id,
              });
              setTrackWizardOpen(true);
              setContextMenu(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="space-y-5 p-4 lg:p-6"
      onClick={() => setContextMenu(null)}
    >
      <PageHeader
        title={archiveBox ? "决策 · 已归档" : "时间管理决策树"}
        description={archiveBox ? undefined : MODULE_INTRO.decisions}
        secondaryLink={
          !archiveBox && !embeddedInArchive
            ? {
                label: `总归档箱${archiveCount > 0 ? ` (${archiveCount})` : ""}`,
                href: "/archive?tab=decisions",
              }
            : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportExcelButton
              rows={exportRows}
              fileName={archiveBox ? "decisions-archive.xlsx" : "decisions.xlsx"}
              sheetName="决策"
            />
            {!archiveBox && mode !== "new" && (
              <HeaderAddButton
                title="新建决策"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("new");
                }}
              />
            )}
          </div>
        }
      />

      {triageId && !archiveBox && (mode === "new" || mode === "flow") && (
        <OriginFlashPanel triageId={triageId} />
      )}

      {!archiveBox && mode === "new" && (
        <Card className="border-[#C7D2FE]/50 bg-white shadow-sm">
          <label className="text-xs font-medium text-slate-600">决策标题</label>
          <Input
            className="mt-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简要描述这件事"
          />
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={startFlow} disabled={!title.trim()}>
              开始决策
            </Button>
            <Button variant="ghost" onClick={() => setMode("list")}>
              取消
            </Button>
          </div>
        </Card>
      )}

      {(mode === "list" || archiveBox) && listContent}

      <TrackProblemWizardDialog
        open={trackWizardOpen}
        preset={trackPreset}
        onClose={() => setTrackWizardOpen(false)}
        onSaved={() => setTrackWizardOpen(false)}
      />

      {contextMenu && (
        <DecisionContextMenu
          archiveBox={archiveBox}
          contextMenu={contextMenu}
          onUnarchive={() => toggleArchive(contextMenu.row.id, false)}
          onArchive={() => toggleArchive(contextMenu.row.id, true)}
          onClose={() => setContextMenu(null)}
          onAddTrack={() => {
            setTrackPreset({
              anchorType: "decision",
              anchorId: contextMenu.row.id,
            });
            setTrackWizardOpen(true);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
}

function DecisionContextMenu({
  archiveBox,
  contextMenu,
  onArchive,
  onUnarchive,
  onClose,
  onAddTrack,
}: {
  archiveBox: boolean;
  contextMenu: { row: DecisionRow; x: number; y: number };
  onArchive: () => void;
  onUnarchive: () => void;
  onClose: () => void;
  onAddTrack?: () => void;
}) {
  const { row, x, y } = contextMenu;
  const archiveItem = archiveBox
    ? {
        type: "action" as const,
        label: "取消归档",
        onClick: onUnarchive,
      }
    : {
        type: "action" as const,
        label: "移入总归档箱",
        onClick: onArchive,
      };

  return (
    <FlowListContextMenu
      fromStage="decisions"
      title={row.title}
      entityId={row.id}
      x={x}
      y={y}
      onClose={onClose}
      excludeStages={archiveBox || row.tag_outcome === "abandon" ? ["goals", "track"] : []}
      extraItems={[
        {
          type: "action",
          label: "在仪表盘中显示",
          onClick: () => {
            const result = pinDecisionToDashboard(row.id, row.title);
            if (!result.ok) window.alert(result.reason);
          },
        },
        { type: "separator" },
        archiveItem,
      ]}
      onAddTrack={onAddTrack}
    />
  );
}
