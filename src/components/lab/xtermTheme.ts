import type { ITerminalOptions } from "@xterm/xterm";

/** Shared xterm.js look, matching the CyberCodex palette (globals.css). */
export const xtermOptions: ITerminalOptions = {
  cursorBlink: true,
  fontSize: 15,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, monospace",
  lineHeight: 1.25,
  scrollback: 1200,
  allowProposedApi: true,
  theme: {
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
};

/** Keep Ctrl+S / Ctrl+O / Ctrl+F etc. in the terminal (nano) instead of the browser. */
export function keepCtrlKeys(event: KeyboardEvent) {
  if (event.type === "keydown" && event.ctrlKey && !event.altKey && !event.metaKey) {
    if ("sofgkuxyveacl".includes(event.key.toLowerCase())) event.preventDefault();
  }
  return true;
}
