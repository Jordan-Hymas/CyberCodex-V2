import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { missionById, missions } from '@/lib/linux/challenges';
import { accessError, prerequisite } from '@/lib/linux/access';
import { LinuxLab } from './LinuxLab';
import { notFound } from 'next/navigation';
export async function LinuxLesson({ exerciseId }: { exerciseId: string }) {
  const mission = missionById(exerciseId); if (!mission) notFound();
  const session = await auth();
  const user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  const completed = user ? await prisma.linuxLabSession.findMany({ where: { userId: user.id, solvedAt: { not: null } }, select: { exerciseId: true } }) : [];
  const denied = user ? accessError(mission, user, completed.map(c => c.exerciseId)) : 'Sign in to create your own saved Linux environment.';
  const next = missions[missions.findIndex(m => m.id === mission.id) + 1];
  return <main className="container-custom max-w-6xl pt-28 pb-16">
    <Link href="/courses/linux-fundamentals" className="text-cyber-primary underline">← Linux Fundamentals</Link>
    <p className="mt-6 font-ui uppercase text-cyber-text-muted">{mission.level} • {mission.xp} XP • flag mission</p>
    <h1 className="my-4 text-2xl md:text-3xl">{mission.title}</h1>
    {denied ? <section className="space-y-4 border-2 border-cyber-border p-6"><p>{denied}</p>{!user ? <Link className="underline" href={`/login?callbackUrl=${encodeURIComponent(`/courses/linux-fundamentals/${exerciseId}`)}`}>Sign in</Link> : <><Link className="mr-5 underline" href="/pricing">View plans</Link>{prerequisite(mission) && <Link className="underline" href={`/courses/linux-fundamentals/${prerequisite(mission)}`}>Previous mission</Link>}</>}</section> : <>
      <section className="mb-6 space-y-4 border-2 border-cyber-border p-6">
        <h2 className="text-xl">Learn the command</h2><p className="leading-relaxed">{mission.concept}</p>
        <p className="leading-relaxed">{mission.explanation}</p>
        <h2 className="text-xl">Syntax example</h2><pre className="overflow-x-auto bg-cyber-ink p-4 text-sm"><code>{mission.example}</code></pre>
        <p className="text-sm text-cyber-text-muted">Example filenames illustrate syntax; inspect your mission files before running them.</p>
        <h2 className="text-xl">Your mission</h2><p className="leading-relaxed">{mission.brief}</p>
        <p className="text-sm text-cyber-text-muted">Try commands freely. Incorrect commands do not fail the mission. Submit only the flag text; flags from other accounts, exercises, or reset environments do not count.</p>
      </section>
      <details className="mb-5"><summary className="cursor-pointer">Common mistake and understanding check</summary><p className="my-3">{mission.pitfall}</p><p>{mission.transfer}</p></details>
      <LinuxLab userId={user!.id} exerciseId={exerciseId} nextId={next?.id} hints={mission.hints} />
    </>}
  </main>;
}
