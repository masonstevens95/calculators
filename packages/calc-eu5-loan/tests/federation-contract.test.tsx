// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-eu5-loan', () => {
  it('default export is a renderable React component', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    render(<Component />);
    expect(screen.getByRole('heading', { name: /eu5 loan/i, level: 1 })).toBeInTheDocument();
  });

  it('exposes named domain symbols', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeEu5).toBe('function');
    expect(typeof mod.sumFactors).toBe('function');
    expect(typeof mod.calcIncome).toBe('function');
    expect(typeof mod.validateEu5Inputs).toBe('function');
  });
});
