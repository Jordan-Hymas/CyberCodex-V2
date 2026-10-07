import { randomBytes, randomInt, createHash, timingSafeEqual } from 'node:crypto';
import missionData from './missions.json';
import { addFile, blankShell, execute, type Result, type Shell } from './engine';
import { generators, watchers } from './programs';
export type Mission = typeof missionData[number];
export const missions = missionData;
/** The three Linux courses, beginner to advanced, in catalog order. */
export const linuxCourses = ['linux-fundamentals', 'linux-intermediate', 'linux-advanced'] as const;
export type LinuxCourse = typeof linuxCourses[number];
export function isLinuxCourse(slug: string): slug is LinuxCourse { return (linuxCourses as readonly string[]).includes(slug); }
export function missionById(id: string) { return missions.find(m => m.id === id); }
/** Which course a mission belongs to (set per mission in missions.json). */
export function courseOf(mission: Pick<Mission, 'course'>) { return mission.course; }
/** Missions in a course, in order. */
export function missionsForCourse(slug: string) { return missions.filter(m => m.course === slug); }
export function flagHash(flag: string) { return createHash('sha256').update(flag).digest('hex'); }
/** Changes whenever a mission's fixtures change, so stale saved environments can be rebuilt. */
export function fixtureVersion(m: Mission) {
  return createHash('sha256').update(JSON.stringify([m.files, m.start, m.decoys.length, m.goal])).digest('hex').slice(0, 12);
}
export function flagMatches(flag: string, hash: string) {
  const actual = Buffer.from(flagHash(flag.trim()), 'hex'), expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const newFlag = () => `CYBER{${randomBytes(18).toString('hex')}}`;
const base64Of = (value: string) => Buffer.from(value + '\n').toString('base64');
const reversed = (value: string) => [...value].reverse().join('');
type Fixture = { path: string; text?: string; mode?: number; owner?: string; program?: string; generate?: string; dir?: boolean };
const randomValue = (format = 'hex') => format === 'num' ? String(10000 + randomInt(90000))
  : format === 'word' ? Array.from({ length: 6 }, () => 'abcdefghijklmnopqrstuvwxyz'[randomInt(26)]).join('')
  : randomBytes(3).toString('hex');
/**
 * Per-instance secrets: {{RAND:name[:hex|num|word]}} is a random value and {{PICK:name:a|b|c}} picks
 * one option. Later uses of the same name ({{RAND:name}}, {{PICK:name}}) repeat the value.
 */
export function fillSecrets(text: string, secrets: Record<string, string>) {
  return text.replace(/\{\{(RAND|PICK):([\w.-]+)(?::([^}]*))?\}\}/g, (_, kind: string, name: string, spec?: string) =>
    secrets[name] ??= kind === 'PICK' ? (spec ?? '').split('|')[randomInt((spec ?? '').split('|').length)] : randomValue(spec));
}
export function createChallenge(mission: Mission) {
  const flag = newFlag();
  // Decoys look exactly like real flags; submitting one explains the mistake.
  const decoys = mission.decoys.map(() => newFlag());
  const secrets: Record<string, string> = {};
  const fill = (text: string) => fillSecrets(text, secrets)
    .replaceAll('{{FLAG}}', flag).replaceAll('{{BASE64}}', base64Of(flag)).replaceAll('{{REVERSED}}', reversed(flag))
    .replace(/\{\{DECOY(64|REV)?:(\d+)\}\}/g, (_, form: string | undefined, n: string) => {
      const decoy = decoys[Number(n)];
      if (!decoy) throw Error(`${mission.id}: decoy ${n} is not declared`);
      return form === '64' ? base64Of(decoy) : form === 'REV' ? reversed(decoy) : decoy;
    });
  const shell = blankShell();
  const fixtures = mission.files as Fixture[];
  for (const file of fixtures) {
    const path = fill(file.path);
    if (file.dir) { addFile(shell, path + '/.keep', ''); delete shell.files[path + '/.keep']; shell.files[path].mode = file.mode ?? 0o755; }
    else addFile(shell, path, fill(file.generate ? generators[file.generate]() : file.text ?? ''), file.mode);
    if (file.owner === 'root') shell.files[path].owner = 'root';
    if (file.program) shell.files[path].program = file.program;
  }
  if (mission.goal?.kind === 'fixture-mode') shell.files[mission.goal.path].mode = mission.goal.mode!;
  // Start where the task begins (e.g. inside work/ for a relative-path mission)
  if (shell.files[mission.start]?.kind === 'dir') shell.cwd = mission.start;
  return { shell, flag, decoys, secrets, hash: flagHash(flag), fixture: fixtureVersion(mission) };
}
export function objectiveMet(m: Mission, s: Shell, flag: string): boolean {
  const g = m.goal;
  if (!g || g.kind === 'fixture-mode') return true;
  const node = s.files[g.path];
  if (g.kind === 'cleanup') return !node && s.files[g.keep!]?.text === g.value;
  if (!node || node.kind !== 'file') return false;
  if (g.kind === 'flag-file') return node.text.trim() === flag;
  if (g.kind === 'trim') return node.text.trim() === g.value;
  return node.text === g.value && (g.kind !== 'move' || !s.files[g.absent!]);
}
export function revealReward(m: Mission, s: Shell, flag: string) {
  if (m.goal && !['fixture-mode', 'flag-file'].includes(m.goal.kind) && objectiveMet(m, s, flag)) addFile(s, '/home/user/reward.txt', flag + '\n');
}
/** One learner command: the shell itself, then the mission's watcher and reward checks. */
export function runCommand(m: Mission, s: Shell, flag: string, command: string): Result {
  const result = execute(s, command);
  const watch = (m as { watch?: string }).watch;
  const extra = watch && watchers[watch] ? watchers[watch](s) : '';
  revealReward(m, s, flag);
  return extra ? { ...result, output: result.output + extra } : result;
}

/** Index of the decoy a submitted flag matches, or -1. */
export function decoyIndex(submitted: string, decoys: string[] = []) {
  return decoys.indexOf(submitted.trim());
}
/** First coaching tip that applies to this command (rules are mission-authored regexes). */
export function coachTip(m: Mission, command: string, failed: boolean): string {
  for (const rule of m.coach) {
    if (rule.error && !failed) continue;
    try { if (new RegExp(rule.when).test(command)) return rule.tip; } catch { /* ignore a bad pattern */ }
  }
  return '';
}
