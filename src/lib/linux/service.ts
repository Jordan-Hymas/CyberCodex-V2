import { prisma } from '@/lib/db/prisma';
import { missionById, missions, createChallenge, flagMatches, revealReward, objectiveMet, courseId, decoyIndex, coachTip } from './challenges';
import { execute, listDir, readForEdit, saveFile, commands, type Shell } from './engine';
import { accessError } from './access';
export class LabError extends Error { constructor(message: string, public status = 400) { super(message); } }
type Stored = { shell: Shell; flag: string; decoys?: string[] };
export type LabAction = { action: 'open' | 'command' | 'submit' | 'reset' | 'complete' | 'read' | 'save'; version?: number; command?: string; flag?: string; path?: string; content?: string };
export type LabReply = {
  version: number; cwd: string; completed: boolean; attempts: number;
  output: string; error: string; clear: boolean; status: number; awarded: number; message: string;
  /** Mission-specific coaching after a common mistake */
  tip?: string;
  commands?: string[]; entries?: { name: string; dir: boolean }[]; file?: { path: string; text: string; isNew: boolean };
  /** Learner XP after a successful capture (level = floor(totalXp / 100) + 1) */
  progress?: { totalXp: number; level: number; levelXp: number };
};
export async function labAction(userId: string, exerciseId: string, action: LabAction): Promise<LabReply> {
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
      row = await tx.linuxLabSession.create({ data: { userId, exerciseId, state: JSON.stringify({ shell: challenge.shell, flag: challenge.flag, decoys: challenge.decoys }), flagHash: challenge.hash } });
    }
    const snapshot = () => ({ version: row!.version, cwd: (JSON.parse(row!.state) as Stored).shell.cwd, completed: !!row!.solvedAt, attempts: row!.attempts });
    const idle = (extra: Partial<LabReply> = {}): LabReply => ({ ...snapshot(), output: '', error: '', clear: false, status: 0, awarded: 0, message: '', ...extra });
    if (action.action === 'open') return idle({ commands: Object.keys(commands) });
    // Read-only helpers for tab completion and the nano editor: no version bump.
    if (action.action === 'complete') return idle({ entries: listDir((JSON.parse(row.state) as Stored).shell, action.path ?? '.') });
    if (action.action === 'read') {
      try { return idle({ file: readForEdit((JSON.parse(row.state) as Stored).shell, action.path ?? '') }); }
      catch (e) { return idle({ error: (e as Error).message }); }
    }
    if (action.version !== row.version) throw new LabError('This mission changed in another tab. Reopen it before retrying.', 409);
    const state: Stored = JSON.parse(row.state);
    let output = '', error = '', clear = false, status = 0, awarded = 0, message = '', tip = '';
    let solvedAt = row.solvedAt, attempts = row.attempts, hash = row.flagHash;
    let progress: LabReply['progress'];
    if (action.action === 'reset') {
      const fresh = createChallenge(mission); state.shell = fresh.shell; state.flag = fresh.flag; state.decoys = fresh.decoys; hash = fresh.hash;
      message = 'Environment reset. A new flag was generated; your earned completion is preserved.'; clear = true;
    } else if (action.action === 'command') {
      if (Date.now() - row.updatedAt.getTime() < 80) throw new LabError('Please wait briefly before the next command.', 429);
      const result = execute(state.shell, action.command ?? '');
      ({ output, error, clear = false, status } = result);
      tip = coachTip(mission, action.command ?? '', status !== 0 || !!error);
      revealReward(mission, state.shell, state.flag);
      if (Buffer.byteLength(JSON.stringify(state)) > 512000) throw new LabError('Environment storage limit reached. Remove large files or reset.');
    } else if (action.action === 'save') {
      if (Date.now() - row.updatedAt.getTime() < 80) throw new LabError('Please wait briefly before saving again.', 429);
      try { saveFile(state.shell, action.path ?? '', action.content ?? ''); }
      catch (e) { throw new LabError((e as Error).message, 400); }
      revealReward(mission, state.shell, state.flag);
      if (Buffer.byteLength(JSON.stringify(state)) > 512000) throw new LabError('Environment storage limit reached. Remove large files or reset.');
    } else if (action.action === 'submit') {
      if (row.nextAttemptAt && row.nextAttemptAt > new Date()) throw new LabError('Wait a second before submitting again.', 429);
      attempts++;
      const decoy = decoyIndex(action.flag ?? '', state.decoys);
      if (!flagMatches(action.flag ?? '', hash)) message = decoy >= 0
        ? `Decoy flag! ${mission.decoys[decoy]?.hint ?? 'That one was planted to mislead you. Reread the task.'}`
        : 'That flag does not match this mission instance. Copy the complete CYBER{...} value from your own terminal.';
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
        const totalXp = (await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } })).totalXp;
        progress = { totalXp, level: Math.floor(totalXp / 100) + 1, levelXp: totalXp % 100 };
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
    return { ...snapshot(), output, error, clear, status, awarded, message, progress, tip: tip || undefined };
  }, { maxWait: 5000, timeout: 10000 });
}
