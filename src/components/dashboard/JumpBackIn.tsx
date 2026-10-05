"use client";

import { motion } from "framer-motion";
import { Button, Card, ProgressBar } from "@/components/ui";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  progress: number;
  currentExercise: string;
  totalExercises: number;
  completedExercises: number;
  category: string;
  difficulty: string;
}

interface JumpBackInProps {
  courseProgress?: CourseProgress;
}

export function JumpBackIn({ courseProgress }: JumpBackInProps) {
  if (!courseProgress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-cyber-text-primary mb-4 md:mb-6">
          Jump back in
        </h2>
        <Card className="p-6 md:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-cyber-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-cyber-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-cyber-text-primary mb-2">
              Start Your First Course
            </h3>
            <p className="text-cyber-text-secondary mb-6">
              Browse our course catalog and begin your cybersecurity journey today.
            </p>
            <Button href="/courses" variant="primary" size="lg">
                Browse Courses
              </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-cyber-text-primary mb-4 md:mb-6">
        Jump back in
      </h2>
      <Card className="p-6 md:p-8 hover:border-cyber-primary transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 md:gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-cyber-primary/10 text-cyber-primary text-xs font-semibold uppercase tracking-wider">
                {courseProgress.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-cyber-secondary/10 text-cyber-secondary text-xs font-semibold uppercase tracking-wider">
                {courseProgress.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold text-cyber-text-primary mb-2">
              {courseProgress.courseTitle}
            </h3>
            <p className="text-cyber-text-secondary mb-4">
              Continue from: <span className="text-cyber-primary">{courseProgress.currentExercise}</span>
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyber-text-secondary">Progress</span>
                <span className="text-cyber-text-primary font-semibold">
                  {courseProgress.completedExercises} / {courseProgress.totalExercises} exercises
                </span>
              </div>
              <ProgressBar value={courseProgress.progress} variant="primary" size="md" />
            </div>
          </div>
          <div className="lg:ml-6">
            <Button href={`/courses/${courseProgress.courseSlug}`} variant="primary" size="lg">
                Continue Learning
              </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
