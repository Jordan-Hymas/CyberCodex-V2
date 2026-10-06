'use client';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button, ProgressBar, WindowBar } from '@/components/ui';
import { Mascot } from '@/components/brand';
import { PixelConfetti } from '@/components/fx/PixelConfetti';
import { MissionWorkspace } from './MissionWorkspace';
const LinuxTerminal = dynamic(() => import('./LinuxTerminal').then(m => m.LinuxTerminal), { ssr: false, loading: () => <p className="p-4 font-ui text-cyber-text-muted">Booting terminal…</p> });

type Snapshot = {
  version: number; cwd: string; completed: boolean; attempts: number; output?: string; error?: string; clear?: boolean; message?: string; tip?: string;
  awarded?: number; commands?: string[]; entries?: { name: string; dir: boolean }[]; file?: { path: string; text: string; isNew: boolean };
  progress?: { totalXp: number; level: number; levelXp: number };
  intro?: MissionIntro;
};
type MissionIntro = { number: number; total: number; title: string; goal: string; cwd: string; entries: string[]; notice?: string };

const ansi = { reset: '\x1b[0m', bold: '\x1b[1m', violet: '\x1b[35m', cyan: '\x1b[36m', yellow: '\x1b[33m', muted: '\x1b[90m' };

/** Terminal welcome: what this mission is, where you start and what's there. */
function welcomeText(intro?: MissionIntro) {
  if (!intro) return '';
  const home = '/home/user';
  const where = intro.cwd === home ? `~ (${home})` : intro.cwd.startsWith(home + '/') ? `~${intro.cwd.slice(home.length)}` : intro.cwd;
  const shown = intro.entries.slice(0, 8).join('  ') + (intro.entries.length > 8 ? `  …and ${intro.entries.length - 8} more` : '');
  const lines = [
    `${ansi.bold}${ansi.violet}Mission ${intro.number}/${intro.total} · ${intro.title}${ansi.reset}`,
    `Goal: ${intro.goal}`,
    `${ansi.cyan}You start in ${where}.${ansi.reset} ${intro.entries.length ? `Here: ${shown}` : 'Nothing visible here yet.'}`,
  ];
  if (intro.notice) lines.push(`${ansi.yellow}${intro.notice}${ansi.reset}`);
  if (intro.number === 1) lines.push(`${ansi.muted}Type help for commands · Tab completes names · highlight text to copy it${ansi.reset}`);
  return lines.join('\n') + '\n';
}

interface LinuxLabProps {
  exerciseId: string;
  userId: string;
  nextId?: string;
  hints: string[];
  header: ReactNode;
  /** Server-rendered mission briefing for the left column */
  briefing: ReactNode;
}

export function LinuxLab({ exerciseId, userId, ...rest }: LinuxLabProps) {
  const { data: session, status } = useSession();
  // Remember the last settled account so a session refresh (e.g. after earning XP,
  // which briefly reports 'loading') doesn't unmount the lab mid-celebration.
  const settled = useRef<string | null | undefined>(undefined);
  if (status !== 'loading') settled.current = session?.user?.id ?? null;
  // Switching accounts unmounts the old console and drops pending requests/state.
  const notice = settled.current === undefined ? <p className="p-6 font-ui text-cyber-text-muted">Checking your account…</p>
    : settled.current !== userId ? <p className="p-6">Your account changed. <a href={`/courses/linux-fundamentals/${exerciseId}`} className="underline">Reopen this mission</a> to load the correct environment.</p>
    : null;
  if (notice) return <MissionWorkspace header={rest.header} left={rest.briefing} right={notice} />;
  return <PersonalLab key={`${userId}:${exerciseId}`} exerciseId={exerciseId} {...rest} />;
}

