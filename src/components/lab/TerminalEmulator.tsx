"use client";

import { useEffect, useRef } from "react";
import { VirtualFileSystem } from "@/lib/terminal/filesystem";
import { LocalBackend, ShellSession, type LocalBackendEvents } from "@/lib/terminal/shell";
import { FileSystem } from "@/lib/terminal/types";
import "@xterm/xterm/css/xterm.css";
import { enableCopyOnSelect, keepCtrlKeys, xtermOptions } from "./xtermTheme";
import { CopyToast, useCopyToast } from "./CopyToast";

export interface TerminalEmulatorProps extends LocalBackendEvents {
  initialFilesystem?: FileSystem;
  welcomeMessage?: string;
  className?: string;
}

const DEFAULT_WELCOME =
  "Welcome to the CyberCodex Linux terminal!\n" +
  "Type 'help' to see commands. Press Tab to autocomplete, and try 'nano notes.txt' to edit a file.\n";

export function TerminalEmulator({
  initialFilesystem,
  welcomeMessage,
  className = "",
  onFileSaved,
  onCommand,
}: TerminalEmulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest callbacks without re-creating the terminal
  const eventsRef = useRef<LocalBackendEvents>({ onFileSaved, onCommand });
  eventsRef.current = { onFileSaved, onCommand };
  const toast = useCopyToast();
  const showCopied = useRef(toast.show);
  showCopied.current = toast.show;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);
      if (disposed) return;

      const term = new Terminal(xtermOptions);

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(container);

      term.attachCustomKeyEventHandler(keepCtrlKeys);
      const stopCopy = enableCopyOnSelect(term, container, (text) => showCopied.current(text));

      const fit = () => {
        try {
          fitAddon.fit();
        } catch {
          // container not measurable yet
        }
      };
      fit();

      const backend = new LocalBackend(new VirtualFileSystem(initialFilesystem).getFilesystem(), {
        onFileSaved: (path, content) => eventsRef.current.onFileSaved?.(path, content),
        onCommand: (line, cwd) => eventsRef.current.onCommand?.(line, cwd),
      });
      const session = new ShellSession(
        {
          write: (data) => term.write(data),
          cols: () => term.cols,
          rows: () => term.rows,
          clear: () => term.clear(),
        },
        backend
      );

      const dataListener = term.onData((data) => session.handleData(data));
      const resizeListener = term.onResize(() => session.resize());
      session.start(welcomeMessage ?? DEFAULT_WELCOME);
      term.focus();

      const observer = new ResizeObserver(() => fit());
      observer.observe(container);

      cleanup = () => {
        stopCopy();
        observer.disconnect();
        dataListener.dispose();
        resizeListener.dispose();
        term.dispose();
      };
    })().catch((error) => console.error("Failed to initialize terminal:", error));

    return () => {
      disposed = true;
      cleanup();
    };
    // The terminal is created once; filesystem/welcome are initial values only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      <CopyToast text={toast.copied} />
      <div
        ref={containerRef}
        className={`terminal-container ${className}`}
        style={{ width: "100%", height: "100%", padding: "0.75rem" }}
      />
    </div>
  );
}
