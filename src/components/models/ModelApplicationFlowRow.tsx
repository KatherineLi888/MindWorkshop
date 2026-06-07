"use client";

import Link from "next/link";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { getSlotsFromConfig } from "@/lib/models/helpers";
import { MODEL_KIND_LABELS, type ModelApplication } from "@/lib/models/types";
import { formatDateTime } from "@/lib/utils";

function FlowBlock({
  label,
  text,
  background = "#FFFFFF",
}: {
  label: string;
  text: string;
  background?: string;
}) {
  return (
    <div
      className="flex min-h-[4rem] min-w-[6.5rem] max-w-[10rem] flex-1 flex-col justify-center rounded-lg border border-[#E8ECF0] px-2 py-2"
      style={{ background }}
    >
      <span className="text-[9px] font-medium text-slate-400">{label}</span>
      <p className="mt-1 line-clamp-4 text-xs leading-snug text-slate-700">
        {text || "—"}
      </p>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center justify-center self-stretch px-0.5">
      <span className="mb-1 text-center text-[9px] font-medium text-slate-400">
        {label}
      </span>
      <div className="flex w-full items-center gap-0.5">
        <div className="h-0.5 flex-1 rounded-full bg-slate-300" />
        <span className="text-sm leading-none text-slate-400">›</span>
      </div>
    </div>
  );
}

export function ModelApplicationFlowRow({
  application,
  onDelete,
}: {
  application: ModelApplication;
  onDelete?: () => void;
}) {
  const slots = getSlotsFromConfig(application.configSnapshot);
  const filled = slots
    .map((s) => ({
      label: s.label,
      text: application.values[s.id]?.trim() ?? "",
    }))
    .filter((x) => x.text);

  const previewSlots = filled.slice(0, 3);
  const more = filled.length - previewSlots.length;

  return (
    <div className="rounded-xl border border-[#EEF1F5] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">
            {application.scenario}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {formatDateTime(application.createdAt)}
            {application.note ? ` · ${application.note}` : ""}
          </p>
          <SeedLinkPanel
            entityType="model_application"
            entityId={application.id}
            title={application.scenario || application.modelName}
            stage="model"
            compact
            className="mt-1.5"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/models/apply?model=${application.modelId}`}
            className="text-[10px] text-[#4338CA] hover:underline"
          >
            再次套用
          </Link>
          {onDelete && (
            <button
              type="button"
              className="text-[10px] text-red-500"
              onClick={onDelete}
            >
              删除
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-stretch gap-0 overflow-x-auto pb-1">
        <FlowBlock
          label="场景"
          text={application.scenario}
          background="#F8FAFC"
        />
        <FlowArrow label="套用" />
        <FlowBlock
          label={application.modelName}
          text={`${MODEL_KIND_LABELS[application.kind]}${filled.length ? ` · ${filled.length} 项已填` : ""}`}
          background="#EEF2FF"
        />
        {previewSlots.map((slot, i) => (
          <span key={slot.label} className="flex items-stretch">
            <FlowArrow label={i === 0 ? "填入" : ""} />
            <FlowBlock label={slot.label} text={slot.text} />
          </span>
        ))}
        {more > 0 && (
          <>
            <FlowArrow label="" />
            <FlowBlock label="更多" text={`还有 ${more} 项…`} background="#FAFBFC" />
          </>
        )}
      </div>
    </div>
  );
}
