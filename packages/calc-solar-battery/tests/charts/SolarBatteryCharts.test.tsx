// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  AnnualBreakdownChart,
  CashFlowChart,
  SensitivityChart,
} from '../../src/charts/SolarBatteryCharts';

describe('Solar + Battery charts smoke', () => {
  it('CashFlowChart mounts', () => {
    render(
      <CashFlowChart
        points={[
          { year: 0, cumulative: -20_000, net: -20_000 },
          { year: 5, cumulative: -5_000, net: 3_000 },
          { year: 10, cumulative: 8_000, net: 3_500 },
        ]}
        indexFundPoints={[
          { year: 0, cumulative: 0, net: 0 },
          { year: 5, cumulative: 8_000, net: 1_400 },
          { year: 10, cumulative: 19_000, net: 2_000 },
        ]}
      />,
    );
    expect(
      screen.getByRole('img', {
        name: /cumulative net cash flow: solar and battery vs an index fund alternative/i,
      }),
    ).toBeInTheDocument();
  });

  it('AnnualBreakdownChart mounts', () => {
    render(
      <AnnualBreakdownChart
        points={[
          { year: 1, billSavings: 2_000, arbitrageValue: 150, debtService: 1_500 },
          { year: 2, billSavings: 2_100, arbitrageValue: 155, debtService: 1_500 },
        ]}
      />,
    );
    expect(
      screen.getByRole('img', { name: /annual bill savings vs tou arbitrage and loan payment/i }),
    ).toBeInTheDocument();
  });

  it('SensitivityChart mounts', () => {
    render(
      <SensitivityChart
        points={[
          { rateEscalationPct: 0, paybackYears: 12 },
          { rateEscalationPct: 8, paybackYears: 7 },
        ]}
      />,
    );
    expect(
      screen.getByRole('img', { name: /payback period by utility rate escalation/i }),
    ).toBeInTheDocument();
  });
});
