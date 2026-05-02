// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-birchwood-rent-sell', () => {
  it('default export is a renderable React component', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    render(<Component />);
    expect(
      screen.getByRole('heading', { name: /birchwood rent vs sell/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('exposes named domain symbols', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeBirchwood).toBe('function');
    expect(typeof mod.monthlyCashflow).toBe('function');
    expect(typeof mod.breakEvenRent).toBe('function');
    expect(typeof mod.remainingBalance).toBe('function');
    expect(typeof mod.validateBirchwoodInputs).toBe('function');
    expect(typeof mod.BIRCHWOOD_DEFAULTS).toBe('object');
  });
});
