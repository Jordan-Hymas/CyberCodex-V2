/* Regenerate the Linux lesson MDX files from src/lib/linux/missions.json (the source of truth). */
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const missions = require('../src/lib/linux/missions.json');
const coursesRoot = path.join(root, 'content/courses');
// Rewrite all three Linux courses' exercise folders from scratch so stale files can't linger.
for (const slug of ['linux-fundamentals', 'linux-intermediate', 'linux-advanced']) {
  const dir = path.join(coursesRoot, slug, 'exercises');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
// Escape characters MDX treats as JSX/expressions in prose
const prose = (t) =>
  t
    .replace(/[{}<>]/g, (c) => ({ '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' })[c])
    // A paragraph starting with import/export would be parsed as JavaScript
    .replace(/^(import|export)\b/, '`$1`');
const yaml = (t) => JSON.stringify(t);
for (const m of missions) {
  const lines = [
    '---',
    `title: ${yaml(m.title)}`,
    `description: ${yaml(m.brief)}`,
    'type: exercise',
    `xpReward: ${m.xp}`,
    '---',
    '',
    '## Learn',
    '',
    ...(m.lesson ? m.lesson.sections.flatMap((section) => [
      `### ${prose(section.heading)}`,
      '',
      ...(section.text ?? []).flatMap((t) => [prose(t), '']),
      ...(section.points ?? []).map((t) => `- ${prose(t)}`),
      ...(section.points ? [''] : []),
      ...(section.demo ? ['```sh', ...section.demo.map((d) => d.cmd + (d.note ? `   # ${d.note}` : '')), '```', ''] : []),
    ]) : [prose(m.concept), '', prose(m.explanation), '', '```sh', m.example, '```', '']),
    ...(m.lesson?.commands ? ['## Command cheat sheet', '', ...m.lesson.commands.map((c) => `- \`${c.syntax}\`: ${prose(c.does)}`), ''] : []),
    ...(m.lesson?.terms ? ['## New words', '', ...m.lesson.terms.map((t) => `- **${prose(t.term)}**: ${prose(t.means)}`), ''] : []),
    ...(m.why ? ['## Why it matters', '', prose(m.why), ''] : []),
    '## Your mission',
    '',
    prose(m.brief),
    '',
    // Only list steps when they add detail beyond the brief
    ...(m.steps.length === 1 && m.steps[0] === m.brief ? [] : [...m.steps.map((s, i) => `${i + 1}. ${prose(s)}`), '']),
    '## Common mistake',
    '',
    prose(m.pitfall),
    '',
    '## Check your understanding',
    '',
    prose(m.transfer),
    '',
    'Capture the personal flag and submit it in the form. Use `help` or `man COMMAND` for supported syntax. A reset restores fixtures and replaces the flag while preserving earned completion.',
    '',
  ];
  const dir = path.join(coursesRoot, m.course, 'exercises');
  fs.writeFileSync(path.join(dir, m.id + '.mdx'), lines.join('\n'));
}
console.log(`Wrote ${missions.length} lesson files.`);
