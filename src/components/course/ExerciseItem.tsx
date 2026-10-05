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

export function ExerciseItem({
  exercise,
  courseSlug,
  exerciseNumber,
  chapterId,
  className,
}: ExerciseItemProps) {
  const isLocked = exercise.isLocked;
  const isCompleted = exercise.isCompleted;

  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 px-4 rounded-lg transition-all",
        "hover:bg-cyber-dark-secondary/50",
        isLocked && "opacity-50",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-cyber-text-secondary font-medium whitespace-nowrap">
            Exercise {exerciseNumber}
          </span>
          <span className="text-cyber-text-muted">·</span>
          <span className="text-cyber-text-primary truncate">{exercise.title}</span>
        </div>
        {exercise.description && (
          <p className="text-sm text-cyber-text-secondary mt-1 truncate">
            {exercise.description}
          </p>
        )}
      </div>

      <div className="ml-4 flex-shrink-0">
        {isLocked ? (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="border border-cyber-border"
          >
            <span className="text-cyber-text-muted">???</span>
          </Button>
        ) : isCompleted ? (
          <Button href={`/courses/${courseSlug}/${exercise.id}`}
              variant="ghost"
              size="sm"
              className="border border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10"
            >
              ✓ Review
            </Button>
        ) : (
          <Button href={`/courses/${courseSlug}/${exercise.id}`}
              variant="primary"
              size="sm"
              className="bg-cyber-secondary hover:bg-cyber-secondary/90"
            >
              Start
            </Button>
        )}
      </div>
    </div>
  );
}
