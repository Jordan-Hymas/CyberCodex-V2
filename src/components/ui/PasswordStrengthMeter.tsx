import { cn } from "@/lib/utils";
import { calculatePasswordStrength } from "@/lib/utils/password-validation";

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const segmentColors = ["bg-cyber-danger", "bg-cyber-danger", "bg-cyber-warning", "bg-cyber-primary", "bg-cyber-primary"];
const labelColors = ["text-cyber-danger", "text-cyber-danger", "text-cyber-warning", "text-cyber-primary", "text-cyber-primary"];

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label } = calculatePasswordStrength(password);

  return (
    <div className={cn("mt-2", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-cyber-text-secondary">Password strength</span>
        <span className={cn("text-sm font-medium", labelColors[score])}>{label}</span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-2 flex-1 transition-colors duration-200", i < score ? segmentColors[score] : "bg-cyber-dark-tertiary")}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-cyber-text-muted">
        Use at least 12 characters with uppercase, lowercase, numbers, and special characters
      </p>
    </div>
  );
}
