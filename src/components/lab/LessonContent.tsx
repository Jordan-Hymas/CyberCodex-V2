import { addFile, blankShell, execute, type Shell } from '@/lib/linux/engine';

/**
 * The teaching half of a Linux mission: headed sections written for someone who has never
 * used a terminal, with small worked examples between the paragraphs. Example commands run
 * through the lab's own engine when the page renders, so the output shown is exactly what
 * the learner's terminal prints. Example files live in a throwaway shell, never the mission.
 */
/** fails: the example shows a mistake on purpose (tests check that it really errors). */
export type DemoStep = { cmd: string; note?: string; fails?: boolean };
export type LessonFile = { path: string; text?: string; mode?: number; owner?: string; dir?: boolean; program?: string };
export type LessonSection = { heading: string; text?: string[]; points?: string[]; demo?: DemoStep[] };
export type Lesson = {
  files?: LessonFile[];
  /** Directory the examples start in */
  cwd?: string;
  sections: LessonSection[];
  commands?: { syntax: string; does: string }[];
  terms?: { term: string; means: string }[];
};
type Ran = DemoStep & { prompt: string; output: string; error: string };

const sectionTitle = { fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 600 } as const;
const shortPath = (p: string) => p === '/home/user' ? '~' : p.startsWith('/home/user/') ? '~' + p.slice(10) : p;

/** Build the example shell and run every section's demo in order (state carries across sections). */
export function runLessonDemos(lesson: Lesson): Ran[][] {
  const shell: Shell = blankShell();
  for (const f of lesson.files ?? []) {
    if (f.dir) { addFile(shell, f.path + '/.keep', ''); delete shell.files[f.path + '/.keep']; shell.files[f.path].mode = f.mode ?? 0o755; }
    else addFile(shell, f.path, f.text ?? '', f.mode);
    if (f.owner === 'root') shell.files[f.path].owner = 'root';
    // Only the harmless demo programs may appear in lessons
    if (f.program?.startsWith('demo-')) shell.files[f.path].program = f.program;
  }
  if (lesson.cwd && shell.files[lesson.cwd]?.kind === 'dir') shell.cwd = lesson.cwd;
  return lesson.sections.map(section => (section.demo ?? []).map(step => {
    const prompt = `user@cybercodex:${shortPath(shell.cwd)}$`;
    const result = execute(shell, step.cmd);
    return { ...step, prompt, output: result.output, error: result.error };
  }));
}

/** Inline formatting: `code` spans become <code>. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/).map((part, i) => part.startsWith('`') && part.endsWith('`') && part.length > 1
    ? <code key={i}>{part.slice(1, -1)}</code> : part)}</>;
}

function DemoTerminal({ steps }: { steps: Ran[] }) {
  return (
    <div className="my-5 border-2 border-cyber-ink bg-cyber-ink shadow-[3px_3px_0_0_var(--color-cyber-ink)]">
      <div className="flex items-center gap-2 border-b border-cyber-border/60 px-4 py-1.5">
        <span className="h-2 w-2 bg-cyber-danger" aria-hidden="true" /><span className="h-2 w-2 bg-cyber-warning" aria-hidden="true" /><span className="h-2 w-2 bg-cyber-primary" aria-hidden="true" />
        <span className="ml-1 font-label text-[0.65rem] uppercase text-cyber-text-muted">Example</span>
      </div>
      <pre className="!m-0 overflow-x-auto whitespace-pre-wrap break-words !bg-transparent px-4 py-3 text-[0.9rem] leading-relaxed">{steps.map((s, i) => (
        <span key={i} className={`block ${i ? 'mt-3' : ''}`}>
          <span className="text-cyber-primary">{s.prompt}</span> <span className="font-semibold text-cyber-text-primary">{s.cmd}</span>
          {s.output && <span className="block text-cyber-text-secondary">{s.output.replace(/\n$/, '')}</span>}
          {s.error && <span className="block text-cyber-danger">{s.error.replace(/\n$/, '')}</span>}
          {s.note && <span className="mt-1 block font-sans text-[0.92rem] text-cyber-accent"># {s.note}</span>}
        </span>
      ))}</pre>
    </div>
  );
}

export function LessonContent({ lesson }: { lesson: Lesson }) {
  const demos = runLessonDemos(lesson);
  const anchor = (i: number) => `lesson-${i + 1}`;
  return <div className="lesson-prose">
    {/* Table of contents: the lesson at a glance, each part one click away */}
    <nav aria-label="In this lesson" className="border-2 border-cyber-ink bg-cyber-dark-secondary px-5 py-4">
      <p className="mb-2 font-ui text-base font-semibold text-cyber-primary">In this lesson</p>
      <ol className="space-y-1 text-[0.95rem]">{lesson.sections.map((section, i) => (
        <li key={section.heading} className="flex gap-2.5">
          <span className="w-5 shrink-0 text-right font-ui text-cyber-text-muted">{i + 1}.</span>
          <a href={`#${anchor(i)}`} className="text-cyber-text-primary underline decoration-cyber-border underline-offset-4 hover:text-cyber-primary hover:decoration-cyber-primary">{section.heading}</a>
        </li>
      ))}</ol>
      <p className="mt-3 text-xs leading-normal text-cyber-text-muted">Examples use their own practice files, not your mission&apos;s. Their output is exactly what the lab prints.</p>
    </nav>

    {lesson.sections.map((section, i) => (
      <section key={section.heading} id={anchor(i)} className="scroll-mt-4 pt-9">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-cyber-ink bg-cyber-primary font-ui text-sm font-bold text-cyber-ink shadow-[2px_2px_0_0_var(--color-cyber-ink)]">{i + 1}</span>
          <h3 className="text-cyber-text-primary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.25 }}>{section.heading}</h3>
        </div>
        {section.text?.map(p => <p key={p}><Rich text={p} /></p>)}
        {section.points && <ul className={`space-y-2.5 ${section.text?.length ? 'mt-4' : ''}`}>{section.points.map(p => (
          <li key={p} className="flex max-w-[80ch] gap-3"><span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 bg-cyber-accent" aria-hidden="true" /><span><Rich text={p} /></span></li>
        ))}</ul>}
        {demos[i].length > 0 && <DemoTerminal steps={demos[i]} />}
      </section>
    ))}

    {lesson.commands && lesson.commands.length > 0 && <section className="pt-10">
      <h2 className="mb-3 text-cyber-primary" style={sectionTitle}>Command cheat sheet</h2>
      <dl className="divide-y divide-cyber-border/60 border-2 border-cyber-ink bg-cyber-dark-secondary">{lesson.commands.map(c => (
        <div key={c.syntax} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-5">
          <dt className="font-mono text-[0.92rem] text-cyber-primary">{c.syntax}</dt>
          <dd className="text-[0.98rem]"><Rich text={c.does} /></dd>
        </div>
      ))}</dl>
    </section>}

    {lesson.terms && lesson.terms.length > 0 && <section className="pt-10">
      <h2 className="mb-3 text-cyber-primary" style={sectionTitle}>New words</h2>
      <dl className="grid gap-3 sm:grid-cols-2">{lesson.terms.map(t => (
        <div key={t.term} className="border-l-4 border-cyber-secondary bg-cyber-dark-secondary px-4 py-3">
          <dt className="font-ui font-semibold text-cyber-text-primary">{t.term}</dt>
          <dd className="mt-1 text-[0.95rem] leading-relaxed"><Rich text={t.means} /></dd>
        </div>
      ))}</dl>
    </section>}
  </div>;
}
