---
name: check
description: Run the Sevens verification gate (typecheck, lint, unit tests, browser tests) and report exactly what passed and what failed. Use before claiming any change is finished, before committing, and whenever asked whether the build is green.
when_to_use: Use when asked to verify, check, or validate the build; before a commit; after finishing a slice of work; or when the user asks "is it green?"
allowed-tools: Bash Read
---

# Run the gate

Run the fast gate first, because a type error should surface in seconds rather
than after a browser build:

```bash
npm run verify:fast
```

If that passes, run the browser tests:

```bash
CHROMIUM_PATH="${CHROMIUM_PATH:-}" npm run test:e2e
```

## Reporting

Report in this shape, and nothing more:

```
typecheck  ok
lint       ok
unit       58 passed
e2e        7 passed
GATE GREEN
```

On failure, name the first failing thing, quote the actual error, and stop. Do
not report a summary of everything that passed around a failure — the failure is
the message.

## Rules

- **Never** weaken a test to make the gate pass. `tests/unit/invariants.test.ts`
  encodes product decisions from `docs/PRODUCT-SPEC.md`; a failure there means the
  change is wrong, not the test.
- If a test looks wrong, say so explicitly and explain why rather than editing it
  quietly. Tests have been wrong in this project before — but that is a claim to
  argue, not to act on silently.
- Unit tests passing while the app is broken is a known failure mode here. An
  infinite-render bug once passed all 58 unit tests. Never report the build as
  working on unit tests alone.
