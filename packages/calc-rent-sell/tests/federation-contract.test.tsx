// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-rent-sell', () => {
  it('default export is a renderable React component', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    render(<Component />);
    expect(
      screen.getByRole('heading', { name: /rent vs sell/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('exposes named domain symbols', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeRentSell).toBe('function');
    expect(typeof mod.monthlyCashflow).toBe('function');
    expect(typeof mod.breakEvenRent).toBe('function');
    expect(typeof mod.remainingBalance).toBe('function');
    expect(typeof mod.validateRentSellInputs).toBe('function');
    expect(typeof mod.RENT_SELL_DEFAULTS).toBe('object');
  });
});
