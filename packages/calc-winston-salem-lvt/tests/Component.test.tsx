// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { WinstonSalemLvtComponent } from '../src/Component';

describe('<WinstonSalemLvtComponent />', () => {
  it('renders the heading', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.getByRole('heading', { name: /winston-salem lvt/i, level: 1 })).toBeInTheDocument();
  });

  it('does NOT render a privacy disclosure (KTD #18 — I5 dropped from disclosure scope)', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.queryByText(/Inputs don't leave your browser/i)).not.toBeInTheDocument();
  });

  it('renders the shift slider', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders four tabs for the impact perspectives', () => {
    render(<WinstonSalemLvtComponent />);
    expect(screen.getByRole('tab', { name: /city budget/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /parcel types/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /your bill/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /raise revenue/i })).toBeInTheDocument();
  });

  it('Raise revenue tab exposes a multiplier slider and dividend toggle', async () => {
    const user = userEvent.setup();
    render(<WinstonSalemLvtComponent />);
    await user.click(screen.getByRole('tab', { name: /raise revenue/i }));
    // Two sliders now visible: shift slider (always pinned) + multiplier slider in the panel.
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByLabelText(/citizens' dividend/i)).toBeInTheDocument();
  });

  it('renders the sample-parcel table with 7 rows in the Parcel Types tab', async () => {
    const user = userEvent.setup();
    render(<WinstonSalemLvtComponent />);
    await user.click(screen.getByRole('tab', { name: /parcel types/i }));
    const tables = screen.getAllByRole('table');
    const parcelTable = tables[0]!;
    expect(parcelTable.querySelectorAll('tbody tr')).toHaveLength(7);
  });

  it('renders the chart with an aria-label in the Parcel Types tab', async () => {
    const user = userEvent.setup();
    render(<WinstonSalemLvtComponent />);
    await user.click(screen.getByRole('tab', { name: /parcel types/i }));
    expect(
      screen.getByRole('img', { name: /annual tax by parcel/i }),
    ).toBeInTheDocument();
  });

  it('routes results through aria-live', () => {
    const { container } = render(<WinstonSalemLvtComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('renders the user-parcel inputs in the Your Bill tab', async () => {
    const user = userEvent.setup();
    render(<WinstonSalemLvtComponent />);
    await user.click(screen.getByRole('tab', { name: /your bill/i }));
    expect(screen.getByLabelText(/your land value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your improvement value/i)).toBeInTheDocument();
  });
});
