"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, Button } from "@/components/ui";
import { MascotSays } from "@/components/brand";
import { Edit2 } from "lucide-react";
import { EditProfileModal } from "./EditProfileModal";
import { cn } from "@/lib/utils";

interface ProfilePageClientProps {
  userData: any;
  followerCount: number;
  followingCount: number;
  stats: Array<{
    label: string;
    value: string | number;
    color: string;
  }>;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "posts", label: "Posts" },
] as const;

export function ProfilePageClient({ userData, followerCount, followingCount }: ProfilePageClientProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const joined = new Date(userData.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const statTiles = [
    { label: "Total XP", value: userData.totalXp?.toLocaleString() ?? 0, color: "text-cyber-warning" },
    { label: "Rank", value: userData.rank, color: "text-cyber-secondary" },
    { label: "Badges", value: userData.badges.length, color: "text-cyber-accent" },
    { label: "Day streak", value: userData.streak, color: "text-cyber-orange" },
  ];

  return (
    <div className="container-custom">
      {/* Banner */}
      <div className="relative h-56 overflow-hidden border-[3px] border-cyber-ink md:h-72">
        <Image
          src={userData.banner || "/images/banners/space_banner.png"}
          alt=""
          fill
          priority
          unoptimized={!userData.banner}
          sizes="100vw"
          className={cn("object-cover", !userData.banner && "pixelated")}
        />
      </div>

      {/* Header */}
      <div className="pixel-panel -mt-[3px] flex flex-col gap-6 px-6 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="-mt-14 w-fit border-[3px] border-cyber-ink bg-cyber-dark shadow-[4px_4px_0_0_var(--color-cyber-ink)]">
            <Avatar src={userData.image} alt={userData.name || "User"} fallback={userData.name || "?"} className="!h-28 !w-28 !border-0 text-3xl" />
          </div>
          <div>
            <h1 className="mb-1 font-ui text-3xl text-cyber-text-primary" style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>
              {userData.name}
            </h1>
            <p className="text-cyber-text-secondary">@{userData.username || "user"}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-ui text-sm text-cyber-text-muted">
              <span>Joined {joined}</span>
              <span>
                <span className="text-cyber-text-primary">{followerCount}</span> followers
              </span>
              <span>
                <span className="text-cyber-text-primary">{followingCount}</span> following
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="border-2 border-cyber-ink bg-cyber-warning px-2 py-1 font-label text-sm text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)]">
            LV {userData.level}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 size={16} />
            Edit profile
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Tabs */}
        <div className="lg:col-span-2">
          <div role="tablist" aria-label="Profile sections" className="mb-6 flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "border-2 border-cyber-ink px-4 py-2 font-ui transition-colors duration-100",
                  activeTab === tab.id
                    ? "bg-cyber-primary text-cyber-ink"
                    : "bg-cyber-dark-tertiary text-cyber-text-secondary shadow-[3px_3px_0_0_var(--color-cyber-ink)] hover:text-cyber-text-primary"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="pixel-panel flex justify-center p-10">
            {activeTab === "posts" ? (
              <MascotSays mood="looking">No posts yet.</MascotSays>
            ) : (
              <MascotSays mood="coffee">No projects yet. Project showcases are coming soon!</MascotSays>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="pixel-panel p-5">
            <h2 className="pixel-label mb-4 text-cyber-text-muted">Stats</h2>
            <dl className="grid grid-cols-2 gap-3">
              {statTiles.map((tile) => (
                <div key={tile.label} className="border-2 border-cyber-ink bg-cyber-ink p-3 text-center">
                  <dd className={`font-pixel text-sm ${tile.color}`}>{tile.value}</dd>
                  <dt className="pixel-label mt-1 text-cyber-text-muted">{tile.label}</dt>
                </div>
              ))}
            </dl>
          </section>

          <section className="pixel-panel p-5">
            <h2 className="pixel-label mb-3 text-cyber-text-muted">Achievements</h2>
            <p className="mb-4 text-sm text-cyber-text-secondary">
              Want your first achievement? Finish a whole course to earn its badge.
            </p>
            <Button href="/courses" size="sm" fullWidth>
              Explore courses
            </Button>
          </section>
        </aside>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} userData={userData} />
    </div>
  );
}
