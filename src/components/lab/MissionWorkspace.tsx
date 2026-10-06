import { ReactNode } from "react";

/**
 * Full-height mission layout: header bar, briefing on the left, terminal on the right.
 * Stacks vertically on small screens.
 */
export function MissionWorkspace({ header, left, right }: { header: ReactNode; left: ReactNode; right: ReactNode }) {
  return (
    <main className="flex flex-col pt-16 lg:h-dvh">
      {header}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="min-h-0 overflow-y-auto border-b-[3px] border-cyber-ink p-5 scrollbar-cyber md:p-7 lg:border-b-0 lg:border-r-[3px]">
          {left}
        </section>
        <section className="flex min-h-[640px] flex-col lg:min-h-0">{right}</section>
      </div>
    </main>
  );
}
