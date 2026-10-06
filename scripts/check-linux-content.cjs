const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const matter = require('gray-matter');
async function main() {
 const { serialize } = await import('next-mdx-remote/serialize');
 const root = path.resolve(__dirname,'..'), missions = require('../src/lib/linux/missions.json');
 const curriculum = require('../content/courses/linux-fundamentals/curriculum.json');
 assert.deepEqual(curriculum.chapters.flatMap(c=>c.exercises.map(e=>e.id)),missions.map(m=>m.id));
 for(const mission of missions) {
   const content=fs.readFileSync(path.join(root,'content/courses/linux-fundamentals/exercises',mission.id+'.mdx'),'utf8');
   await serialize(matter(content).content);
 }
 assert.equal(curriculum.progress.totalXp,missions.reduce((n,m)=>n+m.xp,0));
 console.log(`Validated ${missions.length} lesson files, MDX compilation, curriculum ordering and XP totals.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
