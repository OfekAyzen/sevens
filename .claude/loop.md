Work toward a shippable Sevens build, one small slice at a time.

On each iteration:

1. Run `npm run verify:fast`. If it fails, fix that and stop there — a red gate is
   always the highest priority.
2. If the gate is green, read `docs/BACKLOG.md` and pick the single highest item
   that is not done. Implement it test-first: write the failing test, make it
   pass, then run `npm run verify`.
3. Update `docs/BACKLOG.md` to check off what you finished, and append one line to
   `docs/PROGRESS.md` saying what changed and what the gate reported.
4. Commit only when `npm run verify` is fully green. Never commit a red gate.

Do not start new features that are not in the backlog, do not refactor for taste,
and never weaken or delete a guard test in `tests/unit/invariants.test.ts` to make
something pass. If a backlog item genuinely conflicts with a product invariant in
CLAUDE.md, stop and write the conflict into `docs/PROGRESS.md` instead of
resolving it yourself.

If everything in the backlog is done and the gate is green, say so in one line and
stop.
