// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SolarBatteryGeneratorComponent } from '../src/Component';

describe('<SolarBatteryGeneratorComponent />', () => {
  it('renders the heading', () => {
    render(<SolarBatteryGeneratorComponent />);
    expect(
      screen.getByRole('heading', { name: /solar \+ battery \+ generator/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders core system, financing, energy, and generator inputs', () => {
    render(<SolarBatteryGeneratorComponent />);
    expect(screen.getByLabelText(/solar array size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battery capacity/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Generator cost')).toBeInTheDocument();
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual usage/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Utility rate ($/kWh)')).toBeInTheDocument();
    expect(screen.getByLabelText(/burn rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expected outage hours/i)).toBeInTheDocument();
  });

  it('renders the financing mode selector', () => {
    render(<SolarBatteryGeneratorComponent />);
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
  });

  it('renders all three charts with descriptive aria-labels', () => {
    render(<SolarBatteryGeneratorComponent />);
    expect(
      screen.getByRole('img', { name: /cumulative net cash flow over the analysis period/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /annual bill savings vs generator cost/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /payback period by utility rate escalation/i }),
    ).toBeInTheDocument();
  });

  it('renders the Payback section', () => {
    render(<SolarBatteryGeneratorComponent />);
    expect(screen.getByRole('heading', { name: /payback/i })).toBeInTheDocument();
  });

  it('routes results through aria-live', () => {
    const { container } = render(<SolarBatteryGeneratorComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });
});
