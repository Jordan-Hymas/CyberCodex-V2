import { executeCommand } from "./commandInterpreter";
import { getAllCommands } from "./commands";
import { HOME_DIR, VirtualFileSystem } from "./filesystem";
import { NanoEditor } from "./nano";
import { FileSystem } from "./types";

/**
 * Interactive shell session for the browser terminal.
 *
 * Owns the mutable state (cwd, filesystem, history, line buffer) so the xterm
 * input handler never reads stale React state. Handles line editing, history,
 * tab completion, output redirection and the nano editor.
 */

export interface ShellHost {
  write: (data: string) => void;
  cols: () => number;
  rows: () => number;
  clear: () => void;
}

export interface ShellEvents {
  /** Fired after any command or editor save changes a file */
  onFileSaved?: (path: string, content: string) => void;
  /** Fired after each command line runs */
  onCommand?: (line: string, cwd: string) => void;
}

const ESC = "\x1b";
const CSI = `${ESC}[`;
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;

// Commands handled by the session itself rather than the command registry
const BUILTINS = ["nano", "history", "clear", "exit"];

export class ShellSession {
  private vfs: VirtualFileSystem;
  cwd = HOME_DIR;
  history: string[] = [];
  private historyIndex = -1; // -1 = editing a fresh line
  private draft = ""; // line being typed before browsing history
  private buffer = "";
  private cursor = 0;
  private cursorRow = 0; // wrapped rows between the prompt start and the cursor
  private lastKeyWasTab = false;
  private editor: NanoEditor | null = null;

  constructor(
    private host: ShellHost,
    filesystem: FileSystem,
    private events: ShellEvents = {}
  ) {
    this.vfs = new VirtualFileSystem(filesystem);
  }

  get filesystem() {
    return this.vfs.getFilesystem();
  }

  start(welcome: string) {
    this.host.write(welcome.replace(/\n/g, "\r\n"));
    if (!welcome.endsWith("\n")) this.host.write("\r\n");
    this.prompt();
  }

  resize() {
    this.editor?.resize();
  }

  // ---------------------------------------------------------------- prompt

  private promptText() {
    const dir = this.cwd === HOME_DIR ? "~" : this.cwd.startsWith(HOME_DIR + "/") ? "~" + this.cwd.slice(HOME_DIR.length) : this.cwd;
    return `\x1b[32muser@cybercodex\x1b[0m:\x1b[34m${dir}\x1b[0m$ `;
  }

  private promptLength() {
    return this.promptText().replace(ANSI, "").length;
  }

  private prompt() {
    this.buffer = "";
    this.cursor = 0;
    this.cursorRow = 0;
    this.host.write(this.promptText());
  }

  /** Redraw the prompt and buffer, handling lines that wrap */
  private redraw() {
    const cols = Math.max(1, this.host.cols());
    let out = "";
    if (this.cursorRow > 0) out += `${CSI}${this.cursorRow}A`;
    out += `\r${CSI}J${this.promptText()}${this.buffer}`;

    const total = this.promptLength() + this.buffer.length;
    // xterm wraps lazily at the right edge; force the wrap so math stays simple
    if (total > 0 && total % cols === 0) out += " \b";

    const endRow = Math.floor(total / cols);
    const target = this.promptLength() + this.cursor;
    const targetRow = Math.floor(target / cols);
    const targetCol = target % cols;
    if (endRow > targetRow) out += `${CSI}${endRow - targetRow}A`;
    out += "\r";
    if (targetCol > 0) out += `${CSI}${targetCol}C`;

    this.cursorRow = targetRow;
    this.host.write(out);
  }

  /** Move past the current input so output starts on a fresh line */
  private finishLine() {
    const cols = Math.max(1, this.host.cols());
    const total = this.promptLength() + this.buffer.length;
    const rowsDown = Math.floor(total / cols) - this.cursorRow;
    if (rowsDown > 0) this.host.write(`${CSI}${rowsDown}B`);
    this.host.write("\r\n");
  }

  // ----------------------------------------------------------------- input

