import { executeCommand } from "./commandInterpreter";
import { getAllCommands } from "./commands";
import { HOME_DIR, VirtualFileSystem } from "./filesystem";
import { NanoEditor } from "./nano";
import { FileSystem } from "./types";

/**
 * Interactive shell front end for xterm.js.
 *
 * Handles line editing, history, tab completion and the nano editor, and
 * delegates command execution and file access to a ShellBackend. Two backends
 * exist: LocalBackend below (in-browser virtual filesystem) and the
 * server-backed Linux missions (components/lab/LinuxTerminal).
 */

export interface ShellHost {
  write: (data: string) => void;
  cols: () => number;
  rows: () => number;
  clear: () => void;
}

export interface RunResult {
  output?: string;
  error?: string;
  clear?: boolean;
  /** Coaching hint, shown in yellow after the output */
  tip?: string;
}

export interface DirEntry {
  name: string;
  dir: boolean;
}

export type ReadResult = { content: string; isNew: boolean } | { error: string };

export interface ShellBackend {
  /** Current working directory (absolute) */
  cwd(): string;
  /** Command names offered by tab completion */
  commandNames(): string[];
  run(line: string): RunResult | Promise<RunResult>;
  /** Entries of an absolute directory path; [] when missing or unreadable */
  listDir(path: string): DirEntry[] | Promise<DirEntry[]>;
  /** Open an absolute path for editing */
  readFile(path: string): ReadResult | Promise<ReadResult>;
  /** Save an absolute path; returns an error message on failure */
  writeFile(path: string, content: string): string | null | Promise<string | null>;
}

export interface ShellOptions {
  home?: string;
  /** Run each line of a multi-line paste (true) or keep it as one editable line (false) */
  pasteRunsLines?: boolean;
}

const ESC = "\x1b";
const CSI = `${ESC}[`;
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;

