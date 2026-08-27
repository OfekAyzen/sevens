# Sevens

A seven-day skill-learning competition for four friends, as an installable
Android app. Everyone picks a **different** skill; the scoring is built so that
guitar, Python and cooking can share one contest without ranking anybody into the
ground.

The design is documented in [`docs/PRODUCT-SPEC.md`](docs/PRODUCT-SPEC.md), and
the reasoning behind every rule is in
[`docs/RESEARCH-BRIEF.md`](docs/RESEARCH-BRIEF.md). Read the spec before changing
mechanics — the restrictions that look arbitrary are load-bearing.

---

## Get the APK to your friends

Three ways, easiest first.

### 1. GitHub Actions (no local Android tooling)

Push this repo to GitHub. Every push to `main` runs the gate and builds an APK.

```bash
gh repo create sevens --private --source=. --push
```

Then: **Actions → android → the latest run → Artifacts → `sevens-main-<sha>.apk`**.

For a link you can paste into a group chat, tag a release:

```bash
git tag v0.1.0 -m "Sevens v0.1.0"
git push origin v0.1.0
```

The workflow attaches the APK to a GitHub release. Send that URL to the group.

### 2. Build it on your own machine

You already have `~/.android` and `~/.gradle`, so this will probably just work:

```bash
npm ci
npm run apk:debug
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

If Gradle complains it cannot find the SDK, create `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

### 3. Installing it

Each person opens the APK link on their phone, allows their browser to install
unknown apps when prompted, and installs. It is signed with the standard Android
debug key — fine for handing an app to four people directly, not valid for Play
Store distribution.

---

## Let the four of you see each other

The app works fully on its own with no setup — you just won't see your friends.
Group sync needs one free Supabase project, created once by one person.

1. Make a project at [supabase.com](https://supabase.com) (free tier is plenty).
2. **SQL Editor → New query**, paste
   [`src/sync/schema.sql`](src/sync/schema.sql), run it.
3. **Project Settings → API**, copy the **Project URL** and the **anon public**
   key.
4. Share three things in the group chat: the URL, the anon key, and the **group
   code** the app showed you when you created the group.
5. Everyone else taps **Join a group**, enters the code, and pastes the URL and
   key. Set the same **Day 1** date so everyone's day numbering matches.

### What that means for privacy

The group code is the only secret. Anyone who has it, plus the URL and anon key,
can read and write that group's data — there are no accounts, which is the
trade-off that makes setup a two-minute job instead of an auth system. That is the
right call for four friends and the wrong one for anything public. Don't reuse the
project for something that matters, and don't post the code publicly.

Each phone only ever writes its **own** document, so four people logging at once
cannot conflict. The app syncs on launch, every 60 seconds while open, and
whenever it regains focus. Everything works offline and uploads when it next
reaches the network.

---

## Development

```bash
npm ci
npm run dev            # dev server
npm run verify         # the full gate: typecheck, lint, 88 unit tests, 14 browser tests
npm run verify:fast    # skip the browser tests
```

`npm run verify` is the contract: if it passes, a change is done; if it fails, it
isn't. See [`CLAUDE.md`](CLAUDE.md) for the architecture and the invariants, and
[`docs/LOOP-WORKFLOW.md`](docs/LOOP-WORKFLOW.md) for running Claude Code
autonomously against this repo.

If Playwright cannot find a browser, point it at one you already have:

```bash
CHROMIUM_PATH=/path/to/chrome npm run test:e2e
```

### Layout

```
src/domain/    Pure functions — scoring, counters, day boundaries, notification
               rules, the Day 8 report. No React, no I/O, no ambient clock.
src/sync/      Supabase REST over plain fetch, plus the SQL schema.
src/store/     Zustand state, persistence, and all derived state (one place).
src/screens/   One file per screen.
src/ui/        Components, design tokens, the motion system.
tests/unit/    Vitest. 90% coverage gate on src/domain.
tests/e2e/     Playwright, phone viewport.
```

### Two traps this codebase has already fallen into

Both are documented in code so they don't recur:

- **Zustand selectors must return raw state only.** A selector that builds a fresh
  object or `Set` makes the store see a new snapshot every render, and React loops
  until it throws error #185. All derived state lives in `src/store/derived.ts`.
  This bug shipped once and passed all 58 unit tests while the app rendered a
  blank screen — which is why the gate includes browser tests.
- **`currentRun` must not exist.** Not hidden, absent. A value that can decrease
  will eventually be rendered decreasing. `tests/unit/invariants.test.ts` fails
  the build if the identifier reappears.
