import Link from 'next/link';
import { orientation, chapterBriefings } from '@/lib/linux/chapters';
import { missions } from '@/lib/linux/challenges';
import { Button } from '@/components/ui';
import { Mascot } from '@/components/brand';

const COURSE = '/courses/linux-fundamentals';
const tierColor = (n: number) => (n <= 3 ? 'bg-cyber-primary' : n <= 6 ? 'bg-cyber-warning' : 'bg-cyber-danger');

/** Course orientation: what you'll learn, how missions and flags work, then a start button. */
export function LinuxOrientation() {
  const first = missions[0];
  return (
    <main className="min-h-screen pb-24 pt-28 md:pt-32">
      <div className="container-custom max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-6 font-ui text-sm text-cyber-text-muted">
          <Link href={COURSE} className="hover:text-cyber-primary">Linux Fundamentals</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-cyber-text-secondary" aria-current="page">Orientation</span>
        </nav>

        <header className="mb-12 flex flex-col items-start gap-6 md:flex-row md:items-end">
          <div className="border-[3px] border-cyber-ink bg-cyber-secondary p-3 shadow-[6px_6px_0_0_var(--color-cyber-ink)]">
            <Mascot mood="hi" width={120} priority />
          </div>
          <div>
            <p className="pixel-label mb-3 inline-block border-2 border-cyber-ink bg-cyber-warning px-2 py-1 text-cyber-ink">Start here</p>
            <h1 className="text-display-2 mb-4">{orientation.title}</h1>
            <p className="max-w-3xl text-lg leading-relaxed text-cyber-text-secondary">{orientation.intro}</p>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="text-display-2 mb-6 !text-[clamp(1.1rem,1.8vw,1.5rem)]">How a mission works</h2>
          <ol className="grid gap-6 md:grid-cols-2">
            {orientation.steps.map((step, i) => (
              <li key={step.title} className="pixel-panel flex gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-cyber-ink bg-cyber-pink font-pixel text-sm text-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)]">{i + 1}</span>
                <div>
                  <h3 className="mb-1 text-cyber-text-primary">{step.title}</h3>
                  <p className="text-cyber-text-secondary">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="pixel-panel p-5">
            <h2 className="mb-3 text-cyber-accent" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.2rem', fontWeight: 600 }}>Why capture flags?</h2>
            <ul className="space-y-2 text-cyber-text-secondary">{orientation.why.map(w => <li key={w}>▸ {w}</li>)}</ul>
          </div>
          <div className="pixel-panel p-5">
            <h2 className="mb-3 text-cyber-secondary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.2rem', fontWeight: 600 }}>Terminal tips</h2>
            <ul className="space-y-2 text-cyber-text-secondary">{orientation.tips.map(t => <li key={t}>▸ {t}</li>)}</ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-display-2 mb-3 !text-[clamp(1.1rem,1.8vw,1.5rem)]">What you&apos;ll learn</h2>
          <p className="mb-6 max-w-3xl text-cyber-text-secondary">{orientation.structure}</p>
          <ol className="space-y-3">
            {chapterBriefings.map(chapter => (
              <li key={chapter.number} className="flex gap-4 border-2 border-cyber-ink bg-cyber-dark-secondary p-4">
                <span className={`grid h-9 w-9 shrink-0 place-items-center border-2 border-cyber-ink font-pixel text-xs text-cyber-ink ${tierColor(chapter.number)}`}>{chapter.number}</span>
                <div>
                  <h3 className="text-cyber-text-primary">{chapter.title}</h3>
                  <p className="text-sm text-cyber-text-secondary">{chapter.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col items-start gap-6 border-[3px] border-cyber-ink bg-cyber-primary p-6 text-cyber-ink shadow-[8px_8px_0_0_var(--color-cyber-ink)] sm:flex-row sm:items-center">
          <Mascot mood="hacker" width={90} />
          <div className="flex-1">
            <p className="pixel-label">Mission 1</p>
            <p className="text-xl" style={{ fontFamily: 'var(--font-ui)', fontWeight: 600 }}>{first.title}</p>
          </div>
          <Button href={`${COURSE}/${first.id}`} variant="secondary" size="lg">Start mission 1 ▶</Button>
        </div>
      </div>
    </main>
  );
}
