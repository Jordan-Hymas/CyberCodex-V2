import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface WindowBarProps {
  title: ReactNode;
  /** Background colour class for the bar */
  accent?: string;
  right?: ReactNode;
  /** Text colour class; use a light one on dark bars */
  textClassName?: string;
  className?: string;
}

/** Title bar for pixel "windows" (editor, console, terminal). */
export function WindowBar({ title, accent = "bg-cyber-accent", right, textClassName = "text-cyber-ink", className }: WindowBarProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-2 border-b-[3px] border-cyber-ink px-3 py-2", accent, className)}>
      <span className="h-3 w-3 border-2 border-cyber-ink bg-cyber-danger" aria-hidden="true" />
      <span className="h-3 w-3 border-2 border-cyber-ink bg-cyber-warning" aria-hidden="true" />
      <span className="h-3 w-3 border-2 border-cyber-ink bg-cyber-primary" aria-hidden="true" />
      <span className={cn("ml-2 font-ui text-sm", textClassName)}>{title}</span>
      {right && <span className={cn("ml-auto font-ui text-sm", textClassName)}>{right}</span>}
    </div>
  );
}
