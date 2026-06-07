"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  createFunnelConfig,
  createGridConfig,
  createQuadrantConfig,
  createStageConfig,
  isFunnelConfig,
  isGridConfig,
  isQuadrantConfig,
  isStageConfig,
  makeFunnelLevels,
  makeGridCells,
  makeRegions,
  makeStages,
  uid,
} from "@/lib/models/helpers";
import {
  MODEL_KIND_LABELS,
  type ModelDefinition,
  type ModelKind,
} from "@/lib/models/types";

type ModelDraft = ModelDefinition & { id: string };
import { ModelPreview } from "./ModelPreview";

const KIND_OPTIONS: ModelKind[] = ["quadrant", "stage", "funnel", "grid"];

export function ModelNotesFields({
  draft,
  onChange,
}: {
  draft: ModelDraft;
  onChange: (next: ModelDraft) => void;
}) {
  return (
    <div className="space-y-2 border-t border-[#EEF1F5] pt-2">
      <p className="text-[10px] font-medium text-slate-500">备注与使用指引</p>
      <Field
        label="适用情况"
        value={draft.applicableScenarios}
        onChange={(v) => onChange({ ...draft, applicableScenarios: v })}
        rows={2}
        placeholder="什么场景下适合用这个模型？"
      />
      <Field
        label="启发"
        value={draft.inspirations}
        onChange={(v) => onChange({ ...draft, inspirations: v })}
        rows={2}
        placeholder="这个模型带来的关键启发或原则"
      />
      <Field
        label="后续使用"
        value={draft.usageNotes}
        onChange={(v) => onChange({ ...draft, usageNotes: v })}
        rows={2}
        placeholder="计划在什么情境中继续使用"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  rows = 1,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-[10px] text-slate-500">
      {label}
      {rows > 1 ? (
        <Textarea
          className="mt-0.5 text-xs"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          className="mt-0.5 h-8 text-xs"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function ModelConfigFields({
  draft,
  onChange,
}: {
  draft: ModelDraft;
  onChange: (next: ModelDraft) => void;
}) {
  const { config } = draft;

  if (isQuadrantConfig(config)) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-slate-500">坐标轴</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <AxisField
            label="横轴（低 → 高）"
            low={config.xAxis.low}
            high={config.xAxis.high}
            onChange={(low, high) =>
              onChange({
                ...draft,
                config: { ...config, xAxis: { low, high } },
              })
            }
          />
          <AxisField
            label="纵轴（低 → 高）"
            low={config.yAxis.low}
            high={config.yAxis.high}
            onChange={(low, high) =>
              onChange({
                ...draft,
                config: { ...config, yAxis: { low, high } },
              })
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              const next = createQuadrantConfig(2, 2);
              next.xAxis = config.xAxis;
              next.yAxis = config.yAxis;
              onChange({ ...draft, config: next });
            }}
          >
            2×2
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              const next = createQuadrantConfig(3, 3);
              next.xAxis = config.xAxis;
              next.yAxis = config.yAxis;
              onChange({ ...draft, config: next });
            }}
          >
            3×3
          </Button>
        </div>
        <p className="text-[10px] font-medium text-slate-500">各象限</p>
        {config.regions.map((r, i) => (
          <div
            key={r.id}
            className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2 space-y-1"
          >
            <Input
              className="h-7 text-xs font-medium"
              value={r.label}
              placeholder={`象限 ${i + 1} 名称`}
              onChange={(e) => {
                const regions = [...config.regions];
                regions[i] = { ...r, label: e.target.value };
                onChange({ ...draft, config: { ...config, regions } });
              }}
            />
            <Textarea
              className="text-xs"
              rows={2}
              value={r.definition}
              placeholder="定义：这个象限代表什么"
              onChange={(e) => {
                const regions = [...config.regions];
                regions[i] = { ...r, definition: e.target.value };
                onChange({ ...draft, config: { ...config, regions } });
              }}
            />
            <Textarea
              className="text-xs"
              rows={1}
              value={r.traits}
              placeholder="特点：典型特征或判断标准"
              onChange={(e) => {
                const regions = [...config.regions];
                regions[i] = { ...r, traits: e.target.value };
                onChange({ ...draft, config: { ...config, regions } });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isStageConfig(config)) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-medium text-slate-500">阶段列表</p>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              const stages = [
                ...config.stages,
                { id: uid("stage"), name: `阶段 ${config.stages.length + 1}`, description: "" },
              ];
              onChange({ ...draft, config: { stages } });
            }}
          >
            + 阶段
          </Button>
          {config.stages.length > 2 && (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                const stages = config.stages.slice(0, -1);
                onChange({ ...draft, config: { stages } });
              }}
            >
              − 阶段
            </Button>
          )}
          <div className="flex gap-1">
            {[3, 4, 5].map((n) => (
              <Button
                key={n}
                size="sm"
                variant="ghost"
                type="button"
                onClick={() =>
                  onChange({
                    ...draft,
                    config: createStageConfig(n, makeStages(n).map((s) => s.name)),
                  })
                }
              >
                {n} 阶段
              </Button>
            ))}
          </div>
        </div>
        {config.stages.map((s, i) => (
          <div
            key={s.id}
            className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2 space-y-1"
          >
            <Input
              className="h-7 text-xs font-medium"
              value={s.name}
              placeholder={`阶段 ${i + 1} 名称`}
              onChange={(e) => {
                const stages = [...config.stages];
                stages[i] = { ...s, name: e.target.value };
                onChange({ ...draft, config: { stages } });
              }}
            />
            <Textarea
              className="text-xs"
              rows={2}
              value={s.description}
              placeholder="阶段说明"
              onChange={(e) => {
                const stages = [...config.stages];
                stages[i] = { ...s, description: e.target.value };
                onChange({ ...draft, config: { stages } });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isFunnelConfig(config)) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-medium text-slate-500">漏斗层级</p>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              const levels = [
                ...config.levels,
                {
                  id: uid("level"),
                  name: `层级 ${config.levels.length + 1}`,
                  description: "",
                },
              ];
              onChange({ ...draft, config: { levels } });
            }}
          >
            + 层级
          </Button>
          {config.levels.length > 2 && (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                const levels = config.levels.slice(0, -1);
                onChange({ ...draft, config: { levels } });
              }}
            >
              − 层级
            </Button>
          )}
        </div>
        {config.levels.map((l, i) => (
          <div
            key={l.id}
            className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2 space-y-1"
          >
            <Input
              className="h-7 text-xs font-medium"
              value={l.name}
              placeholder={`层级 ${i + 1} 名称`}
              onChange={(e) => {
                const levels = [...config.levels];
                levels[i] = { ...l, name: e.target.value };
                onChange({ ...draft, config: { levels } });
              }}
            />
            <Textarea
              className="text-xs"
              rows={2}
              value={l.description}
              placeholder="层级说明"
              onChange={(e) => {
                const levels = [...config.levels];
                levels[i] = { ...l, description: e.target.value };
                onChange({ ...draft, config: { levels } });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isGridConfig(config)) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() =>
              onChange({
                ...draft,
                config: createGridConfig(2, 1, makeGridCells(2, 1).map((c) => c.title)),
              })
            }
          >
            2×1
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() =>
              onChange({
                ...draft,
                config: createGridConfig(2, 2, makeGridCells(2, 2).map((c) => c.title)),
              })
            }
          >
            2×2
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() =>
              onChange({
                ...draft,
                config: createGridConfig(3, 2, makeGridCells(3, 2).map((c) => c.title)),
              })
            }
          >
            3×2
          </Button>
        </div>
        {config.cells.map((c, i) => (
          <div
            key={c.id}
            className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2 space-y-1"
          >
            <Input
              className="h-7 text-xs font-medium"
              value={c.title}
              placeholder={`区域 ${i + 1} 标题`}
              onChange={(e) => {
                const cells = [...config.cells];
                cells[i] = { ...c, title: e.target.value };
                onChange({ ...draft, config: { ...config, cells } });
              }}
            />
            <Textarea
              className="text-xs"
              rows={2}
              value={c.definition}
              placeholder="区域定义"
              onChange={(e) => {
                const cells = [...config.cells];
                cells[i] = { ...c, definition: e.target.value };
                onChange({ ...draft, config: { ...config, cells } });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function AxisField({
  label,
  low,
  high,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  onChange: (low: string, high: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#EEF1F5] p-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <div className="mt-1 flex gap-1">
        <Input
          className="h-7 flex-1 text-xs"
          value={low}
          placeholder="低端"
          onChange={(e) => onChange(e.target.value, high)}
        />
        <span className="self-center text-[10px] text-slate-300">→</span>
        <Input
          className="h-7 flex-1 text-xs"
          value={high}
          placeholder="高端"
          onChange={(e) => onChange(low, e.target.value)}
        />
      </div>
    </div>
  );
}

export function ModelFormFields({
  draft,
  onChange,
  showPreview = false,
  allowKindChange = false,
}: {
  draft: ModelDraft;
  onChange: (next: ModelDraft) => void;
  showPreview?: boolean;
  allowKindChange?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field
        label="模型名称 *"
        value={draft.name}
        onChange={(v) => onChange({ ...draft, name: v })}
        placeholder="例如：重要紧急四象限"
      />
      <Field
        label="简介"
        value={draft.description}
        onChange={(v) => onChange({ ...draft, description: v })}
        rows={2}
        placeholder="一句话说明这个模型的用途"
      />
      {allowKindChange && (
        <div>
          <p className="text-[10px] text-slate-500">模型类型</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {KIND_OPTIONS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() =>
                  onChange({
                    ...draft,
                    kind: k,
                    config:
                      k === draft.kind
                        ? draft.config
                        : k === "quadrant"
                          ? createQuadrantConfig()
                          : k === "stage"
                            ? createStageConfig(3)
                            : k === "funnel"
                              ? createFunnelConfig(4)
                              : createGridConfig(2, 2),
                  })
                }
                className={`rounded-lg px-2.5 py-1 text-[10px] ${
                  draft.kind === k
                    ? "bg-[#EEF2FF] text-[#4338CA]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {MODEL_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      )}
      <ModelConfigFields draft={draft} onChange={onChange} />
      <ModelNotesFields draft={draft} onChange={onChange} />
      {showPreview && (
        <div className="rounded-lg border border-[#EEF1F5] bg-white p-2">
          <p className="mb-2 text-[10px] font-medium text-slate-500">预览</p>
          <ModelPreview model={draft} />
        </div>
      )}
    </div>
  );
}

export function ModelFormActions({
  onSave,
  onCancel,
  saveLabel = "保存",
  showDelete,
  onDelete,
}: {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  showDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="primary" type="button" onClick={onSave}>
        {saveLabel}
      </Button>
      <Button size="sm" variant="ghost" type="button" onClick={onCancel}>
        取消
      </Button>
      {showDelete && onDelete && (
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="text-red-500"
          onClick={onDelete}
        >
          删除
        </Button>
      )}
    </div>
  );
}

export function ModelNotesPreview({ model }: { model: ModelDefinition }) {
  const items = [
    { label: "适用情况", value: model.applicableScenarios },
    { label: "启发", value: model.inspirations },
    { label: "后续使用", value: model.usageNotes },
  ].filter((x) => x.value.trim());

  if (!items.length) return null;

  return (
    <div className="space-y-1.5 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2">
      {items.map((x) => (
        <div key={x.label}>
          <p className="text-[10px] font-medium text-slate-500">{x.label}</p>
          <p className="whitespace-pre-wrap text-[11px] text-slate-600">
            {x.value}
          </p>
        </div>
      ))}
    </div>
  );
}
