import { useMemo } from 'react';
import { LineChart, BarChart, readToken } from '@calc/charts';
import type { ChartData, ChartOptions } from 'chart.js';
import type { AnnualBreakdownPoint, CashFlowPoint, SensitivityPoint } from '../domain';

export type CashFlowChartProps = { points: readonly CashFlowPoint[] };

export function CashFlowChart({ points }: CashFlowChartProps) {
  const data: ChartData<'line'> = useMemo(
    () => ({
      labels: points.map((p) => `Yr ${p.year}`),
      datasets: [
        {
          label: 'Cumulative cash flow',
          data: points.map((p) => p.cumulative),
          borderColor: readToken('--calc-chart-solar-cumulative', '#f59e0b'),
          backgroundColor: 'rgba(245,158,11,0.07)',
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Breakeven',
          data: points.map(() => 0),
          borderColor: readToken('--calc-chart-breakeven', '#ef4444'),
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
      ],
    }),
    [points],
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString() } },
      },
    }),
    [],
  );

  return <LineChart data={data} options={options} ariaLabel="Cumulative net cash flow over the analysis period" />;
}

export type AnnualBreakdownChartProps = { points: readonly AnnualBreakdownPoint[] };

export function AnnualBreakdownChart({ points }: AnnualBreakdownChartProps) {
  const data: ChartData<'bar'> = useMemo(
    () => ({
      labels: points.map((p) => `Yr ${p.year}`),
      datasets: [
        {
          label: 'Bill savings',
          data: points.map((p) => p.billSavings),
          backgroundColor: readToken('--calc-chart-solar-savings', '#14b8a6'),
          borderRadius: 3,
        },
        {
          label: 'Loan payment',
          data: points.map((p) => -p.debtService),
          backgroundColor: readToken('--calc-chart-solar-debt', '#64748b'),
          borderRadius: 3,
        },
      ],
    }),
    [points],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, ticks: { callback: (v) => '$' + Number(v).toLocaleString() } },
      },
    }),
    [],
  );

  return (
    <BarChart data={data} options={options} ariaLabel="Annual bill savings vs loan payment" />
  );
}

export type SensitivityChartProps = { points: readonly SensitivityPoint[] };

export function SensitivityChart({ points }: SensitivityChartProps) {
  const paybackColor = readToken('--calc-chart-solar-payback', 'rgba(20,184,166,0.85)');
  const data: ChartData<'bar'> = useMemo(
    () => ({
      labels: points.map((p) => `${p.rateEscalationPct}%`),
      datasets: [
        {
          label: 'Payback years',
          data: points.map((p) => p.paybackYears ?? null),
          backgroundColor: paybackColor,
          borderRadius: 4,
        },
      ],
    }),
    [points, paybackColor],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: (v) => `${Number(v).toFixed(0)} yr` } },
      },
    }),
    [],
  );

  return (
    <BarChart
      data={data}
      options={options}
      ariaLabel="Payback period by utility rate escalation assumption"
    />
  );
}
