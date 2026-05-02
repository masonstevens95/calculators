// Shared Vitest base used via mergeConfig() in each leaf package config.
// Per KTD #12: this exports a plain config OBJECT (not a defineConfig() result),
// so the root vitest.config.ts can reference it without recursion.
//
// Vitest 3 splits config types: ProjectConfig (per-project) is a strict subset
// of UserConfig (root). Coverage, passWithNoTests, projects, and reporters all
// live on the root only. The intersection that's actually useful per-project is
// `globals` — which is what we expose here so every leaf consumer gets the
// vitest globals (describe, it, expect, vi) without repeating themselves.

import type { UserProjectConfigExport } from 'vitest/config';

export const sharedTestConfig = {
  test: {
    globals: true,
  },
} satisfies UserProjectConfigExport;
