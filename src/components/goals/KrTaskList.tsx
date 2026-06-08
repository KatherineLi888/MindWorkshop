"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecurrenceFields } from "@/components/goals/RecurrenceFields";
import { createKrTask } from "@/lib/goals/kr-tasks";
import { formatScheduleCaption } from "@/lib/goals/recurrence";
import type { KrTask } from "@/lib/goals/types";
import { cn } from "@/lib/utils";

type Props = {
  tasks: KrTask[];
  onChange: (tasks: KrTask[]) => void;
  hideCompleted?: boolean;
  compact?: boolean;
  className?: string;
};

export function KrTaskList({
  tasks,
  onChange,
  hideCompleted = false,
  compact = false,
  className,
}: Props) {
  const [quickTitle, setQuickTitle] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeTasks = tasks.filter((t) => t.title.trim());
  const visible = hideCompleted
    ? activeTasks.filter((t) => !t.completed)
    : activeTasks;
  const completed = activeTasks.filter((t) => t.completed);

  const patchTask = (id: string, patch: Partial<KrTask>) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const addTask = () => {
    const title = quickTitle.trim();
    if (!title) return;
    onChange([...tasks, createKrTask(title)]);
    setQuickTitle("");
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {visible.length === 0 && completed.length === 0 && (
        <p className="text-[10px] text-slate-400">
          暂无子任务，输入标题即可快速添加
        </p>
      )}
      <ul className="space-y-1">
        {visible.map((task) => {
          const caption = formatScheduleCaption(task);
          const editing = editingId === task.id;
          return (
            <li
              key={task.id}
              className={cn(
                "rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] px-2 py-1",
                task.completed && "opacity-60"
              )}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={task.completed}
                  onChange={(e) =>
                    patchTask(task.id, {
                      completed: e.target.checked,
                      completed_at: e.target.checked
                        ? new Date().toISOString()
                        : null,
                    })
                  }
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-xs text-slate-800",
                      task.completed && "line-through text-slate-500"
                    )}
                  >
                    {task.title}
                  </p>
                  {!compact && caption && (
                    <p className="text-[10px] text-slate-400">{caption}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 text-[10px] text-slate-400 hover:text-[#3B82F6]"
                  onClick={() =>
                    setEditingId(editing ? null : task.id)
                  }
                >
                  {editing ? "收起" : "周期"}
                </button>
                <button
                  type="button"
                  className="shrink-0 text-[10px] text-red-400 hover:text-red-600"
                  onClick={() => removeTask(task.id)}
                >
                  删
                </button>
              </div>
              {editing && (
                <div className="mt-2 border-t border-[#EEF1F5] pt-2">
                  <RecurrenceFields
                    compact
                    startDate={task.start_date ?? null}
                    dueDate={task.due_date ?? null}
                    recurrence={task.recurrence}
                    onStartDate={(v) => patchTask(task.id, { start_date: v })}
                    onDueDate={(v) => patchTask(task.id, { due_date: v })}
                    onRecurrence={(v) => patchTask(task.id, { recurrence: v })}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!hideCompleted && completed.length > 0 && (
        <div className="rounded-lg border border-dashed border-[#E2E8F0] px-2 py-1">
          <p className="text-[9px] font-medium text-slate-400">已完成</p>
          <ul className="mt-0.5 space-y-0.5">
            {completed.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 text-[10px] text-slate-400"
              >
                <span className="text-emerald-500">✓</span>
                <span className="line-through">{task.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-1.5">
        <div className="min-w-0 flex-1">
          <Input
            className={cn("h-8", compact && "text-xs")}
            placeholder="任务名称，Enter 快速添加"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTask();
              }
            }}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!quickTitle.trim()}
          onClick={addTask}
        >
          添加
        </Button>
      </div>

      <button
        type="button"
        className="text-[10px] text-slate-400 hover:text-[#3B82F6]"
        onClick={() => setShowExtras((v) => !v)}
      >
        {showExtras ? "收起新建选项" : "新建时可设周期"}
      </button>

      {showExtras && (
        <p className="text-[10px] text-slate-400">
          添加后点击条目右侧「周期」配置重复规则
        </p>
      )}
    </div>
  );
}
