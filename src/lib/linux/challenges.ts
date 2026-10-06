import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import missionData from './missions.json';
import { addFile, blankShell, type Shell } from './engine';
export type Mission = typeof missionData[number];
export const missions = missionData;
export const courseId = 'linux-fundamentals';
export function missionById(id: string) { return missions.find(m => m.id === id); }
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
export function createChallenge(mission: Mission) {
  const flag = newFlag();
  // Decoys look exactly like real flags; submitting one explains the mistake.
  const decoys = mission.decoys.map(() => newFlag());
  const fill = (text: string) => text
    .replaceAll('{{FLAG}}', flag).replaceAll('{{BASE64}}', base64Of(flag)).replaceAll('{{REVERSED}}', reversed(flag))
    .replace(/\{\{DECOY(64|REV)?:(\d+)\}\}/g, (_, form: string | undefined, n: string) => {
      const decoy = decoys[Number(n)];
      if (!decoy) throw Error(`${mission.id}: decoy ${n} is not declared`);
      return form === '64' ? base64Of(decoy) : form === 'REV' ? reversed(decoy) : decoy;
    });
  const shell = blankShell();
  for (const file of mission.files) addFile(shell, file.path, fill(file.text), file.mode);
  if (mission.goal?.kind === 'fixture-mode') shell.files[mission.goal.path].mode = mission.goal.mode!;
  // Start where the task begins (e.g. inside work/ for a relative-path mission)
  if (shell.files[mission.start]?.kind === 'dir') shell.cwd = mission.start;
  return { shell, flag, decoys, hash: flagHash(flag), fixture: fixtureVersion(mission) };
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
