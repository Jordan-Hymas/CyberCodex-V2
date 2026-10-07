import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { missionById, missionsForCourse, courseOf, type Mission } from '@/lib/linux/challenges';
import { accessError, prerequisite } from '@/lib/linux/access';
import { chapterForMission } from '@/lib/linux/chapters';
import { Badge, Button } from '@/components/ui';
import { MascotSays } from '@/components/brand';
import { LinuxLab } from './LinuxLab';
import { MissionWorkspace } from './MissionWorkspace';
import { LessonContent, type Lesson } from './LessonContent';
import { notFound } from 'next/navigation';

const levelVariant = { beginner: 'green', intermediate: 'yellow', advanced: 'red', operator: 'pink' } as const;
const courseTitle: Record<string, string> = { 'linux-fundamentals': 'Linux Fundamentals', 'linux-intermediate': 'Intermediate Linux', 'linux-advanced': 'Advanced Linux' };

function MissionHeader({ mission }: { mission: Mission }) {
  const chapter = chapterForMission(mission.id);
  const course = courseOf(mission);
  const base = `/courses/${course}`;
  const siblings = missionsForCourse(course);
  const index = siblings.findIndex(m => m.id === mission.id);
  const prev = siblings[index - 1], next = siblings[index + 1];
  return (
    <div className="shrink-0 border-b-[3px] border-cyber-ink bg-cyber-dark-secondary">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="mb-0.5 truncate font-ui text-xs text-cyber-text-muted">
            <Link href={base} className="hover:text-cyber-primary">{courseTitle[course] ?? 'Linux'}</Link>
            {chapter && <><span className="mx-1.5" aria-hidden="true">/</span>Chapter {chapter.number}: {chapter.title}</>}
          </nav>
          <h1 className="truncate text-cyber-text-primary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.3rem', fontWeight: 600 }}>{mission.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={levelVariant[mission.level as keyof typeof levelVariant] ?? 'default'}>{mission.level}</Badge>
          <span className="border-2 border-cyber-ink bg-cyber-warning px-2 py-0.5 font-ui text-sm text-cyber-ink shadow-[2px_2px_0_0_var(--color-cyber-ink)]">+{mission.xp} XP</span>
          <span className="font-ui text-sm text-cyber-text-muted">Mission {index + 1}/{siblings.length}</span>
        </div>
        <div className="flex gap-2">
          {prev && <Button href={`${base}/${prev.id}`} variant="secondary" size="sm" aria-label="Previous mission">◀ Prev</Button>}
          <Button href={next ? `${base}/${next.id}` : base} variant="secondary" size="sm">{next ? 'Next ▶' : 'Course ▶'}</Button>
        </div>
      </div>
    </div>
  );
}

const tierGuide = {
  beginner: { label: 'Guided', text: 'The steps tell you exactly what to type.' },
  intermediate: { label: 'Watch for decoys', text: 'The steps point the way. Fake flags may be planted nearby, so read every result carefully.' },
  advanced: { label: 'Goal only', text: 'Plan your own commands. Expect traps that only good technique avoids.' },
  operator: { label: 'Root-owned flag', text: 'The flag belongs to root. A mission program hands it over only when you use the technique being taught.' },
} as const;

const sectionTitle = { fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 600 } as const;

/**
 * Left-column briefing, written to be read top to bottom by a complete beginner:
 * the goal, the full lesson (nothing collapsed), then the task steps and things to watch for.
 */