  handleData(data: string) {
    if (this.editor) {
      this.editor.handleData(data);
      return;
    }

    const wasTab = this.lastKeyWasTab;
    this.lastKeyWasTab = false;

    // Pasted text (possibly multiple lines)
    if (data.length > 1 && !data.startsWith(ESC)) {
      const parts = data.replace(/\r\n?/g, "\n").split("\n");
      parts.forEach((part, i) => {
        this.insert(part.replace(/[\x00-\x1f]/g, ""));
        if (i < parts.length - 1) this.submit();
      });
      return;
    }

    switch (data) {
      case "\r":
        this.submit();
        return;
      case "\x7f":
      case "\b":
        if (this.cursor > 0) {
          this.buffer = this.buffer.slice(0, this.cursor - 1) + this.buffer.slice(this.cursor);
          this.cursor--;
          this.redraw();
        }
        return;
      case `${CSI}3~`:
      case "\x04": // ^D deletes forward
        if (this.cursor < this.buffer.length) {
          this.buffer = this.buffer.slice(0, this.cursor) + this.buffer.slice(this.cursor + 1);
          this.redraw();
        }
        return;
      case "\t":
        this.complete(wasTab);
        this.lastKeyWasTab = true;
        return;
      case `${CSI}A`:
        this.browseHistory(-1);
        return;
      case `${CSI}B`:
        this.browseHistory(1);
        return;
      case `${CSI}C`:
        if (this.cursor < this.buffer.length) {
          this.cursor++;
          this.redraw();
        }
        return;
      case `${CSI}D`:
        if (this.cursor > 0) {
          this.cursor--;
          this.redraw();
        }
        return;
      case `${CSI}H`:
      case `${CSI}1~`:
      case `${ESC}OH`:
      case "\x01": // ^A
        this.cursor = 0;
        this.redraw();
        return;
      case `${CSI}F`:
      case `${CSI}4~`:
      case `${ESC}OF`:
      case "\x05": // ^E
        this.cursor = this.buffer.length;
        this.redraw();
        return;
      case "\x15": // ^U clear to start
        this.buffer = this.buffer.slice(this.cursor);
        this.cursor = 0;
        this.redraw();
        return;
      case "\x0b": // ^K clear to end
        this.buffer = this.buffer.slice(0, this.cursor);
        this.redraw();
        return;
      case "\x17": {
        // ^W delete previous word
        const before = this.buffer.slice(0, this.cursor).replace(/\S+\s*$/, "");
        this.buffer = before + this.buffer.slice(this.cursor);
        this.cursor = before.length;
        this.redraw();
        return;
      }
      case "\x03": // ^C
        this.cursor = this.buffer.length;
        this.redraw();
        this.host.write("^C");
        this.finishLine();
        this.historyIndex = -1;
        this.prompt();
        return;
      case "\x0c": // ^L
        this.host.clear();
        this.cursorRow = 0;
        this.host.write(`${CSI}H${CSI}2J`);
        this.redraw();
        return;
    }

    if (data.startsWith(ESC)) return; // other escape sequences
    if (data >= " ") this.insert(data);
  }

  private insert(text: string) {
    if (!text) return;
    this.buffer = this.buffer.slice(0, this.cursor) + text + this.buffer.slice(this.cursor);
    this.cursor += text.length;
    this.redraw();
  }

  private browseHistory(direction: -1 | 1) {
    if (this.history.length === 0) return;
    if (this.historyIndex === -1) {
      if (direction === 1) return;
      this.draft = this.buffer;
      this.historyIndex = this.history.length - 1;
    } else {
      this.historyIndex += direction;
      if (this.historyIndex < 0) this.historyIndex = 0;
      if (this.historyIndex >= this.history.length) {
        this.historyIndex = -1;
        this.buffer = this.draft;
        this.cursor = this.buffer.length;
        this.redraw();
        return;
      }
    }
    this.buffer = this.history[this.historyIndex];
    this.cursor = this.buffer.length;
    this.redraw();
  }

  // ------------------------------------------------------------ completion

  /** Commands available for completion (registry + builtins) */
  private commandNames() {
    return [...new Set([...getAllCommands().map((c) => c.name), ...BUILTINS])].sort();
  }

