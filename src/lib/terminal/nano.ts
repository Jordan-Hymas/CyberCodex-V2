/**
 * A small nano clone that renders into xterm.js on the alternate screen.
 *
 * Supported: typing, arrows, Home/End, PgUp/PgDn, Enter/Backspace/Delete,
 * ^O write out, ^S save, ^X exit (asks to save), ^K cut line, ^U paste,
 * ^F / ^W search, ^C cursor position, ^G help, ^A / ^E line start/end.
 *
 * Browsers reserve Ctrl+W, Ctrl+T and Ctrl+N, so ^F is offered for search.
 */

export interface NanoHost {
  write: (data: string) => void;
  cols: () => number;
  rows: () => number;
  /** Save file contents; returns an error message on failure */
  save: (path: string, content: string) => string | null;
  /** Resolve a filename typed at the "File Name to Write" prompt */
  resolve: (name: string) => string;
  /** Inverse of resolve: how to show a path (relative to the shell's cwd) */
  relative: (path: string) => string;
  /** Called when the editor closes */
  exit: () => void;
}

type PromptKind = "writeout" | "exit-save" | "search";

interface Prompt {
  kind: PromptKind;
  label: string;
  value: string;
  /** Exit after a successful write (from ^X → Y) */
  exitAfter?: boolean;
}

const ESC = "\x1b";
const CSI = `${ESC}[`;
// Truecolor styles matching the site palette
const TITLE = `${CSI}48;2;160;124;255m${CSI}38;2;18;19;43m`; // violet bar, ink text
const KEY = `${CSI}48;2;61;252;138m${CSI}38;2;18;19;43m`; // mint key caps
const STATUS = `${CSI}48;2;255;210;63m${CSI}38;2;18;19;43m`; // gold status
const MUTED = `${CSI}38;2;150;156;210m`;
const RESET = `${CSI}0m`;

const SHORTCUTS: [string, string][][] = [
  [["^G", "Help"], ["^O", "Write Out"], ["^F", "Where Is"], ["^K", "Cut"], ["^C", "Location"]],
  [["^X", "Exit"], ["^S", "Save"], ["^U", "Paste"], ["^A", "Home"], ["^E", "End"]],
];

const HELP_TEXT = [
  "nano help",
  "",
  "Type to insert text. Use the arrow keys to move around.",
  "",
  "  ^O  Write Out (save, asks for a file name)",
  "  ^S  Save to the current file",
  "  ^X  Exit (asks to save if there are changes)",
  "  ^K  Cut the current line    ^U  Paste cut lines",
  "  ^F  Search (^W also works outside the browser)",
  "  ^C  Show cursor position    ^A / ^E  Start / end of line",
  "  PgUp / PgDn  Scroll a page  (or ^Y / ^V)",
  "",
  "In this course terminal, browser shortcuts like Ctrl+W, Ctrl+T and",
  "Ctrl+N belong to the browser, so use ^F to search.",
  "",
  "Press any key to return to your file.",
];

export class NanoEditor {
  private lines: string[];
  private row = 0;
  private col = 0;
  private top = 0;
  private left = 0;
  private modified = false;
  private status = "";
  private prompt: Prompt | null = null;
  private cutBuffer: string[] = [];
  private lastWasCut = false;
  private showingHelp = false;
  private lastSearch = "";

  constructor(
    private host: NanoHost,
    private path: string | null,
    content: string,
    isNewFile: boolean
  ) {
    this.lines = content.replace(/\r\n/g, "\n").split("\n");
    // Files usually end with a newline; don't show it as an extra empty line
    if (this.lines.length > 1 && this.lines[this.lines.length - 1] === "") this.lines.pop();
    if (this.lines.length === 0) this.lines = [""];
    this.status = isNewFile ? "[ New File ]" : `[ Read ${this.lines.length} line${this.lines.length === 1 ? "" : "s"} ]`;
  }

  open() {
    this.host.write(`${CSI}?1049h`); // alternate screen
    this.render();
  }

  private close() {
    this.host.write(`${CSI}?1049l`);
    this.host.exit();
  }

