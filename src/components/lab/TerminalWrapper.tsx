"use client";

import dynamic from "next/dynamic";
import type { TerminalEmulatorProps } from "@/components/lab/TerminalEmulator";

// Dynamic import of TerminalEmulator with client-side only rendering
const TerminalEmulator = dynamic(
  () => import("@/components/lab/TerminalEmulator").then((mod) => mod.TerminalEmulator),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <div className="font-ui text-cyber-text-muted">Booting terminal…</div>
      </div>
    ),
  }
);

export function TerminalWrapper(props: TerminalEmulatorProps) {
  return <TerminalEmulator {...props} />;
}
