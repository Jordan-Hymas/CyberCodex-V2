"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type LeaderboardPeriod = "weekly" | "alltime";

export interface LeaderboardTabsProps {
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  defaultPeriod?: LeaderboardPeriod;
}

const tabs: { id: LeaderboardPeriod; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "alltime", label: "All time" },
];

export function LeaderboardTabs({ onPeriodChange, defaultPeriod = "alltime" }: LeaderboardTabsProps) {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>(defaultPeriod);

  return (
    <div role="tablist" aria-label="Leaderboard period" className="inline-flex border-[3px] border-cyber-ink bg-cyber-ink">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activePeriod === tab.id}
          onClick={() => {
            setActivePeriod(tab.id);
            onPeriodChange?.(tab.id);
          }}
          className={cn(
            "px-4 py-1.5 font-ui text-sm transition-colors duration-100",
            activePeriod === tab.id ? "bg-cyber-primary text-cyber-ink" : "text-cyber-text-secondary hover:text-cyber-text-primary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
