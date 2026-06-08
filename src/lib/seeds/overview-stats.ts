import { classifySeed, distinctStages } from "./classify";
import type { IdeaSeed, SeedPhase } from "./types";

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function daysAgo(n: number): number {
  return Date.now() - n * 86400000;
}

function inToday(iso: string): boolean {
  return new Date(iso).getTime() >= startOfToday();
}

function inRecent(iso: string, days = 7): boolean {
  return new Date(iso).getTime() >= daysAgo(days);
}

export type PhaseOverviewStats = {
  sprouting: {
    todayNew: number;
    recentNew: number;
    toGrowing: number;
    total: number;
  };
  growing: {
    recentNew: number;
    toOtherOrArchive: number;
    total: number;
  };
  archived: {
    total: number;
    recentArchived: number;
  };
};

export function computeSeedOverviewStats(seeds: IdeaSeed[]): PhaseOverviewStats {
  let sproutingTodayNew = 0;
  let sproutingRecentNew = 0;
  let sproutingToGrowing = 0;
  let sproutingTotal = 0;

  let growingRecentNew = 0;
  let growingToOther = 0;
  let growingTotal = 0;

  let archivedTotal = 0;
  let archivedRecent = 0;

  for (const s of seeds) {
    const phase = classifySeed(s);
    const stages = distinctStages(s);
    const endedEvent = s.events.find((e) => e.action === "ended");

    if (phase === "sprouting") {
      sproutingTotal++;
      if (inToday(s.createdAt)) sproutingTodayNew++;
      if (inRecent(s.createdAt)) sproutingRecentNew++;
    }

    if (phase === "growing") {
      growingTotal++;
      if (stages.length >= 2) {
        const secondEvent = s.events.find(
          (e) => e.action !== "born" && e.action !== "ended"
        );
        if (secondEvent && inRecent(secondEvent.createdAt)) {
          growingRecentNew++;
        }
        if (inRecent(s.updatedAt) && stages.length >= 2) {
          sproutingToGrowing++;
        }
      }
    }

    if (phase === "archived" || s.status === "ended") {
      archivedTotal++;
      const endAt = endedEvent?.createdAt ?? s.updatedAt;
      if (inRecent(endAt)) archivedRecent++;
      if (
        endedEvent &&
        inRecent(endedEvent.createdAt) &&
        stages.length >= 2
      ) {
        growingToOther++;
      }
    }
  }

  return {
    sprouting: {
      todayNew: sproutingTodayNew,
      recentNew: sproutingRecentNew,
      toGrowing: sproutingToGrowing,
      total: sproutingTotal,
    },
    growing: {
      recentNew: growingRecentNew,
      toOtherOrArchive: growingToOther,
      total: growingTotal,
    },
    archived: {
      total: archivedTotal,
      recentArchived: archivedRecent,
    },
  };
}

export const PHASE_ICONS: Record<SeedPhase, string> = {
  sprouting: "🌱",
  growing: "🌿",
  archived: "📁",
};
