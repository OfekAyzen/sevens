---
name: slice
description: Implement exactly one backlog item in Sevens test-first, then verify. Use when picking up the next piece of work, when told to continue building, or when running an autonomous loop over the backlog.
when_to_use: Use for "do the next thing", "continue building", "implement the next backlog item", or as the body of a /goal or /loop iteration.
argument-hint: "[optional backlog item]"
allowed-tools: Read Grep Glob Edit Write Bash
---

# Implement one slice

One item per invocation. Finishing one thing completely beats starting three.

## Procedure

1. **Read the ground.** `docs/BACKLOG.md` for what is next, `CLAUDE.md` for the
   invariants, and the existing code near where you will work. If an item was
   given as an argument, use that instead of picking from the backlog.

2. **Check the gate is green before you start** with `npm run verify:fast`. If it
   is already red, fix that and stop — never build on a red gate, or you will not
   know which change broke it.

3. **Write the failing test first.** Domain logic goes in `tests/unit/`, screens
   in `tests/e2e/`. Run it and watch it fail for the reason you expect. A test
   that passes before the implementation exists is testing nothing.

4. **Implement the smallest thing that passes.** Pure logic belongs in
   `src/domain` and takes time as an argument rather than reading the clock.
   Strings belong in `src/domain/copy.ts`.

5. **Run the full gate** with `npm run verify`. Unit tests alone are not
   sufficient evidence — an infinite-render bug in this project once passed all
   58 of them while the app showed a blank screen.

6. **Record it.** Tick the item in `docs/BACKLOG.md` and append one line to
   `docs/PROGRESS.md`: what changed, and what the gate reported.

## Stop and ask rather than deciding

- The item conflicts with a product invariant in `CLAUDE.md`.
- The item needs a product decision that is not written down.
- Making it pass would require weakening a guard test.

Write the conflict into `docs/PROGRESS.md` and stop. A wrong guess compounds
across an autonomous loop in a way a question does not.
