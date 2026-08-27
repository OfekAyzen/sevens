import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
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
