"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlowFunnelModal } from "@/components/flow/FlowFunnelModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { addInboxItem } from "@/lib/inbox/storage";
import { suggestSummary } from "@/lib/triage/extract";
import { loadTriageWizard } from "@/lib/triage/logic-storage";
import {
  findWizardOption,
  getWizardParentStepId,
  TRIAGE_DESTINATION_LABELS,
  TRIAGE_FOCUS_LABELS,
  type TriageWizardStep,
} from "@/lib/triage/logic";
import {
  createTriageRecord,
  patchTriageTarget,
} from "@/lib/triage/storage";
import type {
  TriageDestination,
  TriageFocus,
  TriageOrigin,
} from "@/lib/triage/types";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import { createThoughtSession } from "@/lib/thinking/storage";
import { cn } from "@/lib/utils";

type FlowStep = "input" | "direct" | "wizard" | "result" | "organize";

const DIRECT_DESTINATIONS: TriageDestination[] = [
  "inbox",
  "thinking",
  "decisions",
  "goals",
  "track",
  "knowledge",
];

const DIRECT_FOCUS: Partial<Record<TriageDestination, TriageFocus>> = {
  thinking: "clear_explore",
  decisions: "clear_decide",
  goals: "clear_goal",
  track: "clear_blocked",
  knowledge: "clear_knowledge",
};

const DEST_ICON: Record<TriageDestination, string> = {
  inbox: "▤",
  thinking: "◉",
  decisions: "◇",
  goals: "◎",
  track: "◈",
  knowledge: "◈",
};

const DEST_HINT: Record<TriageDestination, string> = {
  inbox: "先记下来，以后再归类或展开",
  thinking: "用追问与方法把脉络摊开",
  decisions: "在时间与取舍里做「做不做」的决定",
  goals: "落成 SMART 与 OKR，开始推进",
  track: "记录推进中的问题与解法",
  knowledge: "用理论、模型与画布做系统梳理",
};

