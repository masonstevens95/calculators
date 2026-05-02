// Root Vitest projects config.
// Per KTD #12, this references package-level configs and never extends
// vitest.shared.ts itself (would recurse). Each leaf config does
// mergeConfig(sharedTestConfig, defineConfig({ test: { environment: '...' } })).
//
// Coverage lives at the root in vitest 3 — per-project configs can't override it.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/tests/**',
        '**/*.config.{ts,js}',
        '**/index.ts',
        'reference/**',
        'old_calcs/**',
      ],
    },
  },
});
