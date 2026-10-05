import { Hero } from "@/components/features";
import { CourseCard } from "@/components/course";
import { Button } from "@/components/ui";
import { Mascot, type MascotMood } from "@/components/brand";
import type { CourseSummary } from "@/types";

interface HomeClientProps {
  courses: CourseSummary[];
}

const steps: { n: string; title: string; body: string; mood: MascotMood; accent: string }[] = [
  {
    n: "01",
    title: "Read",
    body: "Short lessons that explain one idea at a time, with real commands and real code.",
    mood: "smart",
    accent: "bg-cyber-secondary",
  },
  {
    n: "02",
    title: "Run it",
    body: "Practice in a terminal and Python editor that live in your browser. Nothing to install.",
    mood: "hacker",
    accent: "bg-cyber-pink",
  },
  {
    n: "03",
    title: "Level up",
    body: "Earn XP for every exercise, keep your streak alive and climb the community leaderboard.",
    mood: "cheers",
    accent: "bg-cyber-warning",
  },
];

export function HomeClient({ courses }: HomeClientProps) {
  const featuredCourses = courses.slice(0, 6);
  const stats = [
    { label: "courses", value: courses.length },
    { label: "chapters", value: courses.reduce((sum, c) => sum + (c.chapterCount ?? 0), 0) },
    { label: "exercises", value: courses.reduce((sum, c) => sum + (c.exerciseCount ?? 0), 0) },
  ].filter((s) => s.value > 0);

  return (
    <main className="min-h-screen">
      <Hero stats={stats} />

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 py-[var(--section-padding)]">
        <div className="container-custom">
          <p className="pixel-label mb-3 text-cyber-pink">How it works</p>
          <h2 className="text-display-2 mb-12 max-w-3xl">Three steps. Repeat until hacker.</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="pixel-panel relative flex flex-col p-6 pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className={`border-2 border-cyber-ink px-2 py-0.5 font-pixel text-xs text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)] ${step.accent}`}
                  >
                    {step.n}
                  </span>
                  <div className={`border-2 border-cyber-ink p-1 shadow-[3px_3px_0_0_var(--color-cyber-ink)] ${step.accent}`}>
                    <Mascot mood={step.mood} width={64} />
                  </div>
                </div>
                <h3 className="mb-2 text-2xl">{step.title}</h3>
                <p className="text-cyber-text-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured courses */}
      <section className="border-y-[3px] border-cyber-ink bg-cyber-dark-secondary/60 py-[var(--section-padding)]">
        <div className="container-custom">
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="pixel-label mb-3 text-cyber-secondary">Course catalog</p>
              <h2 className="text-display-2">Pick a world</h2>
            </div>
            <Button href="/courses" variant="secondary">
              All courses ▶
            </Button>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[var(--section-padding)]">
        <div className="container-custom">
          <div className="relative flex flex-col items-center gap-8 overflow-hidden border-[3px] border-cyber-ink bg-cyber-accent p-8 shadow-[10px_10px_0_0_var(--color-cyber-ink)] md:flex-row md:p-12">
            <Mascot mood="cheers" width={150} className="shrink-0" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-4 text-cyber-ink" style={{ fontSize: "var(--font-size-display-2)" }}>
                Press start.
              </h2>
              <p className="max-w-xl text-lg text-cyber-ink/85">
                The first chapters of most courses are free. Make an account to save your progress and start earning XP.
              </p>
            </div>
            <Button href="/signup" size="lg" className="shrink-0">
              Create free account
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
