/**
 * Built-in challenge programs for the Operator missions.
 *
 * The flag lives in /flag, owned by root and unreadable by the learner. These programs
 * run "as root" (server-side TypeScript, never learner text): each one checks how it was
 * invoked (path, directory, arguments, where its streams point, which variables reached it)
 * and releases the flag only when the technique being taught was used. Per-instance
 * secrets (keys, chosen directories) live in root-owned files under /var/lib/relay.
 */
import { randomInt } from 'node:crypto';
import { pathOf, type Invocation, type Result, type Shell } from './engine';

type Program = (s: Shell, call: Invocation, arg: string) => Result;

const ok = (output: string, error = ''): Result => ({ output, error, status: 0 });
const refuse = (error: string, status = 1): Result => ({ output: '', error: error + '\n', status });
const flag = (s: Shell) => s.files['/flag']?.text.trim() ?? '';
const secret = (s: Shell, name: string) => s.files['/var/lib/relay/' + name]?.text.trim() ?? '';
const dirOf = (p: string) => p.slice(0, p.lastIndexOf('/')) || '/';
const baseOf = (p = '') => p.split('/').pop() ?? '';
const reverse = (t: string) => [...t].reverse().join('');
const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[randomInt(16)]).join('');
const pick = <T,>(a: T[]) => a[randomInt(a.length)];
const lines = (t: string) => t.split('\n').filter(Boolean);

