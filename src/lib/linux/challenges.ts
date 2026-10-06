import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import missionData from './missions.json';
import { addFile, blankShell, type Shell } from './engine';
export type Mission = typeof missionData[number];
export const missions = missionData;
export const courseId = 'linux-fundamentals';
export function missionById(id: string) { return missions.find(m => m.id === id); }
export function flagHash(flag: string) { return createHash('sha256').update(flag).digest('hex'); }
export function flagMatches(flag: string, hash: string) {
  const actual = Buffer.from(flagHash(flag.trim()), 'hex'), expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function createChallenge(mission: Mission) {
  const flag = `CYBER{${randomBytes(18).toString('hex')}}`;
  const shell = blankShell();
  for (const file of mission.files) addFile(shell, file.path, file.text.replaceAll('{{FLAG}}', flag).replaceAll('{{BASE64}}', Buffer.from(flag + '\n').toString('base64')).replaceAll('{{REVERSED}}', [...flag].reverse().join('')), file.mode);
  if (mission.goal?.kind === 'fixture-mode') shell.files[mission.goal.path].mode = mission.goal.mode!;
  return { shell, flag, hash: flagHash(flag) };
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
