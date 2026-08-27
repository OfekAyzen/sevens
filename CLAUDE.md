# Sevens

A seven-day, four-person skill-learning competition, shipped as an installable
Android APK. Each person learns a *different* skill, so the entire scoring design
exists to make non-comparable activities comparable without anybody feeling
ranked into the ground.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| **Full verification gate** | `npm run verify` |
| Fast gate (no browser) | `npm run verify:fast` |
| Unit tests only | `npm test` |
| Coverage (90% on `src/domain`) | `npm run test:cov` |
| Browser tests | `npm run test:e2e` |
| Build the APK locally | `npm run apk:debug` |

`npm run verify` is the contract. If it passes, the change is done; if it fails,
the change is not done. Do not declare work finished without running it.

## Architecture

```
src/domain/   Pure functions. No React, no I/O, no dates from the ambient clock.
src/store/    Zustand state + persistence via Capacitor Preferences.
src/screens/  One file per screen.
src/ui/       Reusable presentational components and the motion system.
```

`src/domain` is the heart. It is pure and exhaustively tested, which is what lets
an autonomous loop verify its own work — see `docs/LOOP-WORKFLOW.md`.

Rules that matter:

- **Domain functions take time as an argument.** Never call `new Date()` inside
  `src/domain`. A function that reads the ambient clock cannot be tested at 03:59.
- **All user-facing strings live in `src/domain/copy.ts`.** Never inline prose in a
  component. `tests/unit/invariants.test.ts` enforces this.
- **`src/domain` may not import from `src/ui` or `src/screens`.** Dependencies point
  inward only.

## Product invariants — do not "improve" these

These come from `docs/PRODUCT-SPEC.md` and are enforced by
`tests/unit/invariants.test.ts`. They look like arbitrary restrictions and are
not; each one is load-bearing.

1. **Every displayed counter is monotonic.** `daysPractised`, `bestRun`,
   `groupTotal` and points only ever increase. There is no current-streak value
   anywhere in the model — see ADR-001 in `src/domain/counters.ts`. A number that
   can fall will eventually be rendered falling, and one missed Wednesday should
   not delete four days of visible progress.
2. **Minutes are recorded, never scored, never shared.** Do not write an
   aggregate-minutes-by-person query. The moment one exists, some screen will
   surface it and a cross-skill volume race begins.
3. **The daily ceiling is 24 for everyone.** A 5-minute minimum earns the same 10
   points as a 60-minute one. Rewarding bigger minimums reintroduces exactly the
   unfairness the design removes.
4. **The group number is the largest element on the home screen**, and any
   ranking is smaller than it wherever both appear.
5. **The four names are listed alphabetically and never sorted by value.** A
   sorted list is a leaderboard whatever it is called.
6. **The catch-up bonus is visible only to its holder.** A "+2" badge on a shared
   row is a last-place indicator.
7. **No mechanic may be lost.** No streak breakage, no countdown to the day
   boundary, no failure state, no nudge button.
8. **Two notifications per person per day, hard cap.**

If a change appears to require breaking one of these, stop and say so rather than
working around the guard test.

## Copy rules

Twelve rules, listed at the top of `src/domain/copy.ts`. The short version: count
up never down, use the user's own words, describe rather than grade, and exactly
one exclamation mark in the entire application (it belongs to Day 7).

## Testing

- New domain logic needs unit tests in `tests/unit/`. Coverage gate is 90% on
  `src/domain`.
- New user-facing copy goes in `copy.ts` and must survive
  `tests/unit/invariants.test.ts`.
- New screens need a Playwright spec in `tests/e2e/`.
- Time-dependent behaviour is tested by passing an explicit `Date`, never by
  mocking the clock globally.