const programs: Record<string, Program> = {
  /** Runs only when started by an absolute path. */
  'absolute-only': (s, c) => c.invoked.startsWith('/')
    ? ok(`Absolute path confirmed: ${c.invoked}\nRelease code: ${flag(s)}\n`)
    : refuse(`beacon: refused. You started me as "${c.invoked}", which is relative to wherever you are standing.\nStart me by my absolute path, the one that begins at /.`),

  /** Runs only from its own directory, started with ./ */
  'dot-slash': (s, c) => {
    const home = dirOf(c.path);
    if (c.invoked.startsWith('/')) return refuse(`uplink: that was an absolute path. This time, stand in ${home} and start me relative to it.`);
    if (s.cwd !== home) return refuse(`uplink: run me from my own directory, ${home}. You are in ${s.cwd}.`);
    if (!c.invoked.startsWith('./')) return refuse('uplink: start me with ./ so Linux knows you mean the program in this directory.');
    return ok(`Relative launch confirmed: ${c.invoked} from ${s.cwd}\nRelease code: ${flag(s)}\n`);
  },

  /** Runs only from a per-instance directory, by absolute path. */
  'launch-site': (s, c) => {
    const site = secret(s, 'site');
    if (s.cwd !== site) return refuse(`ignite: wrong launch site. I only fire from ${site}, and you are in ${s.cwd}.\ncd there, then start me again by my absolute path.`);
    if (!c.invoked.startsWith('/')) return refuse(`ignite: right place. Now start me by my absolute path (${c.path}), not "${c.invoked}".`);
    return ok(`Launched from ${site}.\nRelease code: ${flag(s)}\n`);
  },

  'print-flag': s => ok(`Live launcher online.\nRelease code: ${flag(s)}\n`),
  /** Prints a planted decoy from a root-owned file (arg = secret name). */
  'print-secret': (s, _c, arg) => ok(`Legacy launcher (retired 2024, do not use).\nRelease code: ${secret(s, arg)}\n`),

  /** A privileged file reader: an argument that takes its own argument. */
  'file-reader': (s, c) => {
    const [option, file] = c.args;
    if (!option) return refuse('usage: vault --export FILE\nvault: no option given. The README in /opt/vault explains the options.');
    if (option !== '--export') return refuse(`vault: unknown option ${option}. See /opt/vault/README.`);
    if (!file) return refuse('vault: --export needs the path of the file to read, e.g. vault --export /etc/hostname');
    const path = pathOf(c.cwd, file), node = s.files[path];
    if (!node) return refuse(`vault: ${path}: no such file`);
    if (node.kind === 'dir') return refuse(`vault: ${path} is a directory`);
    // vault runs as root, so permissions do not stop it
    return ok(node.text.endsWith('\n') ? node.text : node.text + '\n');
  },

  /** Documents itself through --help. */
  'help-key': (s, c) => {
    const key = secret(s, 'key'), [option, value] = c.args;
    const help = 'usage: codegen [OPTION]\n  -h, --help        show this help and exit\n  -v, --version     show the version and exit\n  -s, --show-key    print the release key that --key expects\n  -k, --key NUMBER  print the flag if NUMBER is the release key\n';
    if (!option) return refuse('codegen: no option given. Try codegen --help');
    if (option === '-h' || option === '--help') return ok(help);
    if (option === '-v' || option === '--version') return ok('codegen 2.4.1\n');
    if (option === '-s' || option === '--show-key') return ok(`release key: ${key}\n`);
    if (option === '-k' || option === '--key') {
      if (value === '-s' || value === '--show-key') return refuse(`codegen: ${value} was read as the value of ${option}. ${option} takes its own NUMBER; run --show-key on its own first, then pass that number to ${option}.`);
      if (!value) return refuse(`codegen: ${option} needs a NUMBER after it.`);
      return value === key ? ok(`Key accepted.\nRelease code: ${flag(s)}\n`) : refuse('codegen: wrong release key. The help lists an option that prints it.');
    }
    return refuse(`codegen: unknown option ${option}. Try codegen --help`);
  },

  /** Its only documentation is a long manual page. */
  'manual-option': (s, c) => {
    const right = '--' + secret(s, 'opt'), page = s.files['/usr/share/man/signal']?.text ?? '', [option] = c.args;
    if (!option) return refuse('signal: which option? Everything is documented in its manual: man signal');
    if (option === right) return ok(`Signal accepted.\nRelease code: ${flag(s)}\n`);
    if (page.includes(`\n  ${option} `)) return refuse(`signal: ${option} is a real option, but not the one that releases the flag. Search the manual instead of scrolling.`);
    return refuse(`signal: unknown option ${option}. Read man signal`);
  },

  /** Fails with a random exit status. */
  'exit-probe': s => {
    const code = 1 + randomInt(254);
    s.files['/var/lib/relay/code'] = { kind: 'file', text: code + '\n', mode: 0o600, owner: 'root' };
    return { output: 'probe: diagnostics failed. The exit status tells you which check.\n', error: '', status: code };
  },
  'exit-report': (s, c) => {
    const code = secret(s, 'code');
    if (!c.args[0]) return refuse('usage: report CODE   (CODE is the exit status probe returned)');
    if (!code) return refuse('report: run probe first.');
    return c.args[0] === code ? ok(`Exit status ${code} matches.\nRelease code: ${flag(s)}\n`)
      : refuse('report: wrong code. $? only remembers the most recent command, so read it right after probe, before running anything else.');
  },

  /** Sends the flag only into a file called capture.log. */
  'stdout-capture': (s, c) => {
    if (c.stdout.kind !== 'file') return refuse('transmit: I only send the flag into a file. Redirect my standard output to capture.log.');
    if (baseOf(c.stdout.path) !== 'capture.log') return refuse(`transmit: you redirected me into ${c.stdout.path}, but the ground station only reads capture.log.`);
    return ok(flag(s) + '\n', 'transmit: flag sent over standard output into capture.log.\ntransmit: you can still read this line because messages like it travel over standard error, which you did not redirect.\n');
  },

  /** Needs stdout and stderr split into two named files. */
  'stream-split': (s, c) => {
    if (c.stdout.kind !== 'file' || baseOf(c.stdout.path) !== 'data.log') return refuse('relay: standard output (stream 1) must go to data.log.');
    if (c.stderr.kind !== 'file' || baseOf(c.stderr.path) !== 'notes.log') return refuse('relay: data.log is set up. Now send standard error (stream 2) to notes.log as well, in the same command.');
    return ok(flag(s) + '\n', 'relay: both streams separated. The flag went to data.log over stream 1; this note went to notes.log over stream 2.\n');
  },

  /** Writes half the flag into the file itself and half to stdout. */
  'append-halves': (s, c) => {
    const path = '/home/user/assembled.txt';
    if (c.stdout.kind !== 'file' || c.stdout.path !== path) return refuse(`assemble: redirect my standard output into ${path}, and do it in append mode.`);
    const f = flag(s), half = Math.ceil(f.length / 2);
    s.files[path] = { ...s.files[path], kind: 'file', text: f.slice(0, half), mode: s.files[path]?.mode ?? 0o644 };
    return ok(f.slice(half) + '\n', 'assemble: I wrote the first half straight into the file and sent the second half to standard output.\nassemble: with >> the halves join up; with > the second half replaces the first.\n');
  },

  /** Buries the flag in a flood of standard error. */
  'stderr-flood': s => {
    const at = 200 + randomInt(1250), pid = 2000 + randomInt(7000), out: string[] = [];
    for (let i = 0; i < 1500; i++) out.push(i === at ? `relay[${pid}]: release ${flag(s)}` : `relay[${pid}]: heartbeat ${hex(4)} ${pick(['ok', 'ok', 'ok', 'late', 'retry'])}`);
    return { output: '', error: out.join('\n') + '\n', status: 0 };
  },

  /** Prints the per-instance launch codes, but never to a terminal. */
  'codes-emit': (s, c) => c.stdout.kind === 'tty'
    ? refuse('codes: refusing to print launch codes to a terminal. Pipe me into another command.')
    : ok(s.files['/var/lib/relay/codes']?.text ?? ''),
  'codes-verify': (s, c) => {
    if (c.stdin.kind !== 'pipe') return refuse('verify: pipe the codes into me: codes | ... | verify');
    const want = lines(secret(s, 'codes')).slice(0, 7), got = lines(c.stdin.text);
    if (got.join('\n') === want.join('\n')) return ok(`Seven codes verified.\nRelease code: ${flag(s)}\n`);
    return refuse(got.length > 7 ? `verify: received ${got.length} codes. I take exactly the first 7; trim the stream before it reaches me.` : 'verify: those are not the first 7 codes in order.');
  },

  /** Sends a handshake into a pipe; explains its mistakes only into the pipe too. */
  'tee-emitter': (s, c) => {
    if (c.stdout.kind !== 'pipe') return refuse('emitter: my output must flow into receiver through a pipe: emitter | receiver');
    const token = secret(s, 'token');
    if (c.args[0] !== '--token' || c.args[1] !== token) return { output: `emitter: missing or wrong token.\nusage: emitter --token TOKEN\nthe TOKEN for this session is ${token}\n`, error: 'emitter: handshake not sent.\n', status: 2 };
    return ok(`HANDSHAKE:${reverse(token)}\n`);
  },
  'tee-receiver': (s, c) => {
    if (c.stdin.kind !== 'pipe') return refuse('receiver: pipe emitter into me: emitter | receiver');
    const last = lines(c.stdin.text).at(-1);
    if (last === `HANDSHAKE:${reverse(secret(s, 'token'))}`) return ok(`Handshake accepted.\nRelease code: ${flag(s)}\n`);
    return refuse('receiver: no valid handshake arrived. Whatever emitter said went into the pipe, not your screen.\nreceiver: put tee between the two commands to keep a copy of what emitter sent, then read that copy.');
  },

  /** Inspects which variables were exported to it (and, unlike a real program, peeks at your shell). */
  'export-check': (s, c) => {
    if (c.env.CALLSIGN !== undefined) return refuse('clearance: CALLSIGN reached me, so it was exported (or set on my command line). It must stay local to your shell.');
    if (c.env.OPERATOR === undefined) return refuse(s.env.OPERATOR !== undefined
      ? 'clearance: OPERATOR exists in your shell, but you did not export it, so I never received it.'
      : 'clearance: I need the variable OPERATOR, set to relay and exported to me.');
    if (c.env.OPERATOR !== 'relay') return refuse(`clearance: OPERATOR reached me as "${c.env.OPERATOR}", but it must be relay.`);
    if (s.env.CALLSIGN !== 'night') return refuse('clearance: OPERATOR is right. Now set CALLSIGN to night in your shell, without exporting it.\nclearance: (a real program could not see an unexported variable at all; this one checks your shell directly.)');
    return ok(`OPERATOR exported, CALLSIGN kept local. Clearance granted.\nRelease code: ${flag(s)}\n`);
  },

  /** Checkpoint: hidden program, fixed working directory, argument from a file, pipe-only output, reversed payload. */
  uplink: (s, c) => {
    if (s.cwd !== '/tmp') return refuse('uplink: I only run from /tmp, my scratch space. cd /tmp first.');
    const [option, channel] = c.args, live = secret(s, 'chan-live'), old = secret(s, 'chan-old');
    if (option !== '--channel' || !channel) return refuse('usage: uplink --channel NAME   (channels are listed in /opt/relay/channels.txt)');
    if (channel !== live && channel !== old) return refuse(`uplink: no such channel ${channel}.`);
    if (c.stdout.kind !== 'pipe') return refuse('uplink: refusing to dump raw channel traffic onto a terminal. Pipe me into a filter.');
    const payload = reverse(channel === live ? flag(s) : secret(s, 'retired.flag')), at = randomInt(300), out: string[] = [];
    for (let i = 0; i < 300; i++) out.push(i === at ? `<< ${payload}` : `<< ${hex(8)} ${hex(8)} ${hex(4)}`);
    return ok(out.join('\n') + '\n');
  },
};

