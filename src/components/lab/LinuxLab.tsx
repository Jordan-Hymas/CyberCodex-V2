'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const LinuxTerminal = dynamic(() => import('./LinuxTerminal').then(m => m.LinuxTerminal), { ssr: false, loading: () => <p>Loading terminal…</p> });
type Snapshot = { version: number; cwd: string; completed: boolean; attempts: number; output?: string; error?: string; clear?: boolean; message?: string; commands?: string[]; entries?: { name: string; dir: boolean }[]; file?: { path: string; text: string; isNew: boolean } };
export function LinuxLab({ exerciseId, userId, nextId, hints }: { exerciseId: string; userId: string; nextId?: string; hints: string[] }) {
  const { data: session, status } = useSession();
  // Switching accounts unmounts the old console and drops pending requests/state.
  if (status === 'loading') return <p>Checking your account…</p>;
  if (session?.user?.id !== userId) return <p>Your account changed. <a href={`/courses/linux-fundamentals/${exerciseId}`} className="underline">Reopen this mission</a> to load the correct environment.</p>;
  return <PersonalLab key={`${userId}:${exerciseId}`} exerciseId={exerciseId} nextId={nextId} hints={hints} />;
}
function PersonalLab({ exerciseId, nextId, hints }: { exerciseId: string; nextId?: string; hints: string[] }) {
  const [snapshot,setSnapshot] = useState<Snapshot | null>(null), [error,setError] = useState(''), [busy,setBusy] = useState(false), [flag,setFlag] = useState(''), [message,setMessage] = useState(''), [generation,setGeneration] = useState(0), [stale,setStale] = useState(false);
  const current = useRef<Snapshot | null>(null), inFlight = useRef(false), live = useRef(true), controller = useRef<AbortController | null>(null);
  const commandNames = useRef<string[]>([]);
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
  return <div className="space-y-4">
    <p className="text-sm text-cyber-text-muted">Private, saved teaching environment • bounded Linux simulation • no installation needed</p>
    {snapshot && <div className="h-[420px] border-2 border-cyber-border bg-[#12132b]"><LinuxTerminal key={generation} cwd={snapshot.cwd} commands={commandNames.current} run={run} listDir={listDir} readFile={readFile} writeFile={writeFile} /></div>}
    {error && <p role="alert" className="text-cyber-danger">{error}</p>}
    {(!snapshot || stale) && <button className="underline" disabled={busy} onClick={() => void request('open').then(() => setGeneration(g => g + 1)).catch(() => {})}>Reopen environment</button>}
    <form className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); void request('submit', { flag: flag.trim() }).catch(() => {}); }}>
      <label className="flex-1 min-w-48">Captured flag<input aria-label="Captured flag" className="mt-1 block w-full border-2 border-cyber-border bg-cyber-dark p-3 font-mono" placeholder="CYBER{...}" value={flag} maxLength={160} onChange={e => setFlag(e.target.value)} autoComplete="off" spellCheck={false} /></label>
      <button className="self-end border-2 border-cyber-ink bg-cyber-primary px-4 py-3 text-cyber-ink disabled:opacity-50" disabled={busy || !snapshot || stale || !flag.trim()}>Check flag</button>
    </form>
    <p aria-live="polite">{busy ? 'Saving…' : message || (snapshot?.completed ? 'Mission previously completed. You can continue or practice again.' : 'Find your flag in the terminal, then paste it above.')}</p>
    {snapshot?.completed && (nextId ? <Link className="inline-block underline text-cyber-primary" href={`/courses/linux-fundamentals/${nextId}`}>Continue to the next mission →</Link> : <Link className="underline" href="/courses/linux-fundamentals">Track complete — review your progress →</Link>)}
    <details><summary className="cursor-pointer">Need a hint?</summary><ol className="list-decimal space-y-2 pl-6">{hints.map(hint => <li key={hint}>{hint}</li>)}</ol></details>
    <details><summary className="cursor-pointer">Reset this mission</summary><p className="my-2 text-sm">This clears this mission’s files and command history and generates a new flag. Earned completion stays saved.</p><button className="underline" disabled={busy || !snapshot || stale} onClick={() => void request('reset').then(() => { setGeneration(g => g + 1); setFlag(''); }).catch(() => {})}>Reset environment and flag</button></details>
  </div>;
}
