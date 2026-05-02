// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Eu5LoanComponent } from '../src/Component';

describe('<Eu5LoanComponent />', () => {
  it('renders the heading', () => {
    render(<Eu5LoanComponent />);
    expect(screen.getByRole('heading', { name: /eu5 loan/i, level: 1 })).toBeInTheDocument();
  });

  it('renders both the loan and income input cards', () => {
    render(<Eu5LoanComponent />);
    expect(screen.getByLabelText(/loan amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/building cost/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/interest rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/3-year cumulative profit/i)).toBeInTheDocument();
  });

  it('renders the net-profit-over-time table with 5 horizon rows', () => {
    render(<Eu5LoanComponent />);
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
    // First table is the horizon table
    const horizonTable = tables[0]!;
    const rows = horizonTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });

  it('routes results through aria-live', () => {
    const { container } = render(<Eu5LoanComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('verdict updates when profit3yr changes from default to strong', async () => {
    render(<Eu5LoanComponent />);
    const user = userEvent.setup();
    const profit = screen.getByLabelText(/3-year cumulative profit/i);
    await user.clear(profit);
    await user.type(profit, '1000');
    expect(screen.getByText(/Strong — borrow aggressively/i)).toBeInTheDocument();
  });

  it('shows Wait vs Borrow comparison cards', () => {
    render(<Eu5LoanComponent />);
    expect(screen.getByRole('heading', { name: /borrow now/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /wait & save/i })).toBeInTheDocument();
  });

  it('does NOT render any chart canvas (EU5 is form/calc only — KTD #18 scope)', () => {
    const { container } = render(<Eu5LoanComponent />);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
