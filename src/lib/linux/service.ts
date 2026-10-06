import { prisma } from '@/lib/db/prisma';
import { missionById, missions, createChallenge, flagMatches, revealReward, objectiveMet, courseId } from './challenges';
import { execute, type Shell } from './engine';
import { accessError } from './access';
export class LabError extends Error { constructor(message: string, public status = 400) { super(message); } }
type Stored = { shell: Shell; flag: string };
export type LabAction = { action: 'open' | 'command' | 'submit' | 'reset'; version?: number; command?: string; flag?: string };
export async function labAction(userId: string, exerciseId: string, action: LabAction) {
  const mission = missionById(exerciseId);
  if (!mission) throw new LabError('Unknown Linux mission.', 404);
  return prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new LabError('Sign in to use your Linux environment.', 401);
    const completed = await tx.linuxLabSession.findMany({ where: { userId, solvedAt: { not: null } }, select: { exerciseId: true } });
    const denied = accessError(mission, user, completed.map(c => c.exerciseId));
    if (denied) throw new LabError(denied, 403);
    const key = { userId_exerciseId: { userId, exerciseId } };
    let row = await tx.linuxLabSession.findUnique({ where: key });
    if (!row) {
      if (action.action !== 'open') throw new LabError('Open your mission before sending commands.', 409);
      const challenge = createChallenge(mission);
      row = await tx.linuxLabSession.create({ data: { userId, exerciseId, state: JSON.stringify({ shell: challenge.shell, flag: challenge.flag }), flagHash: challenge.hash } });
    }
    const snapshot = () => ({ version: row!.version, cwd: (JSON.parse(row!.state) as Stored).shell.cwd, completed: !!row!.solvedAt, attempts: row!.attempts });
    if (action.action === 'open') return { ...snapshot(), output: '', error: '', clear: false, status: 0, awarded: 0, message: '' };
    if (action.version !== row.version) throw new LabError('This mission changed in another tab. Reopen it before retrying.', 409);
    const state: Stored = JSON.parse(row.state);
    let output = '', error = '', clear = false, status = 0, awarded = 0, message = '';
    let solvedAt = row.solvedAt, attempts = row.attempts, hash = row.flagHash;
    if (action.action === 'reset') {
      const fresh = createChallenge(mission); state.shell = fresh.shell; state.flag = fresh.flag; hash = fresh.hash;
      message = 'Environment reset. A new flag was generated; your earned completion is preserved.'; clear = true;
    } else if (action.action === 'command') {
      if (Date.now() - row.updatedAt.getTime() < 80) throw new LabError('Please wait briefly before the next command.', 429);
      const result = execute(state.shell, action.command ?? '');
      ({ output, error, clear = false, status } = result);
      revealReward(mission, state.shell, state.flag);
      if (Buffer.byteLength(JSON.stringify(state)) > 512000) throw new LabError('Environment storage limit reached. Remove large files or reset.');
    } else if (action.action === 'submit') {
      if (row.nextAttemptAt && row.nextAttemptAt > new Date()) throw new LabError('Wait a second before submitting again.', 429);
      attempts++;
      if (!flagMatches(action.flag ?? '', hash)) message = 'That flag does not match this mission instance. Copy the complete CYBER{...} value from your own terminal.';
      else if (!objectiveMet(mission, state.shell, state.flag)) message = 'The flag is valid, but the required filesystem task is not complete yet.';
      else {
        solvedAt ??= new Date();
        await tx.userExercise.upsert({ where: { userId_courseId_exerciseId: { userId, courseId, exerciseId } }, create: { userId, courseId, exerciseId }, update: {} });
        const claim = await tx.userExercise.updateMany({ where: { userId, courseId, exerciseId, isCompleted: false }, data: { isCompleted: true, completedAt: solvedAt, attempts: { increment: 1 } } });
        if (claim.count) {
          awarded = mission.xp;
          const updated = await tx.user.update({ where: { id: userId }, data: { totalXp: { increment: awarded }, lastActive: new Date() } });
          await tx.user.update({ where: { id: userId }, data: { level: Math.floor(updated.totalXp / 100) + 1, xp: updated.totalXp % 100 } });
        }
        const finished = await tx.linuxLabSession.findMany({ where: { userId, solvedAt: { not: null } }, select: { exerciseId: true } });
        const ids = new Set([...finished.map(f => f.exerciseId), exerciseId]);
        const count = missions.filter(m => ids.has(m.id)).length;
        const data = { exercisesCompleted: count, totalExercises: missions.length, xpEarned: missions.filter(m => ids.has(m.id)).reduce((sum,m) => sum + m.xp, 0), totalXp: missions.reduce((sum,m) => sum + m.xp, 0), isCompleted: count === missions.length, completedAt: count === missions.length ? new Date() : null, lastActivityAt: new Date() };
        await tx.courseProgress.upsert({ where: { userId_courseId: { userId, courseId } }, create: { userId, courseId, ...data }, update: data });
        message = awarded ? `Flag captured! +${awarded} XP. The next mission is unlocked.` : 'Flag confirmed. This mission was already completed; no duplicate XP awarded.';
      }
    }
    const changed = await tx.linuxLabSession.updateMany({ where: { id: row.id, version: row.version }, data: { state: JSON.stringify(state), flagHash: hash, version: { increment: 1 }, solvedAt, attempts, nextAttemptAt: action.action === 'submit' ? new Date(Date.now() + 1000) : row.nextAttemptAt } });
    if (!changed.count) throw new LabError('Mission changed in another tab. Reopen it before retrying.', 409);
    row = (await tx.linuxLabSession.findUnique({ where: key }))!;
    return { ...snapshot(), output, error, clear, status, awarded, message };
  }, { maxWait: 5000, timeout: 10000 });
}
