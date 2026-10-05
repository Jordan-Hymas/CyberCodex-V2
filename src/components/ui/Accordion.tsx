"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const baseId = useId();

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item) => {
        const open = openItems.includes(item.id);
        const panelId = `${baseId}-${item.id}`;
        return (
          <div key={item.id} className="pixel-panel !shadow-[4px_4px_0_0_var(--color-cyber-ink)]">
            <button
              onClick={() => toggleItem(item.id)}
              aria-expanded={open}
              aria-controls={panelId}
              className={cn(
                "w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors duration-100",
                open ? "bg-cyber-dark-tertiary" : "hover:bg-cyber-dark-tertiary"
              )}
            >
              <span className="font-ui text-lg font-semibold text-cyber-text-primary">{item.question}</span>
              <span
                className={cn(
                  "grid h-7 w-7 flex-shrink-0 place-items-center border-2 border-cyber-ink font-ui text-lg font-bold leading-none text-cyber-ink",
                  open ? "bg-cyber-pink" : "bg-cyber-primary"
                )}
                aria-hidden="true"
              >
                {open ? "−" : "+"}
              </span>
            </button>

            {open && (
              <div id={panelId} className="px-5 py-4 border-t-2 border-dashed border-cyber-border text-cyber-text-secondary leading-relaxed animate-fade-in">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
