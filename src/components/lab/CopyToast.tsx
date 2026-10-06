"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Small "Copied!" badge shown over a terminal after copy-on-select. */
export function useCopyToast() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((text: string) => {
    setCopied(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { copied, show };
}

export function CopyToast({ text }: { text: string | null }) {
  if (!text) return null;
  const isFlag = /CYBER\{[^}]+\}/.test(text);
  return (
    <div
      role="status"
      className="pointer-events-none absolute right-3 top-3 z-10 border-2 border-cyber-ink bg-cyber-primary px-3 py-1 font-ui text-sm text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)] animate-fade-in"
    >
      {isFlag ? "Flag copied! Paste it below." : "Copied to clipboard"}
    </div>
  );
}
