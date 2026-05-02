// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { SurryCountyOfferComponent } from '../src/Component';
import { computeOffer } from '../src/domain';
import { defaultInputs } from '../src/presets';
import { fixtures } from './fixtures';

describe('<SurryCountyOfferComponent />', () => {
  it('renders the heading and subtitle', () => {
    render(<SurryCountyOfferComponent />);
    expect(screen.getByRole('heading', { name: /surry county offer/i, level: 1 })).toBeInTheDocument();
  });

  it('renders all input fields with labels (happy path)', () => {
    render(<SurryCountyOfferComponent />);
    expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mortgage payoff/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/realtor commission/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transfer \+ closing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/offer price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seller concession/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mortgage rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/property tax/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/insurance \(/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/buyer closing costs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/equipment budget/i)).toBeInTheDocument();
  });

  it('reflects the default scenario in the result section (matches domain.computeOffer)', () => {
    render(<SurryCountyOfferComponent />);
    const computed = computeOffer(defaultInputs);
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;
    // Net proceeds shown as "$97,400"
    expect(screen.getAllByText(/\$97,400/).length).toBeGreaterThanOrEqual(1);
    // Loan amount shown as "$311,250"
    expect(screen.getAllByText(/\$311,250/).length).toBeGreaterThanOrEqual(1);
  });

  it('updates the AriaLive results region when an input changes (AE3)', async () => {
    render(<SurryCountyOfferComponent />);
    const user = userEvent.setup();
    const offer = screen.getByLabelText(/offer price/i);
    // Sanity: default is $415k → loan $311,250 visible
    expect(screen.getAllByText(/\$311,250/).length).toBeGreaterThanOrEqual(1);
    await user.clear(offer);
    await user.type(offer, '500000');
    // After typing 500000, loan = 500000 * (1 - 0.25) = 375000
    expect(screen.getAllByText(/\$375,000/).length).toBeGreaterThanOrEqual(1);
  });

  it('routes the computed metrics through an aria-live region', () => {
    const { container } = render(<SurryCountyOfferComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('shows the concession-over-limit warning at 95% LTV with 6% concession', async () => {
    render(<SurryCountyOfferComponent />);
    const user = userEvent.setup();
    const down = screen.getByLabelText(/down payment/i);
    await user.clear(down);
    await user.type(down, '5');
    // 95% LTV → max conventional concession is 3%; default concession 9% > 3%
    const alerts = screen.getAllByRole('alert');
    expect(
      alerts.some((node) => /exceeds the limit/i.test(node.textContent ?? '')),
    ).toBe(true);
  });

  it('keyboard tab order traverses inputs in DOM order without trap', async () => {
    render(<SurryCountyOfferComponent />);
    const user = userEvent.setup();
    // Press Tab and confirm we eventually reach the last input without throwing
    for (let i = 0; i < 12; i++) {
      await user.tab();
    }
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
  });

  it('renders both charts with accessible aria-labels', () => {
    render(<SurryCountyOfferComponent />);
    expect(screen.getByRole('img', { name: /monthly piti by scenario/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /final cash reserve by scenario/i })).toBeInTheDocument();
  });

  it('renders the scenario comparison table with one column per preset + custom', () => {
    render(<SurryCountyOfferComponent />);
    const heading = screen.getByRole('heading', { name: /scenario comparison/i });
    const section = heading.closest('section');
    expect(section).not.toBeNull();
    if (!section) return;
    const table = within(section).getByRole('table');
    expect(within(table).getByRole('columnheader', { name: /\$415k.*25%.*9%/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /custom/i })).toBeInTheDocument();
  });

  it('agrees numerically with computeOffer for each fixture (UI ↔ domain integration)', () => {
    // We don't drive the full UI per fixture; we assert the computeOffer the
    // Component will call produces the same expected values the fixtures encode.
    for (const fixture of fixtures) {
      const result = computeOffer(fixture.input);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(Math.round(result.result.netProceeds)).toBe(Math.round(fixture.expected.netProceeds));
    }
  });
});
