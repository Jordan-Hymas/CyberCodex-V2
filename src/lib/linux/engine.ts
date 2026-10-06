/** Bounded teaching shell. Never executes host commands or reads host files. */
export type Node = { kind: 'file' | 'dir'; text: string; mode: number };
export type Shell = { cwd: string; env: Record<string, string>; files: Record<string, Node>; history: string[] };
export type Result = { output: string; error: string; status: number; clear?: boolean };
const ok = (output = ''): Result => ({ output, error: '', status: 0 });
const fail = (error: string): Result => ({ output: '', error: error + '\n', status: 1 });
export const commands: Record<string, string> = {
  pwd: 'pwd — print working directory', cd: 'cd [directory] — change directory; cd - returns to previous directory',
  ls: 'ls [-al] [path] — list entries; -a includes dotfiles', cat: 'cat [file...] — read files or piped input',
  echo: 'echo [-n] [words...] — print text', printf: 'printf FORMAT [values...] — supports %s, %d, \\n and \\t',
  mkdir: 'mkdir [-p] directory...', touch: 'touch file...', cp: 'cp source destination — copy a file',
  mv: 'mv source destination — move files or directories', rm: 'rm [-rf] path...', rmdir: 'rmdir directory...',
  head: 'head [-n count] [file]', tail: 'tail [-n count] [file]', wc: 'wc [-lwc] [file]',
  grep: 'grep [-invF] pattern [file...] — literal search with optional ^/$ anchors; use -F for literal anchors',
  find: 'find [path] [-name pattern] [-type f|d] — quote wildcard patterns',
  sort: 'sort [-nru] [file]', uniq: 'uniq [-cu] [file] — adjacent duplicate lines',
  cut: 'cut -d delimiter -f field [file] — one field per line', tr: 'tr [-d] SET1 [SET2] — literal sets, a-z, A-Z, 0-9',
  base64: 'base64 [-d] [file] — encode/decode text', rev: 'rev [file] — reverse each line',
  nl: 'nl [file] — number nonempty lines', tee: 'tee [-a] file — copy input to output and a file',
  diff: 'diff first second — show changed lines', chmod: 'chmod MODE path — octal or u/g/o/a +/-/= rwx',
  stat: 'stat path — inspect type, permissions and size', file: 'file path — identify directories/text',
  basename: 'basename path', dirname: 'dirname path', whoami: 'whoami', id: 'id',
  uname: 'uname [-a] — simulated system identification', env: 'env — show shell variables',
  export: 'export NAME=value', unset: 'unset NAME', history: 'history', clear: 'clear',
  true: 'true — exit successfully', false: 'false — exit unsuccessfully',
  test: 'test -f|-d|-e path; test string = string; test number -eq number',
  help: 'help [command]', man: 'man command — supported teaching-shell syntax',
  nano: 'nano [file] — edit a file: ^O write out, ^S save, ^X exit, ^K cut, ^U paste, ^F search, ^G help',
};
export function pathOf(cwd: string, value: string): string {
  const raw = value === '~' ? '/home/user' : value.startsWith('~/') ? '/home/user/' + value.slice(2) : value;
  const parts: string[] = [];
  for (const part of (raw.startsWith('/') ? raw : cwd + '/' + raw).split('/')) {
    if (part === '..') parts.pop(); else if (part && part !== '.') parts.push(part);
  }
  return '/' + parts.join('/');
}
const parent = (p: string) => p.slice(0, p.lastIndexOf('/')) || '/';
export function blankShell(): Shell {
  const s: Shell = { cwd: '/home/user', env: { HOME: '/home/user', USER: 'user', PATH: '/usr/bin:/bin' }, files: {}, history: [] };
  for (const p of ['/', '/home', '/home/user', '/tmp', '/var', '/var/log', '/etc', '/opt', '/opt/academy']) s.files[p] = { kind: 'dir', text: '', mode: 0o755 };
  return s;
}
export function addFile(s: Shell, p: string, text: string, mode = 0o644) {
  p = pathOf('/', p);
  const parts = p.split('/').filter(Boolean); parts.pop(); let d = '';
  for (const part of parts) { d += '/' + part; s.files[d] ??= { kind: 'dir', text: '', mode: 0o755 }; }
  s.files[p] = { kind: 'file', text, mode };
}
function access(s: Shell, p: string) {
  let d = parent(p);
  while (true) { const n = s.files[d]; if (!n || n.kind !== 'dir') throw Error(`${d}: no such directory`); if (!(n.mode & 0o100)) throw Error(`${d}: permission denied`); if (d === '/') break; d = parent(d); }
}
function read(s: Shell, p: string) {
  access(s, p); const n = s.files[p];
  if (!n) throw Error(`${p}: no such file`);
  if (n.kind !== 'file') throw Error(`${p}: is a directory`);
  if (!(n.mode & 0o400)) throw Error(`${p}: permission denied`);
  return n.text;
}
function write(s: Shell, p: string, text: string, append = false) {
  access(s, p); const n = s.files[p];
  if (n?.kind === 'dir') throw Error(`${p}: is a directory`);
  if (!(n ? n.mode & 0o200 : s.files[parent(p)].mode & 0o200)) throw Error(`${p}: permission denied`);
  const value = (append ? n?.text ?? '' : '') + text;
  if (value.length > 65536) throw Error('file size limit (64 KiB) reached');
  if (!n && Object.keys(s.files).length >= 512) throw Error('filesystem limit (512 entries) reached');
  s.files[p] = { kind: 'file', text: value, mode: n?.mode ?? 0o644 };
}
type Token = { text: string; op: boolean; glob: boolean };
function lex(input: string, env: Record<string, string>): Token[] {
  const out: Token[] = []; let text = '', started = false, glob = false, quote = '';
  const push = () => { if (started) out.push({ text, op: false, glob }); text = ''; started = false; glob = false; };
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '\\' && quote !== "'") { if (++i === input.length) throw Error('unfinished escape'); text += input[i]; started = true; continue; }
    if (quote && c === quote) { quote = ''; continue; }
    if (!quote && (c === '"' || c === "'")) { quote = c; started = true; continue; }
    if (c === '$' && quote !== "'") {
      if (input[i + 1] === '(') throw Error('command substitution is not supported in this simulator');
      const match = input.slice(i + 1).match(/^(?:\{([A-Za-z_][A-Za-z_0-9]*)\}|([A-Za-z_][A-Za-z_0-9]*|\?))/);
      if (match) { text += env[match[1] || match[2]] ?? ''; i += match[0].length; started = true; continue; }
    }
    if (!quote && /\s/.test(c)) { push(); continue; }
    if (!quote && c === '#' && !started) break;
    if (!quote && '|&;<>'.includes(c)) {
      push(); let op = c;
      if (input[i + 1] === c && '|&>'.includes(c)) { op += c; i++; }
      if (op === '&' || (op === '<' && input[i + 1] === '<')) throw Error('background jobs and heredocs are not supported');
      out.push({ text: op, op: true, glob: false }); continue;
    }
    if (!quote && c === '`') throw Error('command substitution is not supported');
    if (!quote && '*?'.includes(c)) glob = true;
    text += c; started = true;
  }
  if (quote) throw Error('unclosed quote'); push(); return out;
}
function wildcard(pattern: string) {
  if (pattern.length > 2048 || (pattern.match(/[?*]/g) ?? []).length > 4) throw Error('use at most four wildcard characters');
  return new RegExp('^' + pattern.split('').map(c => c === '*' ? '[^/]*' : c === '?' ? '[^/]' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$');
}
function expand(s: Shell, t: Token): string[] {
  if (!t.glob) return [t.text];
  const p = pathOf(s.cwd, t.text), re = wildcard(p);
  const matches = Object.keys(s.files).filter(f => re.test(f) && (!f.split('/').pop()!.startsWith('.') || p.split('/').pop()!.startsWith('.'))).sort();
  return matches.length ? matches : [t.text];
}
function lines(text: string) { const a = text.split('\n'); if (a.at(-1) === '') a.pop(); return a; }
function run(s: Shell, argv: string[], stdin: string): Result {
  const [cmd, ...raw] = argv;
  if (!cmd) return ok();
  const args = [...raw];
  const take = (flag: string) => { const i = args.indexOf(flag); if (i < 0) return undefined; if (i + 1 >= args.length) throw Error(`${flag}: needs a value`); return args.splice(i, 2)[1]; };
  const flags = new Set<string>();
  // Options with values are parsed before boolean flags.
  const count = ['head', 'tail'].includes(cmd) ? take('-n') : undefined;
  const delim = cmd === 'cut' ? take('-d') : undefined, field = cmd === 'cut' ? take('-f') : undefined;
  const name = cmd === 'find' ? take('-name') : undefined, type = cmd === 'find' ? take('-type') : undefined;
  const allowed: Record<string, string> = { ls: 'al', echo: 'n', mkdir: 'p', rm: 'rf', head: '', tail: '', wc: 'lwc', grep: 'invF', sort: 'nru', uniq: 'cu', tr: 'd', base64: 'd', tee: 'a', uname: 'a' };
  if (cmd in allowed) {
    let end = false;
    for (let i = 0; i < args.length;) {
      if (args[i] === '--') { args.splice(i, 1); end = true; continue; }
      if (!end && args[i].startsWith('-') && args[i] !== '-') {
        for (const f of args[i].slice(1)) { if (!allowed[cmd].includes(f)) throw Error(`${cmd}: unsupported option -${f}; try man ${cmd}`); flags.add(f); }
        args.splice(i, 1);
      } else i++;
    }
  }
  const p = (v: string) => pathOf(s.cwd, v);
  const requireArgs = (n: number) => { if (args.length < n) throw Error(`${cmd}: missing operand; try man ${cmd}`); };
  const input = () => args.length ? args.map(a => a === '-' ? stdin : read(s, p(a))).join('') : stdin;
  switch (cmd) {
    case 'nano': throw Error('nano: run nano on its own line, e.g. nano notes.txt');
    case 'help': case 'man': return ok(args[0] ? (commands[args[0]] ?? 'No manual for this command') + '\n' : 'CyberCodex teaching shell (bounded simulation, not a full Linux OS).\n' + Object.values(commands).join('\n') + '\nOperators: | > >> < && || ; — quotes, $VARIABLE and * ? globbing.\n');
    case 'pwd': return ok(s.cwd + '\n');
    case 'cd': { const dest = p(args[0] === '-' ? s.env.OLDPWD ?? s.cwd : args[0] ?? s.env.HOME); access(s, dest); const n = s.files[dest]; if (!n || n.kind !== 'dir') throw Error(`${dest}: not a directory`); if (!(n.mode & 0o100)) throw Error(`${dest}: permission denied`); s.env.OLDPWD = s.cwd; s.cwd = dest; return ok(args[0] === '-' ? dest + '\n' : ''); }
    case 'echo': return ok(args.join(' ') + (flags.has('n') ? '' : '\n'));
    case 'printf': { requireArgs(1); let i = 1; return ok(args[0].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/%[%sd]/g, f => f === '%%' ? '%' : f === '%d' ? String(Number(args[i++] ?? 0)) : args[i++] ?? '')); }
    case 'ls': {
      const result: string[] = [];
      for (const arg of args.length ? args : ['.']) {
        const dest = p(arg); access(s, dest); const n = s.files[dest]; if (!n) throw Error(`${dest}: no such file`);
        if (n.kind === 'dir' && !(n.mode & 0o400)) throw Error(`${dest}: permission denied`);
        const entries = n.kind === 'file' ? [dest] : Object.keys(s.files).filter(f => parent(f) === dest && f !== dest && (flags.has('a') || !f.split('/').pop()!.startsWith('.'))).sort();
        for (const f of entries) { const node = s.files[f]; result.push((flags.has('l') ? `${node.kind === 'dir' ? 'd' : '-'}${[8,7,6,5,4,3,2,1,0].map((b, i) => node.mode & (1 << b) ? 'rwx'[i % 3] : '-').join('')} user ${node.text.length} ` : '') + f.split('/').pop()); }
      } return ok(result.join('\n') + (result.length ? '\n' : ''));
    }
    case 'cat': return ok(input());
    case 'mkdir': requireArgs(1); for (const arg of args) { const dest = p(arg); if (s.files[dest]) { if (flags.has('p') && s.files[dest].kind === 'dir') continue; throw Error(`${dest}: exists`); } const dirs = flags.has('p') ? dest.split('/').filter(Boolean).map((_, i, a) => '/' + a.slice(0, i + 1).join('/')) : [dest]; for (const d of dirs) { if (s.files[d]?.kind === 'dir') continue; if (s.files[d]) throw Error(`${d}: not a directory`); access(s, d); if (!(s.files[parent(d)].mode & 0o200)) throw Error('permission denied'); if (Object.keys(s.files).length >= 512) throw Error('filesystem limit reached'); s.files[d] = { kind: 'dir', text: '', mode: 0o755 }; } } return ok();
    case 'touch': requireArgs(1); for (const arg of args) { if (!s.files[p(arg)]) write(s, p(arg), ''); } return ok();
    case 'cp': case 'mv': { requireArgs(2); if (args.length !== 2) throw Error('use one source and one destination'); const src = p(args[0]); let dest = p(args[1]); const node = s.files[src]; if (!node) throw Error('source does not exist'); if (s.files[dest]?.kind === 'dir') dest += '/' + src.split('/').pop(); if (src === dest) throw Error('source and destination are the same'); if (cmd === 'cp') { write(s, dest, read(s, src)); return ok(); } if (src === '/' || dest.startsWith(src + '/') || s.files[dest]?.kind === 'dir') throw Error('invalid move'); access(s, src); access(s, dest); if (!(s.files[parent(src)].mode & 0o200) || !(s.files[parent(dest)].mode & 0o200)) throw Error('permission denied'); const paths = Object.keys(s.files).filter(f => f === src || f.startsWith(src + '/')); for (const f of paths) { s.files[dest + f.slice(src.length)] = s.files[f]; delete s.files[f]; } if (s.cwd === src || s.cwd.startsWith(src + '/')) s.cwd = dest + s.cwd.slice(src.length); return ok(); }
    case 'rm': case 'rmdir': requireArgs(1); for (const arg of args) { const dest = p(arg), n = s.files[dest]; if (!n) { if (flags.has('f')) continue; throw Error('no such file'); } if (dest === '/' || s.cwd === dest || s.cwd.startsWith(dest + '/')) throw Error('cannot remove root or current directory'); access(s, dest); if (!(s.files[parent(dest)].mode & 0o200)) throw Error('permission denied'); const children = Object.keys(s.files).filter(f => f.startsWith(dest + '/')); if (cmd === 'rmdir' && n.kind !== 'dir') throw Error('not a directory'); if (n.kind === 'dir' && (cmd === 'rm' && !flags.has('r') || cmd === 'rmdir' && children.length)) throw Error('directory requires -r or must be empty'); for (const f of children) delete s.files[f]; delete s.files[dest]; } return ok();
    case 'head': case 'tail': { const n = Number(count ?? 10); if (!Number.isInteger(n) || n < 0 || n > 65536) throw Error('invalid line count'); const a = lines(input()); const picked = cmd === 'head' ? a.slice(0, n) : n ? a.slice(-n) : []; return ok(picked.length ? picked.join('\n') + '\n' : ''); }
    case 'wc': { const text = input(); const values: number[] = []; if (!flags.size || flags.has('l')) values.push((text.match(/\n/g) ?? []).length); if (!flags.size || flags.has('w')) values.push(text.trim() ? text.trim().split(/\s+/).length : 0); if (!flags.size || flags.has('c')) values.push(Buffer.byteLength(text)); return ok(values.join(' ') + '\n'); }
    case 'grep': {
      requireArgs(1);
      const pattern = args.shift()!;
      if (pattern.length > 128) throw Error('pattern too long');
      const anchoredStart = !flags.has('F') && pattern.startsWith('^');
      const anchoredEnd = !flags.has('F') && pattern.endsWith('$');
      const literal = pattern.slice(anchoredStart ? 1 : 0, anchoredEnd ? -1 : undefined);
      if (!flags.has('F') && /[.*?()[\]{}+|\\]/.test(literal)) throw Error('full regular expressions are not supported; use -F for literal text');
      const needle = flags.has('i') ? literal.toLowerCase() : literal;
      const matches = lines(input()).flatMap((line, i) => {
        const value = flags.has('i') ? line.toLowerCase() : line;
        const yes = anchoredStart && anchoredEnd ? value === needle : anchoredStart ? value.startsWith(needle) : anchoredEnd ? value.endsWith(needle) : value.includes(needle);
        return yes !== flags.has('v') ? [(flags.has('n') ? `${i + 1}:` : '') + line] : [];
      });
      return { output: matches.length ? matches.join('\n') + '\n' : '', error: '', status: matches.length ? 0 : 1 };
    }
    case 'find': { const root = p(args[0] ?? '.'); if (!s.files[root]) throw Error('no such starting path'); if (type && !['f', 'd'].includes(type)) throw Error('use -type f or d'); const re = name ? wildcard(name) : null; const found = Object.keys(s.files).filter(f => (f === root || f.startsWith(root === '/' ? '/' : root + '/')) && (!type || s.files[f].kind === (type === 'f' ? 'file' : 'dir')) && (!re || re.test(f.split('/').pop()!))); return ok(found.sort().join('\n') + (found.length ? '\n' : '')); }
    case 'sort': { let a = lines(input()).sort(flags.has('n') ? (a,b) => parseFloat(a) - parseFloat(b) : undefined); if (flags.has('r')) a.reverse(); if (flags.has('u')) a = [...new Set(a)]; return ok(a.length ? a.join('\n') + '\n' : ''); }
    case 'uniq': { const groups: { text: string; count: number }[] = []; for (const line of lines(input())) { const last = groups.at(-1); if (last?.text === line) last.count++; else groups.push({ text: line, count: 1 }); } const out = groups.filter(g => !flags.has('u') || g.count === 1).map(g => (flags.has('c') ? `${g.count} ` : '') + g.text); return ok(out.length ? out.join('\n') + '\n' : ''); }
    case 'cut': { const index = Number(field); if (!delim || delim.length !== 1 || !Number.isInteger(index) || index < 1) throw Error('use cut -d delimiter -f positive-field-number'); return ok(lines(input()).map(l => l.includes(delim) ? l.split(delim)[index - 1] ?? '' : l).join('\n') + '\n'); }
    case 'tr': { requireArgs(flags.has('d') ? 1 : 2); const sets = (x: string) => x.replace(/a-z/g, 'abcdefghijklmnopqrstuvwxyz').replace(/A-Z/g, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').replace(/0-9/g, '0123456789').replace(/\\n/g, '\n').replace(/\\t/g, '\t'); const from = sets(args[0]), to = sets(args[1] ?? ''); return ok([...stdin].map(c => { const i = from.indexOf(c); return i < 0 ? c : flags.has('d') ? '' : to[Math.min(i, to.length - 1)] ?? ''; }).join('')); }
    case 'base64': { const text = input(); if (flags.has('d')) { const clean = text.replace(/\s/g, ''); if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clean)) throw Error('invalid base64'); return ok(Buffer.from(clean, 'base64').toString('utf8')); } return ok(Buffer.from(text).toString('base64') + '\n'); }
    case 'rev': return ok(lines(input()).map(l => [...l].reverse().join('')).join('\n') + '\n');
    case 'nl': return ok(lines(input()).map((l, i) => l ? `${i + 1}\t${l}` : '').join('\n') + '\n');
    case 'tee': requireArgs(1); for (const arg of args) write(s, p(arg), stdin, flags.has('a')); return ok(stdin);
    case 'diff': { requireArgs(2); const a = lines(read(s, p(args[0]))), b = lines(read(s, p(args[1]))); const out: string[] = []; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { if (a[i] !== undefined) out.push('< ' + a[i]); if (b[i] !== undefined) out.push('> ' + b[i]); } return { output: out.join('\n') + (out.length ? '\n' : ''), error: '', status: out.length ? 1 : 0 }; }
    case 'chmod': { requireArgs(2); const mode = args.shift()!; for (const arg of args) { const dest = p(arg); access(s, dest); const n = s.files[dest]; if (!n) throw Error('no such file'); if (/^[0-7]{3}$/.test(mode)) n.mode = parseInt(mode, 8); else { const m = mode.match(/^([ugoa]+)([+=-])([rwx]+)$/); if (!m) throw Error('unsupported permission syntax'); for (const [who, shift] of [['u',6],['g',3],['o',0]] as const) if (m[1].includes(who) || m[1].includes('a')) { const bits = (m[3].includes('r') ? 4 : 0) | (m[3].includes('w') ? 2 : 0) | (m[3].includes('x') ? 1 : 0); n.mode = m[2] === '+' ? n.mode | bits << shift : m[2] === '-' ? n.mode & ~(bits << shift) : (n.mode & ~(7 << shift)) | bits << shift; } } } return ok(); }
    case 'stat': case 'file': requireArgs(1); return ok(args.map(arg => { const dest = p(arg); access(s, dest); const n = s.files[dest]; if (!n) throw Error('no such file'); return `${arg}: ${n.kind === 'dir' ? 'directory' : 'text file'}${cmd === 'stat' ? ` mode=${n.mode.toString(8)} bytes=${Buffer.byteLength(n.text)}` : ''}`; }).join('\n') + '\n');
    case 'basename': requireArgs(1); return ok(args[0].replace(/\/+$/, '').split('/').pop() + '\n');
    case 'dirname': requireArgs(1); return ok((args[0].includes('/') ? parent(args[0].replace(/\/+$/, '')) : '.') + '\n');
    case 'whoami': return ok('user\n'); case 'id': return ok('uid=1000(user) gid=1000(user) groups=1000(user)\n');
    case 'uname': return ok(flags.has('a') ? 'Linux cybercodex teaching-simulator (no host kernel access)\n' : 'Linux (simulated)\n');
    case 'env': return ok(Object.entries(s.env).filter(([k]) => k !== '?').map(([k,v]) => `${k}=${v}`).join('\n') + '\n');
    case 'export': requireArgs(1); for (const arg of args) { const m = arg.match(/^([A-Za-z_][A-Za-z_0-9]*)=([\s\S]*)$/); if (!m) throw Error('use export NAME=value'); if (['HOME','USER','PATH'].includes(m[1])) throw Error('this simulator keeps HOME, USER and PATH fixed'); s.env[m[1]] = m[2]; } return ok();
    case 'unset': requireArgs(1); for (const arg of args) if (!['HOME','USER','PATH'].includes(arg)) delete s.env[arg]; return ok();
    case 'history': return ok(s.history.map((v,i) => `${i + 1}  ${v}`).join('\n') + '\n');
    case 'clear': return { ...ok(), clear: true }; case 'true': return ok(); case 'false': return { ...ok(), status: 1 };
    case 'test': { let pass = false; if (['-f','-d','-e'].includes(args[0])) { const n = s.files[p(args[1] ?? '')]; pass = !!n && (args[0] === '-e' || n.kind === (args[0] === '-f' ? 'file' : 'dir')); } else if (args[1] === '=') pass = args[0] === args[2]; else if (args[1] === '-eq') pass = Number(args[0]) === Number(args[2]); else throw Error('unsupported test expression'); return { ...ok(), status: pass ? 0 : 1 }; }
    default: return fail(`${cmd}: command not supported; type help for the supported command set`);
  }
}
export function execute(s: Shell, input: string): Result {
  if (input.length > 2048) return fail('command limit: 2048 characters');
  if (!input.trim()) return ok();
  s.history = [...s.history, input].slice(-100);
  try {
    const tokens = lex(input, s.env);
    if (tokens.length > 256) throw Error('too many command tokens');
    let output = '', error = '', last = 0, clear = false;
    const groups: { tokens: Token[]; when: string }[] = []; let group: Token[] = [], when = ';';
    for (const t of tokens) if (t.op && [';', '&&', '||'].includes(t.text)) { if (!group.length) throw Error('missing command'); groups.push({ tokens: group, when }); group = []; when = t.text; } else group.push(t);
    if (group.length) groups.push({ tokens: group, when }); else if (when !== ';') throw Error('missing command after operator');
    for (const g of groups) {
      if (g.when === '&&' && last !== 0 || g.when === '||' && last === 0) continue;
      const pipeline: Token[][] = [[]]; for (const t of g.tokens) { if (t.op && t.text === '|') pipeline.push([]); else pipeline.at(-1)!.push(t); }
      let stream = '';
      for (const part of pipeline) {
        if (!part.length) throw Error('missing pipeline command');
        const argv: string[] = []; let target: string | undefined, append = false;
        for (let i = 0; i < part.length; i++) {
          const t = part[i];
          if (t.op) { const next = part[++i]; if (!next || next.op) throw Error('missing redirection path'); const expanded = expand(s, next); if (expanded.length !== 1) throw Error('ambiguous redirection'); const path = pathOf(s.cwd, expanded[0]); if (t.text === '<') stream = read(s, path); else if (t.text === '>' || t.text === '>>') { target = path; append = t.text === '>>'; write(s, path, '', append); } else throw Error('unsupported operator'); }
          else argv.push(...expand(s, t));
        }
        let result: Result; try { result = run(s, argv, stream); } catch (e) { result = fail((e as Error).message); }
        last = result.status; s.env['?'] = String(last); error += result.error; clear ||= !!result.clear; stream = result.output;
        if (target) { write(s, target, stream, append); stream = ''; }
      }
      output += stream;
    }
    return { output: output.slice(0, 65536), error: error.slice(0, 4096), status: last, clear };
  } catch (e) { return fail((e as Error).message); }
}

/** Directory entries for tab completion. Respects traverse and read bits like ls. */
export function listDir(s: Shell, path: string): { name: string; dir: boolean }[] {
  const dest = pathOf(s.cwd, path);
  try { access(s, dest); } catch { return []; }
  const n = s.files[dest];
  if (!n || n.kind !== 'dir' || !(n.mode & 0o400) || !(n.mode & 0o100)) return [];
  return Object.keys(s.files).filter(f => f !== dest && parent(f) === dest).sort()
    .map(f => ({ name: f.split('/').pop()!, dir: s.files[f].kind === 'dir' })).slice(0, 512);
}
/** Open a file for the nano editor. A missing file in a writable directory opens as new. */
export function readForEdit(s: Shell, path: string): { path: string; text: string; isNew: boolean } {
  const dest = pathOf(s.cwd, path);
  access(s, dest);
  const n = s.files[dest];
  if (!n) {
    if (s.files[parent(dest)]?.kind !== 'dir') throw Error(`${path}: no such directory`);
    return { path: dest, text: '', isNew: true };
  }
  return { path: dest, text: read(s, dest), isNew: false };
}
/** Save editor contents with the same permission and size rules as redirection. */
export function saveFile(s: Shell, path: string, text: string): string {
  const dest = pathOf(s.cwd, path);
  write(s, dest, text);
  return dest;
}