/** Resolve a path against cwd, handling ~, . and .. */
export function resolvePath(cwd: string, path: string, home = HOME_DIR) {
  if (path === "~" || path.startsWith("~/")) path = home + path.slice(1);
  const parts: string[] = [];
  for (const part of (path.startsWith("/") ? path : `${cwd}/${path}`).split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return "/" + parts.join("/");
}

export class ShellSession {
  history: string[] = [];
  private historyIndex = -1; // -1 = editing a fresh line
  private draft = ""; // line being typed before browsing history
  private buffer = "";
  private cursor = 0;
  private cursorRow = 0; // wrapped rows between the prompt start and the cursor
  private lastKeyWasTab = false;
  private editor: NanoEditor | null = null;
  private busy = false;
  private queue: string[] = []; // keystrokes received while busy
  private home: string;
  private pasteRunsLines: boolean;

  constructor(
    private host: ShellHost,
    private backend: ShellBackend,
    options: ShellOptions = {}
  ) {
    this.home = options.home ?? HOME_DIR;
    this.pasteRunsLines = options.pasteRunsLines ?? true;
  }

  get cwd() {
    return this.backend.cwd();
  }

  get isEditing() {
    return this.editor !== null;
  }

  start(welcome: string) {
    if (welcome) {
      this.host.write(welcome.replace(/\r?\n/g, "\r\n"));
      if (!welcome.endsWith("\n")) this.host.write("\r\n");
    }
    this.prompt();
  }

  resize() {
    this.editor?.resize();
  }

  // ---------------------------------------------------------------- prompt

  private promptText() {
    const cwd = this.cwd;
    const dir = cwd === this.home ? "~" : cwd.startsWith(this.home + "/") ? "~" + cwd.slice(this.home.length) : cwd;
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
    if (this.busy) {
      this.queue.push(data);
      return;
    }
    if (this.editor) {
      this.editor.handleData(data);
      return;
    }

    const wasTab = this.lastKeyWasTab;
    this.lastKeyWasTab = false;

    // Pasted text
    if (data.length > 1 && !data.startsWith(ESC)) {
      const parts = data.replace(/\r\n?/g, "\n").split("\n").map((p) => p.replace(/[\x00-\x1f]/g, ""));
      if (!this.pasteRunsLines) return this.insert(parts.join(" "));
      this.insert(parts[0]);
      for (const part of parts.slice(1)) this.queue.push("\r", ...(part ? [part] : []));
      this.drain();
      return;
    }

    switch (data) {
      case "\r":
        void this.track(this.submit());
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
        this.lastKeyWasTab = true;
        void this.track(this.complete(wasTab));
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
    if (data >= " ") this.insert(data.slice(0, 2048 - this.buffer.length));
  }

  /** Mark the session busy while an async step runs, then replay queued keys */
  private async track(step: Promise<unknown>) {
    this.busy = true;
    try {
      await step;
    } finally {
      this.busy = false;
      this.drain();
    }
  }

  private drain() {
    while (!this.busy && this.queue.length) this.handleData(this.queue.shift()!);
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

  private async complete(isDoubleTab: boolean) {
    const before = this.buffer.slice(0, this.cursor);
    const tokenStart = before.search(/\S*$/);
    const token = before.slice(tokenStart);
    // A new command starts at the line start or after | ; && ||
    const isCommand = /(^|[|;&])\s*$/.test(before.slice(0, tokenStart));
    const commandName = before.slice(0, tokenStart).split(/[|;&]/).pop()!.trim().split(/\s+/)[0];

    let candidates: string[];
    let base = ""; // portion of the token before the name being completed

    if (isCommand && !token.includes("/")) {
      candidates = [...new Set(this.backend.commandNames())].sort().filter((name) => name.startsWith(token));
      if (candidates.length === 1) candidates = [candidates[0] + " "];
    } else {
      const slash = token.lastIndexOf("/");
      base = slash === -1 ? "" : token.slice(0, slash + 1);
      const partial = token.slice(slash + 1);
      const dir = resolvePath(this.cwd, base || ".", this.home);
      const dirsOnly = commandName === "cd" || commandName === "rmdir";

      let entries: DirEntry[];
      try {
        entries = await this.backend.listDir(dir);
      } catch {
        entries = [];
      }
      candidates = entries
        .filter((e) => e.name.startsWith(partial))
        .filter((e) => partial.startsWith(".") || !e.name.startsWith("."))
        .filter((e) => !dirsOnly || e.dir)
        .map((e) => (e.dir ? `${e.name}/` : e.name));

      if (candidates.length === 1 && !candidates[0].endsWith("/")) candidates = [candidates[0] + " "];
      candidates = candidates.map((c) => base + c);
    }

    if (candidates.length === 0) return this.bell();

    const common = longestCommonPrefix(candidates);
    if (common.length > token.length) return this.insert(common.slice(token.length));
    if (candidates.length === 1) return; // already complete

    // Ambiguous with nothing more to add: list options on the second Tab
    if (!isDoubleTab) return this.bell();
    const names = candidates.map((c) => c.slice(base.length).trimEnd());
    const saved = this.cursor;
    this.cursor = this.buffer.length;
    this.redraw();
    this.finishLine();
    this.host.write(formatColumns(names, this.host.cols()) + "\r\n");
    this.cursorRow = 0;
    this.host.write(this.promptText());
    this.cursor = saved;
    this.redraw();
  }

  private bell() {
    this.host.write("\x07");
  }

  // ------------------------------------------------------------- execution

  private async submit() {
    const line = this.buffer;
    this.cursor = this.buffer.length;
    this.finishLine();
    this.historyIndex = -1;
    this.draft = "";

    const trimmed = line.trim();
    if (trimmed) {
      this.history = [...this.history, trimmed].slice(-200);
      const [name, ...args] = trimmed.split(/\s+/);
      if (name === "nano") {
        await this.openNano(args);
        if (this.editor) return; // the prompt returns when nano exits
      } else {
        try {
          this.print(await this.backend.run(trimmed));
        } catch (error) {
          this.print({ error: (error as Error).message });
        }
      }
    }
    this.prompt();
  }

  private print(result: RunResult) {
    if (result.clear) {
      this.host.clear();
      this.host.write(`${CSI}H${CSI}2J`);
    }
    // Strip control characters (keep tab/newline) so output can't drive the terminal
    const block = (text: string) => {
      const body = text.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
      return (body.endsWith("\n") ? body : body + "\n").replace(/\n/g, "\r\n");
    };
    if (result.output) this.host.write(block(result.output));
    if (result.error) this.host.write(`\x1b[31m${block(result.error)}\x1b[0m`);
    if (result.tip) this.host.write(`\x1b[33mTip: ${block(result.tip)}\x1b[0m`);
  }

  private async openNano(args: string[]) {
    const fileArg = args.find((a) => !a.startsWith("-"));
    let path: string | null = null;
    let content = "";
    let isNew = true;

    if (fileArg) {
      path = resolvePath(this.cwd, fileArg, this.home);
      let result: ReadResult;
      try {
        result = await this.backend.readFile(path);
      } catch (error) {
        result = { error: (error as Error).message };
      }
      if ("error" in result) return this.print({ error: `nano: ${result.error}` });
      content = result.content;
      isNew = result.isNew;
    }

    this.editor = new NanoEditor(
      {
        write: (d) => this.host.write(d),
        cols: () => this.host.cols(),
        rows: () => this.host.rows(),
        resolve: (name) => resolvePath(this.cwd, name, this.home),
        relative: (target) => (target.startsWith(this.cwd + "/") ? target.slice(this.cwd.length + 1) : target),
        save: (target, text) => this.backend.writeFile(target, text),
        busy: (step) => this.track(step),
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

// ------------------------------------------------------------- local backend

export interface LocalBackendEvents {
  /** Fired after any command or editor save changes a file */
  onFileSaved?: (path: string, content: string) => void;
  /** Fired after each command line runs */
  onCommand?: (line: string, cwd: string) => void;
}

/** In-browser virtual filesystem backend used by the practice terminal. */
export class LocalBackend implements ShellBackend {
  private vfs: VirtualFileSystem;
  private dir = HOME_DIR;
  private lines: string[] = [];

  constructor(filesystem: FileSystem, private events: LocalBackendEvents = {}) {
    this.vfs = new VirtualFileSystem(filesystem);
  }

  get filesystem() {
    return this.vfs.getFilesystem();
  }

  cwd() {
    return this.dir;
  }

  commandNames() {
    return [...getAllCommands().map((c) => c.name), "nano", "history", "clear", "exit"];
  }

  run(line: string): RunResult {
    this.lines.push(line);
    const result = this.execute(line);
    this.events.onCommand?.(line, this.dir);
    return result;
  }

  private execute(line: string): RunResult {
    const { command, redirect } = splitRedirect(line);
    const name = command.split(/\s+/)[0];

    if (name === "history") return { output: this.lines.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join("\n") };
    if (name === "clear") return { clear: true };
    if (name === "exit") return { output: "logout: this is a practice terminal, so there's nowhere to go!" };
    if (name === "vi" || name === "vim") return { error: `${name}: not installed here. Try: nano ${command.split(/\s+/)[1] ?? "file.txt"}` };
    if (redirect && !redirect.target) return { error: "syntax error near unexpected token `newline'" };

    const result = executeCommand(
      command,
      this.dir,
      this.vfs.getFilesystem(),
      (dir) => {
        this.dir = dir;
      },
      (fs) => this.vfs.setFilesystem(fs)
    );

    if (redirect) {
      if (result.error) return { error: result.output };
      const text = result.output ? result.output.replace(/\n$/, "") + "\n" : "";
      const error = this.write(resolvePath(this.dir, redirect.target), text, redirect.append);
      return error ? { error: `${name}: ${redirect.target}: ${error}` } : {};
    }

    return result.error ? { error: result.output } : { output: result.output };
  }

  listDir(path: string): DirEntry[] {
    if (!this.vfs.isDirectory(path)) return [];
    return this.vfs.readdir(path).map((name) => ({
      name,
      dir: this.vfs.isDirectory(this.vfs.normalizePath(`${path}/${name}`)),
    }));
  }

  readFile(path: string): ReadResult {
    if (this.vfs.isDirectory(path)) return { error: `${path}: Is a directory` };
    const parent = path.slice(0, path.lastIndexOf("/")) || "/";
    if (!this.vfs.isDirectory(parent)) return { error: `${path}: No such file or directory` };
    if (this.vfs.isFile(path)) return { content: this.vfs.readFile(path), isNew: false };
    return { content: "", isNew: true };
  }

  writeFile(path: string, content: string): string | null {
    return this.write(path, content, false);
  }

  /** Write (or append) a file; returns an error message on failure */
  private write(path: string, content: string, append: boolean): string | null {
    const parent = path.slice(0, path.lastIndexOf("/")) || "/";
    if (this.vfs.isDirectory(path)) return "Is a directory";
    if (!this.vfs.isDirectory(parent)) return "No such file or directory";

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
