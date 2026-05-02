// Root Vitest projects config.
// Per KTD #12, this references package-level configs and never extends
// vitest.shared.ts itself (would recurse). Each leaf config does
// mergeConfig(sharedTestConfig, defineConfig({ test: { environment: '...' } })).

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*'],
  },
});
