"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { PageBanner } from "@/components/layout/PageBanner";
import { Mascot } from "@/components/brand";
import { LeaderboardTabs } from "@/components/community/LeaderboardTabs";
import { LeaderboardTable } from "@/components/community/LeaderboardTable";
import { CommunityStats } from "@/components/community/CommunityStats";
import { UpdatesCard, Update } from "@/components/community/UpdatesCard";
import { LeaderboardUser } from "@/components/community/LeaderboardEntry";
import type { LeaderboardPeriod } from "@/components/community/LeaderboardTabs";

export default function CommunityPage() {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("alltime");
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [activeToday, setActiveToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Sample updates/announcements (you can edit these directly in the code)
  const updates: Update[] = [
    {
      id: "1",
      date: "2025-01-12",
      title: "Community Page Launched!",
      description: "Welcome to the new community page! Compete with other users, track your progress on the leaderboard, and stay updated with the latest platform changes.",
      type: "feature",
    },
    {
      id: "2",
      date: "2025-01-10",
      title: "New Python Course Available",
      description: "Check out our comprehensive Python Fundamentals course with 43 exercises across 8 chapters. Perfect for beginners!",
      type: "update",
    },
    {
      id: "3",
      date: "2025-01-08",
      title: "XP System Update",
      description: "We've updated the XP calculation system to better reward course completion and exercise mastery. Keep learning to climb the leaderboard!",
      type: "fix",
    },
    {
      id: "4",
      date: "2025-01-05",
      title: "Weekly Challenges Coming Soon",
      description: "Stay tuned for our upcoming weekly cybersecurity challenges! Compete for special badges and bonus XP.",
      type: "announcement",
    },
  ];

  // Fetch leaderboard data on mount and when period changes
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch leaderboard users
        const usersResponse = await fetch(`/api/leaderboard?period=${activePeriod}`);
        const usersData = await usersResponse.json();
        setLeaderboardUsers(usersData.users || []);

        // Fetch community stats
        const statsResponse = await fetch('/api/leaderboard/stats');
        const statsData = await statsResponse.json();
        setTotalUsers(statsData.totalUsers || 0);
        setTotalXP(statsData.totalXP || 0);
        setActiveToday(statsData.activeToday || 0);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [activePeriod]);

  return (
    <main className="min-h-screen pb-24">
      <PageBanner
        image="/images/banners/futureOutpost.gif"
        imagePosition="center 60%"
        eyebrow="Community"
        title="High scores"
        description="Earn XP from exercises and courses, then see how you stack up against everyone else."
      />

      <div className="container-custom grid gap-10 pt-12 lg:grid-cols-[2fr_1fr] lg:items-start">
        {/* Leaderboard */}
        <section id="leaderboard" className="scroll-mt-24 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-display-2 !text-[clamp(1.25rem,2vw,1.75rem)]">Leaderboard</h2>
            <LeaderboardTabs onPeriodChange={setActivePeriod} defaultPeriod={activePeriod} />
          </div>

          {isLoading ? (
            <div className="pixel-panel flex items-center justify-center gap-4 p-12">
              <span className="loading-spinner h-8 w-8" aria-hidden="true" />
              <p className="font-ui text-cyber-text-muted">Loading scores…</p>
            </div>
          ) : (
            <LeaderboardTable users={leaderboardUsers} />
          )}

          <div className="flex flex-col items-start gap-5 border-[3px] border-cyber-ink bg-cyber-secondary p-6 text-cyber-ink shadow-[6px_6px_0_0_var(--color-cyber-ink)] sm:flex-row sm:items-center">
            <Mascot mood="smart" width={80} />
            <div className="flex-1">
              <h3 className="mb-2 text-xl text-cyber-ink">How to earn XP</h3>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                <li>▸ Complete course exercises and projects</li>
                <li>▸ Finish entire courses to unlock badges</li>
                <li>▸ Maintain your learning streak</li>
                <li>▸ Weekly challenges (coming soon)</li>
              </ul>
            </div>
            <Button href="/courses" variant="secondary">
              Explore courses
            </Button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-10">
          <section className="space-y-4">
            <h2 className="pixel-label text-cyber-text-muted">
              Community stats
            </h2>
            <CommunityStats totalUsers={totalUsers} totalXP={totalXP} activeToday={activeToday} />
          </section>
          <section className="space-y-4">
            <h2 className="pixel-label text-cyber-text-muted">
              Patch notes
            </h2>
            <UpdatesCard updates={updates} />
          </section>
        </aside>
      </div>
    </main>
  );
}
