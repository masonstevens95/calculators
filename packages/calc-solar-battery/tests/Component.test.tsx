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

  it('renders Solar and Battery as separate card sections', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByRole('heading', { name: 'Solar', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Battery', level: 2 })).toBeInTheDocument();
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

  it('renders a panel age field defaulting to 0, and reduces estimated production when raised', () => {
    render(<SolarBatteryComponent />);
    const panelAge = screen.getByLabelText(/panel age/i) as HTMLInputElement;
    expect(panelAge.value).toBe('0');

    const productionBefore = screen.getByText(/kWh\/yr$/).textContent;
    fireEvent.change(panelAge, { target: { value: '15' } });
    const productionAfter = screen.getByText(/kWh\/yr$/).textContent;

    expect(productionAfter).not.toBe(productionBefore);
  });

  it('toggles solar cost input between per-watt and total system cost', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByLabelText('Solar cost per watt')).toBeInTheDocument();
    expect(screen.queryByLabelText('Total solar cost')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/solar cost basis/i), { target: { value: 'total' } });

    expect(screen.getByLabelText('Total solar cost')).toBeInTheDocument();
    expect(screen.queryByLabelText('Solar cost per watt')).not.toBeInTheDocument();
  });

  it('toggles battery cost input between per-kWh and total system cost', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByLabelText('Battery cost per kWh')).toBeInTheDocument();
    expect(screen.queryByLabelText('Total battery cost')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/battery cost basis/i), { target: { value: 'total' } });

    expect(screen.getByLabelText('Total battery cost')).toBeInTheDocument();
    expect(screen.queryByLabelText('Battery cost per kWh')).not.toBeInTheDocument();
  });

  it('toggles soft costs between percent and flat dollar amount', () => {
    render(<SolarBatteryComponent />);
    const softCostsField = () => screen.getByLabelText('Soft costs (permitting/install)');
    expect(softCostsField().parentElement?.textContent).toContain('%');

    fireEvent.change(screen.getByLabelText(/soft costs basis/i), { target: { value: 'flat' } });

    expect(softCostsField().parentElement?.textContent).toContain('$');
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
      screen.getByRole('img', {
        name: /cumulative net cash flow: solar and battery vs an index fund alternative/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /annual bill savings vs tou arbitrage and loan payment/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /payback period by utility rate escalation/i }),
    ).toBeInTheDocument();
  });

  it('renders the Payback section', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByRole('heading', { name: /payback/i })).toBeInTheDocument();
  });

  it('renders the index fund return input and compares it in the payback headline', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByLabelText(/index fund return/i)).toBeInTheDocument();
    expect(screen.getAllByText(/index fund/i).length).toBeGreaterThan(1);
  });

  it('renders the annual production and index fund stats', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByText('Est. annual production')).toBeInTheDocument();
    expect(screen.getByText(/index fund alternative/i)).toBeInTheDocument();
  });

  it('routes results through aria-live', () => {
    const { container } = render(<SolarBatteryComponent />);
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('renders the Suggested sizing section with house size, coverage goal, and an autofill button', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByRole('heading', { name: 'Suggested sizing', level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText(/house size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/coverage goal/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /autofill solar & battery sizing/i }),
    ).toBeInTheDocument();
  });

  it('autofills solar size and battery capacity from the suggested sizing tool', () => {
    render(<SolarBatteryComponent />);
    const solarSize = screen.getByLabelText(/solar array size \(kw\)/i) as HTMLInputElement;
    const batteryCapacity = screen.getByLabelText(/battery capacity/i) as HTMLInputElement;
    const originalSolarSize = solarSize.value;

    fireEvent.click(screen.getByRole('button', { name: /autofill solar & battery sizing/i }));

    expect(solarSize.value).not.toBe(originalSolarSize);
    expect(Number(solarSize.value)).toBeGreaterThan(0);
    expect(Number(batteryCapacity.value)).toBeGreaterThan(0);
  });

  it('TOU arbitrage is off by default and hides its rate/efficiency fields', () => {
    render(<SolarBatteryComponent />);
    expect(screen.getByLabelText('TOU arbitrage')).toHaveValue('off');
    expect(screen.queryByLabelText(/off-peak charge rate/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/on-peak avoided rate/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/round-trip efficiency/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Battery arbitrage (Yr 1)')).not.toBeInTheDocument();
  });

  it('enabling TOU arbitrage reveals its inputs and the arbitrage stat', () => {
    render(<SolarBatteryComponent />);
    fireEvent.change(screen.getByLabelText('TOU arbitrage'), { target: { value: 'on' } });

    expect(screen.getByLabelText(/off-peak charge rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/on-peak avoided rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/round-trip efficiency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arbitrage days\/year/i)).toBeInTheDocument();
    expect(screen.getByText('Battery arbitrage (Yr 1)')).toBeInTheDocument();
  });

  it('suggests a larger solar array for Total coverage than for Minimal', () => {
    render(<SolarBatteryComponent />);
    const coverageGoal = screen.getByLabelText(/coverage goal/i);
    const preview = () => screen.getByTestId('sizing-preview').textContent ?? '';

    fireEvent.change(coverageGoal, { target: { value: 'minimal' } });
    const minimalMatch = /Suggests ([\d.]+) kW/.exec(preview());

    fireEvent.change(coverageGoal, { target: { value: 'totalCoverage' } });
    const totalMatch = /Suggests ([\d.]+) kW/.exec(preview());

    expect(minimalMatch).not.toBeNull();
    expect(totalMatch).not.toBeNull();
    expect(Number(totalMatch![1])).toBeGreaterThan(Number(minimalMatch![1]));
  });
});
