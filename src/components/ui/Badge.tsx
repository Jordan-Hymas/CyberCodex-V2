import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-cyber-dark-tertiary text-cyber-text-primary",
  primary: "bg-cyber-primary text-cyber-ink",
  secondary: "bg-cyber-secondary text-cyber-ink",
  accent: "bg-cyber-accent text-cyber-ink",
  pink: "bg-cyber-pink text-cyber-ink",
  success: "bg-cyber-primary text-cyber-ink",
  warning: "bg-cyber-warning text-cyber-ink",
  danger: "bg-cyber-danger text-cyber-ink",
  // Aliases used by difficultyLevels in lib/config
  green: "bg-cyber-primary text-cyber-ink",
  yellow: "bg-cyber-warning text-cyber-ink",
  red: "bg-cyber-danger text-cyber-ink",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "px-1.5 py-0.5 text-[0.7rem]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 font-ui font-semibold uppercase tracking-wider",
        "border-2 border-cyber-ink shadow-[2px_2px_0_0_var(--color-cyber-ink)]",
        variants[variant] ?? variants.default,
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);

Badge.displayName = "Badge";
