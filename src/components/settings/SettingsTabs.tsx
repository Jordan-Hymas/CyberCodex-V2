"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { PreferencesTab } from "./PreferencesTab";
import { AccountTab } from "./AccountTab";

type Tab = "profile" | "security" | "preferences" | "account";

interface SettingsTabsProps {
  user: any;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
  { id: "account", label: "Account" },
];

export function SettingsTabs({ user }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="grid gap-8 md:grid-cols-[13rem_1fr] md:items-start">
      {/* Menu */}
      <nav aria-label="Settings sections" className="pixel-panel md:sticky md:top-24">
        <ul role="tablist" aria-orientation="vertical" className="flex overflow-x-auto py-2 md:block">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-2 whitespace-nowrap px-4 py-2.5 text-left font-ui transition-colors duration-100",
                    active ? "bg-cyber-dark-tertiary text-cyber-primary" : "text-cyber-text-secondary hover:text-cyber-text-primary",
                    tab.id === "account" && !active && "hover:text-cyber-danger"
                  )}
                >
                  <span className={cn("text-[0.6rem]", !active && "invisible")} aria-hidden="true">
                    ▶
                  </span>
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div role="tabpanel" key={activeTab} className="min-w-0 animate-fade-in">
        {activeTab === "profile" && <ProfileTab user={user} />}
        {activeTab === "security" && <SecurityTab user={user} />}
        {activeTab === "preferences" && <PreferencesTab user={user} />}
        {activeTab === "account" && <AccountTab user={user} />}
      </div>
    </div>
  );
}
