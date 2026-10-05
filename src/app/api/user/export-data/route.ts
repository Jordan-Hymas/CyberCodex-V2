import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        courseProgress: true,
        exercises: true,
        badges: {
          include: {
            badge: true,
          },
        },
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      user: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        level: userData.level,
        xp: userData.xp,
        totalXp: userData.totalXp,
        streak: userData.streak,
        rank: userData.rank,
        subscriptionTier: userData.subscriptionTier,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        lastActive: userData.lastActive,
      },
      courseProgress: userData.courseProgress.map((progress) => ({
        courseId: progress.courseId,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        startedAt: progress.startedAt,
        lastActivityAt: progress.lastActivityAt,
        exercisesCompleted: progress.exercisesCompleted,
        totalExercises: progress.totalExercises,
        xpEarned: progress.xpEarned,
        exercises: userData.exercises
          .filter((ex) => ex.courseId === progress.courseId)
          .map((ex) => ({
            exerciseId: ex.exerciseId,
            isCompleted: ex.isCompleted,
            completedAt: ex.completedAt,
            attempts: ex.attempts,
            timeSpent: ex.timeSpent,
          })),
      })),
      badges: userData.badges.map((userBadge) => ({
        badgeId: userBadge.badgeId,
        unlockedAt: userBadge.unlockedAt,
        badge: {
          name: userBadge.badge.name,
          description: userBadge.badge.description,
          category: userBadge.badge.category,
        },
      })),
      connectedAccounts: userData.accounts.map((account) => ({
        provider: account.provider,
        type: account.type,
      })),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
