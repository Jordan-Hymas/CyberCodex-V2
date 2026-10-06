import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { getAllCourses } from "@/lib/mdx";
import { getCurriculumBySlug } from "@/lib/curriculum";
import { courseCategories, difficultyLevels } from "@/lib/config";
import {
  DashboardWelcome,
  JumpBackIn,
  ExploreMore,
  DashboardSidebar,
} from "@/components/dashboard";

export const metadata = {
  title: "Dashboard - CyberCodex.io",
  description: "Your cybersecurity learning dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard");
  }

  // Fetch user data with progress
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      courseProgress: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },
      badges: {
        include: {
          badge: true,
        },
      },
    },
  });

  if (!userData) {
    redirect("/login?callbackUrl=%2Fdashboard");
  }

  // Get the most recent course in progress
  const recentCourse = userData.courseProgress[0];
  let courseProgress;
  if (recentCourse) {
    // Look up the real course details instead of hardcoded placeholders
    const course = getAllCourses().find((c) => c.slug === recentCourse.courseId);
    const curriculum = await getCurriculumBySlug(recentCourse.courseId);
    const done = new Set(
      (
        await prisma.userExercise.findMany({
          where: { userId: session.user.id, courseId: recentCourse.courseId, isCompleted: true },
          select: { exerciseId: true },
        })
      ).map((e) => e.exerciseId)
    );
    const nextExercise = curriculum?.chapters.flatMap((c) => c.exercises).find((e) => !done.has(e.id));

    courseProgress = {
      courseId: recentCourse.courseId,
      courseTitle: course?.title ?? curriculum?.metadata.title ?? recentCourse.courseId,
      courseSlug: recentCourse.courseId,
      progress:
        recentCourse.totalExercises > 0
          ? Math.round((recentCourse.exercisesCompleted / recentCourse.totalExercises) * 100)
          : 0,
      currentExercise: nextExercise?.title ?? "Course complete",
      totalExercises: recentCourse.totalExercises,
      completedExercises: recentCourse.exercisesCompleted,
      category: courseCategories.find((c) => c.id === course?.category)?.name ?? "Course",
      difficulty: course ? difficultyLevels[course.difficulty].label : "",
    };
  }

  // Prepare user stats
  const userStats = {
    xp: userData.totalXp,
    level: userData.level,
    coursesCompleted: userData.courseProgress.filter((p) => p.isCompleted).length,
    badgesEarned: userData.badges.length,
    streak: userData.streak,
  };

  return (
    <main className="min-h-screen pt-28 pb-24 md:pt-32">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Content */}
          <div className="space-y-12 lg:col-span-8">
            <DashboardWelcome userName={userData.name || "User"} />
            <JumpBackIn courseProgress={courseProgress} />
            <ExploreMore />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <DashboardSidebar
              user={{
                name: userData.name || "User",
                email: userData.email,
                image: userData.image,
              }}
              stats={userStats}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