function PersonalLab({ exerciseId, nextId, hints, header, briefing }: Omit<LinuxLabProps, 'userId'>) {
  const { update: refreshSession } = useSession();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [flag, setFlag] = useState(''), [message, setMessage] = useState(''), [generation, setGeneration] = useState(0), [stale, setStale] = useState(false);
  const [hintsShown, setHintsShown] = useState(0), [confirmReset, setConfirmReset] = useState(false);
  const [celebration, setCelebration] = useState<{ awarded: number; progress?: Snapshot['progress']; key: number } | null>(null);
  const current = useRef<Snapshot | null>(null), inFlight = useRef(false), live = useRef(true), controller = useRef<AbortController | null>(null);
  const commandNames = useRef<string[]>([]);
  const intro = useRef<MissionIntro | undefined>(undefined);

  // quiet: read-only terminal helpers (tab completion, opening files) skip the busy/status UI
  const request = useCallback(async (action: string, extra: Record<string, unknown> = {}, quiet = false) => {
    if (inFlight.current) throw Error('Wait for the current action to finish.');
    inFlight.current = true; if (!quiet) { setBusy(true); setError(''); }
    const abort = new AbortController(); controller.current = abort;
    try {
      const response = await fetch(`/api/linux/${encodeURIComponent(exerciseId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, version: current.current?.version, ...extra }), signal: abort.signal });
      const data = await response.json();
      if (!live.current) throw Error('Mission closed.');
      if (!response.ok) { if (response.status === 409) setStale(true); throw Error(data.error ?? 'Request failed.'); }
      if (data.commands) commandNames.current = data.commands;
      if (data.intro) intro.current = data.intro;
      current.current = data; if (!quiet) setSnapshot(data); setStale(false);
      if (data.message) setMessage(data.message);
      return data as Snapshot;
    } catch (err) { if (live.current && !abort.signal.aborted && !quiet) setError((err as Error).message); throw err; }
    finally { inFlight.current = false; if (live.current && !quiet) setBusy(false); }
  }, [exerciseId]);

  useEffect(() => {
    live.current = true;
    const timer = setTimeout(() => { void request('open').catch(() => {}); }, 0);
    return () => { clearTimeout(timer); live.current = false; controller.current?.abort(); };
  }, [request]);

  const run = async (command: string) => {
    if (stale) throw Error('Reopen the environment using the button below.');
    return request('command', { command });
  };
  const listDir = async (path: string) => (await request('complete', { path }, true).catch(() => null))?.entries ?? [];
  const readFile = async (path: string) => {
    const data = await request('read', { path }, true);
    return data.file ? { content: data.file.text, isNew: data.file.isNew } : { error: data.error?.trim() || 'cannot open file' };
  };
  const writeFile = async (path: string, content: string) => {
    if (stale) return 'reopen the environment using the button below';
    try { await request('save', { path, content }); return null; } catch (err) { return (err as Error).message; }
  };

  const submitFlag = async () => {
    try {
      const data = await request('submit', { flag: flag.trim() });
      if (data.completed && data.message?.startsWith('Flag')) {
        setCelebration({ awarded: data.awarded ?? 0, progress: data.progress, key: Date.now() });
        setFlag('');
        // Update the level badge: refresh the client session and the server-rendered nav
        if (data.awarded) void refreshSession().then(() => router.refresh());
      }
    } catch { /* error shown via state */ }
  };

  const reset = () => void request('reset').then(() => { setGeneration(g => g + 1); setFlag(''); setConfirmReset(false); setCelebration(null); }).catch(() => {});
  const nextHref = nextId ? `/courses/linux-fundamentals/${nextId}` : '/courses/linux-fundamentals';

  const left = <>
    {briefing}

    {hints.length > 0 && <section className="mt-6 space-y-3">
      {hints.slice(0, hintsShown).map((hint, i) => (
        <p key={hint} className="border-2 border-cyber-ink border-l-[6px] border-l-cyber-warning bg-cyber-dark-secondary p-3">
          <span className="pixel-label mb-1 block text-cyber-warning">Hint {i + 1}</span>{hint}
        </p>
      ))}
      {hintsShown < hints.length && <Button variant="secondary" size="sm" onClick={() => setHintsShown(n => n + 1)}>💡 {hintsShown ? 'Another hint' : 'Need a hint?'} ({hintsShown}/{hints.length})</Button>}
    </section>}

    <section className="mt-8 border-t-2 border-dashed border-cyber-border pt-6">
      <h2 className="mb-2 text-cyber-text-primary" style={{ fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 600 }}>Reset this mission</h2>
      <p className="mb-4 text-sm text-cyber-text-secondary">Wipes this mission&apos;s files and command history and generates a new flag. Completion you&apos;ve already earned stays saved.</p>
      {confirmReset ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-ui text-cyber-danger">Reset everything?</span>
          <Button variant="danger" size="sm" disabled={busy || !snapshot} onClick={reset}>Yes, reset</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="danger" size="sm" disabled={busy || !snapshot || stale} onClick={() => setConfirmReset(true)}>↺ Reset mission</Button>
      )}
    </section>
  </>;

  const right = <>
    <div className="relative flex min-h-0 flex-1 flex-col bg-cyber-ink">
      <WindowBar title="user@cybercodex: personal mission" right={snapshot?.completed ? '✓ captured' : undefined} />
      <div className="min-h-0 flex-1">
        {snapshot ? <LinuxTerminal key={generation} cwd={snapshot.cwd} commands={commandNames.current} run={run} listDir={listDir} readFile={readFile} writeFile={writeFile} welcome={welcomeText(intro.current)} />
          : <p className="p-4 font-ui text-cyber-text-muted">{error ? '' : 'Opening your environment…'}</p>}
      </div>

      {celebration && <div className="absolute inset-0 z-20 flex items-center justify-center bg-cyber-ink/85 p-6 animate-fade-in">
        <PixelConfetti key={celebration.key} />
        <div className="relative w-full max-w-md border-[3px] border-cyber-ink bg-cyber-primary p-6 text-center text-cyber-ink shadow-[10px_10px_0_0_#000]">
          <Mascot mood="cheers" width={110} className="mx-auto -mt-16 mb-2" />
          <p className="pixel-label mb-1">Flag captured</p>
          <p className="mb-4 font-pixel text-2xl [text-shadow:3px_3px_0_rgba(0,0,0,0.25)]">{celebration.awarded ? `+${celebration.awarded} XP` : 'Already solved'}</p>
          {celebration.progress && <XpGain progress={celebration.progress} awarded={celebration.awarded} />}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button href={nextHref} variant="secondary">{nextId ? 'Next mission ▶' : 'Back to the course ▶'}</Button>
            <Button variant="ghost" className="!text-cyber-ink hover:!bg-black/10" onClick={() => setCelebration(null)}>Keep exploring</Button>
          </div>
        </div>
      </div>}
    </div>

    <div className="shrink-0 space-y-3 border-t-[3px] border-cyber-ink bg-cyber-dark-secondary p-4">
      <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void submitFlag(); }}>
        <label className="min-w-48 flex-1">
          <span className="pixel-label mb-1 block text-cyber-text-secondary">Captured flag</span>
          <input aria-label="Captured flag" className="pixel-input w-full px-3 py-2.5 font-mono" placeholder="CYBER{...}  (highlight it in the terminal to copy)" value={flag} maxLength={160} onChange={e => setFlag(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <Button type="submit" disabled={busy || !snapshot || stale || !flag.trim()}>Check flag</Button>
      </form>
      {error && <p role="alert" className="font-ui text-cyber-danger">{error}</p>}
      {(!snapshot || stale) && <Button variant="secondary" size="sm" disabled={busy} onClick={() => void request('open').then(() => setGeneration(g => g + 1)).catch(() => {})}>Reopen environment</Button>}
      <p aria-live="polite" className="text-sm text-cyber-text-secondary">
        {busy ? 'Saving…' : message || (snapshot?.completed ? 'Mission completed. You can keep practicing or move on.' : 'Find the flag in your terminal, then paste it here.')}
      </p>
      {snapshot?.completed && !celebration && <Button href={nextHref} size="sm">{nextId ? 'Next mission ▶' : 'Back to the course ▶'}</Button>}
    </div>
  </>;

  return <MissionWorkspace header={header} left={left} right={right} />;
}

/** XP bar that fills from the previous total to the new one, with a level-up flourish. */
function XpGain({ progress, awarded }: { progress: NonNullable<Snapshot['progress']>; awarded: number }) {
  const levelledUp = awarded > 0 && progress.levelXp - awarded < 0;
  const [value, setValue] = useState(levelledUp ? 0 : Math.max(0, progress.levelXp - awarded));
  useEffect(() => { const t = setTimeout(() => setValue(progress.levelXp), 350); return () => clearTimeout(t); }, [progress.levelXp]);
  return <div className="mb-5 border-2 border-cyber-ink bg-cyber-ink p-3 text-left text-cyber-text-primary">
    {levelledUp && <p className="mb-2 inline-block border-2 border-cyber-ink bg-cyber-warning px-2 py-0.5 font-label text-xs text-cyber-ink animate-blink">Level up!</p>}
    <ProgressBar label={`Level ${progress.level}`} value={value} variant="warning" />
    <p className="mt-2 text-xs text-cyber-text-muted">{100 - progress.levelXp} XP to level {progress.level + 1} · {progress.totalXp} XP total</p>
  </div>;
}
