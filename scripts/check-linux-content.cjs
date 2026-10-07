const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const matter = require('gray-matter');
const COURSES = ['linux-fundamentals', 'linux-intermediate', 'linux-advanced'];
async function main() {
 const { serialize } = await import('next-mdx-remote/serialize');
 const root = path.resolve(__dirname, '..'), missions = require('../src/lib/linux/missions.json');
 let checked = 0;
 for (const slug of COURSES) {
   const curriculum = require(`../content/courses/${slug}/curriculum.json`);
   const ids = curriculum.chapters.flatMap((c) => c.exercises.map((e) => e.id));
   const courseMissions = missions.filter((m) => m.course === slug);
   // Curriculum lists exactly this course's missions, in mission order.
   assert.deepEqual(ids, courseMissions.map((m) => m.id), `${slug}: curriculum order`);
   for (const mission of courseMissions) {
     const content = fs.readFileSync(path.join(root, 'content/courses', slug, 'exercises', mission.id + '.mdx'), 'utf8');
     await serialize(matter(content).content);
     checked++;
   }
   assert.equal(curriculum.progress.totalXp, courseMissions.reduce((n, m) => n + m.xp, 0), `${slug}: totalXp`);
   assert.equal(curriculum.progress.totalExercises, courseMissions.length, `${slug}: totalExercises`);
 }
 // Every mission belongs to exactly one course.
 assert.equal(checked, missions.length, 'every mission has a lesson file');
 console.log(`Validated ${checked} lesson files across ${COURSES.length} courses, MDX compilation, curriculum ordering and XP totals.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
