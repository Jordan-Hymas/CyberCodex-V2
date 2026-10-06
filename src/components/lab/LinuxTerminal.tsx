'use client';
import { useEffect, useRef, useState } from 'react';
import type { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
export type TerminalReply = { output?: string; error?: string; cwd: string; clear?: boolean };
export function LinuxTerminal({ cwd, run }: { cwd: string; run: (command: string) => Promise<TerminalReply> }) {
  const container = useRef<HTMLDivElement>(null);
  const runRef = useRef(run); runRef.current = run;
  const cwdRef = useRef(cwd); cwdRef.current = cwd;
  const [failure, setFailure] = useState('');
  useEffect(() => {
    let disposed = false, term: Terminal | undefined, cleanup = () => {};
    async function mount() {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import('@xterm/xterm'), import('@xterm/addon-fit')]);
      if (disposed || !container.current) return;
      term = new Terminal({ convertEol: true, cursorBlink: true, fontSize: 14, fontFamily: 'monospace', scrollback: 1200, theme: { background: '#12132b', foreground: '#f5f3ff', cursor: '#3dfc8a' } });
      const terminal = term, fit = new FitAddon(); terminal.loadAddon(fit); terminal.open(container.current);
      const resize = () => { if (!disposed && container.current?.clientWidth && container.current?.clientHeight) fit.fit(); };
      const observer = new ResizeObserver(resize); observer.observe(container.current); resize();
      let buffer = '', busy = false, history: string[] = [], cursor = 0;
      const prompt = () => terminal.write(`\x1b[32muser@cybercodex\x1b[0m:${cwdRef.current}$ `);
      const replace = (value: string) => { terminal.write('\r\x1b[2K'); prompt(); terminal.write(value); buffer = value; };
      const safe = (text: string) => text.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
      terminal.writeln('Personal Linux mission. Type help for commands. Reset restores only this mission.'); prompt();
      const subscription = terminal.onData(async data => {
        if (busy || disposed) return;
        if (data === '\x1b[A') { cursor = Math.max(0, cursor - 1); replace(history[cursor] ?? ''); return; }
        if (data === '\x1b[B') { cursor = Math.min(history.length, cursor + 1); replace(history[cursor] ?? ''); return; }
        if (data === '\x03') { terminal.write('^C\r\n'); buffer = ''; prompt(); return; }
        if (data === '\x0c') { terminal.clear(); replace(buffer); return; }
        if (data === '\x7f') { if (buffer.length) { buffer = buffer.slice(0,-1); terminal.write('\b \b'); } return; }
        if (data === '\r') {
          const command = buffer.trim(); terminal.write('\r\n'); buffer = '';
          if (!command) { prompt(); return; }
          history = [...history,command].slice(-100); cursor = history.length; busy = true;
          try {
            const result = await runRef.current(command);
            if (disposed) return;
            cwdRef.current = result.cwd;
            if (result.clear) terminal.clear();
            if (result.output) terminal.write(safe(result.output));
            if (result.error) terminal.write(`\x1b[31m${safe(result.error)}\x1b[0m`);
            if ((result.output && !result.output.endsWith('\n')) || (result.error && !result.error.endsWith('\n'))) terminal.write('\r\n');
          } catch (error) { if (!disposed) terminal.writeln(`\x1b[31m${safe((error as Error).message)}\x1b[0m`); }
          finally { busy = false; if (!disposed) prompt(); }
          return;
        }
        // Pasted multi-line text is kept editable, never auto-executed.
        if (data.startsWith('\x1b')) return;
        const printable = data.replace(/[\r\n]+/g, ' ').replace(/[^\x20-\x7e]/g, '').slice(0, 2048 - buffer.length);
        buffer += printable; terminal.write(printable);
      });
      cleanup = () => { subscription.dispose(); observer.disconnect(); terminal.dispose(); };
    }
    mount().catch(() => { if (!disposed) setFailure('Terminal could not initialize. Reload this page to retry.'); });
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div className="h-full min-h-[320px]" role="region" aria-label="Personal Linux terminal">{failure && <p role="alert">{failure}</p>}<div ref={container} className="h-full p-3" /></div>;
}
