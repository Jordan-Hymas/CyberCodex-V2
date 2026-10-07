# Linux Fundamentals: flag-course handoff

Implemented October 5, 2026 in CyberCodex-V2. This document covers the Linux work only; concurrent UI, legacy terminal, and developer-login edits belong to other ongoing work.

## Course structure (three courses)

As of the split, the 53 missions are delivered as **three catalog courses**, by difficulty, so learners progress beginner → intermediate → advanced:

- **linux-fundamentals** — "Linux Fundamentals" (Beginner): the 12 `beginner`-level missions, chapters 1–3. Entirely free.
- **linux-intermediate** — "Intermediate Linux": the 12 `intermediate`-level missions, chapters 1–3 (renumbered). Chapter 1 is free; chapters 2–3 are Elite.
- **linux-advanced** — "Advanced Linux": the 12 `advanced`-level missions plus the 17 `operator` missions = 29, chapters 1–7. Fully Elite.

How it is wired:

- Each mission in `missions.json` carries `course` (its catalog slug) and `paid` (whether it needs Elite). `challenges.ts` exposes `linuxCourses`, `isLinuxCourse`, `courseOf` and `missionsForCourse`.
- Access (`access.ts`): `paid` drives the subscription gate; `prerequisite` is now **per course**, so each course's first mission opens freely and every later mission needs the previous one *in the same course*.
- Progress (`service.ts`): `UserExercise`/`CourseProgress` are recorded under `courseOf(mission)`, and course totals count only that course's missions. `LinuxLabSession` stays keyed by `(userId, exerciseId)` — global — so a learner's environment and flag for a mission are unchanged by the split.
- Each course has its own `content/courses/<slug>/` (`curriculum.json` + `exercises/`) and a `<slug>.mdx` catalog file with its own `banner`. Chapter `summary`/`skills` live in each `curriculum.json`; `chapters.ts` stitches the three together. `generate-linux-lessons.cjs` writes each mission's MDX into its course's folder, and `check-linux-content.cjs` validates all three.
- The generic `complete-exercise` route rejects any `courseId` starting with `linux-`, so Linux completions only happen through flag submission.

To re-slice the courses, change each mission's `course`/`paid` fields in `missions.json`, update the three `curriculum.json` files to match (chapter membership, numbering, `isPremium`, totals), then run `node scripts/generate-linux-lessons.cjs` and `npm run test:linux`.

## Shipped course

53 original missions (split across three courses, see above) in thirteen chapters total: 12 beginner/free, 12 intermediate/paid, 12 advanced/paid and 17 operator/paid. Each mission includes concept explanation, syntax example, task, hints, a common mistake, and an understanding question. Four checkpoints combine skills. All missions have lesson files and solvable fixtures.

The Operator tier (chapters 10–13, added October 6, 2026) follows pwn.college's model: `/flag` is owned by root and unreadable, and a mission program releases it only when the learner uses the technique being taught (path, working directory, arguments, streams, exported variables). Research behind it is in `docs/research/pwn-college-linux-luminarium.md`.

The learner signs in, opens a mission, uses a personal saved terminal, retrieves a `CYBER{...}` flag, and submits it. The server checks that flag against that learner's current instance. Some tasks additionally require an exact filesystem outcome. Correct completion unlocks the next mission and awards XP once. Incorrect commands remain exploratory and do not fail the lesson.

