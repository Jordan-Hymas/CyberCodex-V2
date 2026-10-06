import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '@/lib/db/prisma';
import { labAction, LabError, pruneLabSessions, LAB_LIMITS } from '../src/lib/linux/service';
import { missions } from '../src/lib/linux/challenges';
import { hasLinuxPro } from '../src/lib/linux/access';
after(async () => prisma.$disconnect());
const relax = async (userId: string, exerciseId: string) => prisma.linuxLabSession.update({ where: { userId_exerciseId: { userId, exerciseId } }, data: { updatedAt: new Date(0), nextAttemptAt: null } });
test('database-backed personal missions: isolation, persistence, resets, progression and XP', async () => {
 const a = await prisma.user.create({ data: { email: 'a@linux.test' } });
 const b = await prisma.user.create({ data: { email: 'b@linux.test' } });
 const first = missions[0].id;
 await assert.rejects(labAction('missing-user',first,{action:'open'}), (e: unknown) => e instanceof LabError && e.status === 401);
 let sa = await labAction(a.id,first,{action:'open'}), sb = await labAction(b.id,first,{action:'open'});
 assert.equal('state' in sa,false); assert.equal('flag' in sa,false);
 const originalA = JSON.parse((await prisma.linuxLabSession.findUniqueOrThrow({where:{userId_exerciseId:{userId:a.id,exerciseId:first}}})).state).flag;
 const flagB = JSON.parse((await prisma.linuxLabSession.findUniqueOrThrow({where:{userId_exerciseId:{userId:b.id,exerciseId:first}}})).state).flag;
 assert.notEqual(originalA,flagB);
 let wrong = await labAction(a.id,first,{action:'submit',version:sa.version,flag:flagB}); assert.equal(wrong.completed,false);
 const reset = await labAction(a.id,first,{action:'reset',version:wrong.version});
 await relax(a.id,first);
 wrong = await labAction(a.id,first,{action:'submit',version:reset.version,flag:originalA}); assert.equal(wrong.completed,false);
 await relax(a.id,first);
 const changed = await labAction(a.id,first,{action:'command',version:wrong.version,command:'mkdir scratch'});
 assert.equal((await labAction(a.id,first,{action:'open'})).version,changed.version);
 // Editor helpers: complete/read are read-only, save is versioned and persisted.
 const listed=await labAction(a.id,first,{action:'complete',path:'/home/user'}); assert.equal(listed.version,changed.version); assert.ok(listed.entries!.some(e=>e.name==='scratch'&&e.dir));
 assert.ok((await labAction(a.id,first,{action:'open'})).commands!.includes('nano'));
 await relax(a.id,first);
 const saved=await labAction(a.id,first,{action:'save',version:changed.version,path:'scratch/note.txt',content:'from nano\n'}); assert.equal(saved.version,changed.version+1);
 const opened=await labAction(a.id,first,{action:'read',path:'/home/user/scratch/note.txt'}); assert.equal(opened.file!.text,'from nano\n'); assert.equal(opened.version,saved.version);
 assert.ok((await labAction(a.id,first,{action:'read',path:'/home/user/scratch'})).error);
 await relax(a.id,first);
 await assert.rejects(labAction(a.id,first,{action:'save',version:changed.version,path:'x.txt',content:'stale'}),(e: unknown)=>e instanceof LabError && e.status===409);
 await relax(a.id,first);
 const changedAfterSave=await labAction(a.id,first,{action:'command',version:saved.version,command:'rm scratch/note.txt'});
 assert.ok(JSON.parse((await prisma.linuxLabSession.findUniqueOrThrow({where:{userId_exerciseId:{userId:a.id,exerciseId:first}}})).state).shell.files['/home/user/scratch']);
 assert.equal(JSON.parse((await prisma.linuxLabSession.findUniqueOrThrow({where:{userId_exerciseId:{userId:b.id,exerciseId:first}}})).state).shell.files['/home/user/scratch'],undefined);
 void changedAfterSave;
 await assert.rejects(labAction(a.id,first,{action:'command',version:wrong.version,command:'pwd'}), (e: unknown) => e instanceof LabError && e.status === 409);
 await assert.rejects(labAction(a.id,missions[2].id,{action:'open'}), (e: unknown) => e instanceof LabError && e.status===403);
 let priorFlag = '';
 for (const m of missions) {
   if(m.id === missions[12].id) {
     await assert.rejects(labAction(a.id,m.id,{action:'open'}),(e: unknown)=>e instanceof LabError && e.status===403);
     await prisma.user.update({where:{id:a.id},data:{subscriptionTier:'pro',subscriptionStatus:'active'}});
   }
   let state = await labAction(a.id,m.id,{action:'open'}); let transcript='';
   if(priorFlag) { await relax(a.id,m.id); state=await labAction(a.id,m.id,{action:'submit',version:state.version,flag:priorFlag}); assert.equal(state.completed,false); }
   for(const command of m.solution) { await relax(a.id,m.id); const result=await labAction(a.id,m.id,{action:'command',version:state.version,command}); assert.equal(result.error,'',m.id+': '+command); transcript+=result.output; state=result; }
   const flag=transcript.match(/CYBER\{[a-f0-9]+\}/)?.[0]; assert.ok(flag,m.id+' must expose its flag through commands');
   await relax(a.id,m.id); state=await labAction(a.id,m.id,{action:'submit',version:state.version,flag}); assert.equal(state.completed,true); assert.equal(state.awarded,m.xp);
   await relax(a.id,m.id); const repeat=await labAction(a.id,m.id,{action:'submit',version:state.version,flag}); assert.equal(repeat.awarded,0);
   priorFlag=flag;
 }
 const progress=await prisma.courseProgress.findUniqueOrThrow({where:{userId_courseId:{userId:a.id,courseId:'linux-fundamentals'}}});
 assert.equal(progress.exercisesCompleted,36); assert.equal(progress.isCompleted,true);
 assert.equal((await prisma.user.findUniqueOrThrow({where:{id:a.id}})).totalXp,missions.reduce((sum,m)=>sum+m.xp,0));
 assert.equal((await prisma.user.findUniqueOrThrow({where:{id:b.id}})).totalXp,0);
 // Competing tabs cannot both commit a version or award twice.
 sb=await labAction(b.id,first,{action:'open'}); await relax(b.id,first);
 const concurrent=await Promise.allSettled([labAction(b.id,first,{action:'submit',version:sb.version,flag:flagB}),labAction(b.id,first,{action:'submit',version:sb.version,flag:flagB})]);
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await prisma.user.findUniqueOrThrow({where:{id:b.id}})).totalXp,missions[0].xp);
 sa=await labAction(a.id,first,{action:'open'}); const resetSolved=await labAction(a.id,first,{action:'reset',version:sa.version}); assert.equal(resetSolved.completed,true);
 // A decoy flag explains itself and does not complete the mission.
 const relayId='beginner-relay';
 const decoyUser = await prisma.user.create({ data: { email: 'decoy@linux.test' } });
 await prisma.linuxLabSession.createMany({ data: missions.slice(0, missions.findIndex(m=>m.id===relayId)).map(m=>({ userId: decoyUser.id, exerciseId: m.id, state: '{}', flagHash: 'x', solvedAt: new Date() })) });
 let relay = await labAction(decoyUser.id, relayId, { action: 'open' });
 const stored = JSON.parse((await prisma.linuxLabSession.findUniqueOrThrow({ where: { userId_exerciseId: { userId: decoyUser.id, exerciseId: relayId } } })).state);
 assert.equal(stored.decoys.length, 1);
 relay = await labAction(decoyUser.id, relayId, { action: 'submit', version: relay.version, flag: stored.decoys[0] });
 assert.equal(relay.completed, false); assert.match(relay.message, /^Decoy flag! .*archive/);
 await relax(decoyUser.id, relayId);
 const tipped = await labAction(decoyUser.id, relayId, { action: 'command', version: relay.version, command: stored.flag });
 assert.match(tipped.tip ?? '', /flag box/);
 await prisma.user.update({where:{id:a.id},data:{subscriptionStatus:'canceled',subscriptionEndsAt:new Date(0)}});
 await assert.rejects(labAction(a.id,missions[12].id,{action:'open'}),(e: unknown)=>e instanceof LabError && e.status===403);
 await prisma.user.delete({where:{id:b.id}}); assert.equal(await prisma.linuxLabSession.count({where:{userId:b.id}}),0);
});
test('paid access respects cancellation dates and payment status',()=>{
 assert.equal(hasLinuxPro({subscriptionTier:'pro',subscriptionStatus:'canceled',subscriptionEndsAt:new Date(Date.now()+60000)}),true);
 assert.equal(hasLinuxPro({subscriptionTier:'pro',subscriptionStatus:'past_due',subscriptionEndsAt:null}),false);
 assert.equal(hasLinuxPro({subscriptionTier:'free',subscriptionStatus:'active',subscriptionEndsAt:null}),false);
});
test('storage lifecycle: intro, compaction, rebuilds and pruning', async () => {
 const u = await prisma.user.create({ data: { email: 'storage@linux.test' } });
 const [m1, m2] = missions;
 const key = (exerciseId: string) => ({ userId_exerciseId: { userId: u.id, exerciseId } });
 const stateOf = async (exerciseId: string) => (await prisma.linuxLabSession.findUniqueOrThrow({ where: key(exerciseId) })).state;
 // Intro describes this mission and only visible entries
 let s1 = await labAction(u.id, m1.id, { action: 'open' });
 assert.equal(s1.intro!.number, 1); assert.equal(s1.intro!.cwd, '/home/user'); assert.ok(s1.intro!.entries.includes('dispatch.txt'));
 const lsMission = missions.find(m => m.id === 'ls-command')!;
 // Solve mission 1
 const flag1 = JSON.parse(await stateOf(m1.id)).flag; await relax(u.id, m1.id);
 s1 = await labAction(u.id, m1.id, { action: 'submit', version: s1.version, flag: flag1 }); assert.equal(s1.completed, true);
 // Opening mission 2 compacts solved mission 1
 await labAction(u.id, m2.id, { action: 'open' });
 assert.equal(await stateOf(m1.id), '');
 await assert.rejects(labAction(u.id, m1.id, { action: 'command', version: s1.version, command: 'ls' }), (e: unknown) => e instanceof LabError && e.status === 409);
 // Reopening a solved mission rebuilds it with a new flag and keeps completion
 const again = await labAction(u.id, m1.id, { action: 'open' });
 assert.equal(again.completed, true); assert.match(again.intro!.notice ?? '', /already solved/);
 assert.notEqual(JSON.parse(await stateOf(m1.id)).flag, flag1);
 // Outdated fixtures are rebuilt for unsolved missions
 const st2 = JSON.parse(await stateOf(m2.id)); st2.fixture = 'old'; st2.shell.files['/home/user/stale'] = { kind: 'file', text: 'x', mode: 420 };
 await prisma.linuxLabSession.update({ where: key(m2.id), data: { state: JSON.stringify(st2) } });
 const rebuilt = await labAction(u.id, m2.id, { action: 'open' });
 assert.match(rebuilt.intro!.notice ?? '', /updated/); assert.equal(JSON.parse(await stateOf(m2.id)).shell.files['/home/user/stale'], undefined);
 // Pruning: idle unsolved compacted, abandoned deleted, solved rows kept
 const old = (ms: number) => new Date(Date.now() - ms - 1000);
 await prisma.linuxLabSession.update({ where: key(m2.id), data: { updatedAt: old(LAB_LIMITS.unsolvedIdleMs) } });
 await prisma.linuxLabSession.update({ where: key(m1.id), data: { updatedAt: old(LAB_LIMITS.abandonedMs) } });
 const pruned = await pruneLabSessions();
 assert.ok(pruned.compacted >= 1);
 assert.equal(await stateOf(m2.id), '');
 assert.ok(await prisma.linuxLabSession.findUnique({ where: key(m1.id) }), 'solved rows are never deleted');
 const back = await labAction(u.id, m2.id, { action: 'open' }); assert.match(back.intro!.notice ?? '', /14 days/);
 await prisma.linuxLabSession.update({ where: key(m2.id), data: { updatedAt: old(LAB_LIMITS.abandonedMs) } });
 await pruneLabSessions(); assert.equal(await prisma.linuxLabSession.findUnique({ where: key(m2.id) }), null);
 void lsMission;
});
