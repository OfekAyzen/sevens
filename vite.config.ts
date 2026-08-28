import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only registered for the real web/PWA build — the Capacitor native
    // shells (Android, iOS) load `dist` straight off the filesystem and
    // never need a service worker, and e2e's build stays minimal.
    ...(mode === 'production'
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
              name: 'Sevens',
              short_name: 'Sevens',
              description: 'A seven-day, four-person skill-learning competition.',
              start_url: './',
              scope: './',
              display: 'standalone',
              background_color: '#0b0d12',
              theme_color: '#0b0d12',
              icons: [
                { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icons/maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              // The app already treats storage/network failure as normal
              // (see src/store/persist.ts, src/sync/supabase.ts) — this just
              // adds the app shell to the cache so a repeat visit opens
              // instantly and a offline launch shows the last-synced state
              // instead of a blank tab.
              globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
              navigateFallback: 'index.html',
              runtimeCaching: [
                {
                  // Supabase sync must always hit the network — caching it
                  // would show four people a stale copy of each other's day.
                  urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
                  handler: 'NetworkOnly',
                },
              ],
            },
          }),
        ]
      : []),
  ],
  // Capacitor loads the bundle from the filesystem, so assets must be relative.
  base: './',
  // The e2e build must never see real Supabase credentials from a locally
  // configured `.env` — pointing envDir at an empty directory for that mode
  // keeps `import.meta.env.VITE_SUPABASE_*` unset, same as no `.env` at all.
  envDir: mode === 'e2e' ? 'tools/empty-env' : undefined,
  build: { outDir: 'dist', sourcemap: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: ['src/domain/**/*.ts'],
      // copy.ts is a declarative string table, not logic. Its correctness is
      // enforced by tests/unit/invariants.test.ts (which scans every string) and
      // by the Playwright specs (which assert the rendered text), so counting
      // string-builder arrows here would only dilute the real signal.
      exclude: ['src/domain/copy.ts'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
}));
