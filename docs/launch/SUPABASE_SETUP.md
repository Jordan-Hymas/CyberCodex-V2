# Supabase database and social sign-in setup

Prepared October 6, 2026. This is the implementation runbook for the database/auth work. Billing and pricing are unchanged.

## Recommended architecture and cost

Use **Supabase-hosted PostgreSQL + Prisma + the existing Auth.js login system**. Supabase is PostgreSQL (SQL), operated for you; the advantage is managed infrastructure, not replacing relational data. Avoid a second, competing Supabase Auth identity system for this launch: our existing users, passwords, provider accounts, progress, XP, badges, and labs already fit the Prisma schema.

Start on Supabase Free for development and callback testing. For public launch, choose **Pro with one Micro project, currently $25/month**, with 8 GB included disk and daily backups retained seven days. Free has a 500 MB database quota, no included automatic backups, and can pause after a week of inactivity. Pro's included compute credit covers one Micro; an extra project or larger compute costs more. The Small compute option adds about $5/month over Micro at current rates. Keep spend controls enabled and check the checkout total. [Supabase pricing](https://supabase.com/pricing).

This is a reasonable starting database for **100 registered users**. Neither monthly-active-user allowances nor connection counts are a benchmark for 100 simultaneous lab users. With Auth.js we are not consuming Supabase Auth's MAU allocation. Benchmark command-heavy traffic before claiming 100 concurrent learners; lab commands involve multiple queries and state rewrites. Start the application pool at five connections, use the same geographic region for VPS/database, and monitor query latency, connections, disk and egress. Supabase does not host this Next.js application; it still needs a small application server. A 2 vCPU / 4 GB VPS plus Supabase Pro is about $49/month using the $24 DigitalOcean baseline, before email, domain, backups and optional services. [VPS price reference](https://www.digitalocean.com/pricing/droplets).

