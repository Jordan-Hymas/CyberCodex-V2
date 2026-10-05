"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cyber-ink/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Window */}
      <div
        className={cn("relative w-full pixel-panel !shadow-[10px_10px_0_0_var(--color-cyber-ink)] animate-slide-up", sizes[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Title bar */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between gap-4 bg-cyber-accent px-4 py-2 border-b-[3px] border-cyber-ink">
            {title ? (
              <h2 id="modal-title" className="font-ui text-lg font-bold text-cyber-ink" style={{ fontFamily: "var(--font-ui)" }}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="grid h-7 w-7 place-items-center border-2 border-cyber-ink bg-cyber-danger font-ui font-bold leading-none text-cyber-ink active:translate-x-px active:translate-y-px"
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-4 border-t-2 border-dashed border-cyber-border",
        className
      )}
    >
      {children}
    </div>
  );
}
