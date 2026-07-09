// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SolarBatteryComponent } from '../src/Component';

describe('<SolarBatteryComponent />', () => {
  it('renders the heading', () => {
    render(<SolarBatteryComponent />);
    expect(
      screen.getByRole('heading', { name: /solar \+ battery/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders core system, financing, and energy inputs', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByLabelText(/solar array size \(kw\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battery capacity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual usage/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Utility rate ($/kWh)')).toBeInTheDocument();
  });

  it('does NOT render a generator section', () => {
    render(<SolarBatteryComponent />);
    expect(screen.queryByText(/generator/i)).not.toBeInTheDocument();
  });

  it('hides loan-only fields when payment method is Cash', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan term/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/payment method/i), { target: { value: 'cash' } });

    expect(screen.queryByLabelText(/down payment/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/loan rate/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/loan term/i)).not.toBeInTheDocument();
  });

  it('renders all three charts with descriptive aria-labels', () => {
    render(<SolarBatteryComponent />);
    expect(
      screen.getByRole('img', { name: /cumulative net cash flow over the analysis period/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /annual bill savings vs loan payment/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /payback period by utility rate escalation/i }),
    ).toBeInTheDocument();
  });

  it('renders the Payback section', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByRole('heading', { name: /payback/i })).toBeInTheDocument();
  });

  it('routes results through aria-live', () => {
    const { container } = render(<SolarBatteryComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });
});