  private complete(isDoubleTab: boolean) {
    const before = this.buffer.slice(0, this.cursor);
    const tokenStart = before.search(/\S*$/);
    const token = before.slice(tokenStart);
    const isCommand = before.slice(0, tokenStart).trim() === "";
    const commandName = before.trim().split(/\s+/)[0];

    let candidates: string[];
    let base = ""; // portion of the token before the name being completed

    if (isCommand && !token.includes("/")) {
      candidates = this.commandNames().filter((name) => name.startsWith(token));
      if (candidates.length === 1) candidates = [candidates[0] + " "];
    } else {
      const slash = token.lastIndexOf("/");
      base = slash === -1 ? "" : token.slice(0, slash + 1);
      const partial = token.slice(slash + 1);
      const dir = this.vfs.resolvePath(this.cwd, base || ".");
      if (!this.vfs.isDirectory(dir)) return this.bell();

      const dirsOnly = commandName === "cd" || commandName === "rmdir";
      candidates = this.vfs
        .readdir(dir)
        .filter((name) => name.startsWith(partial))
        .filter((name) => partial.startsWith(".") || !name.startsWith("."))
        .map((name) => {
          const isDir = this.vfs.isDirectory(this.vfs.normalizePath(`${dir}/${name}`));
          return isDir ? `${name}/` : name;
        })
        .filter((name) => !dirsOnly || name.endsWith("/"));

      if (candidates.length === 1 && !candidates[0].endsWith("/")) candidates = [candidates[0] + " "];
      candidates = candidates.map((c) => base + c);
    }

    if (candidates.length === 0) return this.bell();

    const common = longestCommonPrefix(candidates);
    if (common.length > token.length) {
      this.insert(common.slice(token.length));
      return;
    }

    if (candidates.length === 1) return; // already complete

    // Ambiguous with nothing more to add: list options on the second Tab
    if (!isDoubleTab) return this.bell();
    const names = candidates.map((c) => c.slice(base.length).trimEnd());
    this.cursorRowToEnd();
    this.host.write("\r\n" + formatColumns(names, this.host.cols()) + "\r\n");
    this.cursorRow = 0;
    this.host.write(this.promptText() + this.buffer);
    this.cursorRow = Math.floor((this.promptLength() + this.buffer.length) / Math.max(1, this.host.cols()));
    // Put the cursor back where it was
    const saved = this.cursor;
    this.cursor = this.buffer.length;
    if (saved !== this.cursor) {
      this.cursor = saved;
      this.redraw();
    }
  }

  private cursorRowToEnd() {
    const cols = Math.max(1, this.host.cols());
    const rowsDown = Math.floor((this.promptLength() + this.buffer.length) / cols) - this.cursorRow;
    if (rowsDown > 0) this.host.write(`${CSI}${rowsDown}B`);
  }

  private bell() {
    this.host.write("\x07");
  }

  // ------------------------------------------------------------- execution

  private submit() {
    const line = this.buffer;
    this.cursor = this.buffer.length;
    this.finishLine();
    this.historyIndex = -1;
    this.draft = "";

    if (line.trim()) {
      this.history.push(line.trim());
      this.run(line.trim());
      this.events.onCommand?.(line.trim(), this.cwd);
    }

    if (!this.editor) this.prompt();
  }

  private print(text: string, isError = false) {
    if (!text) return;
    const body = text.replace(/\r?\n/g, "\r\n");
    this.host.write(isError ? `\x1b[31m${body}\x1b[0m\r\n` : `${body}\r\n`);
  }

