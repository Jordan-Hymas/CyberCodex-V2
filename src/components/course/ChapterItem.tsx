"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui";
import { ExerciseItem } from "./ExerciseItem";
import type { Chapter } from "@/types/curriculum";
import { cn } from "@/lib/utils";

export interface ChapterItemProps {
  chapter: Chapter;
  courseSlug: string;
  /** @deprecated use defaultOpen */
  isFirst?: boolean;
  defaultOpen?: boolean;
  startingExerciseNumber?: number;
  completedExercises?: string[];
  className?: string;
}

export function ChapterItem({
  chapter,
  courseSlug,
  isFirst = false,
  defaultOpen,
  startingExerciseNumber = 1,
  completedExercises = [],
  className,
}: ChapterItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen ?? isFirst);
  const panelId = useId();

  const done = chapter.exercises.filter((e) => completedExercises.includes(e.id)).length;
  const total = chapter.exercises.length;
  const isComplete = total > 0 && done === total;

  return (
    <li className={cn("flex gap-3 md:gap-4", className)}>
      {/* Path node */}
      <div
        className={cn(
          "relative z-10 grid h-12 w-12 shrink-0 place-items-center border-[3px] border-cyber-ink font-pixel text-sm md:h-14 md:w-14",
          isComplete
            ? "bg-cyber-primary text-cyber-ink"
            : isExpanded
              ? "bg-cyber-warning text-cyber-ink"
              : "bg-cyber-dark-tertiary text-cyber-text-primary",
          "shadow-[3px_3px_0_0_var(--color-cyber-ink)]"
        )}
        aria-hidden="true"
      >
        {isComplete ? "✓" : chapter.number}
      </div>

      <div className={cn("pixel-panel min-w-0 flex-1", isExpanded && "!border-cyber-warning")}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="group flex w-full items-start gap-3 p-4 text-left hover:bg-cyber-dark-tertiary md:p-5"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="pixel-label text-cyber-text-muted">Chapter {chapter.number}</span>
              {chapter.isPremium && <Badge variant="warning" size="sm">Club</Badge>}
            </div>
            <h3 className="text-cyber-text-primary group-hover:text-cyber-primary" style={{ fontSize: "1.15rem" }}>
              {chapter.title}
            </h3>
            {chapter.description && (
              <p className="mt-1 line-clamp-2 text-sm text-cyber-text-secondary">{chapter.description}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="font-ui text-sm text-cyber-text-muted">
              {done}/{total}
            </span>
            <span
              className={cn(
                "grid h-7 w-7 place-items-center border-2 border-cyber-ink font-ui font-bold leading-none text-cyber-ink",
                isExpanded ? "bg-cyber-pink" : "bg-cyber-primary"
              )}
              aria-hidden="true"
            >
              {isExpanded ? "−" : "+"}
            </span>
          </div>
        </button>

        {isExpanded && (
          <ul id={panelId} className="animate-fade-in divide-y-2 divide-dashed divide-cyber-border border-t-2 border-dashed border-cyber-border">
            {chapter.exercises.map((exercise, index) => (
              <ExerciseItem
                key={exercise.id}
                exercise={{ ...exercise, isCompleted: completedExercises.includes(exercise.id) }}
                courseSlug={courseSlug}
                exerciseNumber={startingExerciseNumber + index}
                chapterId={chapter.id}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
