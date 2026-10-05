"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    level?: number;
  };
}

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-3 border-2 px-2 py-1 transition-colors duration-100",
          isOpen ? "border-cyber-ink bg-cyber-dark-tertiary" : "border-transparent hover:bg-cyber-dark-tertiary"
        )}
      >
        <Avatar src={user.image} alt={user.name || "User"} size="sm" />
        <span className="text-left leading-tight">
          <span className="block font-ui text-sm font-semibold text-cyber-text-primary">{user.name}</span>
          <span className="block font-ui text-xs text-cyber-warning">LV {user.level || 1}</span>
        </span>
        <span className={cn("text-[0.6rem] text-cyber-text-secondary transition-transform", isOpen && "rotate-180")} aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 z-50 mt-3 w-64 pixel-panel animate-slide-down">
          <div className="border-b-2 border-dashed border-cyber-border p-4">
            <p className="font-ui font-semibold text-cyber-text-primary">{user.name}</p>
            <p className="text-sm text-cyber-text-secondary">@{user.username || "user"}</p>
            <p className="mt-1 truncate text-xs text-cyber-text-muted">{user.email}</p>
          </div>
          <div className="py-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-2 px-4 py-2.5 font-ui text-cyber-text-primary hover:bg-cyber-dark-tertiary"
              >
                <span className="text-[0.6rem] text-cyber-primary opacity-0 group-hover:opacity-100" aria-hidden="true">
                  ▶
                </span>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-cyber-border p-2">
            <button
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full px-4 py-2.5 text-left font-ui font-semibold text-cyber-danger hover:bg-cyber-danger hover:text-cyber-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
