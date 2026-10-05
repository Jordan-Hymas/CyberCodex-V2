"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
      <div className="flex justify-center py-4">
        <div className="text-cyber-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="p-4 bg-cyber-dark-secondary/50 border border-cyber-border rounded-lg text-center">
        <p className="text-cyber-text-secondary text-sm mb-3">
          Sign in to track your progress and earn XP
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2 bg-cyber-primary text-cyber-dark font-semibold rounded-lg hover:bg-cyber-secondary transition-colors"
        >
          Sign In
        </Link>
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
