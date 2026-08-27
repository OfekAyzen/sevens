import type { SyncConfig } from './sync/types';

/**
 * One shared Supabase project's credentials, baked in at build time.
 *
 * Nobody who plays the app configures a database — that used to be an
 * onboarding step (paste a URL and an anon key) and is now this. `.env`
 * (gitignored, never committed) supplies the real values; see `.env.example`.
 * With no `.env` at all — plain `npm run dev`, or CI — this is `null` and the
 * app runs fully local/solo, same as it always could.
 */
export const defaultSyncConfig: SyncConfig | null =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      }
    : null;
