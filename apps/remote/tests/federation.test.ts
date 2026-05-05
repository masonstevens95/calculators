// @vitest-environment node
//
// Federation manifest contract test (U10). Asserts the post-build
// mf-manifest.json shape so the host can rely on a stable surface.
//
// Build is run separately via `pnpm --filter @apps/remote build`. This test
// reads the artifact off disk; it skips with a clear note when dist/
// doesn't exist yet (so a fresh checkout doesn't fail spuriously).

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', 'dist', 'mf-manifest.json');
const REMOTE_ENTRY_PATH = join(__dirname, '..', 'dist', 'remoteEntry.js');

const EXPECTED_EXPOSES = [
  './CalculatorsApp',
  './CalculatorsRoutes',
  './CalculatorsLoadError',
  './calc/rural-land-offer',
  './calc/lgs-dscr',
  './calc/olamina-dscr',
  './calc/eu5-loan',
  './calc/winston-salem-lvt',
  './calc/rent-sell',
];

const SHARED_REACT_KEYS = ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'];

describe.runIf(existsSync(MANIFEST_PATH))('federation manifest contract', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));

  it('uses the documented remote name "calculators"', () => {
    expect(manifest.id).toBe('calculators');
    expect(manifest.name).toBe('calculators');
  });

  it('emits remoteEntry.js as the bootstrap module', () => {
    expect(existsSync(REMOTE_ENTRY_PATH)).toBe(true);
    expect(manifest.metaData.remoteEntry.name).toBe('remoteEntry.js');
  });

  it('exposes the documented surface — 3 shell components + 6 per-calc', () => {
    const exposedPaths = manifest.exposes.map((e: { path: string }) => e.path);
    for (const expected of EXPECTED_EXPOSES) {
      expect(exposedPaths).toContain(expected);
    }
    expect(exposedPaths).toHaveLength(EXPECTED_EXPOSES.length);
  });

  it('marks React + ReactDOM as singleton-shared (KTD #14 trailing-slash patterns active)', () => {
    const sharedNames = manifest.shared.map((s: { name: string }) => s.name);
    for (const key of SHARED_REACT_KEYS) {
      expect(sharedNames).toContain(key);
    }
    for (const entry of manifest.shared) {
      if (SHARED_REACT_KEYS.includes(entry.name)) {
        expect(entry.singleton).toBe(true);
      }
    }
  });
});

// When dist/ doesn't exist this whole describe is skipped — log a hint.
if (!existsSync(MANIFEST_PATH)) {
  console.warn(
    'federation.test.ts: dist/mf-manifest.json missing — run `pnpm --filter @apps/remote build` to generate it.',
  );
}
