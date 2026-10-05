"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";

interface UserStats {
  xp: number;
  level: number;
  coursesCompleted: number;
  badgesEarned: number;
  streak: number;
}

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  stats: UserStats;
}

const upcomingEvents = [
  {
    id: 1,
    title: "Web Security Workshop",
    date: "Dec 15, 2024",
    time: "2:00 PM EST",
    type: "workshop",
  },
  {
    id: 2,
    title: "CTF Competition",
    date: "Dec 20, 2024",
    time: "6:00 PM EST",
    type: "competition",
  },
];

export function DashboardSidebar({ user, stats }: DashboardSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="space-y-4 md:space-y-6"
    >
      {/* User Profile Card */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={64}
                height={64}
                className="rounded-full ring-2 ring-cyber-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-cyber-primary/20 flex items-center justify-center ring-2 ring-cyber-primary">
                <span className="text-2xl font-bold text-cyber-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyber-primary flex items-center justify-center text-xs font-bold text-cyber-dark">
              {stats.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-cyber-text-primary truncate">
              {user.name}
            </h3>
            <p className="text-sm text-cyber-text-secondary truncate">
              Level {stats.level}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-cyber-dark-secondary border border-cyber-border">
            <div className="text-2xl font-bold text-cyber-primary mb-1">
              {stats.xp.toLocaleString()}
            </div>
            <div className="text-xs text-cyber-text-secondary uppercase tracking-wider">
              XP
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-cyber-dark-secondary border border-cyber-border">
            <div className="text-2xl font-bold text-cyber-secondary mb-1">
              {stats.streak}
            </div>
            <div className="text-xs text-cyber-text-secondary uppercase tracking-wider">
              Day Streak
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-cyber-dark-secondary border border-cyber-border">
            <div className="text-2xl font-bold text-cyber-warning mb-1">
              {stats.coursesCompleted}
            </div>
            <div className="text-xs text-cyber-text-secondary uppercase tracking-wider">
              Courses
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-cyber-dark-secondary border border-cyber-border">
            <div className="text-2xl font-bold text-cyber-danger mb-1">
              {stats.badgesEarned}
            </div>
            <div className="text-xs text-cyber-text-secondary uppercase tracking-wider">
              Badges
            </div>
          </div>
        </div>

        <Button href="/profile" variant="secondary" size="md" fullWidth className="mt-4">
            View Profile
          </Button>
      </Card>

      {/* Upcoming Events */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-bold text-cyber-text-primary mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-cyber-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-lg bg-cyber-dark-secondary border border-cyber-border hover:border-cyber-primary transition-colors duration-300"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-cyber-text-primary">
                  {event.title}
                </h4>
                <Badge variant={event.type === "workshop" ? "primary" : "danger"} size="sm">
                  {event.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyber-text-secondary">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{event.date}</span>
                <span className="text-cyber-border">•</span>
                <span>{event.time}</span>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" fullWidth className="mt-4">
          View All Events
        </Button>
      </Card>

      {/* Club Upgrade CTA */}
      <Card className="p-4 md:p-6 bg-gradient-to-br from-cyber-primary/10 to-cyber-secondary/10 border-cyber-primary/50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-cyber-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-cyber-text-primary mb-2">
            Upgrade to Club
          </h3>
          <p className="text-sm text-cyber-text-secondary mb-4">
            Unlock exclusive courses, labs, and certificates
          </p>
          <Button href="/pricing" variant="primary" size="md" fullWidth>
              Upgrade Now
            </Button>
        </div>
      </Card>

      {/* Invite Friends */}
      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-bold text-cyber-text-primary mb-2">
          Invite a Friend
        </h3>
        <p className="text-sm text-cyber-text-secondary mb-4">
          Share CyberCodex and earn bonus XP for every friend who joins!
        </p>
        <Button variant="secondary" size="md" fullWidth>
          Get Invite Link
        </Button>
      </Card>
    </motion.div>
  );
}
