import { useMemo } from 'react';
import { LineChart, BarChart } from '@calc/charts';
import type { ChartData, ChartOptions } from 'chart.js';
import type { CashflowPoint, SensitivityPoint, WealthPoint } from '../domain';

export type CashflowChartProps = { points: readonly CashflowPoint[] };

export function CashflowChart({ points }: CashflowChartProps) {
  const data: ChartData<'line'> = useMemo(
    () => ({
      labels: points.map((p) => `$${p.rent.toLocaleString()}`),
      datasets: [
        {
          label: 'Managed (9%)',
          data: points.map((p) => p.managedCf),
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20,184,166,0.07)',
          tension: 0.15,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Self-managed',
          data: points.map((p) => p.selfCf),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.07)',
          tension: 0.15,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Break-even',
          data: points.map(() => 0),
          borderColor: '#ef4444',
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

  return <LineChart data={data} options={options} ariaLabel="Net cash flow vs monthly rent" />;
}

export type WealthChartProps = { points: readonly WealthPoint[] };

export function WealthChart({ points }: WealthChartProps) {
  const data: ChartData<'line'> = useMemo(
    () => ({
      labels: points.map((p) => `Yr ${p.year}`),
      datasets: [
        {
          label: 'Sell → invest proceeds',
          data: points.map((p) => p.sellWealth),
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20,184,166,0.07)',
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          label: 'Rent (equity + cash flow)',
          data: points.map((p) => p.rentWealth),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.07)',
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2,
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

  return <LineChart data={data} options={options} ariaLabel="Net wealth: sell vs rent over 10 years" />;
}

export type SensitivityChartProps = { points: readonly SensitivityPoint[] };

export function SensitivityChart({ points }: SensitivityChartProps) {
  const data: ChartData<'bar'> = useMemo(
    () => ({
      labels: points.map((p) => `${p.appRatePct}%`),
      datasets: [
        {
          label: 'Rent − Sell at year 10',
          data: points.map((p) => p.rentMinusSellAt10),
          backgroundColor: points.map((p) =>
            p.rentMinusSellAt10 >= 0 ? 'rgba(20,184,166,0.85)' : 'rgba(239,68,68,0.85)',
          ),
          borderRadius: 4,
        },
      ],
    }),
    [points],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString() } },
      },
    }),
    [],
  );

  return (
    <BarChart data={data} options={options} ariaLabel="Rent advantage at year 10 by home appreciation rate" />
  );
}
