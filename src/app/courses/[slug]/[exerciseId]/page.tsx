import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { serialize } from "next-mdx-remote/serialize";
import rehypePrism from "rehype-prism-plus";
import { getAllCurriculumSlugs, getAllExerciseIds, getExerciseContent, getCurriculumBySlug } from "@/lib/curriculum";
import { Container, Button } from "@/components/ui";
import { TerminalWrapper } from "@/components/lab/TerminalWrapper";
import { InteractivePythonLayout } from "@/components/course/InteractivePythonLayout";
import { ExerciseCompletionWrapper } from "@/components/course/ExerciseCompletionWrapper";
import type { Metadata } from "next";

// Courses that use the terminal emulator
const TERMINAL_ENABLED_COURSES = ["linux-fundamentals", "networking-fundamentals"];

interface ExercisePageProps {
  params: Promise<{
    slug: string;
    exerciseId: string;
  }>;
}

// Generate static paths for all exercises
export async function generateStaticParams() {
  const slugs = getAllCurriculumSlugs();
  const paths: { slug: string; exerciseId: string }[] = [];

  for (const slug of slugs) {
    const exerciseIds = getAllExerciseIds(slug);
    for (const exerciseId of exerciseIds) {
      paths.push({ slug, exerciseId });
    }
  }

  return paths;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ExercisePageProps): Promise<Metadata> {
  const { slug, exerciseId } = await params;
  const exercise = await getExerciseContent(slug, exerciseId);
  const curriculum = await getCurriculumBySlug(slug);

  if (!exercise || !curriculum) {
    return {
      title: "Exercise Not Found",
    };
  }

  return {
    title: `${exercise.frontmatter.title || exerciseId} - ${curriculum.metadata.title} - CyberCodex.io`,
    description: exercise.frontmatter.description || `Learn ${exercise.frontmatter.title}`,
  };
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { slug, exerciseId } = await params;
  const exercise = await getExerciseContent(slug, exerciseId);
  const curriculum = await getCurriculumBySlug(slug);

  if (!exercise || !curriculum) {
    notFound();
  }

  const hasTerminal = TERMINAL_ENABLED_COURSES.includes(slug);
  const isInteractivePython = exercise.frontmatter.type === "interactive-python";

  // Find next and previous exercises, and get current exercise metadata
  let nextExerciseId: string | undefined;
  let previousExerciseId: string | undefined;
  let currentChapterId: string | undefined;
  let currentXpReward: number = 0;

  const allExercises = curriculum.chapters.flatMap((chapter) => chapter.exercises);
  const currentIndex = allExercises.findIndex((ex) => ex.id === exerciseId);

  if (currentIndex !== -1) {
    if (currentIndex > 0) {
      previousExerciseId = allExercises[currentIndex - 1].id;
    }
    if (currentIndex < allExercises.length - 1) {
      nextExerciseId = allExercises[currentIndex + 1].id;
    }
  }

  // Get current exercise metadata from curriculum
  for (const chapter of curriculum.chapters) {
    const ex = chapter.exercises.find((e) => e.id === exerciseId);
    if (ex) {
      currentChapterId = chapter.id;
      currentXpReward = ex.xpReward || 0;
      break;
    }
  }

  // For interactive Python exercises, serialize MDX content
  if (isInteractivePython) {
    const mdxSource = await serialize(exercise.content, {
      mdxOptions: {
        rehypePlugins: [rehypePrism as any],
      },
    });

    return (
      <InteractivePythonLayout
        title={exercise.frontmatter.title || exerciseId}
        description={exercise.frontmatter.description}
        mdxContent={mdxSource}
        starterCode={exercise.frontmatter.starterCode || "# Write your code here\n"}
        solution={exercise.frontmatter.solution}
        tests={exercise.frontmatter.tests}
        hints={exercise.frontmatter.hints}
        courseSlug={slug}
        exerciseId={exerciseId}
        chapterId={currentChapterId}
        xpReward={currentXpReward}
        nextExerciseId={nextExerciseId}
        previousExerciseId={previousExerciseId}
      />
    );
  }

  return (
    <main className="min-h-screen bg-cyber-dark">
      {/* Full-Width Banner Header - Touches Top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-cyber-dark border-b border-cyber-primary/30">
        {/* Top Navigation Bar */}
        <div className="border-b border-cyber-border/50 bg-gradient-to-r from-cyber-dark via-cyber-dark-secondary to-cyber-dark">
          <div className="px-6 md:px-8 lg:px-10">
            <div className="flex items-center justify-between py-1.5">
              {/* Logo - Match Homepage Style */}
              <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
                <div className="relative w-6 h-6 md:w-8 md:h-8">
                  <Image
                    src="/images/logo/possibleCharacter.gif"
                    alt="CyberCodex Logo"
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-110"
                    unoptimized
                    priority
                  />
                </div>
                <div className="font-pixel leading-tight text-xs md:text-sm">
                  <span className="text-cyber-primary">Cyber</span>
                  <span className="text-cyber-text-primary">Codex.io</span>
                </div>
              </Link>

              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs text-cyber-text-muted">
                <Link href="/courses" className="hover:text-cyber-primary transition-colors">
                  Courses
                </Link>
                <span>/</span>
                <Link href={`/courses/${slug}`} className="hover:text-cyber-primary transition-colors hidden md:inline">
                  {curriculum.metadata.title}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Title Section */}
        <div className="bg-gradient-to-r from-cyber-dark-secondary/80 via-cyber-primary/5 to-cyber-secondary/5">
          <div className="px-6 md:px-8 lg:px-10">
            <div className="py-1.5 flex items-center gap-2">
              {/* Course Icon/Badge */}
              <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-primary/20 to-cyber-secondary/20 border border-cyber-primary/40 flex-shrink-0">
                <span className="text-lg">🐧</span>
              </div>

              {/* Title and Meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-lg lg:text-xl font-bold gradient-text leading-tight">
                  {exercise.frontmatter.title || exerciseId}
                </h1>
                <div className="flex items-center gap-2 text-xs text-cyber-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="text-cyber-primary text-[10px]">📚</span>
                    <span className="text-[11px]">{curriculum.metadata.title}</span>
                  </span>
                  {exercise.frontmatter.xpReward && (
                    <span className="flex items-center gap-1">
                      <span className="text-cyber-warning text-[10px]">⭐</span>
                      <span className="text-[11px]">{exercise.frontmatter.xpReward} XP</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {hasTerminal ? (
        // Two-column layout for terminal-enabled courses
        <div className="fixed top-[130px] left-0 right-0 bottom-0">
          <div className="flex flex-col lg:grid lg:grid-cols-2 h-full">
            {/* Left: Exercise Content */}
            <div className="h-1/2 lg:h-full overflow-y-auto scrollbar-cyber lg:border-r border-b lg:border-b-0 border-cyber-border bg-gradient-to-br from-cyber-dark via-cyber-dark to-cyber-dark-secondary/50">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
                <div className="absolute top-20 right-10 w-64 h-64 bg-cyber-primary rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-64 h-64 bg-cyber-secondary rounded-full blur-3xl"></div>
              </div>

              <div className="relative p-6 sm:p-8 lg:p-10 pb-20">
                <article className="prose prose-invert prose-cyber max-w-none">
                  <MDXRemote
                    source={exercise.content}
                    options={{
                      mdxOptions: {
                        rehypePlugins: [rehypePrism as any],
                      },
                    }}
                  />
                </article>

                {/* Completion Button for Terminal Courses */}
                <div className="mt-8 not-prose">
                  <ExerciseCompletionWrapper
                    courseId={slug}
                    exerciseId={exerciseId}
                    chapterId={currentChapterId}
                    xpReward={currentXpReward}
                    nextExerciseId={nextExerciseId}
                  />
                </div>
              </div>
            </div>

            {/* Right: Terminal */}
            <div className="h-1/2 lg:h-full bg-[#0a0e27] overflow-hidden flex flex-col">
              <div className="border-b border-cyber-border px-6 py-3.5 bg-cyber-dark-secondary/50 backdrop-blur-sm flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                </div>
                <span className="text-sm text-cyber-text-secondary font-mono">Linux Terminal</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <TerminalWrapper className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Single-column layout for regular courses
        <div className="pt-[132px]">
          <Container className="max-w-4xl py-8">
            {/* Back Button */}
            <Button href={`/courses/${slug}`} variant="ghost" className="mb-6 border border-cyber-border hover:border-cyber-primary">
                ← Back to Course
              </Button>

            {/* Exercise Content */}
            <article className="prose prose-invert prose-cyber max-w-none">
              <MDXRemote
                source={exercise.content}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypePrism as any],
                  },
                }}
              />
            </article>

            {/* Completion Button */}
            <div className="mt-8">
              <ExerciseCompletionWrapper
                courseId={slug}
                exerciseId={exerciseId}
                chapterId={currentChapterId}
                xpReward={currentXpReward}
                nextExerciseId={nextExerciseId}
              />
            </div>

            {/* Navigation */}
            <div className="mt-12 pt-8 border-t border-cyber-border flex justify-between">
              <Button href={`/courses/${slug}`} variant="ghost" className="border border-cyber-border hover:border-cyber-primary">
                  ← Back to Course
                </Button>

              {exercise.frontmatter.nextExercise && (
                <Button href={`/courses/${slug}/${exercise.frontmatter.nextExercise}`} variant="primary">
                    Next Exercise →
                  </Button>
              )}
            </div>
          </Container>
        </div>
      )}
    </main>
  );
}
