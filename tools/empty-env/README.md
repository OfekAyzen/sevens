# Empty on purpose

Vite's e2e build mode points `envDir` here instead of the project root, so it
never picks up real Supabase credentials from `.env`. See `vite.config.ts` and
`playwright.config.ts`.

Without this, `npm run verify`'s browser tests would build against whatever
`.env` happens to be configured locally and run against a live database —
slow, flaky, and it writes real rows into a real group's table. The e2e suite
must always run fully local/solo, the same as `npm run dev` with no `.env`.
