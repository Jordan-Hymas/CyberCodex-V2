'use client';
import { useEffect, useRef, useState } from 'react';
import '@xterm/xterm/css/xterm.css';
import { ShellSession, type DirEntry, type ReadResult, type ShellBackend } from '@/lib/terminal/shell';
import { keepCtrlKeys, xtermOptions } from './xtermTheme';

export type TerminalReply = { output?: string; error?: string; cwd: string; clear?: boolean };

export interface LinuxTerminalProps {
  cwd: string;
  /** Command names for tab completion (from the server's command list) */
  commands: string[];
  run: (command: string) => Promise<TerminalReply>;
  listDir: (path: string) => Promise<DirEntry[]>;
  readFile: (path: string) => Promise<ReadResult>;
  writeFile: (path: string, content: string) => Promise<string | null>;
}

const WELCOME =
  'Personal Linux mission. Type help for commands.\n' +
  'Tab completes commands and file names; nano FILE edits a file. Reset restores only this mission.\n';

/** xterm front end for the server-owned mission shell. No filesystem or flag lives in the browser. */
export function LinuxTerminal(props: LinuxTerminalProps) {
  const container = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props); propsRef.current = props;
  const cwdRef = useRef(props.cwd);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    let disposed = false, cleanup = () => {};
    async function mount() {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import('@xterm/xterm'), import('@xterm/addon-fit')]);
      if (disposed || !container.current) return;
      const term = new Terminal(xtermOptions), fit = new FitAddon();
      term.loadAddon(fit); term.open(container.current);
      term.attachCustomKeyEventHandler(keepCtrlKeys);
      const resize = () => { if (!disposed && container.current?.clientWidth && container.current?.clientHeight) { try { fit.fit(); } catch { /* not measurable yet */ } } };
      const observer = new ResizeObserver(resize); observer.observe(container.current); resize();

      const backend: ShellBackend = {
        cwd: () => cwdRef.current,
        commandNames: () => propsRef.current.commands,
        run: async line => {
          const reply = await propsRef.current.run(line);
          cwdRef.current = reply.cwd;
          return reply;
        },
        listDir: path => propsRef.current.listDir(path),
        readFile: path => propsRef.current.readFile(path),
        writeFile: (path, content) => propsRef.current.writeFile(path, content),
      };
      // Pasted multi-line text stays editable instead of auto-running (mission safety).
      const session = new ShellSession({ write: d => term.write(d), cols: () => term.cols, rows: () => term.rows, clear: () => term.clear() }, backend, { pasteRunsLines: false });
      const data = term.onData(d => { if (!disposed) session.handleData(d); });
      const resized = term.onResize(() => session.resize());
      session.start(WELCOME);
      term.focus();
      cleanup = () => { data.dispose(); resized.dispose(); observer.disconnect(); term.dispose(); };
    }
    mount().catch(() => { if (!disposed) setFailure('Terminal could not initialize. Reload this page to retry.'); });
    return () => { disposed = true; cleanup(); };
  }, []);

  return <div className="h-full min-h-[320px]" role="region" aria-label="Personal Linux terminal">{failure && <p role="alert">{failure}</p>}<div ref={container} className="terminal-container h-full p-3" /></div>;
}
