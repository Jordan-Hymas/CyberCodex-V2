"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

/** TEMPORARY: lets the dev admin switch paid access on/off. Remove with dev-admin.ts before launch. */
export function DevProToggle({ initialPro }: { initialPro: boolean }) {
  const [pro, setPro] = useState(initialPro);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { update } = useSession();

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/user/dev-pro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !pro }),
    });
    if (res.ok) {
      setPro(!pro);
      await update({});
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={pro}
      disabled={busy}
      onClick={toggle}
      title="Dev admin only: toggle paid access for testing"
      className={cn(
        "border-2 border-cyber-ink px-2 py-1 font-label text-sm shadow-[3px_3px_0_0_var(--color-cyber-ink)] disabled:opacity-60",
        pro ? "bg-cyber-primary text-cyber-ink" : "bg-cyber-dark-tertiary text-cyber-text-secondary"
      )}
    >
      {busy ? "..." : pro ? "PRO: ON" : "PRO: OFF"}
    </button>
  );
}
