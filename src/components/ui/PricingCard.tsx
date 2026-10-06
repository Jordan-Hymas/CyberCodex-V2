import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Badge } from "./Badge";

export interface PricingFeature {
  readonly text: string;
  readonly included: boolean;
}

export interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: readonly PricingFeature[];
  ctaText: string;
  ctaVariant?: "primary" | "secondary" | "accent" | "ghost";
  onCtaClick?: () => void;
  ctaHref?: string;
  badge?: string;
  highlighted?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  ctaText,
  ctaVariant = "primary",
  onCtaClick,
  ctaHref,
  badge,
  highlighted = false,
  icon,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative p-8 h-full flex flex-col pixel-panel",
        highlighted && "!border-cyber-primary !shadow-[8px_8px_0_0_var(--color-cyber-primary-dark)]",
        className
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="warning" size="lg">
            {badge}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}

        <h3 className="text-2xl text-cyber-text-primary mb-3">
          {title}
        </h3>

        <div className="mb-3">
          <span className="font-pixel text-4xl text-cyber-warning [text-shadow:3px_3px_0_var(--color-cyber-ink)]">
            {price}
          </span>
          {period && (
            <span className="text-lg text-cyber-text-secondary ml-2">
              {period}
            </span>
          )}
        </div>

        <p className="text-cyber-text-secondary">{description}</p>
      </div>

      {/* Features List */}
      <div className="space-y-3 flex-grow mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <span
              className={cn(
                "grid h-5 w-5 flex-shrink-0 place-items-center border-2 border-cyber-ink font-ui text-xs font-bold leading-none text-cyber-ink mt-0.5",
                feature.included ? "bg-cyber-primary" : "bg-cyber-dark-tertiary text-cyber-text-muted"
              )}
              aria-label={feature.included ? "Included" : "Not included"}
            >
              {feature.included ? "✓" : "–"}
            </span>
            <span
              className={cn(
                "text-sm",
                feature.included ? "text-cyber-text-primary" : "text-cyber-text-muted"
              )}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button - Now at bottom */}
      <Button
        variant={ctaVariant}
        size="lg"
        fullWidth
        href={ctaHref}
        onClick={onCtaClick}
      >
        {ctaText}
      </Button>
    </div>
  );
}
