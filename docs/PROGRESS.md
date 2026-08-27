# Progress

One line per slice. Newest last.

- Scaffolded Vite + React + TS + Capacitor; generated the Android project.
- Domain core: app-day boundary, scoring, counters, group, catch-up. Gate green.
- Guard tests added: banned strings and banned mechanics scanned across `src/`.
  Comments are stripped before scanning, so the ADRs explaining what is forbidden
  don't trip their own guards.
- Caught and fixed React error #185: zustand selectors were returning freshly
  built objects. All derived state moved to `src/store/derived.ts`. All 58 unit
  tests had passed while the app rendered nothing — browser tests added to the
  gate as a result.
- Rewrote the store for four people: per-member documents, own-document-only
  writes, Supabase REST sync, offline-first.
- Added Feed, Settings, Finale, Onboard screens. Enabled `strict` and
  `noUncheckedIndexedAccess`, which surfaced real latent bugs in date parsing.
- Notification rules extracted as pure functions and tested: two-per-day cap,
  cue suppression once logged, digest names only who practised, quiet hours.
- Gate: typecheck + lint + 88 unit tests + 14 Playwright specs, 95%+ coverage on
  `src/domain`. Green.
