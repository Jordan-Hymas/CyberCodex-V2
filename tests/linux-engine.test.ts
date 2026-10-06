import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute, blankShell, addFile, listDir, readForEdit, saveFile } from '../src/lib/linux/engine';
import { missions, createChallenge, revealReward, flagMatches, objectiveMet } from '../src/lib/linux/challenges';
for (const mission of missions) test(`solve ${mission.level}: ${mission.id}`, () => {
  const challenge = createChallenge(mission); let transcript = '';
  for (const command of mission.solution) { const result = execute(challenge.shell, command); assert.equal(result.error, '', command); transcript += result.output; revealReward(mission, challenge.shell, challenge.flag); }
  assert.ok(transcript.includes(challenge.flag), 'solution must actually expose the flag');
  assert.ok(objectiveMet(mission, challenge.shell, challenge.flag));
  assert.ok(flagMatches(challenge.flag, challenge.hash));
});
test('independent instances and flags, including the same mission', () => {
 const a = createChallenge(missions[0]), b = createChallenge(missions[0]);
 assert.notEqual(a.flag, b.flag); assert.equal(flagMatches(a.flag,b.hash),false);
 execute(a.shell,'echo changed > dispatch.txt'); assert.ok(b.shell.files['/home/user/dispatch.txt'].text.includes(b.flag));
});
test('permission restoration is required', () => {
 const m = missions.find(m=>m.id==='restore-permission')!, c = createChallenge(m);
 assert.equal(execute(c.shell,'cat sealed.txt').status,1);
 execute(c.shell,'chmod u+r sealed.txt'); assert.ok(execute(c.shell,'cat sealed.txt').output.includes(c.flag));
});
test('state, quoted paths, normalized .., redirects and clear', () => {
 const s=blankShell(); execute(s,'mkdir -p a/b'); execute(s,'cd a/b'); assert.equal(s.cwd,'/home/user/a/b');
 execute(s,'echo "hello there" > "../note file"'); assert.equal(execute(s,'cat ../b/../"note file"').output,'hello there\n');
 execute(s,'echo again >> "../note file"'); assert.equal(execute(s,'cat "../note file" | tail -n 1').output,'again\n');
 assert.equal(execute(s,'clear').clear,true);
});
test('invalid commands cannot read host files or run host programs', () => {
 const s=blankShell(); assert.equal(execute(s,'cat /etc/passwd').status,1); assert.equal(execute(s,'curl https://example.com').status,1);
 assert.equal(execute(s,'echo $(id)').status,1); assert.equal(execute(s,'echo "unterminated').status,1);
});
test('exact objectives do not accept superficially similar contents', () => {
 const m=missions.find(m=>m.id==='redirect-report')!, c=createChallenge(m);
 execute(c.shell,'echo "relay ready extra" > status.txt'); revealReward(m,c.shell,c.flag);
 assert.equal(objectiveMet(m,c.shell,c.flag),false); assert.equal(c.shell.files['/home/user/reward.txt'],undefined);
});
test('pipelines and conditionals select correct branches', () => {
 const s=blankShell(); assert.equal(execute(s,'false && echo no || echo yes').output,'yes\n');
 assert.equal(execute(s,'true || echo no').output,'');
 addFile(s,'/home/user/data','z\na\nz\n'); assert.equal(execute(s,'sort data | uniq -u').output,'a\n');
});
test('tab completion listing respects permissions', () => {
 const s=blankShell(); addFile(s,'/home/user/notes.txt','hi\n'); execute(s,'mkdir docs'); addFile(s,'/home/user/.hidden','x');
 assert.deepEqual(listDir(s,'.').map(e=>e.name),['.hidden','docs','notes.txt']);
 assert.equal(listDir(s,'.').find(e=>e.name==='docs')!.dir,true);
 execute(s,'chmod 300 docs'); assert.deepEqual(listDir(s,'docs'),[]);
 assert.deepEqual(listDir(s,'/nope'),[]);
});
test('nano read/save uses the same rules as the shell', () => {
 const s=blankShell(); addFile(s,'/home/user/a.txt','one\n');
 assert.deepEqual(readForEdit(s,'a.txt'),{path:'/home/user/a.txt',text:'one\n',isNew:false});
 assert.equal(readForEdit(s,'new.txt').isNew,true);
 assert.throws(()=>readForEdit(s,'missing/x.txt'));
 assert.throws(()=>readForEdit(s,'/home'));
 saveFile(s,'a.txt','two\n'); assert.equal(execute(s,'cat a.txt').output,'two\n');
 execute(s,'chmod 400 a.txt'); assert.throws(()=>saveFile(s,'a.txt','x'));
 execute(s,'chmod 000 a.txt'); assert.throws(()=>readForEdit(s,'a.txt'));
 assert.throws(()=>saveFile(s,'big.txt','x'.repeat(70000)));
 assert.equal(execute(s,'nano a.txt').status,1);
});
