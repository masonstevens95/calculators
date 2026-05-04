// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ChartData } from 'chart.js';
import { ParcelComparisonChart } from '../../src/charts/ParcelComparisonChart';

const sampleBill = {
  parcel: { name: 'Test', land: 50_000, imp: 200_000 },
  today: 1_500,
  next: 1_400,
  pure: 800,
  delta: -100,
} as const;

describe('<ParcelComparisonChart /> smoke', () => {
  it('mounts and renders the chart canvas', () => {
    render(<ParcelComparisonChart bills={[sampleBill]} shift={0.3} />);
    expect(screen.getByRole('img', { name: /annual tax by parcel/i })).toBeInTheDocument();
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(<ParcelComparisonChart bills={[]} shift={0.5} />);
    expect(() => unmount()).not.toThrow();
  });
});

// Spy on the underlying BarChart's `data` prop to assert dataset filtering.
// vi.hoisted lets the mock factory reference the spy without TDZ issues.
const { dataSpy } = vi.hoisted(() => ({ dataSpy: vi.fn() }));
vi.mock('@calc/charts', () => ({
  BarChart: (props: { data: ChartData<'bar'>; ariaLabel: string }) => {
    dataSpy(props.data);
    return <div role="img" aria-label={props.ariaLabel} />;
  },
  readToken: (_name: string, fallback = '') => fallback,
}));

describe('<ParcelComparisonChart /> dataset filtering at shift boundaries', () => {
  it('renders all three datasets at mid-shift (0.5)', () => {
    dataSpy.mockClear();
    render(<ParcelComparisonChart bills={[sampleBill]} shift={0.5} />);
    const data = dataSpy.mock.lastCall?.[0] as ChartData<'bar'>;
    expect(data.datasets).toHaveLength(3);
    expect(data.datasets.map((d) => d.label)).toEqual(['Today (uniform)', 'Split-rate', 'Pure LVT']);
  });

  it('drops the Split-rate dataset at shift 0', () => {
    dataSpy.mockClear();
    render(<ParcelComparisonChart bills={[sampleBill]} shift={0} />);
    const data = dataSpy.mock.lastCall?.[0] as ChartData<'bar'>;
    expect(data.datasets).toHaveLength(2);
    expect(data.datasets.map((d) => d.label)).toEqual(['Today (uniform)', 'Pure LVT']);
  });

  it('drops the Split-rate dataset at shift 1', () => {
    dataSpy.mockClear();
    render(<ParcelComparisonChart bills={[sampleBill]} shift={1} />);
    const data = dataSpy.mock.lastCall?.[0] as ChartData<'bar'>;
    expect(data.datasets).toHaveLength(2);
    expect(data.datasets.map((d) => d.label)).toEqual(['Today (uniform)', 'Pure LVT']);
  });

  it('drops the Split-rate dataset within the float-precision epsilon (e.g. 0.0009)', () => {
    dataSpy.mockClear();
    render(<ParcelComparisonChart bills={[sampleBill]} shift={0.0009} />);
    const data = dataSpy.mock.lastCall?.[0] as ChartData<'bar'>;
    expect(data.datasets).toHaveLength(2);
  });
});
