// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  CashflowChart,
  WealthChart,
  SensitivityChart,
} from '../../src/charts/RentVsSellCharts';

describe('Rent vs Sell charts smoke', () => {
  it('CashflowChart mounts', () => {
    render(
      <CashflowChart
        points={[
          { rent: 1500, managedCf: -100, selfCf: 50 },
          { rent: 2000, managedCf: 50, selfCf: 200 },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: /net cash flow vs monthly rent/i })).toBeInTheDocument();
  });

  it('WealthChart mounts', () => {
    render(
      <WealthChart
        points={[
          { year: 0, sellWealth: 100_000, rentWealth: 100_000 },
          { year: 5, sellWealth: 140_000, rentWealth: 130_000 },
          { year: 10, sellWealth: 196_000, rentWealth: 200_000 },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: /net wealth: sell vs rent/i })).toBeInTheDocument();
  });

  it('SensitivityChart mounts', () => {
    render(
      <SensitivityChart
        points={[
          { appRatePct: 0, rentMinusSellAt10: -10_000 },
          { appRatePct: 7, rentMinusSellAt10: 50_000 },
        ]}
      />,
    );
    expect(
      screen.getByRole('img', { name: /rent advantage at year 10 by home appreciation/i }),
    ).toBeInTheDocument();
  });
});
