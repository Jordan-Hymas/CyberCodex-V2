import { missions as linuxMissions } from "@/lib/linux/challenges";
import { hasLinuxPro } from "@/lib/linux/access";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getAllCurriculumSlugs, getAllExerciseIds, getCurriculumBySlug } from "@/lib/curriculum";
import { getCourseBySlug } from "@/lib/mdx";
import Link from "next/link";
import { courseCategories, difficultyLevels } from "@/lib/config";
import { Badge } from "@/components/ui";
import { Mascot } from "@/components/brand";
import { CourseLayout, CourseSidebar, ChapterList } from "@/components/course";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for all courses
export async function generateStaticParams() {
  const slugs = getAllCurriculumSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const curriculum = await getCurriculumBySlug(slug);

  if (!curriculum) {
    return {
      title: "Course Not Found",
    };
  }

  return {
    title: `${curriculum.metadata.title} - CyberCodex.io`,
    description: curriculum.metadata.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const curriculum = await getCurriculumBySlug(slug);

  if (!curriculum) {
    notFound();
  }

  // Fetch course metadata to get category for banner
  const courseMetadata = await getCourseBySlug(slug);
  const category = courseMetadata ? courseCategories.find((c) => c.id === courseMetadata.category) : null;

  // Fetch authenticated user session
  const session = await auth();

  // Fetch user data and progress if authenticated
  let user = null;
  let userProgress = curriculum.progress; // Default to curriculum progress
  let completedExercises: string[] = [];
  let unlockedBadges: any[] = [];

  if (session?.user?.id) {
    // Fetch full user data including level, xp, etc.
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        level: true,
        xp: true,
        totalXp: true,
        image: true,
      },
    });

    if (userData) {
      user = {
        name: userData.username || userData.name || "Anonymous",
        level: userData.level,
        avatar: userData.image ?? undefined,
        xp: userData.xp,
        totalXp: userData.totalXp,
      };
    }

    // Fetch course progress
    const courseProgress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: slug,
        },
      },
    });

    // If progress exists, merge with curriculum data
    if (courseProgress) {
      userProgress = {
        ...curriculum.progress,
        exercisesCompleted: courseProgress.exercisesCompleted,
        totalExercises: courseProgress.totalExercises || curriculum.progress.totalExercises,
        projectsCompleted: courseProgress.projectsCompleted,
        totalProjects: courseProgress.totalProjects || curriculum.progress.totalProjects,
        xpEarned: courseProgress.xpEarned,
        totalXp: courseProgress.totalXp || curriculum.progress.totalXp,
        badgesEarned: 0, // Will be calculated from unlocked badges
      };
    }

    // Fetch completed exercises
    const completedExercisesData = await prisma.userExercise.findMany({
      where: {
        userId: session.user.id,
        courseId: slug,
        isCompleted: true,
      },
      select: {
        exerciseId: true,
      },
    });

    completedExercises = completedExercisesData.map((ex) => ex.exerciseId);

    // Fetch unlocked badges for this course
    const unlockedBadgesData = await prisma.userBadge.findMany({
      where: {
        userId: session.user.id,
        badge: {
          courseId: slug,
        },
      },
      include: {
        badge: true,
      },
      orderBy: {
        unlockedAt: "desc",
      },
    });

    unlockedBadges = unlockedBadgesData.map((ub) => ({
      ...ub.badge,
      isUnlocked: true,
      unlockedAt: ub.unlockedAt,
    }));

    userProgress.badgesEarned = unlockedBadges.length;
  }

  // Default user for non-authenticated users
  if (!user) {
    user = {
      name: "Guest",
      level: 1,
      isGuest: true,
    };
  }

  // Merge curriculum badges with unlocked badges
  const badgesWithUnlockStatus = curriculum.badges.map((badge) => {
    const unlocked = unlockedBadges.find((ub) => ub.name.endsWith(`:${badge.id}`));
    return {
      ...badge,
      isUnlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt,
    };
  });

  const difficulty = courseMetadata ? difficultyLevels[courseMetadata.difficulty] : null;
  const writtenExercises = new Set(getAllExerciseIds(slug));
  let linuxCompleted: string[] = [];
  let linuxPaid = false;
  if (slug === "linux-fundamentals" && session?.user?.id) {
    const learner = await prisma.user.findUnique({ where: { id: session.user.id } });
    linuxPaid = !!learner && hasLinuxPro(learner);
    linuxCompleted = (await prisma.linuxLabSession.findMany({ where: { userId: session.user.id, solvedAt: { not: null } }, select: { exerciseId: true } })).map(s => s.exerciseId);
    completedExercises = linuxCompleted;
    userProgress = {
      ...curriculum.progress,
      exercisesCompleted: linuxCompleted.length,
      xpEarned: linuxMissions.filter(m => linuxCompleted.includes(m.id)).reduce((total, m) => total + m.xp, 0),
    };
  }
  const chapters = curriculum.chapters.map((chapter) => ({
    ...chapter,
    isLocked: slug === "linux-fundamentals" ? chapter.isPremium && !linuxPaid : chapter.isLocked,
    exercises: chapter.exercises.map((ex) => {
      const index = linuxMissions.findIndex(m => m.id === ex.id);
      return { ...ex, hasContent: writtenExercises.has(ex.id),
        ...(slug === "linux-fundamentals" ? {
          isCompleted: linuxCompleted.includes(ex.id),
          isLocked: (chapter.isPremium && !linuxPaid) || (index > 0 && !linuxCompleted.includes(linuxMissions[index - 1].id)),
        } : {}),
      };
    }),
  }));
  const exerciseCount = curriculum.chapters.reduce((sum, c) => sum + c.exercises.length, 0);

  return (
    <main className="min-h-screen pb-24">
      <header className="relative mb-12 overflow-hidden border-b-[3px] border-cyber-ink">
        {category?.iconGif && (
          <div className="absolute inset-0" aria-hidden="true">
            <Image src={category.iconGif} alt="" fill priority unoptimized sizes="100vw" className="object-cover pixelated" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-dark via-cyber-dark/85 to-cyber-dark/30" />
          </div>
        )}
        <div className="container-custom relative pt-28 pb-12 md:pt-32 md:pb-16">
          <nav aria-label="Breadcrumb" className="mb-6 font-ui text-sm text-cyber-text-muted">
            <Link href="/courses" className="hover:text-cyber-primary">
              Courses
            </Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-cyber-text-secondary" aria-current="page">
              {curriculum.metadata.title}
            </span>
          </nav>
          <h1 className="text-display-2 mb-4 max-w-4xl">{curriculum.metadata.title}</h1>
          <p className="mb-6 max-w-3xl text-lg leading-relaxed text-cyber-text-secondary md:text-xl">
            {curriculum.metadata.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {difficulty && <Badge variant={difficulty.color} size="lg">{difficulty.label}</Badge>}
            {[
              courseMetadata?.duration,
              `${curriculum.chapters.length} chapters`,
              `${exerciseCount} exercises`,
            ]
              .filter(Boolean)
              .map((item) => (
                <span
                  key={item}
                  className="border-2 border-cyber-ink bg-cyber-dark-secondary px-3 py-1 font-ui text-sm text-cyber-text-primary shadow-[2px_2px_0_0_var(--color-cyber-ink)]"
                >
                  {item}
                </span>
              ))}
            {curriculum.progress.totalXp > 0 && (
              <span className="border-2 border-cyber-ink bg-cyber-dark-secondary px-3 py-1 font-ui text-sm text-cyber-warning shadow-[2px_2px_0_0_var(--color-cyber-ink)]">
                +{curriculum.progress.totalXp} XP
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <CourseLayout
        hero={null}
        sidebar={
          <CourseSidebar
            user={user}
            progress={userProgress}
            badges={badgesWithUnlockStatus}
          />
        }
      >
        {slug === "linux-fundamentals" && (
          <Link
            href="/courses/linux-fundamentals/orientation"
            className="card card-interactive mb-10 flex-row items-center gap-5 !border-cyber-secondary !p-5"
          >
            <div className="shrink-0 border-2 border-cyber-ink bg-cyber-secondary p-1">
              <Mascot mood="hi" width={64} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="pixel-label mb-1 text-cyber-secondary">Start here</p>
              <p className="text-lg text-cyber-text-primary" style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}>
                Course orientation
              </p>
              <p className="text-sm text-cyber-text-secondary">
                What you&apos;ll learn, how flag missions work, and how you earn XP.
              </p>
            </div>
            <span className="font-ui text-cyber-text-primary" aria-hidden="true">▶</span>
          </Link>
        )}
        <ChapterList
          chapters={chapters}
          courseSlug={slug}
          completedExercises={completedExercises}
        />
      </CourseLayout>
    </main>
  );
}
