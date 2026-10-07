# CyberCodex launch readiness: accounts, payments, storage, and hosting

Prepared October 6, 2026. Scope: source review of the current working tree, targeted checks, and current vendor documentation. Another agent is editing course/lab code; these findings describe the snapshot inspected today. No application code, credentials, provider accounts, or deployments were changed.

## 1. Recommended decision

**Keep Next.js, Prisma, and the existing Auth.js integration. Move production data to PostgreSQL, finish Google/GitHub signup, and implement Stripe-hosted subscription Checkout and the customer portal.** Start with a **2 vCPU / 4 GB RAM / 80 GB SSD application VPS plus a small managed PostgreSQL instance**, in the same region. Budget **about $50–80/month plus payment fees and domain registration** for an early launch; the detailed budget below includes an allowance for the domain spread over the year.

This is an engineering starting estimate for **100 registered users**, assuming roughly 5–20 active at once. If the goal means **100 people actively using labs simultaneously**, budget for **4 vCPU / 8 GB application RAM plus 2 GB managed PostgreSQL** and prove capacity with a staging load test. A larger VPS alone does not fix database contention or CPU-heavy synchronous JavaScript.

The current site is **not ready for public paid launch**. Billing is not implemented, non-Linux XP can be manipulated, identity linking needs repair, and the locked framework version has a known critical security advisory. These are more urgent than removing unused images or buying a large server.

You do **not** currently need 100 Linux containers. The terminal architecture is substantially lighter than that.

## 2. What exists today

Paths below are relative to the repository root.

| Area | Existing implementation | Launch assessment |
|---|---|---|
| Application | Next.js App Router, React, TypeScript; lockfile has Next 16.0.3, React 19.2.0 | Preserve architecture; patch dependencies before exposing it |
| Database | Prisma; SQLite schema and SQLite migration history | Real persistence exists; production PostgreSQL migration still required |
| Accounts | `User`, `Account`, `Session`, `VerificationToken`; email/password signup and login | Useful foundation, not a finished identity lifecycle |
| Passwords | Argon2id hashing; password recovery/change handlers | Keep hashing; repair revocation, throttling, and reset transactions |
| OAuth | Google/GitHub providers and login buttons | Provider configuration exists; real callbacks have not been validated |
| Signup | Credentials form; automatic credentials login | No Google/GitHub buttons on signup; plan selection is lost |
| Progress | `CourseProgress`, `UserExercise`, badges, XP and levels | Stored in DB; non-Linux writes need server authority and concurrency protection |
| Linux labs | Per-user/per-mission JSON state, version checks, server flag validation and transactional rewards | Stronger than generic progress path; load test on PostgreSQL |
| Billing | Four subscription-related fields on `User`; pricing page and environment placeholders | No Stripe SDK, checkout route, webhook handler, or customer portal found |
| Paid access | Linux server checks consult current DB subscription fields | Preserve this pattern and extend across all paid content/API routes |
| Email | Resend verification, welcome, reset helpers | Config mismatches and delivery handling need repair |
| Abuse prevention | Upstash dependencies and `LoginAttempt` model | No integrated general auth rate limiter or login-attempt writes found |
| Preferences | `/api/user/preferences` returns success | Does not persist changes |
| Deployment | Build/start scripts | No production Dockerfile/Compose, service definition, CI deployment, or backup/restore runbook found |

Primary evidence: `prisma/schema.prisma`; `src/lib/auth/auth.ts`; `src/lib/auth/auth.config.ts`; `src/components/auth/{LoginForm,SignupForm}.tsx`; `src/lib/linux/{engine,service,access}.ts`; `src/app/api/progress/{complete-exercise,start-course}/route.ts`; `src/app/pricing/page.tsx`; `src/lib/email/{send,resend}.ts`; `package.json` and `package-lock.json`.

## 3. Fixes required before launch

### Block public exposure

