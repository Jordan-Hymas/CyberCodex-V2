# Linux Fundamentals: flag-course handoff

Implemented October 5, 2026 in CyberCodex-V2. This document covers the Linux work only; concurrent UI, legacy terminal, and developer-login edits belong to other ongoing work.

## Shipped course

36 original missions in nine chapters: 12 beginner/free, 12 intermediate/paid, and 12 advanced/paid. Each mission includes concept explanation, syntax example, task, hints, a common mistake, and an understanding question. Three checkpoints combine skills. All missions have lesson files and solvable fixtures.

The learner signs in, opens a mission, uses a personal saved terminal, retrieves a `CYBER{...}` flag, and submits it. The server checks that flag against that learner's current instance. Some tasks additionally require an exact filesystem outcome. Correct completion unlocks the next mission and awards XP once. Incorrect commands remain exploratory and do not fail the lesson.

The learning sequence draws inspiration from small, cumulative challenges in [pwn.college Linux Luminarium](https://pwn.college/linux-luminarium/). The mission text, fixtures, flag format, and scenarios here are original. Command behavior was researched against [GNU Coreutils](https://www.gnu.org/software/coreutils/manual/coreutils.html), [Bash pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines), [Bash redirection](https://www.gnu.org/s/bash/manual/html_node/Redirections.html), and the upstream [find](https://www.man7.org/linux/man-pages/man1/find.1.html), [chmod](https://www.man7.org/linux/man-pages/man1/chmod.1.html), and [grep](https://www.man7.org/linux/man-pages/man1/grep.1.html) manuals. Those references describe full utilities; the supported subset below is narrower.

## Architecture and ownership

- `src/lib/linux/missions.json`: canonical mission definitions, author reference solutions, fixtures, hints, explanations, XP and optional outcome checks. Server-side data; never import this into a client component.
- `src/lib/linux/engine.ts`: bounded, deterministic teaching shell. It never launches an OS process, reads a host file, or accesses the network.
- `src/lib/linux/challenges.ts`: random instance flags, SHA-256 comparison, fixture construction, and filesystem objectives.
- `src/lib/linux/access.ts`: prerequisite and paid-access rules.
- `src/lib/linux/service.ts`: authenticated-user database operations inside transactions; versioned state and progress awards.
- `src/app/api/linux/[exerciseId]/route.ts`: validated POST actions: open, command, submit, reset. No caller-supplied user ID or filesystem state.
- `src/components/lab/LinuxLesson.tsx`: server-rendered lesson and access checks.
- `src/components/lab/LinuxLab.tsx`: session-scoped client controls, flag form, hints, reset, continuation.
- `src/components/lab/LinuxTerminal.tsx`: xterm lifecycle; adapts the shared `ShellSession` front end to the lab API. No browser-held filesystem or expected flag.
- API actions `complete` (directory listing) and `read` (open file) are read-only and do not bump the version; `save` writes a file like `>` and re-runs reward checks.
- `prisma/schema.prisma`: `LinuxLabSession`, unique on `(userId, exerciseId)`, cascading on account deletion.
- `content/courses/linux-fundamentals/`: catalog curriculum and MDX lesson representations.

Linux has its own runtime so ongoing edits to the older general terminal do not get overwritten. Python and networking continue to use their existing paths. UI work can restyle the three new components while keeping the API and account isolation intact.

## State and flags

Each mission instance has its own random 144-bit flag, filesystem, working directory, variables, command history, submission count, and optimistic version. State is server-owned JSON in the database, not localStorage and not returned to the browser. Normal terminal output can of course reveal the flag the learner discovers.

Reloading opens the saved state. The visible console starts clean, with one welcome prompt, rather than replaying all output. The `history` command exposes persisted command history. Reset restores fixtures and rotates the flag; it preserves earned completion. Old flags, flags from other exercises, and flags from other accounts fail verification. A reset may preserve unlocks because mastery was previously earned.

The client sends its last observed version. Another tab's update produces a conflict instead of silently overwriting work. Reopening resynchronizes. Repeated completion does not duplicate XP. The old generic completion endpoint rejects Linux completions, preventing manual completion from bypassing flag checks.

The auth callback refreshes server-owned profile/progression fields on session updates instead of merging arbitrary client data into identity or privileges. Signed JWT subject determines identity.

## Subscription and progression

Beginner missions are free for signed-in learners. Intermediate/advanced require `subscriptionTier=pro` plus active subscription status, or canceled status with a future paid-through date. Status is read from the database, not trusted from the browser. This work does not implement billing or silently grant anyone a paid entitlement.

Every mission after the first requires the immediately preceding mission's captured flag. Course listings show this state; APIs enforce it again. Existing generic self-reported Linux completions do not satisfy new flag prerequisites. Existing overall XP is preserved; the same `UserExercise` cannot award duplicate XP if an older version was already completed.

## Supported teaching shell

Navigation and discovery: `pwd`, `cd`, `ls`, `find`, `basename`, `dirname`, `stat`, `file`.

File operations: `cat`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `rmdir`, `chmod`.

Text and streams: `echo`, `printf`, `head`, `tail`, `wc`, `grep`, `sort`, `uniq`, `cut`, `tr`, `base64`, `rev`, `nl`, `tee`, `diff`.

Environment and inspection: `whoami`, `id`, `uname`, `env`, `export`, `unset`, `history`, `help`, `man`, `clear`, `true`, `false`, `test`.

Shell syntax: single/double quotes, escapes, variables, bounded `*`/`?` filename expansion, pipes, input/output/append redirection, semicolon sequences, `&&`, and `||`. Use `man COMMAND` for each command's supported options.

Limits: 2,048 command characters; 256 tokens; 512 filesystem entries; 64 KiB per file; 512 KB persisted environment; 100 history entries; 64 KiB output per command. Requests are versioned and commands/submissions have short per-instance cooldowns. This is not a substitute for deployment-wide rate limiting and capacity planning.

## Important simulation boundaries

This is **not a full Linux VM, container, or Bash implementation**. “Advanced” means composition of this supported command-line subset, not complete Linux administration.

- No host filesystem/process/network access, real process jobs, package manager, services, kernel tools, or arbitrary script execution.
- One simulated owner; owner read/write/traverse bits are modeled. No real user switching, ACLs, symlinks, or full Unix metadata semantics.
- `grep` supports literal matching and optional start/end anchors, with `-F` for literal anchors. Full user-controlled regex execution is intentionally excluded.
- `find` supports name/type selection, not `-exec` or every predicate; glob patterns allow at most four wildcard characters.
- `diff` presents changed lines but not a complete GNU diff patch format.
- `printf`, `tr`, `test`, option parsing, and text utilities implement their documented educational subset.
- Set variables in one input before using them in the next; full Bash expansion/scoping and subshell pipeline semantics are not modeled.
- No command substitution, background execution, heredocs, Bash control structures, or full POSIX shell grammar.
- The terminal front end (`src/lib/terminal/shell.ts`, shared with the practice terminal) provides cursor editing, history, Ctrl+A/E/U/K/W/C/L, Tab completion of commands and paths (server `complete` action, honoring directory read/traverse bits), and a nano-style editor (`src/lib/terminal/nano.ts`) that loads with the read-only `read` action and saves through the versioned `save` action using the same permission and 64 KiB limits as redirection. Multiline paste stays one editable line rather than auto-executing.

Keep these limits visible in course promises. A future isolated lab service is needed for faithful process control, scripting, networking and system administration. Do not execute learner text in the Next.js host shell to fill that gap.

## Extending lessons

1. Add a stable mission ID, level, explanation, example, task, hints, pitfall, and understanding question.
2. Add synthetic fixture files. `{{FLAG}}`, `{{BASE64}}`, and `{{REVERSED}}` become that instance's flag representation on the server.
3. For state-changing tasks, define an outcome predicate and a reference solution. Rewards for those tasks appear in `/home/user/reward.txt` when the predicate is met.
4. Add the matching curriculum entry and MDX. Keep ordering, XP, and free/paid chapter flags consistent.
5. Add needed commands to the bounded interpreter with tests before publishing a lesson that relies on them.
6. Run `npm run test:linux` and `npm run type-check`. The suite solves every reference solution, compiles every MDX lesson, checks curriculum totals, and tests database lifecycle/isolation.
7. If changing fixtures for a previously shipped mission, consider an explicit content version/migration. Existing saved instances currently keep their original state until reset.

## Migration and verification

Migration: `20261006000100_linux_lab_sessions`. Applied to the local SQLite development database after taking `/tmp/cybercodex-before-linux-20261005-190725.db` as a private backup. For another environment, generate Prisma Client and apply migrations through the normal deployment procedure; do not copy the local database.

Automated verification: 42 engine/mission tests plus two database/access tests, all 36 MDX files, curriculum ordering and XP totals, and TypeScript checking. Database tests create and remove their own temporary database. They cover all mission solutions, two-account separation, old/foreign flags, persistent state, reset, stale versions, sequential gating, paid access, concurrent submissions, duplicate XP, and cascade deletion.

Browser interaction could not be verified because the browser tool could not validate its admin-enforced access policy. A visual/manual pass is still needed: log in; open the first mission; run `cat dispatch.txt`; paste the flag; continue; reload; switch accounts; reset; check phone layout and copy/paste behavior. Production build status is recorded in the task completion message.

## Next Linux depth milestones

- Expand each command family with varied datasets and transfer tasks; avoid repeating the same answer pattern without teaching a new concept.
- Add path expansion, quoting, permissions, and text-processing fidelity tests against real tools using trusted fixed fixtures.
- Add a deliberate practice mode that does not require sequential unlocks, without changing the main learning path.
- Add content-version handling and administrative lab reset tooling before revising deployed fixtures at scale.
- Extend account data export to include Linux lab history/state where the product's export policy requires it; account deletion already cascades lab rows.
- Design a separately isolated execution service before adding real Bash scripts, process management, SSH, archives, service logs, or system administration labs.
