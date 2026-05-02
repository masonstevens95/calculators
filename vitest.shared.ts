// Shared Vitest base used via mergeConfig() in each leaf package config.
// Per KTD #12: this exports a plain config OBJECT, not a defineConfig() result,
// so the root vitest.config.ts can also reference it without recursion.

import type { UserProjectConfigExport } from 'vitest/config';

export const sharedTestConfig = {
  test: {
    globals: true,
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'html', 'json-summary'] as const,
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/tests/**',
        '**/*.config.{ts,js}',
        '**/index.ts',
      ],
    },
    reporters: ['default'],
    passWithNoTests: true,
  },
} satisfies UserProjectConfigExport;
