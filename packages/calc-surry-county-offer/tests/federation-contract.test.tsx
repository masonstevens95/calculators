// @vitest-environment jsdom
//
// Per KTD #23: lock down the federation public-API contract at U4 so U5–U9
// inherit a validated surface. The test mirrors what a Module Federation host
// will do — dynamic-import the package's entry, take the default export, and
// mount it as a React component.

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => cleanup());

describe('federation public-API contract for calc-surry-county-offer', () => {
  it('default export is a renderable React component (no top-level side effects)', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;
    expect(Component).toBeDefined();
    expect(typeof Component).toBe('function');

    render(<Component />);
    // The component renders its primary heading
    expect(
      screen.getByRole('heading', { name: /surry county offer/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('is idempotent across two mount cycles', async () => {
    const mod = await import('../src/index');
    const Component = mod.default;

    const first = render(<Component />);
    expect(
      screen.getByRole('heading', { name: /surry county offer/i, level: 1 }),
    ).toBeInTheDocument();
    first.unmount();

    const second = render(<Component />);
    expect(
      screen.getByRole('heading', { name: /surry county offer/i, level: 1 }),
    ).toBeInTheDocument();
    second.unmount();
  });

  it('exposes named domain symbols alongside the component (logic without UI)', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.computeOffer).toBe('function');
    expect(typeof mod.monthlyPayment).toBe('function');
    expect(typeof mod.netProceedsCalc).toBe('function');
    expect(typeof mod.concessionLimit).toBe('function');
    expect(typeof mod.validateOfferInputs).toBe('function');
  });
});
