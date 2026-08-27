# Sevens

A seven-day, four-person skill-learning competition, shipped as an installable
Android APK. Each person learns a *different* skill, so the scoring design's
core fairness rule — the 24-point daily ceiling, identical for everyone
regardless of minutes practised — exists to make non-comparable activities
comparable without rewarding whoever has the most free time.

As of the Design Revision documented at the top of `docs/PRODUCT-SPEC.md`
(2026-08-27), Sevens deliberately leans into being a real competitive game on
top of that fair scoring floor: a ranked leaderboard, a real losable streak,
visible minutes and a public catch-up badge. This was an explicit product
decision, not drift — see the invariants below for exactly what changed and
what didn't.

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
not; each one is load-bearing. **Revised 2026-08-27** — items 1, 5 and 6 below
reverse the original no-streak / alphabetical-only / private-catch-up rules as
an explicit, approved product decision (see the Design Revision note in
`docs/PRODUCT-SPEC.md`). Don't "fix" them back without asking first — that
history is exactly why this file says what it says instead of just linking the
spec.

1. **`daysPractised`, `bestRun`, `groupTotal` and `totalPoints` are monotonic**
   and only ever increase — the honest record of what happened. `currentStreak`
   (`src/domain/streak.ts`) is the one figure that can fall to 0; it is a
   real, deliberately losable stake, not an oversight.
2. **Minutes are recorded and never scored** — the daily ceiling never changes
   because of them. They ARE now aggregated and shown on the leaderboard
   (`src/domain/counters.ts`'s `totalMinutes`, `src/domain/leaderboard.ts`).
3. **The daily ceiling is 24 for everyone.** A 5-minute minimum earns the same 10
   points as a 60-minute one. Rewarding bigger minimums reintroduces exactly the
   unfairness the design removes. This is the one fairness rule that did NOT
   change in the revision.
4. **The group number is the largest element on the home screen**, and any
   ranking is smaller than it wherever both appear.
5. **The four people are ranked by current contest score** on the leaderboard
   (`src/domain/leaderboard.ts`'s `rankMembers`), not listed alphabetically.
   Ties still break alphabetically, purely for stable rendering.
6. **The catch-up bonus badge is visible to the whole group**, not just its
   holder, on the leaderboard row(s) of whoever currently holds it.
7. **The 2-day and 4-day rules — the 4am boundary, the cover token, the
   notification cap — are untouched.** Only the streak/rank/minutes/catch-up
   visibility mechanics above changed; nothing about timing or the honour
   system did.
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
