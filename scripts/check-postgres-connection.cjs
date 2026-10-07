require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
if (!/^postgres(?:ql)?:/.test(process.env.DATABASE_URL || '')) throw Error('Requires a PostgreSQL DATABASE_URL and PostgreSQL-generated Prisma client');
const prisma = new PrismaClient();
const rollback = new Error('intentional smoke-test rollback');
(async () => {
  const [{ schema, role }] = await prisma.$queryRaw`SELECT current_schema() AS schema, current_user AS role`;
  if (schema !== 'cybercodex' || role !== 'cybercodex_app') throw Error('Use the private cybercodex schema and restricted cybercodex_app role');
  try {
    await prisma.$transaction(async tx => {
      const id = 'database-smoke-' + require('node:crypto').randomUUID();
      await tx.user.create({ data: { id, email: `${id}@example.invalid` } });
      await tx.account.create({ data: { userId: id, provider: 'google', providerAccountId: id, type: 'oidc' } });
      await tx.userExercise.create({ data: { userId: id, courseId: 'smoke', exerciseId: 'smoke', isCompleted: true } });
      const user = await tx.user.update({ where: { id }, data: { totalXp: { increment: 10 } } });
      if (user.totalXp !== 10) throw Error('XP persistence check failed');
      await tx.linuxLabSession.create({ data: { userId: id, exerciseId: 'smoke', state: '{}', flagHash: 'smoke' } });
      const saved = await tx.user.findUnique({ where: { id }, include: { accounts: true, exercises: true, linuxLabSessions: true } });
      if (saved.accounts.length !== 1 || saved.exercises.length !== 1 || saved.linuxLabSessions.length !== 1) throw Error('Relation persistence check failed');
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  console.log('PostgreSQL role, schema, account, progress, XP and lab persistence checks passed; test rows rolled back.');
})().catch(() => { console.error('PostgreSQL smoke test failed. Check generated client, credentials, migrations and runtime-role grants. No connection secrets are printed.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
