"use client";

import Link from "next/link";
import { FlowFunnelAnalyticsPanel } from "@/components/flow/FlowFunnelAnalyticsPanel";
import { FlowFunnelView } from "@/components/flow/FlowFunnelView";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export function FlowFunnelPageClient() {
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4 lg:p-6">
      <PageHeader
        title="流程漏斗"
        description="线性下漏与跳入留存：看清从哪一层进入最多，以及一步步往下漏的情况。"
        secondaryLink={{ label: "← 返回首页", href: "/home" }}
        actions={
          <Link href="/stats">
            <Button size="sm" variant="ghost">
              统计仪表盘
            </Button>
          </Link>
        }
      />
      <FlowFunnelView compact />

      <div className="border-t border-[#E2E8F0] pt-5">
        <FlowFunnelAnalyticsPanel />
      </div>
    </div>
  );
}
