"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Hides the site footer inside a course (course overview, lessons, missions,
 * orientation) so the workspace isn't cluttered. The /courses catalog keeps it.
 */
export function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const insideCourse = /^\/courses\/[^/]+/.test(pathname ?? "");
  return insideCourse ? null : <>{children}</>;
}
