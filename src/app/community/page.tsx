"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Container, Card, Button, Badge } from "@/components/ui";
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
    <main className="min-h-screen">
      {/* Hero Banner Section */}
      <div className="relative mb-16 pt-32 pb-20 overflow-hidden min-h-[300px] sm:min-h-[350px] md:min-h-[400px]">
        {/* Background Image/GIF */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banners/space_banner.png"
            alt="CyberCodex Community"
            fill
            className="object-cover"
            priority
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Darker gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-dark/70 via-cyber-dark/60 to-cyber-dark" />
          {/* Additional dark overlay at top for title */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        </div>

        {/* Header Content */}
        <Container>
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mb-6 flex justify-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 relative">
                <Image
                  src="/images/logo/possibleCharacter.gif"
                  alt="CyberCodex Trophy"
                  width={80}
                  height={80}
                  className="object-contain"
                  unoptimized
                />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-display-2 font-bold mb-4 sm:mb-6 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,1)] [text-shadow:_0_0_30px_rgb(0_0_0_/_100%),_0_2px_10px_rgb(0_0_0_/_100%)] px-4"
            >
              Community
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            >
              Compete with other users and rise to the top 🏆
            </motion.p>
          </div>
        </Container>
      </div>

      {/* Main Content Section */}
      <section className="pb-20 -mt-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-start">
            {/* Main Leaderboard Section (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs and Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-2xl md:text-3xl font-bold text-cyber-text-primary"
                >
                  Leaderboard
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <LeaderboardTabs
                    onPeriodChange={setActivePeriod}
                    defaultPeriod={activePeriod}
                  />
                </motion.div>
              </div>

              {/* Leaderboard Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {isLoading ? (
                  <Card className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-cyber-text-muted">Loading leaderboard...</p>
                    </div>
                  </Card>
                ) : (
                  <LeaderboardTable users={leaderboardUsers} />
                )}
              </motion.div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card padding="md" className="bg-gradient-to-br from-cyber-primary/5 to-cyber-secondary/5 border-cyber-primary/30">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-cyber-primary">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-cyber-primary mb-2">How to Earn XP</h3>
                      <ul className="text-sm text-cyber-text-secondary space-y-2 list-disc list-inside">
                        <li>Complete course exercises and projects</li>
                        <li>Finish entire courses to unlock badges</li>
                        <li>Participate in weekly challenges (coming soon)</li>
                        <li>Maintain your learning streak</li>
                      </ul>
                      <Button href="/courses" variant="primary" size="sm" className="mt-4">
                          Explore Courses
                        </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar (1/3 width on desktop) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Community Stats with external heading to match leaderboard structure */}
              <div className="space-y-6">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-2xl md:text-3xl font-bold text-cyber-text-primary"
                >
                  Community Stats
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <CommunityStats
                    totalUsers={totalUsers}
                    totalXP={totalXP}
                    activeToday={activeToday}
                  />
                </motion.div>
              </div>

              {/* Updates Card */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl md:text-3xl font-bold text-cyber-text-primary"
                  >
                    Latest Updates
                  </motion.h2>
                  <Badge variant="primary" size="sm">New</Badge>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <UpdatesCard updates={updates} />
                </motion.div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
