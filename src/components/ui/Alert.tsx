import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "info";
}

const styles = {
  success: "border-l-cyber-primary text-cyber-primary",
  error: "border-l-cyber-danger text-cyber-danger",
  info: "border-l-cyber-secondary text-cyber-secondary",
};

export function Alert({ variant = "info", className, children, ...props }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("border-2 border-l-[6px] border-cyber-ink bg-cyber-ink px-4 py-3 font-ui", styles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