function MissionBriefing({ mission }: { mission: Mission }) {
  const chapter = chapterForMission(mission.id);
  const course = courseOf(mission);
  const siblings = missionsForCourse(course);
  const index = siblings.findIndex(m => m.id === mission.id);
  const isChapterStart = chapter?.missionIds[0] === mission.id;
  const showSteps = !(mission.steps.length === 1 && mission.steps[0] === mission.brief);
  const tier = tierGuide[mission.level as keyof typeof tierGuide] ?? tierGuide.beginner;
  const start = mission.start === '/home/user' ? '~' : mission.start.replace('/home/user', '~');
  const lesson = (mission as { lesson?: Lesson }).lesson;
  return <div className="space-y-6">
    {index === 0 && course === 'linux-fundamentals' && (
      <Link href={`/courses/${course}/orientation`} className="card card-interactive flex-row items-center gap-3 !border-cyber-secondary !p-4">
        <span className="pixel-label text-cyber-secondary">New here?</span>
        <span className="flex-1 text-cyber-text-primary">Read the course orientation first: how missions, flags and XP work.</span>
        <span aria-hidden="true">▶</span>
      </Link>
    )}

    {isChapterStart && chapter && (
      <section className="border-2 border-cyber-ink bg-cyber-dark-tertiary p-4">
        <span className="pixel-label text-cyber-pink">Chapter {chapter.number} briefing</span>
        <p className="mb-3 mt-2 text-cyber-text-primary">{chapter.summary}</p>
        <p className="mb-1 font-ui text-sm text-cyber-text-primary">By the end of this chapter you will be able to:</p>
        <ul className="space-y-1 text-sm text-cyber-text-secondary">{chapter.skills.map(skill => <li key={skill}>▸ {skill}</li>)}</ul>
      </section>
    )}

    <section className="border-l-[6px] border-cyber-warning bg-cyber-dark-secondary px-4 py-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="pixel-label text-cyber-warning">Goal</span>
        <span className="ml-auto border border-cyber-border px-1.5 py-0.5 font-label text-[0.65rem] uppercase text-cyber-text-muted">{tier.label}</span>
      </div>
      <p className="leading-relaxed text-cyber-text-primary">{mission.brief}</p>
      <p className="mt-2 text-xs text-cyber-text-muted">Read the lesson below first. The step-by-step task is at the bottom.</p>
    </section>

    {lesson ? <LessonContent lesson={lesson} /> : <>
      <section>
        <h2 className="mb-2 text-cyber-primary" style={sectionTitle}>Learn</h2>
        <p className="mb-3 leading-relaxed text-cyber-text-secondary">{mission.concept}</p>
        <p className="leading-relaxed text-cyber-text-secondary">{mission.explanation}</p>
      </section>
      <section>
        <h2 className="mb-2 text-cyber-primary" style={sectionTitle}>Example</h2>
        <pre className="!m-0 border-2 border-cyber-ink bg-cyber-ink p-4 text-sm text-cyber-text-primary"><code>{mission.example}</code></pre>
      </section>
    </>}

    {mission.why && <p className="border-l-[6px] border-cyber-accent bg-cyber-dark-secondary px-4 py-3 text-sm text-cyber-text-secondary">
      <span className="pixel-label mr-2 text-cyber-accent">Why it matters</span>{mission.why}
    </p>}

    {/* The task, once the learner has the knowledge to do it */}
    <section className="pixel-panel !border-cyber-warning p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="pixel-label text-cyber-warning">Your mission</span>
      </div>
      <p className="mb-4 text-lg leading-relaxed text-cyber-text-primary">{mission.brief}</p>
      {showSteps && <ol className="mb-4 space-y-2">{mission.steps.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center border-2 border-cyber-ink bg-cyber-warning font-ui text-xs text-cyber-ink">{i + 1}</span>
          <span className="text-cyber-text-secondary">{step}</span>
        </li>
      ))}</ol>}
      <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-cyber-border pt-3 text-sm">
        <span className="text-cyber-text-muted">Starts in</span>
        <code>{start}</code>
        {mission.commands.length > 0 && <>
          <span className="ml-2 text-cyber-text-muted">Tools</span>
          {mission.commands.map(c => <code key={c}>{c}</code>)}
        </>}
      </div>
      <p className="mt-3 text-xs text-cyber-text-muted">{tier.text} Wrong commands never fail a mission, so experiment freely.</p>
    </section>

    <section className="space-y-3 border-2 border-cyber-ink bg-cyber-dark-secondary p-4">
      <p className="text-cyber-text-secondary"><strong className="text-cyber-danger">Watch out:</strong> {mission.pitfall}</p>
      <p className="text-cyber-text-secondary"><strong className="text-cyber-secondary">Think about it:</strong> {mission.transfer}</p>
    </section>
  </div>;
}

export async function LinuxLesson({ exerciseId }: { exerciseId: string }) {
  const mission = missionById(exerciseId); if (!mission) notFound();
  const base = `/courses/${courseOf(mission)}`;
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  const completed = user ? await prisma.linuxLabSession.findMany({ where: { userId: user.id, solvedAt: { not: null } }, select: { exerciseId: true } }) : [];
  const denied = user ? accessError(mission, user, completed.map(c => c.exerciseId)) : 'Sign in to create your own saved Linux environment.';
  const header = <MissionHeader mission={mission} />;
  const briefing = <MissionBriefing mission={mission} />;

  if (denied) {
    const previous = prerequisite(mission);
    return <MissionWorkspace header={header} left={briefing} right={
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-cyber-ink p-8 text-center">
        <MascotSays mood={user ? 'looking' : 'hi'}>{denied}</MascotSays>
        <div className="flex flex-wrap justify-center gap-3">
          {!user && <Button href={`/login?callbackUrl=${encodeURIComponent(`${base}/${exerciseId}`)}`}>Sign in</Button>}
          {!user && <Button href="/signup" variant="secondary">Create free account</Button>}
          {user && previous && <Button href={`${base}/${previous}`}>Go to previous mission</Button>}
          {user && <Button href="/pricing" variant="secondary">View plans</Button>}
        </div>
      </div>
    } />;
  }

  const siblings = missionsForCourse(courseOf(mission));
  const next = siblings[siblings.findIndex(m => m.id === mission.id) + 1];
  return <LinuxLab userId={user!.id} exerciseId={exerciseId} courseSlug={courseOf(mission)} nextId={next?.id} hints={mission.hints} header={header} briefing={briefing} />;
}
