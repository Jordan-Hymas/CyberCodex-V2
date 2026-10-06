"use client";

import { useEffect, useRef } from "react";
import { VirtualFileSystem } from "@/lib/terminal/filesystem";
import { ShellSession, type ShellEvents } from "@/lib/terminal/shell";
import { FileSystem } from "@/lib/terminal/types";
import "@xterm/xterm/css/xterm.css";

export interface TerminalEmulatorProps extends ShellEvents {
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
  const eventsRef = useRef<ShellEvents>({ onFileSaved, onCommand });
  eventsRef.current = { onFileSaved, onCommand };

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

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 15,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, monospace",
        lineHeight: 1.25,
        scrollback: 1000,
        theme: {
          // Matches the CyberCodex palette (globals.css)
          background: "#12132b",
          foreground: "#f5f3ff",
          cursor: "#3dfc8a",
          cursorAccent: "#12132b",
          selectionBackground: "rgba(255, 95, 162, 0.35)",
          black: "#12132b",
          red: "#ff5266",
          green: "#3dfc8a",
          yellow: "#ffd23f",
          blue: "#4cc9ff",
          magenta: "#ff5fa2",
          cyan: "#4cc9ff",
          white: "#f5f3ff",
          brightBlack: "#969cd2",
          brightRed: "#ff7584",
          brightGreen: "#6dffa8",
          brightYellow: "#ffe27a",
          brightBlue: "#7fd9ff",
          brightMagenta: "#ff85b9",
          brightCyan: "#7fd9ff",
          brightWhite: "#ffffff",
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(container);

      // Let Ctrl+S / Ctrl+O / Ctrl+F etc. reach the terminal (nano) instead of the browser
      term.attachCustomKeyEventHandler((event) => {
        if (event.type === "keydown" && event.ctrlKey && !event.altKey && !event.metaKey) {
          if ("sofgkuxyveacl".includes(event.key.toLowerCase())) event.preventDefault();
        }
        return true;
      });

      const fit = () => {
        try {
          fitAddon.fit();
        } catch {
          // container not measurable yet
        }
      };
      fit();

      const session = new ShellSession(
        {
          write: (data) => term.write(data),
          cols: () => term.cols,
          rows: () => term.rows,
          clear: () => term.clear(),
        },
        new VirtualFileSystem(initialFilesystem).getFilesystem(),
        {
          onFileSaved: (path, content) => eventsRef.current.onFileSaved?.(path, content),
          onCommand: (line, cwd) => eventsRef.current.onCommand?.(line, cwd),
        }
      );

      const dataListener = term.onData((data) => session.handleData(data));
      const resizeListener = term.onResize(() => session.resize());
      session.start(welcomeMessage ?? DEFAULT_WELCOME);
      term.focus();

      const observer = new ResizeObserver(() => fit());
      observer.observe(container);

      cleanup = () => {
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
    <div
      ref={containerRef}
      className={`terminal-container ${className}`}
      style={{ width: "100%", height: "100%", padding: "0.75rem" }}
    />
  );
}
