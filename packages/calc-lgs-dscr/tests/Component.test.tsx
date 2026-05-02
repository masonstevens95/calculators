// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { LgsDscrComponent } from '../src/Component';
import { computeDscr } from '../src/domain';
import { defaultInputs } from '../src/presets';

describe('<LgsDscrComponent />', () => {
  it('renders the heading', () => {
    render(<LgsDscrComponent />);
    expect(screen.getByRole('heading', { name: /lgs dscr/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the privacy disclosure (KTD #18)', () => {
    render(<LgsDscrComponent />);
    expect(screen.getByText(/Inputs don't leave your browser/i)).toBeInTheDocument();
  });

  it('renders the home-count input and the loan-parameter inputs', () => {
    render(<LgsDscrComponent />);
    expect(screen.getByLabelText(/number of homes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mortgage rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dscr target/i)).toBeInTheDocument();
  });

  it('reflects the default scenario in the result section', () => {
    render(<LgsDscrComponent />);
    const computed = computeDscr(defaultInputs);
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;
    // 7 homes × Cumberland: totalCost = 268736*7 + 23312*7 + 100000 = 2,144,336
    expect(screen.getAllByText(/\$2,144,336/i).length).toBeGreaterThanOrEqual(1);
  });

  it('updates the result region when the DSCR target changes', async () => {
    render(<LgsDscrComponent />);
    const user = userEvent.setup();
    const dscr = screen.getByLabelText(/dscr target/i);
    await user.clear(dscr);
    await user.type(dscr, '1.5');
    // The summary card label includes the live DSCR value
    expect(screen.getByText(/Monthly rent needed.*DSCR.*1\.5/i)).toBeInTheDocument();
  });

  it('routes computed results through an aria-live region', () => {
    const { container } = render(<LgsDscrComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('renders one row per home in the per-home breakdown table', () => {
    render(<LgsDscrComponent />);
    // 7 home rows + 1 total row + 1 header row
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(7 + 1 + 1);
  });

  it('clicking a preset button updates the homes', async () => {
    render(<LgsDscrComponent />);
    const user = userEvent.setup();
    const presetA = screen.getByRole('button', { name: /preset a/i });
    await user.click(presetA);
    // Preset A: 3× Cumberland, 2× Whitfield, 2× Horizon I Cape
    // Whitfield should now appear in a select option AS the chosen value
    const selects = screen.getAllByRole('combobox');
    const values = selects.map((s) => (s as HTMLSelectElement).value);
    expect(values.filter((v) => v === 'whitfield').length).toBe(2);
    expect(values.filter((v) => v === 'horizon_i_cape').length).toBe(2);
  });
});
