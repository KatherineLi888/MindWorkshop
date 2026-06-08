"use client";

import { Button } from "@/components/ui/button";

type Props = {
  onReset: () => void;
  onCancel: () => void;
  onDone: () => void;
};

export function DashboardEditBar({ onReset, onCancel, onDone }: Props) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-[#BFDBFE] bg-[#EFF6FF]/95 px-3 py-2.5 shadow-lg backdrop-blur-sm md:bottom-0">
      <p className="mb-2 text-center text-[10px] text-[#1D4ED8]">
        编辑模式 · 右键组件可编辑/删除 · 点格子「+」添加 · 长按可移动
      </p>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset}>
          恢复默认
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button variant="primary" size="sm" onClick={onDone}>
          完成
        </Button>
      </div>
    </div>
  );
}