  private run(line: string) {
    const { command, redirect } = splitRedirect(line);
    const name = command.split(/\s+/)[0];

    if (name === "nano") return this.openNano(command.split(/\s+/).slice(1));
    if (name === "history") return this.print(this.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join("\n"));
    if (name === "clear") {
      this.host.clear();
      this.host.write(`${CSI}H${CSI}2J`);
      return;
    }
    if (name === "exit") return this.print("logout: this is a practice terminal, so there's nowhere to go!");
    if (name === "vi" || name === "vim") return this.print(`${name}: not installed here. Try: nano ${command.split(/\s+/)[1] ?? "file.txt"}`, true);

    if (redirect && !redirect.target) return this.print("syntax error near unexpected token `newline'", true);

    const result = executeCommand(
      command,
      this.cwd,
      this.vfs.getFilesystem(),
      (dir) => {
        this.cwd = dir;
      },
      (fs) => this.vfs.setFilesystem(fs)
    );

    if (redirect) {
      if (result.error) return this.print(result.output, true);
      const text = result.output ? result.output.replace(/\n$/, "") + "\n" : "";
      const error = this.writeFile(redirect.target, text, redirect.append);
      if (error) this.print(`${name}: ${error}`, true);
      return;
    }

    this.print(result.output, result.error);
  }

  /** Write (or append) a file; returns an error message on failure */
  private writeFile(name: string, content: string, append = false): string | null {
    const path = this.vfs.resolvePath(this.cwd, name);
    const parent = path.slice(0, path.lastIndexOf("/")) || "/";
    if (this.vfs.isDirectory(path)) return `${name}: Is a directory`;
    if (!this.vfs.isDirectory(parent)) return `${name}: No such file or directory`;

    const existing = this.vfs.getNode(path);
    const next = append && existing ? (existing.content ?? "") + content : content;
    this.vfs.writeFile(path, next);
    // Keep permissions/owner on overwrite
    if (existing) {
      const node = this.vfs.getNode(path)!;
      node.permissions = existing.permissions;
      node.owner = existing.owner;
    }
    this.events.onFileSaved?.(path, next);
    return null;
  }

  private openNano(args: string[]) {
    const fileArg = args.find((a) => !a.startsWith("-"));
    let path: string | null = null;
    let content = "";
    let isNew = true;

    if (fileArg) {
      path = this.vfs.resolvePath(this.cwd, fileArg);
      if (this.vfs.isDirectory(path)) return this.print(`nano: ${fileArg}: Is a directory`, true);
      const parent = path.slice(0, path.lastIndexOf("/")) || "/";
      if (!this.vfs.isDirectory(parent)) return this.print(`nano: ${fileArg}: No such file or directory`, true);
      if (this.vfs.isFile(path)) {
        content = this.vfs.readFile(path);
        isNew = false;
      }
    }

    this.editor = new NanoEditor(
      {
        write: (d) => this.host.write(d),
        cols: () => this.host.cols(),
        rows: () => this.host.rows(),
        resolve: (name) => this.vfs.resolvePath(this.cwd, name),
        relative: (target) => (target.startsWith(this.cwd + "/") ? target.slice(this.cwd.length + 1) : target),
        save: (target, text) => {
          const error = this.writeFile(target, text);
          return error ? error.replace(/^.*?: /, "") : null;
        },
        exit: () => {
          this.editor = null;
          this.prompt();
        },
      },
      path,
      content,
      isNew
    );
    this.editor.open();
  }
}

// ---------------------------------------------------------------- helpers

/** Split `cmd > file` / `cmd >> file` (outside quotes) */
export function splitRedirect(line: string): { command: string; redirect?: { target: string; append: boolean } } {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      const append = line[i + 1] === ">";
      const target = line
        .slice(i + (append ? 2 : 1))
        .trim()
        .replace(/^["']|["']$/g, "");
      return { command: line.slice(0, i).trim(), redirect: { target, append } };
    }
  }
  return { command: line };
}

export function longestCommonPrefix(items: string[]) {
  if (items.length === 0) return "";
  let prefix = items[0];
  for (const item of items.slice(1)) {
    while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/** Lay names out in columns like bash's completion listing */
export function formatColumns(names: string[], cols: number) {
  const width = Math.max(...names.map((n) => n.length)) + 2;
  const perRow = Math.max(1, Math.floor(cols / width));
  const rows: string[] = [];
  for (let i = 0; i < names.length; i += perRow) {
    rows.push(
      names
        .slice(i, i + perRow)
        .map((n) => n.padEnd(width))
        .join("")
        .trimEnd()
    );
  }
  return rows.join("\r\n");
}
