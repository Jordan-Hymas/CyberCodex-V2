require('dotenv').config({ quiet: true });
let failed = false;
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  try {
    const url = new URL(process.env[key] || '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw Error('must be a PostgreSQL URL');
    if (!url.username || !url.password) throw Error('must include database credentials');
    if (url.searchParams.get('schema') !== 'cybercodex') throw Error('must use schema=cybercodex');
    if (!['require', 'verify-full'].includes(url.searchParams.get('sslmode') || '')) throw Error('must require TLS');
    if (key === 'DIRECT_URL' && (url.port === '6543' || url.searchParams.get('pgbouncer') === 'true')) throw Error('migrations require a direct/session connection (usually port 5432)');
    if (key === 'DATABASE_URL' && !/^[1-9][0-9]*$/.test(url.searchParams.get('connection_limit') || '')) throw Error('must set connection_limit (start at 5)');
    console.log(`${key}: valid PostgreSQL configuration`);
  } catch (error) { console.error(`${key}: ${error.message === 'Invalid URL' ? 'missing or invalid URL' : error.message}`); failed = true; }
}
process.exitCode = failed ? 1 : 0;
