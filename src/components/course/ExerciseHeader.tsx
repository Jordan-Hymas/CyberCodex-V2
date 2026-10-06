import Link from "next/link";
import { Button } from "@/components/ui";

export interface ExerciseHeaderProps {
  title: string;
  courseSlug: string;
  courseTitle: string;
  chapterLabel?: string;
  xpReward?: number;
  previousExerciseId?: string;
  nextExerciseId?: string;
}

/** Slim bar under the main nav for exercise pages. */
export function ExerciseHeader({
  title,
  courseSlug,
  courseTitle,
  chapterLabel,
  xpReward,
  previousExerciseId,
  nextExerciseId,
}: ExerciseHeaderProps) {
  return (
    <div className="shrink-0 border-b-[3px] border-cyber-ink bg-cyber-dark-secondary">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="mb-0.5 truncate font-ui text-xs text-cyber-text-muted">
            <Link href={`/courses/${courseSlug}`} className="hover:text-cyber-primary">
              {courseTitle}
            </Link>
            {chapterLabel && (
              <>
                <span className="mx-1.5" aria-hidden="true">/</span>
                {chapterLabel}
              </>
            )}
          </nav>
          <h1 className="truncate text-cyber-text-primary" style={{ fontFamily: "var(--font-ui)", fontSize: "1.25rem", fontWeight: 600 }}>
            {title}
          </h1>
        </div>
        {xpReward ? (
          <span className="border-2 border-cyber-ink bg-cyber-warning px-2 py-0.5 font-ui text-sm text-cyber-ink shadow-[2px_2px_0_0_var(--color-cyber-ink)]">
            +{xpReward} XP
          </span>
        ) : null}
        <div className="flex gap-2">
          {previousExerciseId && (
            <Button href={`/courses/${courseSlug}/${previousExerciseId}`} variant="secondary" size="sm" aria-label="Previous exercise">
              ◀ Prev
            </Button>
          )}
          <Button
            href={nextExerciseId ? `/courses/${courseSlug}/${nextExerciseId}` : `/courses/${courseSlug}`}
            variant="secondary"
            size="sm"
          >
            {nextExerciseId ? "Next ▶" : "Course ▶"}
          </Button>
        </div>
      </div>
    </div>
  );
}