The learning sequence draws inspiration from small, cumulative challenges in [pwn.college Linux Luminarium](https://pwn.college/linux-luminarium/). The mission text, fixtures, flag format, and scenarios here are original. Command behavior was researched against [GNU Coreutils](https://www.gnu.org/software/coreutils/manual/coreutils.html), [Bash pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines), [Bash redirection](https://www.gnu.org/s/bash/manual/html_node/Redirections.html), and the upstream [find](https://www.man7.org/linux/man-pages/man1/find.1.html), [chmod](https://www.man7.org/linux/man-pages/man1/chmod.1.html), and [grep](https://www.man7.org/linux/man-pages/man1/grep.1.html) manuals. Those references describe full utilities; the supported subset below is narrower.

## Architecture and ownership

- `src/lib/linux/missions.json`: canonical mission definitions, author reference solutions, fixtures, hints, explanations, XP and optional outcome checks. Server-side data; never import this into a client component.
- `src/lib/linux/engine.ts`: bounded, deterministic teaching shell. It never launches an OS process, reads a host file, or accesses the network.
- `src/lib/linux/challenges.ts`: random instance flags, SHA-256 comparison, fixture construction (including per-instance secrets), filesystem objectives, and `runCommand` (shell + watcher + reward check).
- `src/lib/linux/programs.ts`: built-in challenge programs, after-command watchers and fixture generators for the Operator tier. Server-side TypeScript only; learner text is never executed.
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

Environment and inspection: `whoami`, `id`, `uname`, `env`, `export`, `unset`, `read`, `history`, `help`, `man`, `clear`, `true`, `false`, `test`.

Shell syntax: single/double quotes, escapes, variables, `NAME=value` assignments (alone, or in front of one command), exported versus local variables, bounded `*`/`?` filename expansion, pipes, input/output/append redirection, `2>`, `2>>`, `2>&1`, `>&2`, `/dev/null`, semicolon sequences, `&&`, and `||`. Use `man COMMAND` for each command's supported options; `man NAME` also shows a mission's page at `/usr/share/man/NAME`.

Programs: a path (`/opt/x/run`, `./run`) runs a mission program; a bare name runs a builtin, then a program in `/usr/local/bin`, `/usr/bin` or `/bin`. The current directory is never searched. Only nodes with a `program` id execute; anything else is "cannot execute".

Limits: 2,048 command characters; 256 tokens; 512 filesystem entries; 64 KiB per file; 512 KB persisted environment; 100 history entries; 64 KiB output per command. Requests are versioned and commands/submissions have short per-instance cooldowns. This is not a substitute for deployment-wide rate limiting and capacity planning.

## Important simulation boundaries

This is **not a full Linux VM, container, or Bash implementation**. “Advanced” means composition of this supported command-line subset, not complete Linux administration.

- No host filesystem/process/network access, real process jobs, package manager, services, kernel tools, or arbitrary script execution.
- Two owners: the learner, and `root` for fixture nodes marked `owner: "root"`. The learner gets owner bits on their own nodes and "other" bits on root's, and cannot chmod, move or remove root's nodes. No user switching, groups, ACLs, symlinks, or full Unix metadata semantics.
- `grep` supports literal matching and optional start/end anchors, with `-F` for literal anchors. Full user-controlled regex execution is intentionally excluded.
- `find` supports name/type selection, not `-exec` or every predicate; glob patterns allow at most four wildcard characters.
- `diff` presents changed lines but not a complete GNU diff patch format.
- `printf`, `tr`, `test`, option parsing, and text utilities implement their documented educational subset.
- Set variables in one input before using them in the next: `$VAR` and `$?` expand when Enter is pressed, before any part of the line runs. `read` in a pipeline leaves the variable unset (as in bash) and says why; other subshell semantics are not modeled.
- No command substitution, background execution, heredocs, Bash control structures, or full POSIX shell grammar.
- The terminal front end (`src/lib/terminal/shell.ts`, shared with the practice terminal) provides cursor editing, history, Ctrl+A/E/U/K/W/C/L, Tab completion of commands and paths (server `complete` action, honoring directory read/traverse bits), and a nano-style editor (`src/lib/terminal/nano.ts`) that loads with the read-only `read` action and saves through the versioned `save` action using the same permission and 64 KiB limits as redirection. Multiline paste stays one editable line rather than auto-executing.

Keep these limits visible in course promises. A future isolated lab service is needed for faithful process control, scripting, networking and system administration. Do not execute learner text in the Next.js host shell to fill that gap.

## Storage lifecycle

Each learner gets one `LinuxLabSession` row per mission, but only environments in active use keep a filesystem. Everything else is compacted to an empty `state` (the row stays: it records completion, attempts and the prerequisite chain). Limits live in `LAB_LIMITS` in `src/lib/linux/service.ts`.

- Opening a mission compacts the learner's other solved missions. In practice a learner has one or two live environments of a few KB each.
- Reopening a compacted mission builds a fresh environment with a new flag. Completion and XP are untouched, and the terminal explains why it is fresh.
- Unsolved environments idle for 14 days are compacted (fresh start next time). Solved environments idle for 24 hours are compacted. Never-solved rows idle for 90 days are deleted. Solved rows are never deleted.
- Each saved state records a fixture version. When a mission's files change, unsolved environments built from older fixtures are rebuilt on open.
- One environment is capped at 256 KB serialized (files are capped at 64 KiB, 512 entries).
- Pruning runs opportunistically (at most every 10 minutes per server process, outside the request) and via `npm run db:prune-labs` for cron. Set `LINUX_LAB_AUTOPRUNE=off` to disable the opportunistic run (the test runner does).
- Commands against a compacted environment return 409 and ask the learner to reopen it.

## Mission authoring: traps and coaching

- `decoys`: each entry declares a decoy flag (`{{DECOY:n}}`, `{{DECOY64:n}}`, `{{DECOYREV:n}}` in fixtures). Decoys are unique per instance and indistinguishable from real flags; submitting one shows its `hint` and does not fail the mission. Reference solutions must never print a decoy (tested).
- `coach`: rules with a JavaScript regex `when` tested against the command (optionally only when it failed); the first match prints a yellow tip in the terminal.
- `start`: the directory the mission begins in. `steps`, `commands` and `why` feed the briefing panel. The terminal opens with a mission intro (goal, start directory and its visible entries).
- Beginner missions use signposts rather than decoys until the checkpoint; intermediate missions plant decoys in near misses; advanced missions rely on traps that only correct technique avoids.

### Operator-tier fixtures

- `owner: "root"` makes a node root's. `/flag` (`{{FLAG}}`, mode 256 = 0400) is the standard locked flag.
- `program: "id"` or `"id:arg"` makes a file executable as the program `id` in `programs.ts` (give it mode 493 = 0755). Programs receive an `Invocation` and return output, error and exit status; they may read root files and change the shell.
- `dir: true` creates a directory node (e.g. `/var/lib/relay`, root, mode 448 = 0700, for per-instance secrets).
- `generate: "id"` fills a file from a generator in `programs.ts` (long man pages, code lists).
- `{{RAND:name[:hex|num|word]}}` and `{{PICK:name:a|b|c}}` work in paths and text. Reusing a name repeats its value. Values are stored server-side as `secrets` in the lab state. Reference solutions may use the same placeholders; tests fill them per instance.
- `watch: "id"` runs a watcher from `programs.ts` after every command (the equivalent of a shell's PROMPT_COMMAND), appending its output.
- Programs report mistakes on standard error, so operator reference solutions are allowed stderr output; tests still require that they reveal the flag and no decoy.

## Lesson pages

The left column of a mission (`LinuxLesson.tsx` + `LessonContent.tsx`) is written for someone who has never used a terminal and shows everything, nothing collapsed: goal, an "In this lesson" contents list, numbered lesson sections, a command cheat sheet, new words, why it matters, then the task steps, the common mistake and a reflection question.

Each mission's `lesson` in `missions.json`:

- `sections`: `{ heading, text?: string[], points?: string[], demo?: [{ cmd, note?, fails? }] }`. Wrap commands and paths in backticks inside text.
- `files` / `cwd`: a throwaway practice filesystem for the examples (never the mission's own files or flag). `program` may only be one of the harmless `demo-*` programs in `programs.ts`.
- `commands` (`{ syntax, does }`) and `terms` (`{ term, means }`).

Example output is not written by hand: the page runs each `demo` command through the engine when it renders, so learners see exactly what their terminal will print. `npm run test:linux` runs every example and fails on unsupported commands, unless the step is marked `fails: true` to show a mistake on purpose. Reading styles live in `.lesson-prose` in `src/styles/globals.css`.

## Extending lessons

1. Add a stable mission ID, level, explanation, example, task, hints, pitfall, understanding question, and a `lesson` (see above).
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
