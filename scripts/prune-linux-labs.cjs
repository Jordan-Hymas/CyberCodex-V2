/*
 * Compact idle Linux lab environments (see LAB_LIMITS in src/lib/linux/service.ts).
 * The app also prunes opportunistically; run this from cron for predictable cleanup:
 *   0 * * * *  cd /app && node scripts/prune-linux-labs.cjs
 * Keep the thresholds in sync with LAB_LIMITS.
 */
const { PrismaClient } = require('@prisma/client');
const DAY = 24 * 60 * 60 * 1000;
const LIMITS = { solvedIdleMs: DAY, unsolvedIdleMs: 14 * DAY, abandonedMs: 90 * DAY };
(async () => {
  const prisma = new PrismaClient();
  const ago = (ms) => new Date(Date.now() - ms);
  try {
    // Delete abandoned rows first: compaction bumps updatedAt
    const deleted = await prisma.linuxLabSession.deleteMany({ where: { solvedAt: null, updatedAt: { lt: ago(LIMITS.abandonedMs) } } });
    const compacted = await prisma.linuxLabSession.updateMany({
      where: { state: { not: '' }, OR: [
        { solvedAt: { not: null }, updatedAt: { lt: ago(LIMITS.solvedIdleMs) } },
        { solvedAt: null, updatedAt: { lt: ago(LIMITS.unsolvedIdleMs) } },
      ] },
      data: { state: '' },
    });
    const live = await prisma.linuxLabSession.count({ where: { state: { not: '' } } });
    console.log(`Compacted ${compacted.count}, deleted ${deleted.count}; ${live} live environments remain.`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
