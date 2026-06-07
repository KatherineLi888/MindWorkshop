"use client";

import { useEffect, useState } from "react";
import { AUTH_ENABLED } from "@/lib/config";
import { rebuildHistoryFromAnswers, type FlowAnswers } from "@/lib/decision-tree/flow";
import { notesForDisplay } from "@/lib/decisions/notes";
import { DecisionChoiceLog } from "@/components/decision/DecisionChoiceLog";
import { DecisionNotesPanel } from "@/components/decision/DecisionNotesPanel";
import { NoteTimeBadge } from "@/components/decision/NoteTimeBadge";
import { DecisionTagBadges } from "@/components/decision/DecisionTagBadges";
import { DecisionTreeMap } from "@/components/decision/DecisionTreeMap";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { AnchorTrackSection } from "@/components/track/AnchorTrackSection";
import { FlowAdvancePanel } from "@/components/flow/FlowAdvancePanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { DecisionRow } from "@/types/database";

type Props = {
  detail: DecisionRow;
  archiveBox: boolean;
  onBack: () => void;
  onArchive: (archive: boolean) => void | Promise<void>;
  onLink: () => void;
  onUpdated: (rows: DecisionRow[]) => void;
};

export function DecisionDetailView({
  detail,
  archiveBox,
  onBack,
  onArchive,
  onLink,
  onUpdated,
}: Props) {
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const answers = detail.flow_state as FlowAnswers;
  const conclusion =
    detail.manual_conclusion?.trim() || detail.final_action || "—";
  const goal = detail.manual_goal?.trim();
  const displayNotes = notesForDisplay(detail);
  const hasFlow = answers && typeof answers === "object";
  const isArchived = detail.archived_at != null;

  useEffect(() => {
    if (!statusMsg) return;
    const t = setTimeout(() => setStatusMsg(null), 4000);
    return () => clearTimeout(t);
  }, [statusMsg]);

  const runArchive = async (archive: boolean) => {
    setArchiveBusy(true);
    try {
      await onArchive(archive);
      setStatusMsg(
        archive
          ? "已移入总归归档箱，仍可在归档箱中查看或取消归档"
          : "已取消归档，该决策已回到决策列表"
      );
      setConfirmArchiveOpen(false);
    } finally {
      setArchiveBusy(false);
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← 返回{archiveBox ? "归档箱" : "列表"}
      </Button>

      <Card className="bg-white">
        <div className="flex items-start gap-3">
          <h2 className="min-w-0 flex-1 text-lg font-medium text-slate-900">
            {detail.title}
          </h2>
          <div className="shrink-0 text-right">
            <DecisionTagBadges row={detail} />
            <p className="mt-1 text-[10px] text-slate-400">
              {formatDate(detail.created_at)}
            </p>
          </div>
        </div>

        {isArchived && (
          <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
            本条已在总归归档箱中
          </p>
        )}

        {statusMsg && (
          <p
            className="mt-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-xs text-[#166534]"
            role="status"
          >
            {statusMsg}
          </p>
        )}

        <div className="mt-4 space-y-2 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-4 py-3">
          <p className="text-sm leading-relaxed text-slate-800">
            <span className="font-medium text-slate-500">结论：</span>
            {conclusion}
          </p>
          {goal ? (
            <p className="text-sm leading-relaxed text-slate-700">
              <span className="font-medium text-slate-500">目标：</span>
              {goal}
            </p>
          ) : (
            <p className="text-xs text-slate-400">目标：未填写</p>
          )}
        </div>

        {displayNotes.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-medium text-slate-400">展示备注</p>
            <ul className="mt-1.5 space-y-1.5">
              {displayNotes.map((n) => (
                <li key={n.id} className="flex gap-2">
                  <NoteTimeBadge iso={n.created_at} />
                  <p className="min-w-0 flex-1 rounded-md border border-[#EEF1F5] bg-[#FAFBFC] px-2.5 py-1.5 text-sm leading-snug text-slate-700">
                    {n.content}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DecisionNotesPanel decision={detail} onUpdated={onUpdated} />

        <SeedLinkPanel
          entityType="decision"
          entityId={detail.id}
          title={detail.title}
          stage="decisions"
          className="mt-4"
        />

        <div className="mt-4">
          <AnchorTrackSection
            anchorType="decision"
            anchorId={detail.id}
            anchorTitle={detail.title}
          />
        </div>

        {hasFlow && (
          <div className="mt-4 border-t border-[#EEF1F5] pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">决策树</p>
            <DecisionTreeMap
              answers={answers}
              history={rebuildHistoryFromAnswers(answers)}
              currentStepId=""
            />
          </div>
        )}

        {hasFlow && (
          <DecisionChoiceLog
            answers={answers}
            collapsible
            defaultOpen={false}
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EEF1F5] pt-4">
          {AUTH_ENABLED && (
            <Button size="sm" variant="secondary" onClick={onLink}>
              关联到
            </Button>
          )}
          {isArchived ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={archiveBusy}
              onClick={() => runArchive(false)}
            >
              {archiveBusy ? "处理中…" : "取消归档"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmArchiveOpen(true)}
            >
              移入总归归档箱…
            </Button>
          )}
        </div>
      </Card>

      {!archiveBox && !isArchived && detail.tag_outcome !== "abandon" && (
        <FlowAdvancePanel
          fromStage="decisions"
          title={detail.title}
          entityId={detail.id}
        />
      )}

      {confirmArchiveOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 sm:items-center"
          onClick={() => !archiveBusy && setConfirmArchiveOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-slate-800">
              移入总归归档箱？
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              归档后不会删除，可在侧栏「总归归档箱」或列表页链接中找到。确认前不会直接归档。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={archiveBusy}
                onClick={() => setConfirmArchiveOpen(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={archiveBusy}
                onClick={() => runArchive(true)}
              >
                {archiveBusy ? "归档中…" : "确认归档"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
