/* Regenerate the Linux lesson MDX files from src/lib/linux/missions.json (the source of truth). */
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const missions = require('../src/lib/linux/missions.json');
const dir = path.join(root, 'content/courses/linux-fundamentals/exercises');
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
    prose(m.concept),
    '',
    prose(m.explanation),
    '',
    ...(m.why ? ['## Why it matters', '', prose(m.why), ''] : []),
    '## Example',
    '',
    '```sh',
    m.example,
    '```',
    '',
    'Example filenames illustrate syntax; inspect your mission files before running them.',
    '',
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
  fs.writeFileSync(path.join(dir, m.id + '.mdx'), lines.join('\n'));
}
console.log(`Wrote ${missions.length} lesson files.`);
