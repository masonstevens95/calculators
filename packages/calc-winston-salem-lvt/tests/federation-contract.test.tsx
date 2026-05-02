// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-winston-salem-lvt', () => {
  it('default export is a renderable React component', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    render(<Component />);
    expect(screen.getByRole('heading', { name: /winston-salem lvt/i, level: 1 })).toBeInTheDocument();
  });

  it('exposes named domain symbols', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeLvt).toBe('function');
    expect(typeof mod.computeRates).toBe('function');
    expect(typeof mod.computeParcelBill).toBe('function');
    expect(typeof mod.validateLvtInputs).toBe('function');
    expect(Array.isArray(mod.SAMPLE_PARCELS)).toBe(true);
  });
});
