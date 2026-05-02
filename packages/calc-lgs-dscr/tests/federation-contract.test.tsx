// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-lgs-dscr', () => {
  it('default export is a renderable React component (no top-level side effects)', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(Component).toBeDefined();
    expect(typeof Component).toBe('function');

    render(<Component />);
    expect(screen.getByRole('heading', { name: /lgs dscr/i, level: 1 })).toBeInTheDocument();
  });

  it('is idempotent across two mount cycles', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;

    const first = render(<Component />);
    first.unmount();
    const second = render(<Component />);
    expect(screen.getByRole('heading', { name: /lgs dscr/i })).toBeInTheDocument();
    second.unmount();
  });

  it('exposes named domain symbols alongside the component', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeDscr).toBe('function');
    expect(typeof mod.monthlyPayment).toBe('function');
    expect(typeof mod.computePerHome).toBe('function');
    expect(typeof mod.validateDscrInputs).toBe('function');
    expect(Array.isArray(mod.MODELS)).toBe(true);
  });
});
