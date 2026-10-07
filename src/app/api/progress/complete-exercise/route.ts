/**
 * API Route: POST /api/progress/complete-exercise
 * Marks an exercise as complete, awards XP, checks for level ups and badge unlocks
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";

const completeExerciseSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  exerciseId: z.string().min(1, "Exercise ID is required"),
  chapterId: z.string().optional(),
  xpReward: z.number().int().min(0),
  code: z.string().optional(), // Save user's code for interactive exercises
  usedSolution: z.boolean().optional().default(false), // Track if user used "Show Solution"
});

// XP required per level (100 XP per level)
const XP_PER_LEVEL = 100;

function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

async function checkBadgeUnlocks(
  userId: string,
  courseId: string,
  chapterId?: string
) {
  if (!chapterId) return [];

  try {
    // Load curriculum to check chapter completion
    const curriculumPath = join(
      process.cwd(),
      "content",
      "courses",
      courseId,
      "curriculum.json"
    );
    const curriculum = JSON.parse(readFileSync(curriculumPath, "utf-8"));

    // Find the chapter
    const chapter = curriculum.chapters.find(
      (ch: any) => ch.id === chapterId
    );
    if (!chapter) return [];

    // Check if all exercises in this chapter are completed
    const chapterExercises = chapter.exercises.map((ex: any) => ex.id);
    const completedExercises = await prisma.userExercise.count({
      where: {
        userId,
        courseId,
        exerciseId: { in: chapterExercises },
        isCompleted: true,
      },
    });

    // If chapter is complete, unlock the chapter badge
    if (completedExercises === chapterExercises.length) {
      const chapterBadges = curriculum.badges.filter(
        (badge: any) =>
          badge.unlockCondition &&
          badge.unlockCondition.includes(`Chapter ${chapter.number}`)
      );

      const unlockedBadges = [];
      for (const curriculumBadge of chapterBadges) {
        const badgeName = `${courseId}:${curriculumBadge.id}`;
        const badge = await prisma.badge.findUnique({
          where: { name: badgeName },
        });

        if (badge) {
          // Check if user already has this badge
          const existingUserBadge = await prisma.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId,
                badgeId: badge.id,
              },
            },
          });

          if (!existingUserBadge) {
            const userBadge = await prisma.userBadge.create({
              data: {
                userId,
                badgeId: badge.id,
              },
              include: {
                badge: true,
              },
            });
            unlockedBadges.push(userBadge);
          }
        }
      }

      return unlockedBadges;
    }

    return [];
  } catch (error) {
    console.error("Error checking badge unlocks:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to complete exercises." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    if (typeof body.courseId === "string" && body.courseId.startsWith("linux-")) {
      return NextResponse.json({ error: "Complete Linux missions by submitting your personal flag." }, { status: 403 });
    }
    const validatedData = completeExerciseSchema.parse(body);

    // Use Prisma transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if exercise was already completed
      const existingExercise = await tx.userExercise.findUnique({
        where: {
          userId_courseId_exerciseId: {
            userId: session.user.id!,
            courseId: validatedData.courseId,
            exerciseId: validatedData.exerciseId,
          },
        },
      });

      // If already completed, return success without awarding XP again
      if (existingExercise?.isCompleted) {
        return {
          alreadyCompleted: true,
          exercise: existingExercise,
          xpAwarded: 0,
          levelUp: false,
        };
      }

      // Calculate actual XP to award (half if solution was used)
      const actualXpReward = validatedData.usedSolution
        ? Math.floor(validatedData.xpReward / 2)
        : validatedData.xpReward;

      // Mark exercise as complete
      const completedExercise = await tx.userExercise.upsert({
        where: {
          userId_courseId_exerciseId: {
            userId: session.user.id!,
            courseId: validatedData.courseId,
            exerciseId: validatedData.exerciseId,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          code: validatedData.code,
          attempts: { increment: 1 },
          usedSolution: validatedData.usedSolution,
        },
        create: {
          userId: session.user.id!,
          courseId: validatedData.courseId,
          exerciseId: validatedData.exerciseId,
          isCompleted: true,
          completedAt: new Date(),
          code: validatedData.code,
          attempts: 1,
          usedSolution: validatedData.usedSolution,
        },
      });

      // Get current user data
      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id! },
        select: { totalXp: true, level: true },
      });

      if (!currentUser) {
        throw new Error("User not found");
      }

      // Calculate new XP and level
      const newTotalXp = currentUser.totalXp + actualXpReward;
      const newLevel = calculateLevel(newTotalXp);
      const levelUp = newLevel > currentUser.level;
      const currentLevelXp = newTotalXp % XP_PER_LEVEL;

      // Update user XP and level
      await tx.user.update({
        where: { id: session.user.id! },
        data: {
          totalXp: newTotalXp,
          xp: currentLevelXp,
          level: newLevel,
          lastActive: new Date(),
        },
      });

      // Update or create course progress
      const courseProgress = await tx.courseProgress.upsert({
        where: {
          userId_courseId: {
            userId: session.user.id!,
            courseId: validatedData.courseId,
          },
        },
        update: {
          exercisesCompleted: { increment: 1 },
          xpEarned: { increment: actualXpReward },
          lastActivityAt: new Date(),
        },
        create: {
          userId: session.user.id!,
          courseId: validatedData.courseId,
          exercisesCompleted: 1,
          xpEarned: actualXpReward,
          totalExercises: 0, // Will be updated when course is started
          totalXp: 0,
        },
      });

      return {
        alreadyCompleted: false,
        exercise: completedExercise,
        xpAwarded: actualXpReward,
        usedSolution: validatedData.usedSolution,
        levelUp,
        newLevel,
        totalXp: newTotalXp,
        currentLevelXp,
        courseProgress,
      };
    });

    // Check for badge unlocks (outside transaction for safety)
    const unlockedBadges = await checkBadgeUnlocks(
      session.user.id,
      validatedData.courseId,
      validatedData.chapterId
    );

    return NextResponse.json({
      message: result.alreadyCompleted
        ? "Exercise already completed"
        : "Exercise completed successfully!",
      ...result,
      unlockedBadges,
    });
  } catch (error) {
    console.error("Error completing exercise:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete exercise. Please try again." },
      { status: 500 }
    );
  }
}