/** Harmless programs for lesson examples: they show how they were called, and never touch a flag. */
const demoPrograms: Record<string, Program> = {
  /** Reports its own invocation */
  'demo-report': (s, c) => ok(`${baseOf(c.path)} is running.\n  started as: ${c.invoked}\n  working directory: ${s.cwd}\n  arguments: ${c.args.length ? c.args.join(' ') : '(none)'}\n`),
  /** One line on each output stream */
  'demo-streams': () => ok('RESULT: 3 hosts up\n', 'status: scan finished in 2s\n'),
  /** Lists the variables it received (only exported ones arrive) */
  'demo-env': (_s, c) => {
    const got = Object.entries(c.env).filter(([k]) => !['HOME', 'USER', 'PATH', 'OLDPWD'].includes(k)).map(([k, v]) => `received ${k}=${v}`);
    return ok((got.length ? got.join('\n') : '(no extra variables received)') + '\n');
  },
  /** Exits with the status given as its program argument */
  'demo-exit': (_s, _c, arg) => ({ output: '', error: `check failed (exit status ${arg})\n`, status: Number(arg) || 1 }),
  /** Prints the help for its options */
  'demo-help': (_s, c) => c.args[0] === '--help' || c.args[0] === '-h'
    ? ok('usage: backup [OPTION]\n  -h, --help          show this help\n  -d, --dest DIR      write the backup into DIR\n  -q, --quiet         print nothing on success\n')
    : c.args[0] === '--dest' || c.args[0] === '-d' ? (c.args[1] ? ok(`backing up into ${c.args[1]}... done\n`) : refuse('backup: --dest needs a DIR')) : refuse('backup: missing option. Try backup --help'),
};
Object.assign(programs, demoPrograms);

