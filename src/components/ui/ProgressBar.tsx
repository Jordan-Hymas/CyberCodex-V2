import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  label?: string;
  current?: number;
  total?: number;
  value?: number; // Alternative: direct percentage value (0-100)
  className?: string;
  showPercentage?: boolean;
  variant?: "primary" | "secondary" | "success" | "warning" | "accent";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-3",
  md: "h-4",
  lg: "h-6",
};

const variantColors = {
  primary: "text-cyber-primary",
  secondary: "text-cyber-secondary",
  success: "text-cyber-primary",
  warning: "text-cyber-warning",
  accent: "text-cyber-accent",
};

/** Segmented, game-style progress bar (like an HP/XP bar). */
export function ProgressBar({
  label,
  current,
  total,
  value,
  className,
  showPercentage = false,
  variant = "primary",
  size = "md",
}: ProgressBarProps) {
  const percentage =
    value !== undefined
      ? Math.min(100, Math.max(0, value))
      : total && current
        ? Math.round((current / total) * 100)
        : 0;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="pixel-label text-cyber-text-secondary">{label}</span>
          <span className="font-ui text-sm font-semibold text-cyber-text-primary">
            {current !== undefined && total !== undefined && `${current}/${total}`}
            {showPercentage && ` (${percentage}%)`}
          </span>
        </div>
      )}
      <div
        className={cn("pixel-progress w-full", sizeClasses[size])}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={cn("pixel-progress-fill", variantColors[variant])} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
