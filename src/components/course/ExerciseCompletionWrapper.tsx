"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/brand";
import { useSession } from "next-auth/react";
import { ExerciseCompletionButton } from "./ExerciseCompletionButton";

export interface ExerciseCompletionWrapperProps {
  courseId: string;
  exerciseId: string;
  chapterId?: string;
  xpReward: number;
  nextExerciseId?: string;
}

export function ExerciseCompletionWrapper({
  courseId,
  exerciseId,
  chapterId,
  xpReward,
  nextExerciseId,
}: ExerciseCompletionWrapperProps) {
  const { data: session, status } = useSession();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user's progress to check if exercise is completed
  useEffect(() => {
    async function fetchProgress() {
      if (status === "loading") return;

      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/progress/${courseId}`);
        if (response.ok) {
          const data = await response.json();
          const completedExercise = data.exercises?.find(
            (ex: any) => ex.exerciseId === exerciseId && ex.isCompleted
          );
          setIsCompleted(!!completedExercise);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [courseId, exerciseId, session, status]);

  // Don't show button if not authenticated
  if (status === "loading" || loading) {
    return (
      <div className="py-4 font-ui text-sm text-cyber-text-muted">Loading…</div>
    );
  }

  if (!session?.user) {
    return (
      <div className="pixel-panel flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <Mascot mood="looking" width={56} />
        <p className="flex-1 text-cyber-text-secondary">Sign in to track your progress and earn XP for this exercise.</p>
        <Button href="/login">Sign in</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ExerciseCompletionButton
        courseId={courseId}
        exerciseId={exerciseId}
        chapterId={chapterId}
        xpReward={xpReward}
        nextExerciseId={nextExerciseId}
        isCompleted={isCompleted}
        className="w-full sm:w-auto"
      />
    </div>
  );
}
