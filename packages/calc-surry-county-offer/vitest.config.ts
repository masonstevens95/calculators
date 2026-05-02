import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { sharedTestConfig } from '../../vitest.shared';

// Per KTD #12: each calc package mixes pure-domain tests (node env) and
// React component tests (jsdom env). Vitest 3 doesn't support nested
// projects per package cleanly, so we use per-file environment annotation
// (`// @vitest-environment node` / `jsdom` at the top of each test file).
// The enforcement is identical: importing React in a node-env test file
// surfaces as an immediate failure.
export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    plugins: [react()],
    test: {
      name: 'calc-surry-county-offer',
      // Default environment for files without a `// @vitest-environment` header.
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
    },
  }),
);