export function runProgram(s: Shell, id: string, call: Invocation): Result {
  const split = id.indexOf(':'), name = split < 0 ? id : id.slice(0, split), arg = split < 0 ? '' : id.slice(split + 1);
  const program = programs[name];
  return program ? program(s, call, arg) : refuse(`${call.invoked}: this program is damaged (unknown program ${name})`, 126);
}

/** Runs after every learner command, like a shell's PROMPT_COMMAND. Returns extra terminal output. */
export const watchers: Record<string, (s: Shell) => string> = {
  /** The key rotates after each command unless KEY already holds the live value. */
  'rotating-key': s => {
    const file = '/opt/relay/rotating.key', node = s.files[file];
    if (!node) return '';
    const key = node.text.trim(), held = s.env.KEY;
    if (held === key) return `\n[watch] KEY matches the live key. Release code: ${flag(s)}\n`;
    s.files[file] = { ...node, text: hex(12) + '\n' };
    return held ? '\n[watch] KEY holds a stale key. The key rotated after your last command; read it straight into KEY in one command.\n' : '';
  },
};

/** Fixture text generators. Their output may contain placeholders, which createChallenge fills afterwards. */
export const generators: Record<string, () => string> = {
  /** A long manual page: about 150 options, exactly one of which releases the flag. */
  'signal-manual': () => {
    const verbs = ['rotate', 'calibrate', 'mute', 'boost', 'reroute', 'archive', 'ping', 'scramble', 'dim', 'sync', 'park', 'sweep'];
    const nouns = ['the antenna', 'channel 4', 'the backup relay', 'all beacons', 'the uplink log', 'the noise filter', 'the dish', 'the night shift roster'];
    const names = new Set<string>();
    while (names.size < 150) names.add(Array.from({ length: 4 + randomInt(4) }, () => 'abcdefghijklmnopqrstuvwxyz'[randomInt(26)]).join(''));
    const options = [...names].map(n => `  --${n} ${' '.repeat(10 - Math.min(n.length, 9))}${pick(verbs)} ${pick(nouns)}`);
    options.splice(60 + randomInt(80), 0, '  --{{RAND:opt:word}}  release the flag to whoever runs this');
    return ['SIGNAL(1)                    Relay Commands                    SIGNAL(1)', '', 'NAME', '  signal - send control signals to the relay', '', 'SYNOPSIS', '  signal OPTION', '', 'DESCRIPTION', '  Exactly one OPTION per run.', '', 'OPTIONS', ...options, '', 'SEE ALSO', '  man(1)', ''].join('\n');
  },
  'launch-codes': () => Array.from({ length: 20 }, () => `CODE-${hex(4)}-${hex(4)}`).join('\n') + '\n',
};