1. **Patch Next.js/React and audit the locked dependency tree.** Next 16.0.3 predates the 16.0.7 fix for the critical RSC remote-code-execution advisory. Use the currently patched compatible release, not merely that historical minimum; run build and regression checks after updating. This is a confirmed affected-version finding, not evidence that this machine was exploited. [Next.js advisory](https://nextjs.org/blog/CVE-2025-66478).
2. **Remove client control over rewards and course totals.** The generic completion route accepts `xpReward`, arbitrary course/exercise IDs, and `usedSolution`; start-course accepts totals from the browser. Resolve IDs against server curriculum, derive rewards/totals there, reject unknown IDs, bound code/body sizes, and enforce prerequisites and entitlements. Linux is explicitly excluded from this generic endpoint and uses its own validation.
3. **Make rewards safe under concurrent requests.** The generic endpoint uses read-then-write totals, which needs redesign for PostgreSQL concurrency. Use a unique reward claim and atomic XP increment in one transaction. Validate duplicate and simultaneous completion of different exercises. A transaction alone is not sufficient at every isolation level. Linux already has an atomic completion claim/version check, but must also pass the PostgreSQL concurrency suite.
4. **Remove blanket email-based OAuth linking.** Both providers set `allowDangerousEmailAccountLinking: true`; credentials accounts can log in before email verification. That combination creates account pre-hijacking risk: an unverified local account can remain accessible by password after a legitimate OAuth identity is attached. Require explicit linking from an authenticated, reverified account. Treat email collisions as recovery/linking flows, not silent merges.
5. **Implement effective abuse limits.** Throttle credentials login, signup, recovery, verification resend, lab actions, and progress writes by appropriate IP/account keys; enforce request limits at the proxy too. The Linux 80 ms per-row command/save check is not general abuse protection; open/reset/read/complete need coverage. Use shared limits if running multiple app processes. Password hashing alone uses about 19 MiB per concurrent operation, making unbounded signup/login an avoidable resource problem.
6. **Remove development access shortcuts from the release.** `src/lib/auth/dev-admin.ts`, the dev-Pro API/UI, and lab prerequisite bypass are guarded against production today. Still remove them and exclude development admin/test rows from production data. Never launch with `next dev`.

### Block accepting payment

7. **Build the actual subscription system.** Environment placeholders do not collect payments. Implement Checkout, verified webhooks, billing records, a portal, reconciliation, and backend entitlement checks before publishing a working “Buy” flow.
8. **Centralize paid access.** Linux checks database state; the generic exercise page/completion path does not enforce a comparable paywall. Decide which content is free and enforce that consistently before sending protected content or accepting protected actions. Do not authorize with a browser flag, query parameter, or stale seven-day JWT subscription claim.
9. **Bound access by paid-through time.** `hasLinuxPro` currently accepts `active` without checking an expiry. A missed cancellation/failure update could leave access indefinitely. Model paid-through time explicitly, reconcile with Stripe, and expire access even when the last local status still says active.
10. **Handle deletion and cancellation together.** The delete-account route only deletes the local user. Once billing exists, cancel future renewal and preserve the minimum billing reconciliation reference before deleting/anonymizing the app account. Otherwise charges could continue with no usable account or customer mapping. Define the refund/dispute policy too.

### Finish account reliability

11. **Fix email configuration.** `send.ts` uses `NEXTAUTH_URL` and falls back to localhost; `.env.example` documents `AUTH_URL`/`NEXT_PUBLIC_APP_URL`. `resend.ts` reads `FROM_EMAIL`; the example documents `EMAIL_FROM`. Standardize these and refuse an invalid production URL. Inspect Resend's returned error as well as thrown errors; helpers currently report success without checking the returned result. Add delivery retries/visibility.
12. **Revoke old sessions after password reset/security actions.** Auth uses seven-day JWT sessions; the presence of a `Session` table does not mean these sessions are database-revocable. Add an `authVersion` or revocation timestamp checked against DB on authenticated requests. Increment it on reset, security-driven logout, and account disablement. Atomically consume reset tokens with password changes; store custom recovery-token hashes instead of usable plaintext tokens.
13. **Make verified identity explicit.** Normalize emails consistently and test uniqueness on the new database. Require a verified identity for sensitive actions. Existing `findVerifiedUser` checks the password, not `emailVerified`. OAuth account creation in the installed Auth.js core initially sets `emailVerified: null`; deliberately persist verified provider evidence after validation rather than assuming it is set.
14. **Repair smaller persistence bugs.** The sign-in event overwrites `lastActive` before calculating streak age, preventing the intended increment/reset. Calculate from the previous value, define day/timezone semantics, and ideally track learning activity rather than login alone. Persist preferences in a real table; update export/deletion coverage for newly stored data.

Also resolve packaging before release: Prisma client, Auth Prisma adapter, and server MDX dependencies currently sit in `devDependencies`, so a production-only install can omit runtime imports. `db:seed` calls `tsx` but it is not declared directly. The README says Node 18+, whereas installed Next requires Node >=20.9. Use a supported LTS Node version, pinned consistently in build and runtime. The `next lint` script is obsolete for Next 16; use the ESLint CLI/configuration. [Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16).

## 4. Database design and migration

### Keep the relational model

PostgreSQL suits the existing relations, unique constraints, transactions, and frequent lab writes. SQLite can handle small sites, but moving before real customers simplifies concurrent writes, backups, and future app replicas. There is no reason to replace Prisma or move all course content into a new database system just to reach 100 users.

| Data | Recommended home | Rule |
|---|---|---|
| User/profile | PostgreSQL `User` | Stable user ID is the common key |
| Google/GitHub identity | `Account` provider + provider account ID | Never store Google/GitHub passwords; do not key identity solely by email |
| Optional local password | Argon2id hash | No plaintext or reversible password storage |
| Recovery | Hashed, purpose-specific, expiring tokens | Consume once, transactionally |
| Progress/completion | Existing progress/exercise tables | Backend-derived, unique per user/exercise |
| XP history | New `XpEvent` table | Unique source key; signed delta, reason, timestamp; total is a cache |
| Lab state | Existing `LinuxLabSession` | Bounded JSON; retain durable completion independently of temporary filesystem |
| Subscription | New `Subscription` table | Unique Stripe subscription ID, user/customer/price IDs, status, period dates, cancellation flag, paid-through and last sync time |
| Billing events | New `BillingEvent` table | Unique Stripe event ID; received/processed/error state; avoid unnecessary sensitive payload retention |
| Invoice/payment summary | New `BillingInvoice` table | Unique invoice ID, integer minor-unit amounts, currency, payment/refund status, relevant Stripe references |
| Preferences | New `UserPreferences` | Notification and marketing choices must survive reload |
| Lessons | Versioned MDX/JSON in repository | Deploy as content artifacts; no need to store every lesson per user |
| Images/uploads | Static assets now; object storage if uploads are added | Do not put image blobs in account rows |

Store payment instruments with Stripe. Your app needs customer/subscription/invoice references, not card numbers or CVVs. Existing OAuth token columns are sensitive: minimize scopes and retention, protect database/backups, and never include tokens in logs or user exports.

### Migration plan

1. Back up the SQLite database without modifying it. Decide whether any local users/progress are real data that must survive; do not copy development admin accounts blindly.
2. In a separate implementation branch, switch the Prisma provider and create a reviewed PostgreSQL initial migration. Existing migration SQL and `migration_lock.toml` are SQLite-specific: changing only `DATABASE_URL` is insufficient. Preserve old history in version control.
3. Keep the currently used Prisma major for this migration unless a separate upgrade is justified. Current online Prisma documentation may describe a newer major with different commands; use the pinned Prisma 6 CLI and its matching workflow.
4. For existing data, write a controlled import preserving user IDs, password hashes, OAuth IDs, progress, timestamps, and foreign keys. Verify row counts, duplicates after email normalization, XP totals, and representative accounts.
5. Rehearse on staging PostgreSQL, including lab transactions, failed writes, multi-tab version conflicts, simultaneous rewards, and rollback. Use `prisma migrate deploy` for reviewed Prisma 6 production migrations; do not run development resets on production.
6. At cutover, briefly stop writes, take a final backup/import, verify, then switch the app. Keep the old DB intact. If production writes have started, rollback needs a data reconciliation plan, not simply pointing back at old SQLite.

Use the managed DB's private network/TLS, restricted source access, separate migration/runtime privileges, and a bounded connection pool. Begin around 5–10 connections per app process, respecting the selected DB's actual connection limit and reserving capacity for migrations/maintenance. Registered users do not each need a dedicated connection.

### Backups and retention

Target a paid-launch recovery point of **one hour or better** using tested managed recovery/PITR or an equivalent backup design; target recovery within **four hours**. These are proposed operating targets, not measured guarantees. Verify the chosen plan's actual recovery window. Keep encrypted off-provider logical backups daily with a defined retention schedule and conduct a restore drill before launch and monthly afterward. Daily-only dumps mean up to 24 hours of progress loss and should be a conscious budget compromise.

Retain compacted completion/XP records; prune temporary lab files and expired tokens. Current lab policy compacts solved state after 24 hours or switching missions, unsolved state after 14 idle days, and deletes abandoned unsolved rows after 90 days. Run the prune script on a schedule, monitor failures, and tell learners about reset behavior. Compaction changes `updatedAt`, so the apparent 90-day deletion age can be extended; use a distinct learner-activity timestamp if exact retention matters. Add an aggregate per-user state quota as well as the existing per-mission cap.

## 5. Google and GitHub account creation

**Recommended UX:** show “Continue with Google” and “Continue with GitHub” prominently on both login and signup. Successful first login creates a free user and provider account automatically through the adapter; returning login finds the same identity. Defer an optional username/profile step until after entry. Google sign-in works with Google accounts; it does not require access to the user's Gmail inbox.

**Google setup:** create a project and web OAuth client in Google Cloud, configure application branding/audience and public homepage/privacy information, then register the exact HTTPS callback for the final domain. Use only identity scopes (`openid email profile`) and move the app to the appropriate production publishing state. Do not request Gmail or offline access for simple login. Validate verified-email evidence, while using the provider subject as identity. [Google production policies](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

**GitHub setup:** create an OAuth App owned by the business/project account, set homepage/callback, and store the client ID/secret securely. Separate production and development OAuth Apps avoid callback confusion. Request identity/email access only, not repository access. The installed provider falls back to `/user/emails` for private email but does not explicitly filter for `verified`; validate a verified primary email and handle missing email gracefully because `User.email` is required. [GitHub OAuth App setup](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

| Provider | Production callback | Existing environment keys |
|---|---|---|
| Google | `https://YOUR-DOMAIN/api/auth/callback/google` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| GitHub | `https://YOUR-DOMAIN/api/auth/callback/github` | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` |

These paths match the existing Next.js Auth.js route. Also configure a strong persistent `AUTH_SECRET` and canonical `AUTH_URL`. The proxy must set trusted host/protocol headers and strip client-supplied forwarded headers. [Auth.js Google setup](https://authjs.dev/getting-started/providers/google), [Auth.js GitHub setup](https://authjs.dev/getting-started/providers/github).

Do not enable automatic merging just to remove one friction point. For an existing email/password or other-provider account, prompt the user to sign into that account and explicitly connect the new provider. Test new accounts, returning accounts, private GitHub email, same-email collisions, provider denial, logout/login, multiple devices, missing username, and account deletion. Real provider credentials and a chosen domain are still required; none were provisioned or tested in this review.

## 6. Getting paid and enforcing monthly subscriptions

### Purchase flow

Use **Stripe Checkout + Stripe Billing + Stripe Customer Portal**. This fits the existing Stripe customer field and avoids maintaining a custom payment form.

1. Visitor selects monthly/yearly Pro.
2. If needed, visitor signs in with Google/GitHub; preserve a validated plan selection through that redirect.
3. Authenticated server endpoint chooses an allowlisted Stripe Price ID, creates/reuses the correct Stripe Customer, and creates Checkout with `mode: subscription`. Reject client-supplied user/customer IDs, amounts, and arbitrary prices. Guard against duplicate active subscriptions and repeated button presses.
4. Redirect to hosted Checkout, with eligible fast payment methods enabled. After return, display activation progress while the backend confirms payment.
5. Verified Stripe events update the local subscription/paid-through record. Only then grant paid features.

Stripe documents hosted Checkout, server-side price selection, and subscription mode. [Checkout integration](https://docs.stripe.com/checkout/quickstart?client=next).

The current pricing link uses `plan=elite`, while the DB uses `pro`; establish one mapping. `SignupForm` currently ignores billing intent and goes to the dashboard. Logged-in users should proceed straight to checkout or the billing portal.

### Minimum backend surface

Proposed routes: `POST /api/billing/checkout`, `POST /api/billing/portal`, `POST /api/billing/webhook`, and an authenticated billing-status read. Protect checkout/portal with session and origin checks. The webhook uses Stripe signature verification over the raw request body instead of a user session. Add server-only monthly/yearly Price ID settings; never expose secret keys with `NEXT_PUBLIC_`.

For event handling, cover checkout mapping, subscription creation/update/deletion, successful invoices, failed invoices and required payment action. Add refund/dispute handling aligned with the published policy. [Subscription events](https://docs.stripe.com/billing/subscriptions/webhooks).

Deduplicate events by Stripe event ID. Persist a durable received event before acknowledging work you plan to do asynchronously; only mark processed after successful application. Handle retries and out-of-order delivery by retrieving current Stripe objects and ensuring old events cannot overwrite newer entitlement state. Maintain a scheduled reconciliation job and an alert for webhook failures. [Webhook delivery and verification](https://docs.stripe.com/webhooks).

### Access policy to implement

| State | Proposed launch behavior |
|---|---|
| Free, incomplete checkout, unpaid first invoice | Free access only |
| Confirmed paid subscription, before paid-through timestamp | Pro access |
| Cancel at period end | Keep remaining paid access; stop future renewal |
| Failed renewal / past due | No new paid period until payment succeeds; optionally introduce an explicit bounded grace period later |
| Unpaid, expired, paused, fully ended | Free access; preserve learning history |
| Refund/dispute | Apply documented policy and reconcile subscription explicitly; a refund is not automatically a cancellation |

Stripe performs recurring collection from the saved payment method. The site does not need a monthly cron job to charge cards. Cards can legitimately fail, users can cancel, and payments can be disputed; the enforceable guarantee is that **unpaid users do not retain paid access indefinitely**. Do not grant access from a success URL, screenshot, local storage, or subscription status copied into an old JWT.

### Money arriving in your bank

Create/activate your own Stripe business account in a supported country, complete identity/business verification, connect your payout bank account, and configure payout settings. Customer payment goes to the Stripe balance; eligible available funds are paid to that bank account. First payouts and settlement schedules vary by account/country/risk, so payment success is not immediate cash in the bank. Stripe Connect is unnecessary when this is your own business selling its own subscription. [Stripe payout documentation](https://docs.stripe.com/payouts).

Before opening paid signup, test initial purchase, authentication-required payment, decline, renewal success/failure/recovery, end-of-period cancellation, duplicate/out-of-order webhook delivery, an outage/replay, second-checkout prevention, forged success URLs, and access expiry. Use Stripe sandbox/Test Clocks for renewals. Then verify live configuration and observe the first legitimate live purchase and payout; sandbox success cannot prove bank settlement. [Stripe Billing testing](https://docs.stripe.com/billing/testing).

## 7. VPS sizing for this particular application

### Actual execution model

* `src/lib/linux/engine.ts` implements a bounded teaching shell. Commands operate on a virtual filesystem; the reviewed path does not spawn host shells or containers.
* `src/lib/linux/service.ts` reads, parses, modifies, and rewrites a user's JSON state inside database transactions. Idle tabs do not imply dedicated server processes.
* The general terminal has an in-browser virtual filesystem (`src/lib/terminal/shell.ts`).
* Python uses browser-side Skulpt (`src/lib/python/runtime.ts`), so that execution primarily costs the learner's CPU/RAM. Pin/self-host the runtime assets and add execution time/output limits; browser tests cannot provide tamper-proof proof of completion.

**The main launch bottlenecks are database write latency/contention, synchronous request work, authentication bursts, and heavy media delivery.** A hypothetical container-per-user calculation would substantially overstate today's baseline.

### Measured storage and explicit assumptions

A scratch measurement generated fresh fixtures for all **53 current Linux missions**: minimum **682 bytes**, median **1,081 bytes**, maximum **7,267 bytes**, total **65,110 bytes** per learner if every fresh mission is retained. Randomized fixture values and ongoing course edits may change those numbers. These are serialized payload sizes, not RSS or a production DB benchmark.

* 100 learners × all 53 fresh fixtures ≈ **6.5 MB raw state**.
* Existing cap: **256,000 bytes per environment**. 100 learners × 53 fully expanded environments ≈ **1.36 GB raw state**, before indexes, row overhead, WAL, and backups. Not every creation/reset path explicitly applies the cap, so apply it consistently as content evolves.
* At 100 users × 500 exercise records × an assumed 2 KB average record, progress/code storage is about **100 MB**, plus indexes. Large saved code must be bounded.
* Begin with **10–20 GB DB capacity**, alerts, retention, and headroom. Actual initial use should be much smaller; the allocation covers growth and operations.

### Capacity scenarios

| Scenario | Workload assumption | Starting allocation, subject to load test |
|---|---|---|
| 100 registered users | 5–20 active; one Linux command per 5 seconds each, approximately 1–4 command requests/sec plus page/API traffic | 2 vCPU / 4 GB app VPS, 80 GB SSD; managed Postgres 1 GB |
| 100 simultaneous active learners | One command per 2–5 seconds each: 20–50 command requests/sec, plus reads, completions, auth and pages | 4 vCPU / 8 GB app VPS, 80–160 GB SSD; managed Postgres 2 GB; tune/pool/test |
| Self-hosted app + DB | First scenario, operator accepts database maintenance | Prefer 4 vCPU / 8 GB / 100+ GB SSD and off-host backups |
| Future real Linux sandboxes | 100 simultaneous isolated environments | Separate lab worker fleet; illustrative 256–512 MiB per lightweight sandbox alone means 25–50 GiB before overhead; CPU depends on permitted tools |

For the first scenario, a planning allowance is roughly 0.5–1 GB for OS/proxy/monitoring and 1–2 GB for Node/Prisma runtime, leaving burst headroom on 4 GB. These are allowances, not measurements. Build outside the serving instance where possible; build-time memory can exceed steady-state requirements. Do not assume more cores accelerate one Node event loop: profile first and consider multiple app processes only with shared limits and controlled DB pools.

If real Bash, compilers, scanning, exploit execution, or Kali desktops are introduced, size and isolate them separately. Never attach those untrusted lab workloads to the production account/billing database host or give them app secrets. That is a different architecture and budget.

### Load test before claiming capacity

Run against a staging production build and PostgreSQL, using synthetic users, never the live customer DB. Ramp 10 → 25 → 50 → 100 active users. Mix lab commands/read/save/submit, course navigation and login; include maximum-size states, multi-tab collisions and retry bursts. Sustain 30–60 minutes with no artificial client think-time removal unless intentionally testing abuse.

Proposed acceptance targets: lab-action p95 below 500 ms, unexpected error rate below 1%, zero duplicate rewards or lost committed completions, memory below roughly 75%, no sustained swap, and database pool waits well below transaction timeouts. Capture event-loop delay, CPU per core, DB query/lock timings, disk/WAL growth, and bandwidth. Measure before tuning; upgrade or optimize if these targets fail.

## 8. Hosting and operating budget

USD planning figures checked October 6, 2026; taxes, regional differences, optional support, and future price changes are excluded. Choose a region near the actual audience; a western US location is a reasonable initial assumption, not a verified audience requirement.

DigitalOcean Basic lists **2 vCPU / 4 GiB / 80 GiB at $24/month**, and **4 vCPU / 8 GiB / 160 GiB at $48/month**. [Droplet pricing](https://www.digitalocean.com/pricing/droplets).

Managed PostgreSQL's current pricing table lists **$15.15/month for 1 GiB** and **$30.45 for 2 GiB**, with storage shown at **$0.215/GiB/month**. Reserve approximately **$20** and **$40** respectively pending the configured checkout quote. These entry single-node plans are not high availability; the vendor describes them as development/testing-oriented. Using one for an early commercial launch is an explicit availability compromise, backed by recovery procedures. Choose a supported HA plan if that downtime risk is unacceptable. [Database pricing](https://www.digitalocean.com/pricing/managed-databases), [single-node/HA guidance](https://docs.digitalocean.com/products/databases/postgresql/details/pricing/).

| Cost | 100 registered users | 100 active simultaneously |
|---|---:|---:|
| Application VPS | $24 | $48 |
| Managed PostgreSQL allowance | $20 | $40 |
| Off-provider backups / monitoring allowance | $5–10 | $5–10 |
| Transactional email | $0–20 | $0–20 |
| Domain annual cost spread monthly, planning allowance | $1–6 | $1–6 |
| **Rounded recurring budget** | **$50–80/month** | **$95–125/month** |

Allow a further **$0–10/month** if choosing a paid managed rate-limit store; this can instead run as a small private service on the VPS. Staging while in use, HA database tiers, premium domains, AI inference, labor, and payment fees are additional. Keep spending alerts enabled.

Resend currently lists a free allowance of **3,000 emails/month, limited to 100/day**, and **$20/month for 50,000 without that daily limit**. A launch day with 100 signups plus verification/welcome/reset emails can exceed the free daily allowance. [Resend pricing](https://resend.com/pricing).

A single self-managed 8 GB DigitalOcean VPS is another reasonable option at **about $55–85/month** including the same backup/email/domain allowances. It puts patching, database upgrades, restore tooling, and app/database failure on you. Managed PostgreSQL is my preference here because the data matters more than saving a small monthly amount.

Hetzner is worth comparing if cost or region fit is better, but do not use old “$5 VPS” articles as quotes: the vendor published substantial June 2026 price changes, varying by plan/location. Compare the actual selected configuration and latency before purchasing. [Hetzner price changes](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/).

### Subscription economics at today's site prices

The site advertises **$4.99/month** and **$49.99/year**. The displayed **33% yearly saving is incorrect**: $49.99 versus 12 × $4.99 is approximately **16.5%**. Correct the claim or change the annual price before taking payment.

For a US Stripe account using standard domestic cards, the listed processing fee is **2.9% + $0.30** per successful charge; pay-as-you-go Billing adds **0.7% of Billing volume**. Other countries/payment methods, international cards, currency conversion, tax products, and disputes differ. [Stripe payment pricing](https://stripe.com/pricing), [Billing pricing](https://stripe.com/billing/pricing).

Approximate domestic-card monthly unit math: `$4.99 − ($4.99 × 3.6% + $0.30) = $4.51` before tax, refunds, support, and infrastructure. At 100 monthly paid users, that is about **$499 gross / $451 after these fees**. Ten monthly paid users yield about **$45** after fees; 100 free users yield no subscription revenue. Covering $50–80 fixed costs therefore needs roughly **12–18 monthly paying users**, before other business costs.

Annual pricing yields about **$47.89 after these fees**, or roughly **$3.99/month economically**, even though cash is collected up front. Do not treat a prepaid year as permanently available margin.

The pricing copy also promises mentorship, certificates, events, and unlimited AI assistance. These are not included in the infrastructure estimate and may cost more than hosting. Only sell benefits that are ready to deliver; bound any future AI usage explicitly.

## 9. Domain, deployment, and launch operations

Buy the domain in an account you control, enable MFA/renewal, and keep recovery access outside this app. Domain availability and a purchase quote were not checked; the repository name does not establish ownership of `cybercodex.io`. Budget roughly $15–25/year for a conventional non-premium `.com`, or $40–70/year for `.io`, as planning allowances only. Check renewal as well as first-year cost. Cloudflare Registrar is an option where the desired TLD is supported and its nameserver requirement fits. [Registrar overview](https://www.cloudflare.com/products/registrar/).

Choose one canonical host; configure DNS, HTTPS at the origin, and redirects from alternate hosts. Register OAuth callback URLs against that exact host. Verify the email sending domain, configure SPF/DKIM and a considered DMARC policy, and provide a working support address. Social login and transactional email sending are separate services.

Use a maintained Linux server image, a non-root app user, SSH keys, firewall rules, security updates, process restart policy, and a reverse proxy such as Caddy or Nginx. Expose HTTPS, not Postgres/Redis or the development server. Build from an agreed commit with the lockfile; include Prisma generation, required course content, and a migration step. Keep secrets outside Git/build output. `.env.bak` is currently untracked and not covered by the existing `.env` ignore rule; exclude environment backups from commits and deployment artifacts without reading or copying their contents into reports.

Do not strip runtime dependencies merely because they look large. The inspected `public/` directory is about **50 MB**, with duplicated multi-megabyte GIFs. Convert suitable animations to smaller formats/video, remove unused copies after reference checks, and cache public assets. This primarily improves page loading/bandwidth; it does not mean every user allocates 50 MB on the VPS. Cache static assets, but bypass shared caching for account, billing, and personalized API responses.

Configure uptime checks, error reporting, CPU/RAM/disk alerts, DB backup failure alerts, webhook lag/failure alerts, and cost alerts. Track a small acquisition funnel—visit → signup → first lesson → return visit → upgrade—without logging credentials or payment data. Publish clear pricing, support, privacy, cancellation, and refund information before selling; choose the tax handling appropriate to the business/customer locations rather than assuming payment processing covers it.

## 10. Implementation order and acceptance gates

| Stage | Work | Gate to move forward |
|---|---|---|
| 1 — Safe foundation | Patch dependencies; remove dev bypasses; repair XP authority, account linking, abuse controls, email config | Production build and security-focused regression checks pass |
| 2 — Durable identity/data | PostgreSQL migration, revocation, OAuth signup, verified-email handling, backups | New/returning Google and GitHub users keep the same account and progress across devices; restore drill passes |
| 3 — Paid flow | Stripe onboarding, Checkout, webhooks, portal, subscription records and centralized entitlements | Payment/renewal/failure/cancellation/replay tests pass; no access from forged client state |
| 4 — Staging operations | Deployment pipeline, monitoring, cleanup jobs, load test, rollback rehearsal | Selected hosting meets latency/correctness targets; backup and alert ownership established |
| 5 — Controlled release | Invite a small cohort, resolve observed issues, then promote broadly | Real account retention works; first legitimate payment/payout reconciles; support can handle failures |

Planning estimate for one focused engineer familiar with the code: **roughly 8–15 engineering days** across these stages, plus provider onboarding/verification delays and any problems uncovered by the full audit. This is a scope estimate, not a delivery commitment. A free beta can precede billing after stages 1–2 and the relevant operational checks; do not advertise paid checkout as available until stage 3 is complete.

Owner inputs needed during implementation: final domain; audience region; business country and payout bank onboarding; monthly/yearly price decision; cancellation/refund/grace policy; whether local development data must survive; and whether the launch target is 100 registered users or 100 simultaneously active learners. None of these prevents preparing the implementation now.

## 11. What was verified, and what remains unproven

Reviewed schema/migrations, auth providers/callbacks, signup/recovery, profile/preferences/delete paths, progress writers, Linux runtime/storage/access, pricing, email helpers, dependencies, and deployment files. No secret values or customer records were read for this report.

`tsc --noEmit --incremental false` **passed**. The Linux test runner validated **53 lesson files, MDX compilation, curriculum ordering, and XP totals**, then could not complete its database-backed run because a child-process operation returned `EPERM` in this environment. That is an incomplete test run, not a passing service suite. The fixture-size measurement ran independently in a disposable temporary directory.

No production build, full security audit, real OAuth callback, Stripe payment/payout, PostgreSQL migration, or end-to-end load test was performed. Therefore capacity figures are transparent planning estimates, and provider integrations are proposed work, not claimed working services. The report is the only repository artifact added by this review.
