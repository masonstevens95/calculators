// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-solar-battery', () => {
  it('default export is a renderable React component', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    render(<Component />);
    expect(
      screen.getByRole('heading', { name: /solar \+ battery/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('exposes named domain symbols', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeSolarBattery).toBe('function');
    expect(typeof mod.systemCost).toBe('function');
    expect(typeof mod.solvePaybackYears).toBe('function');
    expect(typeof mod.indexFundSeries).toBe('function');
    expect(typeof mod.validateSolarBatteryInputs).toBe('function');
    expect(typeof mod.SOLAR_BATTERY_DEFAULTS).toBe('object');
  });
});
