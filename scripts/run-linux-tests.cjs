/* Compile the focused TS suite into a disposable folder; never use the app database. */
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyber-linux-tests-'));
try {
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const files = { engine: 'src/lib/linux/engine.ts', challenges: 'src/lib/linux/challenges.ts', access: 'src/lib/linux/access.ts', service: 'src/lib/linux/service.ts', prisma: 'src/lib/db/prisma.ts', 'engine.test': 'tests/linux-engine.test.ts', 'service.test': 'tests/linux-service.test.ts' };
  for (const [name, file] of Object.entries(files)) {
    let source = fs.readFileSync(path.join(root, file), 'utf8').replaceAll('@/lib/db/prisma', './prisma').replaceAll('../src/lib/linux/', './');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    fs.writeFileSync(path.join(temp, name + '.js'), output);
  }
  fs.copyFileSync(path.join(root, 'src/lib/linux/missions.json'), path.join(temp, 'missions.json'));
  cp.execFileSync(process.execPath, [path.join(root, 'scripts/check-linux-content.cjs')], { stdio: 'inherit' });
  const db = path.join(temp, 'tests.db'); fs.writeFileSync(db, '');
  const env = { ...process.env, DATABASE_URL: 'file:' + db, LINUX_LAB_AUTOPRUNE: 'off' };
  cp.execFileSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], { cwd: root, env, stdio: 'pipe' });
  // Direct invocation prints the nested node:test cases across Node versions.
  cp.execFileSync(process.execPath, [path.join(temp, 'engine.test.js')], { env, stdio: 'inherit' });
  cp.execFileSync(process.execPath, [path.join(temp, 'service.test.js')], { env, stdio: 'inherit' });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
