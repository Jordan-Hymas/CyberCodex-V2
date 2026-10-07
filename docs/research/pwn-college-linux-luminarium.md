# Research notes: how pwn.college and HTB Academy run their Linux courses

Gathered October 6, 2026, for the CyberCodex Linux course. Sources: the public pwn.college source code (the [Linux Luminarium dojo](https://github.com/pwncollege/linux-luminarium), its successor in [pwncollege/challenges](https://github.com/pwncollege/challenges), and the [dojo platform](https://github.com/pwncollege/dojo)), the live [Linux Luminarium page](https://pwn.college/linux-luminarium/), and the public [HTB Academy Linux Fundamentals preview](https://academy.hackthebox.com/course/preview/linux-fundamentals). HTB was not explored while signed in.

Everything below is a summary in our own words. The Operator missions built from it (chapters 10–13) use original scenarios, text and code.

## Licensing

- Linux Luminarium is **BSD 2-Clause**. Reusing its ideas is fine; copying text or code would need the license notice kept.
- The newer `pwncollege/challenges` monorepo defaults to the **pwn.college Noncommercial Use License** unless a subdirectory says otherwise. CyberCodex charges for content, so do not copy from other dojos in that repo without checking each directory's license.
- HTB Academy content is proprietary. Use only for structural inspiration.

## pwn.college: how instances run

- **One container per learner per challenge.** Clicking Start launches a Docker container (Ubuntu with tools) for that challenge. The learner gets in through a browser terminal, browser VS Code, a noVNC desktop, or SSH. Limits are 1024 PIDs and 4 GB of memory, and an idle container is killed after 6 hours.
- **Persistent home, disposable everything else.** `/home/hacker` is a per-user volume mounted into every challenge, so notes and scripts survive. The rest of the filesystem is fresh on each start.
- **The flag is injected at start.** The platform generates the flag and pipes it into the container's init, which writes `/flag` owned by root with mode `0400`. The learner is the unprivileged user `hacker` (uid 1000) and cannot read it.
- **Flags are signed, not stored.** The flag body is `pwn.college{ itsdangerous-signed([account_id, challenge_id]) reversed }`. The server verifies a submission by checking the signature and that it decodes to *this* account and *this* challenge. Sharing flags is useless, and the server keeps no flag table.
- **Per-challenge setup runs as root.** `/challenge/.init` runs as root before the learner gets a shell (30-second timeout). It moves the flag, randomizes names, plants decoys, creates users and sets permissions.
- **Challenge programs are setuid.** Files in `/challenge` (such as `/challenge/run`) run as root through an `exec-suid` wrapper, so they can read `/flag`. They check how they were invoked and print the flag only if the learner did it right.
- **Shell hooks watch the learner.** Many challenges ship a `.bashrc` with `trap ... DEBUG` and `PROMPT_COMMAND` functions that inspect each typed command (`$BASH_COMMAND`) and the shell's variables after it runs. That is how they verify things a program cannot see: an unexported variable, whether `read` was used, whether `cd` used a glob.
- **Wrapper commands for coaching.** `/challenge/bin` is first on PATH. Challenges drop wrappers there (`mv`, `cp`, `man`, `su`, `tee`, `ls`) that detect a common mistake, print a targeted hint, then call the real tool.
- **Practice (privileged) mode.** After the `sudo` lesson, learners can restart a challenge with full `sudo` to debug it. The flag is replaced with a placeholder that cannot be submitted.
- **Determinism from the flag.** Randomized challenges seed their RNG from the digits in the flag, so a learner's instance stays the same across restarts but differs from everyone else's.

## pwn.college: how flags are hidden (the taxonomy)

Every one of the 128 challenges is a variation on a few patterns:

1. **Gatekeeper program**: a root program prints `/flag` only if invoked correctly. It checks `$0` (absolute vs `./` vs naked path), `$PWD`, arguments, whether stdin, stdout or stderr is a terminal, a pipe or a specific file (via `/proc/self/fd`), the parent process, and exported environment variables. Most challenges use this pattern.
2. **Readable copy placed somewhere**: the flag is copied or moved and made readable: into `~`, into a random directory (find), as a random dotfile in `/` (ls -a), behind a trail of 8 clue files (some hidden, some unreadable until you `ls`, one that self-destructs if you `cd` in), or behind a zero-width-space filename that you can only reach with tab completion.
3. **Needle in a haystack**: the flag shuffled into 100,000 dictionary lines (grep), into 1,200 decoy flags tagged `DECOY` (grep -v), into 100 near-identical decoys that sort before it (sort), or among 100 decoys in two files (diff, process substitution).
4. **Transformed output**: case swapped (tr), stuffed with `^` and `%` (tr -d), split by random newlines (tr -d "\n"), one character per line behind random numbers (cut), interleaved with `FAKEFLAG` (sed).
5. **Secret derived from the flag**: a man page option name, a `--help` number or a builtin's secret argument is computed from the flag's characters, so it's unique per learner and can't be shared.
6. **Rotating or ephemeral secrets**: a key that rotates after every prompt (forces `read VAR < file`), a code that changes too fast to copy by hand (forces process substitution), an exit code that `$?` must capture immediately.
7. **Privilege puzzles**: setuid `chown`, `chgrp` or `chmod` made available, a root password given (su), a leaked `/etc/shadow` to crack with john, sudo access, a writable `.bashrc` of another user, credentials visible in `ps` output.
8. **Process puzzles**: a renamed program running in the background (ps), a blocker process to kill, decoys flooding a FIFO, a program that wants to see a suspended or backgrounded copy of itself (Ctrl-Z, bg, fg, &).

Decoys always look exactly like real flags. Submitting one doesn't fail anything; it just doesn't count.

## pwn.college: how they teach

- **Each level teaches exactly one thing.** A typical description runs: a few sentences on the concept, a tiny console transcript (`hacker@dojo:~$ ...`) showing it working on harmless example files, then one precise task with a constraint that forces the technique (for example: "your argument must be at most 3 characters", "you may not use cd").
- **Explain why, not just how.** Several explanations stand out:
  - Linux never searches the current directory for programs because a planted `ls` could hijack you.
  - File descriptors are introduced as numbers (0, 1, 2), and `>` is explained as shorthand for `1>`.
  - Hard links are taught as one apartment with two addresses; symlinks as mail forwarding after a move.
  - Exporting variables: local variables might contain sensitive data, so they are not leaked to children unless you ask.
  - "Useless use of cat" motivates `read VAR < file`.
  - `2>&1` before `|`: the pipe only carries stdout, so redirect stderr into stdout first.
  - Tab completion is presented as the safer alternative to globbing, because a glob can expand to something you did not intend right before `rm` runs.
- **Errors are the hints.** Challenge programs explain what's wrong in plain language ("You invoked this with an absolute path. This challenge needs a relative path!"). The learner discovers the mistake by running the program, not by reading a hint panel.
- **Progressive constraints within a topic.** Example from the paths module: absolute path, then from a specific directory, then five random directories in a row, then a naked relative path, then `./`, then `./` from inside `/challenge`, then `~` with a 3-character limit.
- **Callbacks.** Later levels say "recall the diff challenge" and reuse earlier skills in a new setting.
- **Trivia and arcana boxes** at the end of descriptions add depth for the curious without blocking anyone.
- **Not meant to be tricky.** The dojo says so explicitly. Difficulty comes from new concepts, not from gotchas.

### Module order (128 challenges)

Hello Hackers (3) · Pondering Paths (8) · Comprehending Commands (15) · Digesting Documentation (7) · File Globbing (10) · Practicing Piping (15) · Shell Variables (8) · Data Manipulation (6) · Processes and Jobs (10) · Untangling Users (4) · Perceiving Permissions (8) · Chaining Commands (12) · Terminal Multiplexing (6) · Pondering PATH (5) · Silly Shenanigans (6) · Daring Destruction (5)

## HTB Academy: Linux Fundamentals (public preview)

- One long module (about 30 sections): Linux structure, distributions, the shell, prompt, help, system information, navigation, files, editing, find, file descriptors and redirections, filtering, regex, permissions, users, packages, services and processes, cron, network services, web services, backup, file systems, containers, network configuration, remote desktop, hardening, firewalls, logs, and Solaris.
- Each section is a reading page with example commands, then "questions" at the bottom. Answers are usually short facts discovered on a **target machine** the learner spawns (SSH to an IP with given credentials) or in the browser-based **Pwnbox** VM, rather than per-user flag files.
- The module ends with a **skills assessment**. Completing everything awards "cubes" (currency) and path progress. No time limit and no grading beyond correct answers.
- Positioned as a prerequisite for most of the Academy, and mapped to CREST certification syllabi.

Takeaway: HTB covers more breadth (administration, services, networking) with lighter verification. pwn.college goes deeper on the shell itself, verifies technique per learner, and is closer to what CyberCodex does.

## What CyberCodex adopted, and how

The CyberCodex lab is a server-side simulation, not a container. Each pwn.college mechanism was rebuilt on the simulation:

| pwn.college | CyberCodex (Operator tier) |
|---|---|
| `/flag` root-owned `0400` | `/flag` node with `owner: 'root'`; the learner gets the "other" permission bits, so cat, chmod, mv and rm are refused |
| setuid `/challenge/run` checking `$0`, `$PWD`, `/proc/self/fd` | `program` nodes run built-in TypeScript in `src/lib/linux/programs.ts`; each receives an `Invocation` (as-typed path, cwd, args, stdin/stdout/stderr kind and target, exported env) |
| PATH lookup, `./` required in cwd | Bare names resolve to builtins, then programs in `/usr/local/bin`, `/usr/bin` and `/bin`; never the current directory (with a coaching error) |
| `.init` randomization seeded from the flag | `{{RAND:name}}` and `{{PICK:name:a\|b}}` fixture placeholders, kept in server-side state; generators for long fixtures (man pages, code lists) |
| Secrets in `/challenge/.state`-style root files | Root-owned files under `/var/lib/relay` (directory mode 700) |
| `PROMPT_COMMAND` hooks | Mission `watch` hooks run after every command (the rotating key) |
| `.bashrc` DEBUG traps detecting the typed command | Mission `coach` regex rules (already existed) |
| Signed flags `[account, challenge]` | Unchanged: random 144-bit flag per instance, stored as a SHA-256 hash, plus decoys that explain themselves |

New shell features added for this: `NAME=value` assignments (alone, or prefixed to one command), exported versus local variables (`env` and programs see only exported ones), `read NAME < FILE` (with bash's pipeline-subshell behavior), `2>`, `2>>`, `2>&1`, `>&2`, `/dev/null`, man pages from `/usr/share/man/NAME`, and correct backslash handling inside double quotes (so `tr -d "\n"` works).

## Ideas not yet built (possible next missions)

- **Globbing**: `[abc]` and `[!abc]` classes (the engine has only `*` and `?`), plus argument-length constraints like pwn.college's "at most 3 characters" levels.
- **Process substitution and diff**: `diff <(a) <(b)` against decoy lists. Needs `<( )` in the lexer.
- **Breadcrumb quest**: a chain of clue files across random directories, some hidden, with a trap clue.
- **Symlinks**: `ln -s` to trick a program into reading `/flag` (needs symlink nodes).
- **Users and privilege**: simulated `su` with a given password, a leaked shadow file, `sudo`, `chown`/`chgrp` made "setuid".
- **PATH hijacking**: put your own script first on PATH so a program calls it instead of `rm`. Needs executable learner scripts and a writable PATH.
- **Processes and jobs**: ps, kill, Ctrl-C, Ctrl-Z, bg, fg, &. Needs simulated process state; the current engine has none.
- **Shell scripting**: shebangs, arguments, if/elif/else (pwn.college's Chaining Commands module). Needs a script interpreter.
- **Practice mode**: let learners reopen a solved mission with relaxed permissions and a placeholder flag.

Processes, scripting and real privilege changes are better served by the isolated container service already noted in `docs/LINUX_COURSE.md` than by extending the simulator.
