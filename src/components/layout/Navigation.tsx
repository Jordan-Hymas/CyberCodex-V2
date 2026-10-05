"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui";
import { PixelLogo, Wordmark } from "@/components/brand";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";

interface NavigationProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    level?: number;
  } | null;
}

export function Navigation({ user }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-cyber-ink bg-cyber-dark/95 backdrop-blur-sm">
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-3" aria-label="CyberCodex home">
              <PixelLogo size={40} />
              <Wordmark />
            </Link>

            {/* Desktop links */}
            <ul className="hidden items-center gap-1 md:flex">
              {config.navigation.main.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-1.5 px-3 py-2 font-ui text-[1.05rem] transition-colors duration-100",
                        active ? "text-cyber-primary" : "text-cyber-text-secondary hover:text-cyber-text-primary"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[0.6rem] transition-opacity duration-100",
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="hidden items-center gap-3 md:flex">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <>
                  <Button href="/login" variant="ghost" size="sm">
                    Sign in
                  </Button>
                  <Button href="/signup" size="sm">
                    Get started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="grid h-10 w-10 place-items-center border-2 border-cyber-ink bg-cyber-dark-tertiary md:hidden"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span className="flex w-5 flex-col gap-1" aria-hidden="true">
                <span className={cn("h-[3px] bg-cyber-text-primary transition-transform", isOpen && "translate-y-[7px] rotate-45")} />
                <span className={cn("h-[3px] bg-cyber-text-primary", isOpen && "opacity-0")} />
                <span className={cn("h-[3px] bg-cyber-text-primary transition-transform", isOpen && "-translate-y-[7px] -rotate-45")} />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-menu" className="fixed inset-0 top-16 z-40 animate-fade-in md:hidden">
          <div className="absolute inset-0 bg-cyber-ink/80" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="relative border-b-[3px] border-cyber-ink bg-cyber-dark-secondary animate-slide-down">
            <ul className="container-custom flex flex-col py-4">
              {config.navigation.main.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-2 py-3 font-ui text-xl",
                        active ? "text-cyber-primary" : "text-cyber-text-primary"
                      )}
                    >
                      <span className={cn("text-xs", !active && "invisible")} aria-hidden="true">
                        ▶
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="container-custom flex flex-col gap-3 border-t-2 border-dashed border-cyber-border py-5">
              {user ? (
                <>
                  <Button href="/dashboard" variant="secondary" fullWidth>
                    Dashboard
                  </Button>
                  <Button href="/profile" variant="secondary" fullWidth>
                    Profile
                  </Button>
                  <Button variant="danger" fullWidth onClick={() => signOut({ callbackUrl: "/" })}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button href="/login" variant="secondary" fullWidth>
                    Sign in
                  </Button>
                  <Button href="/signup" fullWidth>
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
