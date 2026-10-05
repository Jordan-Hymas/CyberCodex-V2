import { forwardRef, ImgHTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showBorder?: boolean;
  /** @deprecated kept for compatibility; renders the same as showBorder */
  showGlow?: boolean;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

// Each user gets a stable, bright fallback tile colour
const fallbackColors = [
  "bg-cyber-primary",
  "bg-cyber-secondary",
  "bg-cyber-accent",
  "bg-cyber-pink",
  "bg-cyber-warning",
  "bg-cyber-orange",
];

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    { src, alt = "User avatar", fallback, size = "md", showBorder = false, showGlow = false, className, ...props },
    ref
  ) => {
    const text = fallback || alt || "?";
    const initials = text
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colorIndex = [...text].reduce((sum, c) => sum + c.charCodeAt(0), 0) % fallbackColors.length;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden flex-shrink-0",
          "border-2 border-cyber-ink",
          (showBorder || showGlow) && "shadow-[3px_3px_0_0_var(--color-cyber-ink)]",
          src ? "bg-cyber-dark-tertiary" : fallbackColors[colorIndex],
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes={size === "sm" ? "32px" : size === "md" ? "40px" : size === "lg" ? "48px" : "64px"}
          />
        ) : (
          <span className="font-ui font-bold text-cyber-ink select-none">{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
