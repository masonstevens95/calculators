// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ModularHomeDscrComponent } from '../src/Component';
import { computeDscr } from '../src/domain';
import { defaultInputs } from '../src/presets';

describe('<ModularHomeDscrComponent />', () => {
  it('renders the heading', () => {
    render(<ModularHomeDscrComponent />);
    expect(
      screen.getByRole('heading', { name: /modular home development calculator/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the privacy disclosure', () => {
    render(<ModularHomeDscrComponent />);
    expect(screen.getByText(/Inputs don't leave your browser/i)).toBeInTheDocument();
  });

  it('renders the builder selector with both options', () => {
    render(<ModularHomeDscrComponent />);
    expect(screen.getByRole('radio', { name: /nationwide homes/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /momohomes/i })).toBeInTheDocument();
  });

  it('renders the home-count input and the loan-parameter inputs', () => {
    render(<ModularHomeDscrComponent />);
    expect(screen.getByLabelText(/number of homes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mortgage rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dscr target/i)).toBeInTheDocument();
  });

  it('does NOT render the kit-tier control for the Nationwide builder (single-price models)', () => {
    render(<ModularHomeDscrComponent />);
    expect(screen.queryByLabelText(/kit tier/i)).not.toBeInTheDocument();
  });

  it('renders the kit-tier control after switching to Momohomes (tiered models)', async () => {
    render(<ModularHomeDscrComponent />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /momohomes/i }));
    expect(screen.getByLabelText(/kit tier/i)).toBeInTheDocument();
  });

  it('reflects the default Nationwide scenario in the result section', () => {
    render(<ModularHomeDscrComponent />);
    const computed = computeDscr(defaultInputs);
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;
    // 7 homes × Cumberland: totalCost = 268736*7 + 23312*7 + 100000 = 2,144,336
    expect(screen.getAllByText(/\$2,144,336/i).length).toBeGreaterThanOrEqual(1);
  });

  it('updates the result region when the DSCR target changes', async () => {
    render(<ModularHomeDscrComponent />);
    const user = userEvent.setup();
    const dscr = screen.getByLabelText(/dscr target/i);
    await user.clear(dscr);
    await user.type(dscr, '1.5');
    expect(screen.getByText(/Monthly rent needed.*DSCR.*1\.5/i)).toBeInTheDocument();
  });

  it('routes computed results through an aria-live region', () => {
    const { container } = render(<ModularHomeDscrComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('renders one row per home in the per-home breakdown table', () => {
    render(<ModularHomeDscrComponent />);
    // 7 home rows + 1 total row + 1 header row
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(7 + 1 + 1);
  });

  it('clicking a Nationwide preset button updates the homes', async () => {
    render(<ModularHomeDscrComponent />);
    const user = userEvent.setup();
    const presetA = screen.getByRole('button', { name: /preset a/i });
    await user.click(presetA);
    // Preset A: 3× Cumberland, 2× Whitfield, 2× Horizon I Cape
    const selects = screen.getAllByRole('combobox');
    const values = selects.map((s) => (s as HTMLSelectElement).value);
    expect(values.filter((v) => v === 'whitfield').length).toBe(2);
    expect(values.filter((v) => v === 'horizon_i_cape').length).toBe(2);
  });

  it('switching builder resets portfolio to that builder catalog', async () => {
    render(<ModularHomeDscrComponent />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: /momohomes/i }));
    // Default Momohomes starter is preset A: 3× birmingham + 4× co-live
    const selects = screen.getAllByRole('combobox');
    const values = selects
      .map((s) => (s as HTMLSelectElement).value)
      .filter((v) => v === 'birmingham' || v === 'co_live');
    expect(values.length).toBeGreaterThan(0);
  });
});
