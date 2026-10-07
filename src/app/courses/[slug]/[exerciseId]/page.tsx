import { LinuxLesson } from "@/components/lab/LinuxLesson";
import { isLinuxCourse } from "@/lib/linux/challenges";
import { LinuxOrientation } from "@/components/lab/LinuxOrientation";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { serialize } from "next-mdx-remote/serialize";
import rehypePrism from "rehype-prism-plus";
import { getAllCurriculumSlugs, getAllExerciseIds, getExerciseContent, getCurriculumBySlug } from "@/lib/curriculum";
import { WindowBar } from "@/components/ui";
import { TerminalWrapper } from "@/components/lab/TerminalWrapper";
import { InteractivePythonLayout } from "@/components/course/InteractivePythonLayout";
import { ExerciseCompletionWrapper } from "@/components/course/ExerciseCompletionWrapper";
import { ExerciseHeader } from "@/components/course/ExerciseHeader";
import type { Metadata } from "next";

// Courses that use the terminal emulator
const TERMINAL_ENABLED_COURSES = ["linux-fundamentals", "linux-intermediate", "linux-advanced", "networking-fundamentals"];

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
  if (slug === "linux-fundamentals" && exerciseId === "orientation") {
    return { title: "Orientation - Linux Fundamentals - CyberCodex" };
  }
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
  // Course orientation is a page of its own, not a curriculum exercise
  if (slug === "linux-fundamentals" && exerciseId === "orientation") return <LinuxOrientation />;
  const exercise = await getExerciseContent(slug, exerciseId);
  const curriculum = await getCurriculumBySlug(slug);

  if (!exercise || !curriculum) {
    notFound();
  }

  if (isLinuxCourse(slug)) return <LinuxLesson exerciseId={exerciseId} />;

  const hasTerminal = TERMINAL_ENABLED_COURSES.includes(slug);
  const isInteractivePython = exercise.frontmatter.type === "interactive-python";

  // Find next and previous exercises, and get current exercise metadata
  let nextExerciseId: string | undefined;
  let previousExerciseId: string | undefined;
  let currentChapterId: string | undefined;
  let currentXpReward: number = 0;
  let chapterLabel: string | undefined;

  // Prev/next only step through exercises that have been written
  const writtenExercises = new Set(getAllExerciseIds(slug));
  const allExercises = curriculum.chapters
    .flatMap((chapter) => chapter.exercises)
    .filter((ex) => writtenExercises.has(ex.id));
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
      chapterLabel = `Chapter ${chapter.number}: ${chapter.title}`;
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
        courseTitle={curriculum.metadata.title}
        chapterLabel={chapterLabel}
      />
    );
  }

  const header = (
    <ExerciseHeader
      title={exercise.frontmatter.title || exerciseId}
      courseSlug={slug}
      courseTitle={curriculum.metadata.title}
      chapterLabel={chapterLabel}
      xpReward={currentXpReward}
      previousExerciseId={previousExerciseId}
      nextExerciseId={nextExerciseId}
    />
  );

  const content = (
    <>
      <article className="prose-cyber max-w-none">
        <MDXRemote
          source={exercise.content}
          options={{
            mdxOptions: {
              rehypePlugins: [rehypePrism as any],
            },
          }}
        />
      </article>
      <div className="mt-10">
        <ExerciseCompletionWrapper
          courseId={slug}
          exerciseId={exerciseId}
          chapterId={currentChapterId}
          xpReward={currentXpReward}
          nextExerciseId={nextExerciseId}
        />
      </div>
    </>
  );

  if (hasTerminal) {
    return (
      <main className="flex flex-col pt-16 lg:h-dvh">
        {header}
        <div className="grid min-h-0 flex-1 lg:grid-cols-2">
          <section className="min-h-0 overflow-y-auto border-b-[3px] border-cyber-ink p-6 scrollbar-cyber md:p-8 lg:border-b-0 lg:border-r-[3px] lg:p-10">
            {content}
          </section>
          <section className="flex h-[70vh] min-h-0 flex-col bg-cyber-ink lg:h-auto">
            <WindowBar title="guest@cybercodex: ~" textClassName="text-cyber-ink" />
            <div className="min-h-0 flex-1 overflow-hidden">
              <TerminalWrapper className="h-full w-full" />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16">
      {header}
      <div className="container-custom max-w-4xl py-10 md:py-14">{content}</div>
    </main>
  );
}
