const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compiled = ts.transpileModule(fs.readFileSync('src/lib/auth/oauth.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, process: { env: {} }, URL });
const { safeAuthRedirect, configuredOAuthProviders, verifiedOAuthEmail, selectGitHubEmail } = exportsObject;
for (const value of [undefined, '//evil.example', '/\\evil.example', 'https://evil.example', '/\nevil']) assert.equal(safeAuthRedirect(value), '/dashboard');
assert.equal(safeAuthRedirect('/courses/linux?from=signup'), '/courses/linux?from=signup');
assert.equal(configuredOAuthProviders({}).length, 0);
assert.equal(configuredOAuthProviders({ AUTH_GOOGLE_ID: 'your-client', AUTH_GOOGLE_SECRET: 'secret' }).length, 0);
assert.equal(configuredOAuthProviders({ AUTH_GOOGLE_ID: 'real-id', AUTH_GOOGLE_SECRET: 'real-secret' }).join(','), 'google');
assert.equal(verifiedOAuthEmail('google', { email: 'User@example.com', email_verified: true }), 'user@example.com');
assert.equal(verifiedOAuthEmail('google', { email: 'user@example.com', email_verified: false }), null);
assert.equal(verifiedOAuthEmail('github', { email: 'user@example.com' }), null);
assert.equal(verifiedOAuthEmail('untrusted', { email: 'user@example.com', email_verified: true }), null);
assert.equal(selectGitHubEmail([{ email: 'attacker@example.com', primary: true, verified: false }, { email: 'USER@example.com', primary: false, verified: true }]), 'user@example.com');
assert.equal(selectGitHubEmail([{ email: 'other@example.com', verified: true }, { email: 'primary@example.com', primary: true, verified: true }]), 'primary@example.com');
assert.equal(selectGitHubEmail([{ email: 'user@example.com', verified: false }]), null);
assert.equal(selectGitHubEmail(null), null);
console.log('Auth policy tests passed (redirects, configuration, verified provider emails).');
