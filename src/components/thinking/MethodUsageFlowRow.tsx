"use client";

import Link from "next/link";
import type { MethodUsageRecord } from "@/lib/thinking/method-usage";
import type { StoredThinkingMethod } from "@/lib/thinking/methods";
import type { UsageAnnotation } from "@/lib/thinking/method-meta";
import { formatDate } from "@/lib/utils";

const CONTEXT_LABEL: Record<string, string> = {
  topic: "主题",
  answer: "上一回答",
  question: "上一提问",
  merge: "合并点",
  unknown: "上级",
};

function FlowBlock({
  label,
  text,
  background,
}: {
  label: string;
  text: string;
  background?: string;
}) {
  return (
    <div
      className="flex min-h-[4.5rem] min-w-[7.5rem] max-w-[11rem] flex-1 flex-col justify-center rounded-lg border border-[#E8ECF0] px-2.5 py-2"
      style={{ background: background ?? "#FFFFFF" }}
    >
      <span className="text-[9px] font-medium text-slate-400">{label}</span>
      <p className="mt-1 line-clamp-4 text-xs leading-snug text-slate-700">
        {text}
      </p>
    </div>
  );
}

function FlowArrow({
  label,
  color,
  showLabel = true,
}: {
  label: string;
  color: string;
  showLabel?: boolean;
}) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center justify-center self-stretch px-0.5">
      {showLabel ? (
        <span
          className="mb-1.5 text-center text-[10px] font-bold leading-tight"
          style={{ color }}
        >
          {label}
        </span>
      ) : (
        <span className="mb-1.5 h-[14px]" />
      )}
      <div className="flex w-full items-center gap-0.5">
        <div className="h-0.5 flex-1 rounded-full bg-slate-300" />
        <span className="text-sm leading-none text-slate-400">›</span>
      </div>
    </div>
  );
}

type Props = {
  usage: MethodUsageRecord;
  method: StoredThinkingMethod;
  annotation?: UsageAnnotation;
  onTogglePin: () => void;
  onToggleStar: () => void;
};

export function MethodUsageFlowRow({
  usage,
  method,
  annotation,
  onTogglePin,
  onToggleStar,
}: Props) {
  const contextLabel =
    CONTEXT_LABEL[usage.parentType] ?? CONTEXT_LABEL.unknown;

  return (
    <div className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Link
          href={`/thinking?session=${usage.sessionId}`}
          className="text-xs font-medium text-[#3B82F6] hover:underline"
        >
          {usage.sessionTitle}
        </Link>
        <span className="text-[10px] text-slate-400">
          {formatDate(usage.createdAt)}
        </span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              annotation?.pinned
                ? "bg-[#EEF2FF] text-[#4338CA]"
                : "text-slate-400 hover:bg-white"
            }`}
            onClick={onTogglePin}
          >
            置顶
          </button>
          <button
            type="button"
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              annotation?.starred
                ? "bg-amber-50 text-amber-700"
                : "text-slate-400 hover:bg-white"
            }`}
            onClick={onToggleStar}
          >
            收藏
          </button>
        </div>
      </div>

      <div className="flex items-stretch overflow-x-auto pb-1">
        <FlowBlock
          label={contextLabel}
          text={usage.parentPreview}
        />
        <FlowArrow label={usage.methodShort} color={method.color} />
        <FlowBlock
          label="提问"
          text={usage.question}
          background={method.contentBg}
        />
        {usage.answerPreview && (
          <>
            <FlowArrow label="" color={method.color} showLabel={false} />
            <FlowBlock
              label="回答"
              text={usage.answerPreview}
              background="#F7FCF9"
            />
          </>
        )}
      </div>
    </div>
  );
}