  /** Content as saved to disk (always newline-terminated) */
  getContent() {
    return this.lines.join("\n") + "\n";
  }

  // ---------------------------------------------------------------- input

  handleData(data: string) {
    if (this.showingHelp) {
      this.showingHelp = false;
      this.render();
      return;
    }

    if (this.prompt) {
      this.handlePromptData(data);
      this.render();
      return;
    }

    // Pasted text: insert it all at once
    if (data.length > 1 && !data.startsWith(ESC)) {
      for (const ch of data.replace(/\r\n?/g, "\n")) {
        if (ch === "\n") this.newline();
        else if (ch >= " " || ch === "\t") this.insert(ch === "\t" ? "    " : ch);
      }
      this.render();
      return;
    }

    const wasCut = this.lastWasCut;
    this.lastWasCut = false;
    this.status = "";

    switch (data) {
      case "\r":
        this.newline();
        break;
      case "\x7f":
      case "\b":
        this.backspace();
        break;
      case `${CSI}3~`:
        this.deleteForward();
        break;
      case "\t":
        this.insert("    ");
        break;
      case `${CSI}A`:
        this.moveVertical(-1);
        break;
      case `${CSI}B`:
        this.moveVertical(1);
        break;
      case `${CSI}C`:
        this.moveRight();
        break;
      case `${CSI}D`:
        this.moveLeft();
        break;
      case `${CSI}H`:
      case `${CSI}1~`:
      case `${ESC}OH`:
      case "\x01": // ^A
        this.col = 0;
        break;
      case `${CSI}F`:
      case `${CSI}4~`:
      case `${ESC}OF`:
      case "\x05": // ^E
        this.col = this.lines[this.row].length;
        break;
      case `${CSI}5~`:
      case "\x19": // ^Y
        this.moveVertical(-this.textRows());
        break;
      case `${CSI}6~`:
      case "\x16": // ^V
        this.moveVertical(this.textRows());
        break;
      case "\x0f": // ^O
        this.prompt = { kind: "writeout", label: "File Name to Write", value: this.path ? this.displayName() : "" };
        break;
      case "\x13": // ^S
        if (this.path) this.writeTo(this.path);
        else this.prompt = { kind: "writeout", label: "File Name to Write", value: "" };
        break;
      case "\x18": // ^X
        if (!this.modified) {
          this.close();
          return;
        }
        this.prompt = { kind: "exit-save", label: "Save modified buffer?  Y Yes  N No  ^C Cancel", value: "" };
        break;
      case "\x0b": // ^K
        this.cutLine(wasCut);
        this.lastWasCut = true;
        break;
      case "\x15": // ^U
        this.paste();
        break;
      case "\x06": // ^F
      case "\x17": // ^W
        this.prompt = { kind: "search", label: this.lastSearch ? `Search [${this.lastSearch}]` : "Search", value: "" };
        break;
      case "\x03": // ^C
        this.status = `line ${this.row + 1}/${this.lines.length} (${Math.round(((this.row + 1) / this.lines.length) * 100)}%), col ${this.col + 1}/${this.lines[this.row].length + 1}`;
        break;
      case "\x07": // ^G
        this.showingHelp = true;
        this.renderHelp();
        return;
      default:
        if (data.length === 1 && data >= " " && data !== "\x7f") this.insert(data);
        else if (data.startsWith(ESC)) {
          // Unhandled escape sequence: ignore
        }
    }

    this.render();
  }

  private handlePromptData(data: string) {
    const prompt = this.prompt!;

    if (prompt.kind === "exit-save") {
      const key = data.toLowerCase();
      if (key === "y") {
        if (this.path) {
          if (this.writeTo(this.path)) this.close();
          this.prompt = null;
        } else {
          this.prompt = { kind: "writeout", label: "File Name to Write", value: "", exitAfter: true };
        }
      } else if (key === "n") {
        this.prompt = null;
        this.close();
      } else if (data === "\x03") {
        this.prompt = null;
        this.status = "[ Cancelled ]";
      }
      return;
    }

    if (data === "\x03" || data === ESC) {
      this.prompt = null;
      this.status = "[ Cancelled ]";
    } else if (data === "\r") {
      this.submitPrompt(prompt);
    } else if (data === "\x7f" || data === "\b") {
      prompt.value = prompt.value.slice(0, -1);
    } else if (!data.startsWith(ESC)) {
      prompt.value += data.replace(/[\x00-\x1f]/g, "");
    }
  }

