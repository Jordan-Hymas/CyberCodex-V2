require('dotenv').config({ quiet: true });
let failed = false;
for (const provider of ['GOOGLE', 'GITHUB']) {
  const ready = ['ID', 'SECRET'].every(suffix => {
    const value = process.env[`AUTH_${provider}_${suffix}`];
    return value?.trim() && !/^(your-|replace|placeholder)/i.test(value);
  });
  console.log(`${provider}: ${ready ? 'configured (callback test still required)' : 'missing client ID/secret'}`);
  if (!ready) failed = true;
}
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32 || /^your-/i.test(process.env.AUTH_SECRET)) {
  console.error('AUTH_SECRET: set a random secret of at least 32 characters'); failed = true;
} else console.log('AUTH_SECRET: set');
if (process.env.AUTH_URL) {
  try {
    const url = new URL(process.env.AUTH_URL);
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw Error();
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error();
    for (const provider of ['google', 'github']) console.log(`${provider} callback: ${url.origin}/api/auth/callback/${provider}`);
  } catch { console.error('AUTH_URL: must be a canonical origin, HTTPS in production'); failed = true; }
} else {
  console.log('AUTH_URL: unset; local OAuth callback must match the browser origin');
  if (process.env.NODE_ENV === 'production') { console.error('Set AUTH_URL before production OAuth setup'); failed = true; }
}
process.exitCode = failed ? 1 : 0;
