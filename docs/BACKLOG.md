# Backlog

Ordered. `/slice` takes the top unchecked item.

## Shipped

- [x] Scoring engine: process points, 24 ceiling, gating, catch-up bonus
- [x] Monotonic counters, cover token, 4am day boundary, per-person time zones
- [x] Group total, bands, non-blaming pace headline
- [x] Day 4 midpoint reset (display window only)
- [x] Onboarding: create/join a group, full rules disclosed up front
- [x] Daily log: practised, cue, free-text reflection, optional unscored minutes
- [x] Feed: proof-of-work posts with downscaled images, one-tap support
- [x] Group screen: alphabetical, unranked
- [x] Settings: lower minimum, spend cover day, reminder time, sync status, export
- [x] Multi-person sync over Supabase; own-document-only writes; offline-first
- [x] Notification rules as pure functions, two-per-day cap, quiet hours
- [x] Day 7 reveal and Day 8 personal report
- [x] 88 unit tests, 14 Playwright specs, invariant guard tests
- [x] GitHub Actions APK build gated on the full suite

## Next

- [ ] Wire the Finale screen into navigation automatically on day 7 and after
- [ ] Day 5 "what do you want to be able to do on Sunday?" capture and playback
- [ ] Day 3: surface a peer's *struggle* (a reflection mentioning difficulty)
- [ ] Notification permission screen after setup, stating the two-per-day cap
- [ ] Day 6 prompt for the final artefact
- [ ] App icon and splash screen (currently Capacitor defaults)
- [ ] Retroactive logging UI for yesterday (domain rule exists, no screen yet)
- [ ] Extract `mergeMembers` from the store closure so it can be unit-tested
- [ ] Day 8: archive and delete-everything actions beside the export
