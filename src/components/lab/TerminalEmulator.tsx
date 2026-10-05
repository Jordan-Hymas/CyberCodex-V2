"use client";

import { useEffect, useRef, useState } from "react";
import { VirtualFileSystem } from "@/lib/terminal/filesystem";
import { executeCommand } from "@/lib/terminal/commandInterpreter";
import { FileSystem } from "@/lib/terminal/types";
import "@xterm/xterm/css/xterm.css";

export interface TerminalEmulatorProps {
  initialFilesystem?: FileSystem;
  welcomeMessage?: string;
  className?: string;
}

export function TerminalEmulator({ initialFilesystem, welcomeMessage, className = "" }: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [currentDir, setCurrentDir] = useState("/home/user");
  const [filesystem, setFilesystem] = useState<FileSystem>(() => {
    const vfs = new VirtualFileSystem(initialFilesystem);
    return vfs.getFilesystem();
  });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState("");

  // Ensure we only render on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!terminalRef.current) return;

    // Ensure container has dimensions before initializing terminal
    const container = terminalRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn("Terminal container has no dimensions yet");
      return;
    }

    // Dynamically import xterm modules (client-side only)
    const initTerminal = async () => {
      try {
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        const { WebLinksAddon } = await import("@xterm/addon-web-links");

        // Initialize xterm.js
        const term = new Terminal({
          cursorBlink: true,
          fontSize: 15,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, monospace",
          lineHeight: 1.4,
          letterSpacing: 0,
          scrollback: 1000,
          theme: {
            background: "#0a0e27",
            foreground: "#00ff41",
            cursor: "#00ff41",
            cursorAccent: "#0a0e27",
            selectionBackground: "rgba(0, 255, 65, 0.3)",
            black: "#0a0e27",
            red: "#ff0033",
            green: "#00ff41",
            yellow: "#ffd700",
            blue: "#00d9ff",
            magenta: "#ff00ff",
            cyan: "#00ffff",
            white: "#e0e7ff",
            brightBlack: "#64748b",
            brightRed: "#ff3366",
            brightGreen: "#33ff66",
            brightYellow: "#ffff00",
            brightBlue: "#33ddff",
            brightMagenta: "#ff33ff",
            brightCyan: "#33ffff",
            brightWhite: "#ffffff",
          },
          convertEol: true,
          allowProposedApi: true,
          smoothScrollDuration: 120,
        });

        // Add fit addon
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        fitAddonRef.current = fitAddon;

        // Add web links addon
        const webLinksAddon = new WebLinksAddon();
        term.loadAddon(webLinksAddon);

        // Open terminal
        term.open(container);

        // Store term reference
        xtermRef.current = term;

        // Fit terminal after a brief delay to ensure DOM is ready
        setTimeout(() => {
          if (fitAddonRef.current && term.element) {
            try {
              fitAddon.fit();
            } catch (e) {
              console.warn("Initial fit failed, retrying...", e);
              setTimeout(() => {
                try {
                  fitAddon.fit();
                } catch (e2) {
                  console.error("Terminal fit failed:", e2);
                }
              }, 100);
            }
          }
        }, 50);

        // Display welcome message
        const welcome = welcomeMessage || "Welcome to CyberCodex Linux Terminal!\nType 'help' to see available commands.\n";
        term.writeln(welcome);
        writePrompt(term, currentDir);

        // Handle terminal input
        let inputBuffer = "";

        term.onData((data) => {
          const code = data.charCodeAt(0);

          // Handle different key inputs
          if (code === 13) {
            // Enter key
            term.write("\r\n");

            if (inputBuffer.trim()) {
              // Execute command
              const result = executeCommand(inputBuffer, currentDir, filesystem, setCurrentDir, setFilesystem);

              // Handle clear command
              if (inputBuffer.trim() === "clear") {
                term.clear();
              } else {
                if (result.output) {
                  // Write output with proper color
                  if (result.error) {
                    term.writeln(`\x1b[31m${result.output}\x1b[0m`); // Red for errors
                  } else {
                    term.writeln(result.output);
                  }
                }
              }

              // Add to history
              setCommandHistory((prev) => [...prev, inputBuffer]);
              setHistoryIndex(-1);
            }

            inputBuffer = "";
            setCurrentInput("");
            writePrompt(term, currentDir);
          } else if (code === 127) {
            // Backspace
            if (inputBuffer.length > 0) {
              inputBuffer = inputBuffer.slice(0, -1);
              setCurrentInput(inputBuffer);
              term.write("\b \b");
            }
          } else if (code === 27) {
            // Escape sequences (arrow keys)
            // Arrow keys send: ESC [ A/B/C/D
            // We'll handle this in a simplified way
            return;
          } else if (code === 3) {
            // Ctrl+C
            term.write("^C\r\n");
            inputBuffer = "";
            setCurrentInput("");
            writePrompt(term, currentDir);
          } else if (code === 12) {
            // Ctrl+L (clear)
            term.clear();
            writePrompt(term, currentDir);
          } else if (data >= String.fromCharCode(32) && data <= String.fromCharCode(126)) {
            // Printable characters
            inputBuffer += data;
            setCurrentInput(inputBuffer);
            term.write(data);
          }
        });

        // Handle resize
        const handleResize = () => {
          if (fitAddonRef.current && xtermRef.current && xtermRef.current.element) {
            try {
              fitAddonRef.current.fit();
            } catch (e) {
              // Silently ignore resize errors - they're usually timing issues
            }
          }
        };

        window.addEventListener("resize", handleResize);

        // Use ResizeObserver to handle container size changes
        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            // Debounce resize to avoid excessive calls
            setTimeout(handleResize, 10);
          });

          if (container) {
            resizeObserver.observe(container);
          }
        }

        // Cleanup
        return () => {
          window.removeEventListener("resize", handleResize);
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
          if (term) {
            term.dispose();
          }
        };
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
      }
    };

    initTerminal();
  }, [isMounted]);

  // Update prompt when current directory changes
  useEffect(() => {
    if (xtermRef.current && currentDir) {
      // The prompt will be updated on next command
    }
  }, [currentDir]);

  if (!isMounted) {
    return (
      <div className={`terminal-container ${className} flex items-center justify-center`} style={{ width: "100%", height: "100%", padding: "1rem" }}>
        <div className="text-cyber-text-muted animate-pulse">Loading terminal...</div>
      </div>
    );
  }

  return <div ref={terminalRef} className={`terminal-container ${className}`} style={{ width: "100%", height: "100%", padding: "1rem" }} />;
}

/**
 * Write command prompt
 */
function writePrompt(term: any, currentDir: string) {
  const prompt = `\x1b[32muser@cybercodex\x1b[0m:\x1b[34m${currentDir}\x1b[0m$ `;
  term.write(prompt);
}
