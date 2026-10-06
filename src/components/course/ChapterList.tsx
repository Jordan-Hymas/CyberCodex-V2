import { ChapterItem } from "./ChapterItem";
import type { Chapter } from "@/types/curriculum";
import { cn } from "@/lib/utils";

export interface ChapterListProps {
  chapters: Chapter[];
  courseSlug: string;
  completedExercises?: string[];
  className?: string;
}

export function ChapterList({ chapters, courseSlug, completedExercises = [], className }: ChapterListProps) {
  // Number exercises continuously across chapters
  let exerciseCounter = 0;
  const chaptersWithStartingNumbers = chapters.map((chapter) => {
    const startingExerciseNumber = exerciseCounter + 1;
    exerciseCounter += chapter.exercises.length;
    return { chapter, startingExerciseNumber };
  });

  // The first chapter with unfinished work is "current" and starts open
  const currentIndex = Math.max(
    0,
    chapters.findIndex((c) => c.exercises.some((e) => !completedExercises.includes(e.id)))
  );

  return (
    <div className={className}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-display-2 !text-[clamp(1.25rem,2vw,1.75rem)]">Quest log</h2>
        <p className="font-ui text-cyber-text-secondary">
          {chapters.length} chapters · {exerciseCounter} exercises
        </p>
      </div>

      {/* Path: a dashed line connects the chapter nodes */}
      <ol className="relative space-y-5 before:absolute before:bottom-6 before:left-[1.4rem] before:top-6 before:border-l-[3px] before:border-dashed before:border-cyber-border md:before:left-[1.65rem]">
        {chaptersWithStartingNumbers.map(({ chapter, startingExerciseNumber }, index) => (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            courseSlug={courseSlug}
            defaultOpen={index === currentIndex}
            startingExerciseNumber={startingExerciseNumber}
            completedExercises={completedExercises}
            className={cn("relative")}
          />
        ))}
      </ol>
    </div>
  );
}
