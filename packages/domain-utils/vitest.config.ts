import { defineConfig, mergeConfig } from 'vitest/config';
import { sharedTestConfig } from '../../vitest.shared';

// Per KTD #12: domain-utils runs in `node` env. Any accidental React import
// in src/** would surface as a test failure here — by design.
export default mergeConfig(
  sharedTestConfig,
  defineConfig({
    test: {
      name: '@calc/domain-utils',
      environment: 'node',
      include: ['tests/**/*.test.{ts,tsx}'],
    },
  }),
);
