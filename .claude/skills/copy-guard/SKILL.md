---
name: copy-guard
description: Audit user-facing strings in Sevens against the twelve microcopy rules — count up never down, their words not ours, describe don't grade, no guilt or urgency, one exclamation mark per app. Use whenever adding or changing any string a person will read.
when_to_use: Use when writing new UI copy, changing existing strings, adding a screen or notification, or reviewing a diff that touches src/domain/copy.ts.
allowed-tools: Read Grep Bash
---

# Audit the copy

Every user-facing string in this app lives in `src/domain/copy.ts`. Read that file
first — the twelve rules are listed at the top of it, and
`docs/PRODUCT-SPEC.md` has the reasoning behind each.

## Procedure

1. Read the strings under review.
2. Check each against all twelve rules below.
3. Run `npm test -- invariants` to confirm the mechanical guard passes.
4. For each violation, quote the offending string and offer a rewrite.

The mechanical guard catches banned words. It cannot catch tone, so that part is
your job.

## The twelve rules

| # | Rule | Fails as | Passes as |
|---|---|---|---|
| 1 | Count up, never down | `Streak: 0. Start again.` | `Days practised: 3 of 5.` |
| 2 | Their words, not ours | `Time to practise! 🎸` | `You said: after I put my coffee down, twenty F-chord changes.` |
| 3 | Name the process, not the person | `You're a natural!` | `You practised at your planned time four days running.` |
| 4 | Describe, don't grade | `Great session! 9/10!` | `18 minutes, at the kitchen table, like you planned.` |
| 5 | Make the next action small | `Complete today's session!` | `Five minutes counts. Want to make that your minimum?` |
| 6 | No guilt, urgency or scarcity | `2 hours left to save your streak!` | `Still time today if you want it.` |
| 7 | Comparison is only additive | `Sam is beating you.` | `Sam posted a clip of the bridge.` |
| 8 | Never manufacture a setback | `You missed yesterday.` | `Yesterday is open if you practised and forgot to log it.` |
| 9 | One exclamation mark per week | `AMAZING!! 🎉🎉` | `Logged. Day 2.` |
| 10 | Always show the exit | `No thanks, I don't care about improving.` | `Not today.` |
| 11 | Never promise a habit | `Build a lasting habit in 7 days.` | `Seven days of evidence about how you learn.` |
| 12 | Group shortfalls have no author | `The group would be at 18 if everyone practised.` | `11 of 24. Fourteen sessions left in the week.` |

## The test

If a sentence would work in a slot machine, it does not belong in this app. If it
would make a friend feel watched, judged or nagged, it does not belong either —
there are four real people here who have to keep liking each other on Monday.
