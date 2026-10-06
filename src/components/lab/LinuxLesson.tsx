import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { missionById, missions, type Mission } from '@/lib/linux/challenges';
import { accessError, prerequisite } from '@/lib/linux/access';
import { chapterForMission } from '@/lib/linux/chapters';
import { Badge, Button } from '@/components/ui';
import { MascotSays } from '@/components/brand';
import { LinuxLab } from './LinuxLab';
import { MissionWorkspace } from './MissionWorkspace';
import { notFound } from 'next/navigation';

const levelVariant = { beginner: 'green', intermediate: 'yellow', advanced: 'red' } as const;
const COURSE = '/courses/linux-fundamentals';

function MissionHeader({ mission, index }: { mission: Mission; index: number }) {
  const chapter = chapterForMission(mission.id);
  const prev = missions[index - 1], next = missions[index + 1];
  return (
    <div className="shrink-0 border-b-[3px] border-cyber-ink bg-cyber-dark-secondary">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="mb-0.5 truncate font-ui text-xs text-cyber-text-muted">
            <Link href={COURSE} className="hover:text-cyber-primary">Linux Fundamentals</Link>
            {chapter && <><span className="mx-1.5" aria-hidden="true">/</span>Chapter {chapter.number}: {chapter.title}</>}
          </nav>
          <h1 className="truncate text-cyber-text-primary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.3rem', fontWeight: 600 }}>{mission.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={levelVariant[mission.level as keyof typeof levelVariant] ?? 'default'}>{mission.level}</Badge>
          <span className="border-2 border-cyber-ink bg-cyber-warning px-2 py-0.5 font-ui text-sm text-cyber-ink shadow-[2px_2px_0_0_var(--color-cyber-ink)]">+{mission.xp} XP</span>
          <span className="font-ui text-sm text-cyber-text-muted">Mission {index + 1}/{missions.length}</span>
        </div>
        <div className="flex gap-2">
          {prev && <Button href={`${COURSE}/${prev.id}`} variant="secondary" size="sm" aria-label="Previous mission">◀ Prev</Button>}
          <Button href={next ? `${COURSE}/${next.id}` : COURSE} variant="secondary" size="sm">{next ? 'Next ▶' : 'Course ▶'}</Button>
        </div>
      </div>
    </div>
  );
}

/** Left-column briefing: task first, then the lesson. */
function MissionBriefing({ mission, index }: { mission: Mission; index: number }) {
  const chapter = chapterForMission(mission.id);
  const isChapterStart = chapter?.missionIds[0] === mission.id;
  const showSteps = !(mission.steps.length === 1 && mission.steps[0] === mission.brief);
  return <div className="space-y-6">
    {index === 0 && (
      <Link href={`${COURSE}/orientation`} className="card card-interactive flex-row items-center gap-3 !border-cyber-secondary !p-4">
        <span className="pixel-label text-cyber-secondary">New here?</span>
        <span className="flex-1 text-cyber-text-primary">Read the course orientation first: how missions, flags and XP work.</span>
        <span aria-hidden="true">▶</span>
      </Link>
    )}

    {isChapterStart && chapter && (
      <section className="border-2 border-cyber-ink bg-cyber-dark-tertiary p-4">
        <p className="pixel-label mb-1 text-cyber-pink">Chapter {chapter.number} briefing</p>
        <p className="mb-3 text-cyber-text-primary">{chapter.summary}</p>
        <p className="pixel-label mb-1 text-cyber-text-muted">By the end you&apos;ll be able to</p>
        <ul className="space-y-1 text-sm text-cyber-text-secondary">{chapter.skills.map(skill => <li key={skill}>▸ {skill}</li>)}</ul>
      </section>
    )}

    <section className="pixel-panel !border-cyber-warning p-5">
      <p className="pixel-label mb-2 text-cyber-warning">Your mission</p>
      <p className="mb-3 text-lg leading-relaxed text-cyber-text-primary">{mission.brief}</p>
      {showSteps && <ol className="space-y-2">{mission.steps.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center border-2 border-cyber-ink bg-cyber-warning font-ui text-xs text-cyber-ink">{i + 1}</span>
          <span className="text-cyber-text-secondary">{step}</span>
        </li>
      ))}</ol>}
      <p className="mt-4 text-sm text-cyber-text-muted">Starting folder: <code>{mission.start === '/home/user' ? '~ (your home)' : mission.start.replace('/home/user', '~')}</code>. Wrong commands never fail a mission, so experiment.</p>
    </section>

    <section>
      <h2 className="mb-2 text-cyber-primary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.15rem', fontWeight: 600 }}>Learn</h2>
      <p className="mb-3 leading-relaxed text-cyber-text-secondary">{mission.concept}</p>
      <p className="leading-relaxed text-cyber-text-secondary">{mission.explanation}</p>
    </section>

    {mission.why && <section className="border-l-[6px] border-cyber-accent bg-cyber-dark-secondary px-4 py-3">
      <p className="pixel-label mb-1 text-cyber-accent">Why it matters</p>
      <p className="text-cyber-text-secondary">{mission.why}</p>
    </section>}

    <section>
      <h2 className="mb-2 text-cyber-primary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.15rem', fontWeight: 600 }}>Example</h2>
      <pre className="!m-0 border-2 border-cyber-ink bg-cyber-ink p-4 text-sm text-cyber-text-primary"><code>{mission.example}</code></pre>
      <p className="mt-2 text-xs text-cyber-text-muted">Shows the syntax only. These example files aren&apos;t in your mission, so use the names from your task.</p>
    </section>

    <details className="border-2 border-cyber-ink bg-cyber-dark-secondary p-4">
      <summary className="cursor-pointer font-ui text-cyber-text-primary">Common mistake &amp; check your understanding</summary>
      <p className="mt-3 text-cyber-text-secondary"><strong className="text-cyber-danger">Watch out:</strong> {mission.pitfall}</p>
      <p className="mt-2 text-cyber-text-secondary"><strong className="text-cyber-secondary">Think about it:</strong> {mission.transfer}</p>
    </details>
  </div>;
}

export async function LinuxLesson({ exerciseId }: { exerciseId: string }) {
  const mission = missionById(exerciseId); if (!mission) notFound();
  const index = missions.findIndex(m => m.id === mission.id);
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  const completed = user ? await prisma.linuxLabSession.findMany({ where: { userId: user.id, solvedAt: { not: null } }, select: { exerciseId: true } }) : [];
  const denied = user ? accessError(mission, user, completed.map(c => c.exerciseId)) : 'Sign in to create your own saved Linux environment.';
  const header = <MissionHeader mission={mission} index={index} />;
  const briefing = <MissionBriefing mission={mission} index={index} />;

  if (denied) {
    const previous = prerequisite(mission);
    return <MissionWorkspace header={header} left={briefing} right={
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-cyber-ink p-8 text-center">
        <MascotSays mood={user ? 'looking' : 'hi'}>{denied}</MascotSays>
        <div className="flex flex-wrap justify-center gap-3">
          {!user && <Button href={`/login?callbackUrl=${encodeURIComponent(`${COURSE}/${exerciseId}`)}`}>Sign in</Button>}
          {!user && <Button href="/signup" variant="secondary">Create free account</Button>}
          {user && previous && <Button href={`${COURSE}/${previous}`}>Go to previous mission</Button>}
          {user && <Button href="/pricing" variant="secondary">View plans</Button>}
        </div>
      </div>
    } />;
  }

  return <LinuxLab userId={user!.id} exerciseId={exerciseId} nextId={missions[index + 1]?.id} hints={mission.hints} header={header} briefing={briefing} />;
}
