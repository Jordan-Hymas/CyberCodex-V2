import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execute, blankShell, addFile, listDir, readForEdit, saveFile } from '../src/lib/linux/engine';
import { missions, createChallenge, revealReward, runCommand, fillSecrets, flagMatches, objectiveMet, decoyIndex, coachTip } from '../src/lib/linux/challenges';
for (const mission of missions) test(`solve ${mission.level}: ${mission.id}`, () => {
  const challenge = createChallenge(mission); let transcript = '';
  for (const template of mission.solution) {
    // Solutions may name per-instance secrets ({{RAND:name}}, {{PICK:name}}) chosen when the fixture was built
    const command = fillSecrets(template, challenge.secrets);
    const result = runCommand(mission, challenge.shell, challenge.flag, command);
    // Operator programs talk on standard error by design; everywhere else a reference step must not error
    if (mission.level !== 'operator') assert.equal(result.error, '', command);
    assert.doesNotMatch(result.error, /not supported|not found|damaged/, command);
    transcript += result.output;
  }
  assert.ok(transcript.includes(challenge.flag), 'solution must actually expose the flag');
  for (const decoy of challenge.decoys) assert.ok(!transcript.includes(decoy), 'reference solution must not print a decoy');
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
test('decoys are planted, unique per instance and recognised', () => {
 for (const m of missions) {
  const c = createChallenge(m), texts = Object.values(c.shell.files).map(n => n.text).join('\n');
  assert.ok(!texts.includes('{{'), m.id + ': unresolved placeholder');
  assert.equal(c.decoys.length, m.decoys.length);
  c.decoys.forEach((d, i) => {
   const planted = texts.includes(d) || texts.includes(Buffer.from(d + '\n').toString('base64')) || texts.includes([...d].reverse().join(''));
   assert.ok(planted, `${m.id}: decoy ${i} never planted`);
   assert.equal(decoyIndex(d, c.decoys), i); assert.equal(flagMatches(d, c.hash), false);
  });
  for (const rule of m.coach) assert.doesNotThrow(() => new RegExp(rule.when), m.id + ': bad coach pattern');
 }
});
test('coaching tips respond to common mistakes', () => {
 const welcome = missions.find(m => m.id === 'welcome-to-linux')!;
 assert.match(coachTip(welcome, 'CYBER{abc}', true), /flag box/);
 assert.match(coachTip(welcome, 'cat dispatch', true), /extension/);
 assert.equal(coachTip(welcome, 'cat dispatch.txt', false), '');
 const append = missions.find(m => m.id === 'append-log')!;
 assert.match(coachTip(append, 'echo restored > status.log', false), /single >/);
 assert.equal(coachTip(append, 'echo restored >> status.log', false), '');
});
test('beginner traps redirect instead of dead-ending', () => {
 const cd = createChallenge(missions.find(m => m.id === 'cd-command')!);
 assert.match(execute(cd.shell, 'cat stations/depot/message.txt').output, /cd \.\.\/relay/);
 const quoted = createChallenge(missions.find(m => m.id === 'quoted-paths')!);
 const unquoted = execute(quoted.shell, 'cat shift notes.txt').output;
 assert.match(unquoted, /quotes/); assert.ok(!unquoted.includes(quoted.flag));
 const pwd = createChallenge(missions.find(m => m.id === 'pwd-command')!);
 assert.equal(pwd.shell.cwd, '/home/user/field/sector-4');
});

test('root owns /flag: no reading, moving, removing or chmod', () => {
 const c = createChallenge(missions.find(m => m.id === 'op-absolute-launch')!);
 for (const cmd of ['cat /flag', 'chmod 777 /flag', 'mv /flag /tmp/f', 'rm /flag', 'cp /flag /tmp/f', 'rm -rf /opt/relay']) assert.equal(execute(c.shell, cmd).status, 1, cmd);
 assert.match(execute(c.shell, 'ls -l /flag').output, /^-r-------- root /);
 assert.ok(execute(c.shell, '/opt/relay/bin/beacon').output.includes(c.flag));
});
test('programs resolve like Linux: paths, PATH, never the current directory', () => {
 const c = createChallenge(missions.find(m => m.id === 'op-dot-slash')!);
 execute(c.shell, 'cd /opt/relay/bin');
 assert.match(execute(c.shell, 'uplink').error, /\.\/uplink/);
 assert.ok(execute(c.shell, './uplink').output.includes(c.flag));
 assert.equal(execute(c.shell, '/opt/relay/bin/uplink').output, '');
 const v = createChallenge(missions.find(m => m.id === 'op-argument-value')!);
 assert.ok(execute(v.shell, 'vault --export /flag').output.includes(v.flag));
 execute(v.shell, 'echo hi > /tmp/plain'); assert.match(execute(v.shell, '/tmp/plain').error, /permission denied/);
 execute(v.shell, 'chmod 755 /tmp/plain'); assert.match(execute(v.shell, '/tmp/plain').error, /cannot execute/);
});
test('stream redirection: 2>, 2>&1 ordering, >&2 and /dev/null', () => {
 const s = blankShell();
 execute(s, 'cat missing 2> err.txt'); assert.match(s.files['/home/user/err.txt'].text, /no such file/);
 assert.equal(execute(s, 'cat missing 2> /dev/null').error, '');
 assert.match(execute(s, 'cat missing 2>&1 | wc -l').output, /^1/);
 const both = execute(s, 'cat missing > out.txt 2>&1'); assert.equal(both.error, ''); assert.match(s.files['/home/user/out.txt'].text, /no such file/);
 const first = execute(s, 'cat missing 2>&1 > out2.txt'); assert.match(first.error, /no such file/); assert.equal(s.files['/home/user/out2.txt'].text, '');
 const moved = execute(s, 'echo oops >&2'); assert.equal(moved.output, ''); assert.equal(moved.error, 'oops\n');
 assert.equal(execute(s, 'echo 2 > two.txt').status, 0); assert.equal(s.files['/home/user/two.txt'].text, '2\n');
 assert.equal(execute(s, 'echo "a\nb" | tr -d "\n"').output, 'ab');
});
test('variables: local, exported, per-command and read', () => {
 const s = blankShell();
 execute(s, 'LOCAL=1'); execute(s, 'export SHARED=2'); execute(s, 'QUOTED="two words"');
 assert.equal(execute(s, 'echo $LOCAL $SHARED $QUOTED').output, '1 2 two words\n');
 const env = execute(s, 'env').output; assert.match(env, /SHARED=2/); assert.doesNotMatch(env, /LOCAL/);
 execute(s, 'export LOCAL'); assert.match(execute(s, 'env').output, /LOCAL=1/);
 assert.equal(execute(s, 'VAR = 1').status, 1);
 assert.equal(execute(s, '"X=1"').status, 1, 'a quoted word is not an assignment');
 execute(s, 'echo first line > key.txt'); execute(s, 'read A B < key.txt'); assert.equal(s.env.A, 'first'); assert.equal(s.env.B, 'line');
 const piped = execute(s, 'cat key.txt | read C'); assert.equal(s.env.C, undefined); assert.match(piped.error, /subshell/);
 assert.equal(execute(s, 'read D').status, 1);
 execute(s, 'unset SHARED'); assert.doesNotMatch(execute(s, 'env').output, /SHARED/);
 const legacy = blankShell(); delete legacy.exported; legacy.env.OLD = 'x'; assert.match(execute(legacy, 'env').output, /OLD=x/);
});
test('operator programs reward the technique, not the shortcut', () => {
 const get = (id: string) => { const m = missions.find(x => x.id === id)!; return { m, c: createChallenge(m) }; };
 { const { c } = get('op-export-scope');
   execute(c.shell, 'OPERATOR=relay'); assert.match(execute(c.shell, 'clearance').error, /did not export/);
   execute(c.shell, 'export OPERATOR CALLSIGN=night'); assert.match(execute(c.shell, 'clearance').error, /CALLSIGN reached me/);
   execute(c.shell, 'unset CALLSIGN'); execute(c.shell, 'CALLSIGN=night'); assert.ok(execute(c.shell, 'clearance').output.includes(c.flag)); }
 { const { c } = get('op-append-halves');
   execute(c.shell, 'assemble > assembled.txt'); assert.ok(!c.shell.files['/home/user/assembled.txt'].text.includes(c.flag));
   execute(c.shell, 'assemble >> assembled.txt'); assert.equal(c.shell.files['/home/user/assembled.txt'].text, c.flag + '\n'); }
 { const { c } = get('op-stderr-filter');
   const plain = execute(c.shell, 'flood | grep CYBER'); assert.equal(plain.output, ''); assert.ok(!plain.error.includes(c.flag), 'error output is truncated before the flag'); }
 { const { m, c } = get('op-read-variable');
   const key = c.shell.files['/opt/relay/rotating.key'].text.trim();
   runCommand(m, c.shell, c.flag, 'cat /opt/relay/rotating.key');
   assert.ok(!runCommand(m, c.shell, c.flag, `KEY=${key}`).output.includes(c.flag), 'a hand-copied key is already stale'); }
 { const { c } = get('op-exit-status');
   execute(c.shell, 'probe'); const code = c.shell.env['?']; execute(c.shell, 'ls');
   assert.match(execute(c.shell, 'report $?').error, /wrong code/); assert.equal(execute(c.shell, `report ${code}`).status, 0); }
 { const { c } = get('op-final-uplink');
   assert.match(execute(c.shell, 'cd /tmp').error, /^$/); const path = Object.keys(c.shell.files).find(f => f.includes('.uplink-'))!;
   assert.match(execute(c.shell, `${path} --channel nope`).error, /no such channel/); }
});
test('per-instance secrets differ between learners', () => {
 const m = missions.find(x => x.id === 'op-hidden-launcher')!, a = createChallenge(m), b = createChallenge(m);
 const live = (c: typeof a) => Object.keys(c.shell.files).find(f => f.includes('/.launcher-'));
 assert.ok(live(a) && live(b)); assert.notEqual(a.secrets.live, undefined);
 assert.equal(live(a), '/opt/relay/bin/.launcher-' + a.secrets.live);
});
test('every lesson is complete and its examples run in the lab', () => {
 type Lesson = { files?: { path: string; text?: string; mode?: number; owner?: string; dir?: boolean; program?: string }[]; cwd?: string; sections: { heading: string; text?: string[]; points?: string[]; demo?: { cmd: string; fails?: boolean }[] }[]; commands?: unknown[] };
 for (const m of missions) {
  const lesson = (m as { lesson?: Lesson }).lesson;
  assert.ok(lesson, m.id + ': missing lesson');
  assert.ok(lesson.sections.length >= 3 || m.id.endsWith('relay') || m.id === 'op-final-uplink', m.id + ': lesson needs at least three sections');
  assert.ok(lesson.sections.some(s => s.demo?.length), m.id + ': lesson needs a worked example');
  assert.ok(lesson.commands?.length, m.id + ': lesson needs a command reference');
  // Same setup as the lesson page (LessonContent.runLessonDemos)
  const s = blankShell();
  for (const f of lesson.files ?? []) {
   if (f.dir) { addFile(s, f.path + '/.keep', ''); delete s.files[f.path + '/.keep']; s.files[f.path].mode = f.mode ?? 0o755; }
   else addFile(s, f.path, f.text ?? '', f.mode);
   if (f.owner === 'root') s.files[f.path].owner = 'root';
   if (f.program) { assert.ok(f.program.startsWith('demo-'), m.id + ': lessons may only use demo programs'); s.files[f.path].program = f.program; }
  }
  if (lesson.cwd) s.cwd = lesson.cwd;
  for (const section of lesson.sections) for (const step of section.demo ?? []) {
   const r = execute(s, step.cmd);
   // Examples that show a mistake on purpose are marked fails: true
   if (step.fails) assert.notEqual(r.error, '', `${m.id}: ${step.cmd} should fail`);
   else assert.doesNotMatch(r.error, /not found|not supported|unsupported|damaged|missing operand/, `${m.id}: ${step.cmd}`);
   assert.ok(!r.output.includes('CYBER{') || /REBYC|eulav/.test(step.cmd), `${m.id}: lesson examples must not print flags`);
  }
 }
});
