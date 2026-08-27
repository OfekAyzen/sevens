# Running Claude Code autonomously on this repo

Reference for driving further work on Sevens without prompting each step.

## Which primitive to use

| You want | Use | Stops when |
| --- | --- | --- |
| Keep working until a condition holds | `/goal <condition>` | An evaluator judges it met or impossible |
| Re-run something on a timer | `/loop [interval] [prompt]` | You press Esc, or Claude decides it's done |
| Custom per-turn logic in every session | A `Stop` hook | Your own script decides |

`/goal` is the one for building. It re-checks your condition after every turn with
a fast model and starts another turn if it isn't met. `/loop` polls on a timer
(1 min–1 hr, self-paced if you omit the interval) and expires after 7 days.

**The catch that shapes everything:** the `/goal` evaluator cannot run commands.
It only judges what is already visible in the transcript. So the condition must be
something Claude's own output can demonstrate — which is why `npm run verify`
exists and prints its results.

## The two commands for this repo

Build until the gate is green:

```
/goal npm run verify passes with zero failures and docs/BACKLOG.md has no
unchecked items, or stop after 25 turns
```

Watch the APK build after a push:

```
/loop 2m check the latest android workflow run with gh run list and tell me if
the APK is ready
```

Run `/goal` in auto mode so turns don't stop for permission prompts. `/goal` with
no argument shows status; `/goal clear` ends it.

## What makes it work here

An autonomous loop is only as good as its ability to check itself. This repo is
set up so it can:

- **`npm run verify`** — one command, real exit code: typecheck, lint, 88 unit
  tests, 14 browser tests.
- **A `PostToolUse` hook** (`.claude/settings.json`) type-checks after every edit
  and exits 2 on failure, so stderr goes straight back to Claude and mistakes get
  fixed in the same turn.
- **`tests/unit/invariants.test.ts`** encodes product decisions as tests. An
  autonomous agent that starts drifting toward "Don't lose your streak!" gets a
  red test rather than a polite comment.
- **Browser tests in the gate.** Unit tests alone are not evidence: an
  infinite-render bug here once passed all 58 of them while the app showed a
  blank screen.
- **`.claude/loop.md`** — the prompt a bare `/loop` uses: verify, take one backlog
  item, test-first, record it, never commit red.
- **Four skills** in `.claude/skills/` — `/check`, `/copy-guard`, `/slice`, and
  `/ship-apk`. `ship-apk` is marked `disable-model-invocation: true` so Claude
  cannot decide on its own that the code looks ready to release.

## Rules worth keeping

1. Never let a loop weaken a test to go green. `/slice` and `/check` both say so
   explicitly.
2. Give it a bounded condition (`or stop after N turns`), or it can run a long way
   on a misunderstanding.
3. Commit only on a green gate, so `/rewind` and `git` both stay useful.
4. When a backlog item conflicts with an invariant in `CLAUDE.md`, the loop is
   instructed to stop and write the conflict down rather than resolve it.