  private submitPrompt(prompt: Prompt) {
    this.prompt = null;

    if (prompt.kind === "writeout") {
      const name = prompt.value.trim();
      if (!name) {
        this.status = "[ Cancelled ]";
        return;
      }
      const path = this.host.resolve(name);
      if (this.writeTo(path)) {
        this.path = path;
        if (prompt.exitAfter) this.close();
      }
      return;
    }

    if (prompt.kind === "search") {
      const term = prompt.value || this.lastSearch;
      if (!term) {
        this.status = "[ Cancelled ]";
        return;
      }
      this.lastSearch = term;
      this.search(term);
    }
  }

  // -------------------------------------------------------------- editing

  private insert(text: string) {
    const line = this.lines[this.row];
    this.lines[this.row] = line.slice(0, this.col) + text + line.slice(this.col);
    this.col += text.length;
    this.modified = true;
  }

  private newline() {
    const line = this.lines[this.row];
    // Carry the current indentation onto the new line
    const indent = line.match(/^\s*/)?.[0].slice(0, this.col) ?? "";
    this.lines.splice(this.row, 1, line.slice(0, this.col), indent + line.slice(this.col));
    this.row++;
    this.col = indent.length;
    this.modified = true;
  }

  private backspace() {
    if (this.col > 0) {
      const line = this.lines[this.row];
      this.lines[this.row] = line.slice(0, this.col - 1) + line.slice(this.col);
      this.col--;
      this.modified = true;
    } else if (this.row > 0) {
      const prevLen = this.lines[this.row - 1].length;
      this.lines[this.row - 1] += this.lines[this.row];
      this.lines.splice(this.row, 1);
      this.row--;
      this.col = prevLen;
      this.modified = true;
    }
  }

  private deleteForward() {
    const line = this.lines[this.row];
    if (this.col < line.length) {
      this.lines[this.row] = line.slice(0, this.col) + line.slice(this.col + 1);
      this.modified = true;
    } else if (this.row < this.lines.length - 1) {
      this.lines[this.row] += this.lines[this.row + 1];
      this.lines.splice(this.row + 1, 1);
      this.modified = true;
    }
  }

  private cutLine(append: boolean) {
    const [cut] = this.lines.splice(this.row, 1);
    this.cutBuffer = append ? [...this.cutBuffer, cut] : [cut];
    if (this.lines.length === 0) this.lines = [""];
    this.row = Math.min(this.row, this.lines.length - 1);
    this.col = 0;
    this.modified = true;
  }

  private paste() {
    if (this.cutBuffer.length === 0) {
      this.status = "[ Cut buffer is empty ]";
      return;
    }
    this.lines.splice(this.row, 0, ...this.cutBuffer);
    this.row += this.cutBuffer.length;
    this.col = 0;
    this.modified = true;
  }

  private search(term: string) {
    const total = this.lines.length;
    for (let i = 0; i <= total; i++) {
      const r = (this.row + i) % total;
      const from = i === 0 ? this.col + 1 : 0;
      const idx = this.lines[r].indexOf(term, from);
      if (idx !== -1) {
        const wrapped = i > 0 && r <= this.row;
        if (wrapped && r === this.row && idx === this.col) this.status = "[ This is the only occurrence ]";
        else if (wrapped) this.status = "[ Search Wrapped ]";
        this.row = r;
        this.col = idx;
        return;
      }
    }
    this.status = `[ "${term}" not found ]`;
  }

  private writeTo(path: string): boolean {
    const error = this.host.save(path, this.getContent());
    if (error) {
      this.status = `[ Error writing ${path}: ${error} ]`;
      return false;
    }
    this.modified = false;
    this.status = `[ Wrote ${this.lines.length} line${this.lines.length === 1 ? "" : "s"} ]`;
    return true;
  }

