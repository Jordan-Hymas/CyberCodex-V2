import { Button } from "@/components/ui";
import type { Exercise } from "@/types/curriculum";
import { cn } from "@/lib/utils";

export interface ExerciseItemProps {
  exercise: Exercise;
  courseSlug: string;
  exerciseNumber: number;
  chapterId?: string;
  className?: string;
}

export function ExerciseItem({ exercise, courseSlug, exerciseNumber, className }: ExerciseItemProps) {
  const { isLocked, isCompleted } = exercise;
  const isUnwritten = exercise.hasContent === false;
  const href = `/courses/${courseSlug}/${exercise.id}`;

  return (
    <li className={cn("flex items-center gap-3 px-4 py-3 md:px-5", (isLocked || isUnwritten) && "opacity-60", className)}>
      {/* Status tile */}
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center border-2 border-cyber-ink font-ui text-xs",
          isCompleted
            ? "bg-cyber-primary text-cyber-ink"
            : isLocked
              ? "bg-cyber-ink text-cyber-text-muted"
              : "bg-cyber-dark-tertiary text-cyber-text-primary"
        )}
        aria-label={isCompleted ? "Completed" : isLocked ? "Locked" : `Exercise ${exerciseNumber}`}
      >
        {isCompleted ? "✓" : isLocked ? "🔒" : exerciseNumber}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-cyber-text-primary">{exercise.title}</p>
        {exercise.description && <p className="truncate text-sm text-cyber-text-muted">{exercise.description}</p>}
      </div>

      {exercise.xpReward ? (
        <span className="hidden shrink-0 font-ui text-sm text-cyber-warning sm:inline">+{exercise.xpReward} XP</span>
      ) : null}

      <div className="shrink-0">
        {isLocked ? (
          <span className="font-ui text-sm text-cyber-text-muted">Locked</span>
        ) : isUnwritten ? (
          <span className="border border-cyber-border px-1.5 py-0.5 font-ui text-xs uppercase tracking-wider text-cyber-text-muted">
            Soon
          </span>
        ) : isCompleted ? (
          <Button href={href} variant="ghost" size="sm" className="text-cyber-primary">
            Review
          </Button>
        ) : (
          <Button href={href} size="sm">
            Start
          </Button>
        )}
      </div>
    </li>
  );
}
