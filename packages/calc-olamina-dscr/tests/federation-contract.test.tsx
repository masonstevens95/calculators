// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-olamina-dscr', () => {
  it('default export is a renderable React component', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    render(<Component />);
    expect(screen.getByRole('heading', { name: /olamina dscr/i, level: 1 })).toBeInTheDocument();
  });

  it('exposes named domain symbols', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeDscr).toBe('function');
    expect(typeof mod.monthlyPayment).toBe('function');
    expect(typeof mod.computePerHome).toBe('function');
    expect(typeof mod.validateDscrInputs).toBe('function');
    expect(typeof mod.getKitPrice).toBe('function');
    expect(Array.isArray(mod.MODELS)).toBe(true);
  });

  it('is idempotent across mount cycles', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    const first = render(<Component />);
    first.unmount();
    const second = render(<Component />);
    expect(screen.getByRole('heading', { name: /olamina dscr/i })).toBeInTheDocument();
    second.unmount();
  });
});