  // ------------------------------------------------------------- movement

  private moveVertical(delta: number) {
    this.row = Math.max(0, Math.min(this.lines.length - 1, this.row + delta));
    this.col = Math.min(this.col, this.lines[this.row].length);
  }

  private moveLeft() {
    if (this.col > 0) this.col--;
    else if (this.row > 0) {
      this.row--;
      this.col = this.lines[this.row].length;
    }
  }

  private moveRight() {
    if (this.col < this.lines[this.row].length) this.col++;
    else if (this.row < this.lines.length - 1) {
      this.row++;
      this.col = 0;
    }
  }

  // ------------------------------------------------------------ rendering

  /** Rows available for text: total minus title, status and two help rows */
  private textRows() {
    return Math.max(1, this.host.rows() - 4);
  }

  private displayName() {
    return this.path ? this.host.relative(this.path) : "";
  }

  private pad(text: string, width: number) {
    return text.length >= width ? text.slice(0, width) : text + " ".repeat(width - text.length);
  }

  private titleBar(cols: number) {
    const left = "  GNU nano 7.2";
    const name = this.path ? this.displayName() : "New Buffer";
    const right = this.modified ? "Modified  " : "";
    const space = Math.max(1, cols - left.length - right.length);
    const centered = this.pad(" ".repeat(Math.max(0, Math.floor((space - name.length) / 2))) + name, space);
    return `${TITLE}${this.pad(left + centered + right, cols)}${RESET}`;
  }

  private shortcutRow(items: [string, string][], cols: number) {
    const cell = Math.floor(cols / items.length);
    return items
      .map(([key, label]) => `${KEY}${key}${RESET} ${this.pad(label, Math.max(0, cell - key.length - 1))}`)
      .join("");
  }

  private render() {
    const cols = this.host.cols();
    const textRows = this.textRows();

    // Keep the cursor in view
    if (this.row < this.top) this.top = this.row;
    if (this.row >= this.top + textRows) this.top = this.row - textRows + 1;
    if (this.col < this.left) this.left = this.col;
    if (this.col >= this.left + cols) this.left = this.col - cols + 1;

    let out = `${CSI}?25l${CSI}H`;
    out += this.titleBar(cols) + "\r\n";

    for (let i = 0; i < textRows; i++) {
      const line = this.lines[this.top + i];
      out += `${CSI}2K`;
      if (line !== undefined) out += line.slice(this.left, this.left + cols);
      out += "\r\n";
    }

    // Status / prompt line
    out += `${CSI}2K`;
    if (this.prompt) {
      out += `${STATUS}${this.pad(`${this.prompt.label}: ${this.prompt.value}`, cols)}${RESET}`;
    } else if (this.status) {
      const msg = this.status;
      const lead = Math.max(0, Math.floor((cols - msg.length) / 2));
      out += " ".repeat(lead) + `${STATUS}${msg}${RESET}`;
    }
    out += "\r\n";

    out += `${CSI}2K${this.shortcutRow(SHORTCUTS[0], cols)}\r\n`;
    out += `${CSI}2K${this.shortcutRow(SHORTCUTS[1], cols)}`;

    // Place the cursor
    if (this.prompt) {
      const promptCol = Math.min(cols, this.prompt.label.length + 2 + this.prompt.value.length + 1);
      out += `${CSI}${textRows + 2};${promptCol}H`;
    } else {
      out += `${CSI}${this.row - this.top + 2};${this.col - this.left + 1}H`;
    }
    out += `${CSI}?25h`;
    this.host.write(out);
  }

  private renderHelp() {
    const cols = this.host.cols();
    let out = `${CSI}?25l${CSI}H${CSI}2J`;
    out += this.titleBar(cols) + "\r\n\r\n";
    for (const line of HELP_TEXT) out += `  ${line.startsWith("  ") ? line : MUTED + line + RESET}\r\n`;
    this.host.write(out);
  }

  /** Re-render after the terminal is resized */
  resize() {
    if (this.showingHelp) this.renderHelp();
    else this.render();
  }
}