Neon is also a viable managed PostgreSQL alternative, particularly for intermittent workloads; its usage-based billing can be attractive but is less predictable without workload measurements. The code uses ordinary PostgreSQL and can move providers. Supabase is the recommended first choice here because it meets your preference and offers a straightforward production budget. [Neon pricing model](https://neon.com/blog/new-usage-based-pricing).

**Do not connect either home OptiPlex to the public application.** No inbound port forwards, public database, reverse tunnel, or routed VPN from production into your home network is needed. Keep them for local development with synthetic data. A compromised VPS could still abuse its database permissions, so managed hosting does not replace application security. Separate credentials, restrictive grants, network restrictions where available, backups, and patched app dependencies matter.

## What is implemented

- Separate PostgreSQL schema and initial migration under `prisma/postgresql/`; existing local SQLite database/migrations are preserved.
- A generated PostgreSQL schema and drift check; edit the canonical models in `prisma/schema.prisma`, then run `npm run db:postgres:sync` and create/review a corresponding PostgreSQL migration.
- Private `cybercodex` schema with row-level security enabled. A separate runtime role script grants only app-table data access, not schema ownership or migration-table writes.
- Explicit PostgreSQL generate/build/deploy scripts and secret-safe configuration checks.
- Shared Google/GitHub buttons on login/signup, configured-provider availability, safe same-site redirects, verified provider-email checks, and disabled automatic same-email account merging.
- A verification timestamp persisted after a successful OAuth login when the provider email matches the local account.
- Auth configuration diagnostics, auth policy tests, and a database smoke test that rolls back its synthetic records.

**Not yet done:** hosted project provisioning, real provider credentials, a live database migration/import, real OAuth callbacks, or a production load test. The local environment currently has neither Google's nor GitHub's client ID/secret. That is why provider configuration must be completed even with the code fixed.

## 1. Create the database project

1. Create a project in your own Supabase organization, near the planned VPS region. Use a generated strong database password and account MFA. Free is sufficient to prepare this; do not pay for optional custom-domain/PITR add-ons automatically.
2. Use Supabase only as PostgreSQL for this integration. Disable the Data API if it is unused. Never add `cybercodex` to exposed schemas or grant it to browser-facing roles. No `NEXT_PUBLIC_SUPABASE_*` or service-role API key is needed in this app. [API hardening](https://supabase.com/docs/guides/api/securing-your-api).
3. Copy the **session pooler** connection details from the project's Connect panel. Session mode on port 5432 works for a persistent VPS and supports IPv4; a direct connection also works if the VPS has the required connectivity. Do not use transaction-pooler port 6543 for migrations. [Supabase Prisma connections](https://supabase.com/docs/guides/database/prisma).
4. Configure TLS and restrict database access to the deployment/app IPs where supported by your selected plan. Keep migration credentials out of the long-running app process.

## 2. Configure and migrate in a separate deployment checkout

Do not run PostgreSQL client generation in the same checkout where the other agent is running SQLite: both targets generate `@prisma/client`. Use a separate checkout/container for deployment. A future full switch to PostgreSQL development can remove this dual-target arrangement.

The initial migration expects an empty application schema. It **does not import existing SQLite users or progress**. Keep that database untouched. If any local data must survive, plan and test an explicit ID-preserving import first; never reset it to make deployment work.

Set environment variables in the deployment secret store (URL-encode password characters; replace all example placeholders):

```dotenv
# Temporary migration-stage value; replace with restricted runtime role afterward.
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@REGION.pooler.supabase.com:5432/postgres?schema=cybercodex&sslmode=require&connection_limit=5"
DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@REGION.pooler.supabase.com:5432/postgres?schema=cybercodex&sslmode=require"
```

Then, using the pinned Prisma 6 tools:

```bash
npm ci
npm run db:postgres:check
npm run db:postgres:deploy
```

`DIRECT_URL` is the migration owner's connection; the custom config uses it for CLI operations. `DATABASE_URL` is the application's connection. Never run `migrate reset` on a hosted customer database. The private schema is created by the initial migration. Supabase's `auth.users` is intentionally not used; Auth.js uses `cybercodex.User` and `cybercodex.Account`.

Run `prisma/postgresql/operations/runtime-role.sql` as the migration owner through the Supabase SQL editor. It creates `cybercodex_app` without a password, removes API-role access, and grants it CRUD access to app tables. Set its password separately using a secure administrator session, for example psql's interactive `\password cybercodex_app`; do not commit a password SQL statement.

Change the runtime connection to that role, retaining the project suffix shown by Supabase:

```dotenv
DATABASE_URL="postgresql://cybercodex_app.PROJECT:RUNTIME_PASSWORD@REGION.pooler.supabase.com:5432/postgres?schema=cybercodex&sslmode=require&connection_limit=5"
```

Build and verify in the deployment checkout:

```bash
npm run build:postgres
npm run db:postgres:smoke
npm start
```

Remove `DIRECT_URL` from the runtime environment after the migration/build job. The smoke test verifies the actual role/schema, creates synthetic user/provider/progress/XP/lab records in a transaction, reads them back, and rolls everything back. It is a connectivity/permissions test, not a concurrency benchmark.

RLS policies intentionally permit the **server runtime role** to work across users, because Auth.js/Next.js enforce ownership. They do not turn Auth.js sessions into Supabase Auth sessions. Browser roles get no access. When adding models, update the migration and the reviewed runtime-role table list; newly created tables should remain inaccessible until explicitly granted.

For local SQLite development, keep the existing `DATABASE_URL=file:...`. If the shared client was accidentally generated for PostgreSQL, stop local processes and run `npm run db:sqlite:generate` before restarting them.

## 3. Register Google and GitHub OAuth apps

No OAuth vendor can authenticate this app without client credentials. Put secrets in the local ignored environment file or deployment secrets, never chat, browser code or Git. Registration belongs in Google/GitHub consoles, **not the Supabase Auth dashboard**, for this Auth.js integration.

**Google:** create a web OAuth client, configure its audience/consent branding and production homepage/privacy details, and register the exact redirect URI. Request only `openid email profile`; Gmail inbox permissions are unnecessary. During testing, add test users as required by the selected audience/publishing state. [Google configuration](https://authjs.dev/getting-started/providers/google).

**GitHub:** create an OAuth App, set its homepage and authorization callback URL. Use separate development and production apps. The integration requests identity/email access, fetches verified email addresses (including private emails), and prefers a verified primary address. It never requests repository access. [GitHub configuration](https://authjs.dev/getting-started/providers/github).

| Environment | Google callback | GitHub callback |
|---|---|---|
| Local | `http://localhost:3000/api/auth/callback/google` | `http://localhost:3000/api/auth/callback/github` |
| Production | `https://YOUR-DOMAIN/api/auth/callback/google` | `https://YOUR-DOMAIN/api/auth/callback/github` |

Use the same browser hostname/port you registered. Opening the app through a LAN IP does not make a localhost OAuth callback valid. Pick the final production domain before registering its production callbacks.

Required configuration:

```dotenv
AUTH_GOOGLE_ID="<Google client ID>"
AUTH_GOOGLE_SECRET="<Google client secret>"
AUTH_GITHUB_ID="<GitHub client ID>"
AUTH_GITHUB_SECRET="<GitHub client secret>"
AUTH_SECRET="<persistent random secret>"
# Production only; leave unset for flexible local development.
AUTH_URL="https://YOUR-DOMAIN"
```

Run `npm run auth:check`, restart Next.js after changing credentials, then test both buttons. Disabled buttons mean that provider's configuration is missing/placeholder; enabling a button proves only that credentials are present, not that the provider has accepted them.

New OAuth users get a free local account automatically. Returning users keep their provider account mapping and progress. If an email already belongs to another account, login explains that the original sign-in method is required; there is no silent merge. A dedicated reauthenticated account-linking screen remains future work. Usernames remain optional for social signup.

## 4. Acceptance checks before inviting users

- New Google and GitHub users can enter the dashboard without choosing a password; returning login resolves to the same user ID.
- Private GitHub email works; missing/unverified email, denied consent, invalid client credentials, and mismatched redirect URIs fail safely.
- Same-email collisions do not merge accounts or give access to another user's progress.
- Saved XP/completions survive logout, application restart, and another device.
- Anonymous Data API requests cannot read account/progress tables; the runtime role cannot create tables or modify migration history.
- Database smoke test passes against the hosted instance; migrations are rehearsed on a disposable project/schema before customer data exists.
- Load-test 100 registered users at realistic concurrency, then separately 100 concurrent command users. Inspect latency/connection queues, not only average CPU.
- Verify backup retention and restore a backup. Pro daily backups are not one-hour recovery; more frequent encrypted exports or paid recovery options are a separate decision.
- Patch the critical Next.js/React dependency issue identified in the launch report before any public exposure. Database outsourcing cannot protect a vulnerable application server.

## Validation performed in this checkout

Auth policy tests and TypeScript checking pass. The PostgreSQL schema validates and the initial SQL was generated by the installed Prisma CLI. No Supabase endpoint or OAuth credentials were supplied, and this execution user cannot access the local Docker daemon, so hosted migration/permissions tests and real provider sign-in remain unverified. The setup scripts report missing configuration without printing secrets.