function snippet(text: string, max = 32): string {
  const t = text.trim();
  if (!t) return "这件事";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function formatInboxNote(
  raw: string,
  worryPoints: string[],
  triageId: string
): string {
  const worries =
    worryPoints.length > 0
      ? `核心要点：\n${worryPoints.map((w) => `· ${w}`).join("\n")}`
      : "";
  return [worries, `原始闪念：\n${raw}`, `定位记录：${triageId}`]
    .filter(Boolean)
    .join("\n\n");
}

function renderStepTitle(step: TriageWizardStep, text: string): string {
  if (step.id === "origin") {
    return `关于「${snippet(text)}」，${step.title.replace(/^步骤 \d+ · /, "")}`;
  }
  return step.title.replace(/^步骤 \d+ · /, "");
}

export function HomeTriageClient() {
  const router = useRouter();
  const [wizard, setWizard] = useState(() => loadTriageWizard());
  const [flowStep, setFlowStep] = useState<FlowStep>("input");
  const [wizardStepId, setWizardStepId] = useState("origin");
  const [text, setText] = useState("");
  const [origin, setOrigin] = useState<TriageOrigin | null>(null);
  const [focus, setFocus] = useState<TriageFocus | null>(null);
  const [destination, setDestination] = useState<TriageDestination | null>(null);
  const [selectedHint, setSelectedHint] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [worryPoints, setWorryPoints] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [entryMode, setEntryMode] = useState<"wizard" | "direct">("wizard");
  const [funnelOpen, setFunnelOpen] = useState(false);

  const currentWizardStep = wizard.find((s) => s.id === wizardStepId);

  useEffect(() => {
    if (flowStep === "organize" && text.trim()) {
      setSummary(suggestSummary(text));
    }
  }, [flowStep, text]);

  const reset = () => {
    setFlowStep("input");
    setWizardStepId("origin");
    setOrigin(null);
    setFocus(null);
    setDestination(null);
    setSelectedHint(null);
    setSummary("");
    setWorryPoints([]);
    setEntryMode("wizard");
  };

  const pickDirect = (dest: TriageDestination) => {
    if (dest === "inbox") {
      setOrigin("flash");
      setFocus(null);
    } else {
      setOrigin("clear");
      setFocus(DIRECT_FOCUS[dest] ?? null);
    }
    setDestination(dest);
    setEntryMode("direct");
    setSelectedHint(null);
    setSummary(suggestSummary(text));
    setFlowStep("organize");
  };

  const startOrganize = () => {
    setEntryMode("wizard");
    setSummary(suggestSummary(text));
    setFlowStep("organize");
  };

  const handleOption = (optionId: string) => {
    if (!currentWizardStep) return;
    const opt = findWizardOption(wizard, wizardStepId, optionId);
    if (!opt) return;

    setEntryMode("wizard");
    if (opt.origin) setOrigin(opt.origin);
    if (opt.focus) setFocus(opt.focus);
    setSelectedHint(opt.hint ?? null);

    if (opt.nextStepId) {
      setFlowStep("wizard");
      setWizardStepId(opt.nextStepId);
      return;
    }

    if (opt.destination) {
      setDestination(opt.destination);
      setFlowStep("result");
    }
  };

  const wizardBack = () => {
    const parent = getWizardParentStepId(wizardStepId);
    if (!parent) {
      setFlowStep("input");
      setWizardStepId("origin");
      setOrigin(null);
      setFocus(null);
      return;
    }
    setWizardStepId(parent);
    setFocus(null);
    setDestination(null);
    setSelectedHint(null);
  };

  const updateWorry = (index: number, value: string) => {
    setWorryPoints((prev) => prev.map((w, i) => (i === index ? value : w)));
  };

  const removeWorry = (index: number) => {
    setWorryPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const addWorry = () => {
    setWorryPoints((prev) => [...prev, ""]);
  };

  const go = async (dest: TriageDestination) => {
    const rawText = text.trim();
    const theme = summary.trim();
    if (!rawText || !theme || !origin) return;

    setBusy(true);
    try {
      const record = createTriageRecord({
        rawText,
        summary: theme,
        worryPoints: worryPoints.map((w) => w.trim()).filter(Boolean),
        origin,
        focus,
        destination: dest,
        entryMode,
      });

      const triageQ = `triage=${record.id}`;

      switch (dest) {
        case "inbox": {
          const items = await addInboxItem(
            theme,
            "未归类",
            formatInboxNote(rawText, record.worryPoints, record.id)
          );
          const item = items.find(
            (i) => i.source === "inbox" && i.title === theme
          );
          if (item) {
            patchTriageTarget(record.id, "inbox", item.id);
            registerFlowEntry("inbox_manual", item.id, "inbox");
          }
          router.push(`/inbox?${triageQ}`);
          break;
        }
        case "thinking": {
          const session = createThoughtSession(theme, {
            sourceTriageId: record.id,
          });
          patchTriageTarget(record.id, "thinking_session", session.id);
          registerFlowEntry("thinking_session", session.id, "thinking");
          router.push(`/thinking?session=${session.id}&${triageQ}`);
          break;
        }
        case "decisions": {
          router.push(
            `/decisions?new=1&title=${encodeURIComponent(theme)}&${triageQ}`
          );
          break;
        }
        case "goals": {
          router.push(`/goals?title=${encodeURIComponent(theme)}&${triageQ}`);
          break;
        }
        case "track": {
          router.push(
            `/graph?title=${encodeURIComponent(theme)}&${triageQ}&background=${encodeURIComponent(
              record.worryPoints.join("\n") || rawText
            )}`
          );
          break;
        }
        case "knowledge": {
          router.push(
            `/theories?title=${encodeURIComponent(theme)}&${triageQ}`
          );
          break;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col items-center justify-center px-4 py-6">
      <FlowFunnelModal open={funnelOpen} onClose={() => setFunnelOpen(false)} />

      <div className="w-full max-w-lg">
        {flowStep === "input" && (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              此刻在想什么？
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              先把念头写下来。定位后会梳理成主题，再送进对应流程。
            </p>
          </div>
        )}

        {flowStep === "input" && (
          <Card className="bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]/80">
            <Textarea
              rows={7}
              className="min-h-[180px] resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
              placeholder="随便写，线性、混乱都可以…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#EEF1F5] pt-4">
              <Button
                variant="secondary"
                disabled={!text.trim()}
                onClick={() => setFlowStep("direct")}
              >
                直接选择
              </Button>
              <Button
                variant="primary"
                disabled={!text.trim()}
                onClick={() => {
                  setWizard(loadTriageWizard());
                  setWizardStepId("origin");
                  setEntryMode("wizard");
                  setFlowStep("wizard");
                }}
              >
                帮我定位
              </Button>
            </div>
          </Card>
        )}

        {flowStep === "direct" && (
          <StepCard
            title="你要直接进入哪个板块？"
            onBack={() => setFlowStep("input")}
          >
            {DIRECT_DESTINATIONS.map((dest) => (
              <ChoiceButton key={dest} onClick={() => pickDirect(dest)}>
                <span className="flex items-center gap-2">
                  <span>{DEST_ICON[dest]}</span>
                  <span>{TRIAGE_DESTINATION_LABELS[dest]}</span>
                </span>
                <span className="mt-1 block text-[11px] font-normal text-slate-400">
                  {DEST_HINT[dest]}
                </span>
              </ChoiceButton>
            ))}
          </StepCard>
        )}

        {flowStep === "wizard" && currentWizardStep && (
          <StepCard
            title={renderStepTitle(currentWizardStep, text)}
            condition={currentWizardStep.condition}
            onBack={wizardBack}
          >
            {currentWizardStep.options.map((opt) => (
              <ChoiceButton key={opt.id} onClick={() => handleOption(opt.id)}>
                <span>{opt.label}</span>
                {opt.hint && (
                  <span className="mt-1 block text-[11px] font-normal text-slate-400">
                    {opt.hint}
                  </span>
                )}
              </ChoiceButton>
            ))}
          </StepCard>
        )}

        {flowStep === "result" && destination && (
          <Card className="border-[#C7D2FE] bg-[#EEF2FF]/50 p-5 shadow-sm">
            <p className="text-center text-xs font-medium text-[#4338CA]">
              建议进入
            </p>
            <div className="mt-3 flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                {DEST_ICON[destination]}
              </span>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">
                {TRIAGE_DESTINATION_LABELS[destination]}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {DEST_HINT[destination]}
              </p>
              {focus && (
                <p className="mt-2 text-[11px] text-slate-500">
                  {TRIAGE_FOCUS_LABELS[focus]}
                </p>
              )}
            </div>
            {destination === "knowledge" && (
              <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-center text-[11px] leading-relaxed text-violet-800 ring-1 ring-violet-200/80">
                未验证的洞察先入理论库；已成型的框架用模型；具体议题在画布展开。
              </p>
            )}
            {selectedHint && destination !== "knowledge" && (
              <p className="mt-3 text-center text-[11px] text-slate-500">
                {selectedHint}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={startOrganize}>
                梳理并进入
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                重新定位
              </Button>
            </div>
          </Card>
        )}

        {flowStep === "organize" && destination && (
          <Card className="bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]/80">
            <p className="text-sm font-medium text-slate-800">
              梳理后进入「{TRIAGE_DESTINATION_LABELS[destination]}」
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {entryMode === "direct"
                ? "你已直接选择板块 · 用一句话当主题；核心要点可选"
                : "用一句话当主题；核心要点可选，需要时再添加。"}
            </p>

            <label className="mt-4 block text-xs font-medium text-slate-600">
              一句话主题
            </label>
            <Input
              className="mt-1"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />

            {worryPoints.length > 0 ? (
              <>
                <p className="mt-4 text-xs font-medium text-slate-600">核心要点</p>
                <ul className="mt-2 space-y-2">
                  {worryPoints.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <Input
                        className="text-sm"
                        value={w}
                        onChange={(e) => updateWorry(i, e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => removeWorry(i)}
                      >
                        删
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="mt-2"
                  onClick={addWorry}
                >
                  + 添加要点
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="mt-4"
                onClick={() => setWorryPoints([""])}
              >
                + 添加核心要点
              </Button>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] text-slate-400">
                原始闪念
              </summary>
              <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-500">
                {text}
              </p>
            </details>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#EEF1F5] pt-4">
              <Button
                variant="primary"
                disabled={busy || !summary.trim()}
                onClick={() => go(destination)}
              >
                {busy
                  ? "跳转中…"
                  : `进入${TRIAGE_DESTINATION_LABELS[destination]}`}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFlowStep(entryMode === "direct" ? "direct" : "result")
                }
              >
                返回
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setFunnelOpen(true)}
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-slate-600 transition hover:border-[#94A3B8] hover:text-slate-800"
          >
            流程漏斗
          </button>
          <Link
            href="/home/logic"
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-slate-600 transition hover:border-[#94A3B8] hover:text-slate-800"
          >
            决策逻辑
          </Link>
          <Link
            href="/home/records"
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-slate-600 transition hover:border-[#94A3B8] hover:text-slate-800"
          >
            闪念记录
          </Link>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  title,
  condition,
  onBack,
  children,
}: {
  title: string;
  condition?: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-white p-5 shadow-sm ring-1 ring-[#E2E8F0]/80">
      <p className="text-center text-sm font-medium text-slate-800">{title}</p>
      {condition && (
        <p className="mt-1 text-center text-[10px] text-slate-400">
          {condition}
        </p>
      )}
      <div className="mt-4 grid gap-2">{children}</div>
      <div className="mt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={onBack}>
          上一步
        </Button>
      </div>
    </Card>
  );
}

function ChoiceButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-left text-sm text-slate-700 transition",
        "hover:border-[#94A3B8] hover:bg-[#F8FAFC]"
      )}
    >
      {children}
    </button>
  );
}
