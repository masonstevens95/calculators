import { useMemo } from 'react';
import { BarChart } from '@calc/charts';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ParcelBill } from '../domain';

export type ParcelComparisonChartProps = {
  bills: readonly ParcelBill[];
};

export function ParcelComparisonChart({ bills }: ParcelComparisonChartProps) {
  const data: ChartData<'bar'> = useMemo(
    () => ({
      labels: bills.map((b) => b.parcel.name),
      datasets: [
        {
          label: 'Today (uniform)',
          data: bills.map((b) => Math.round(b.today)),
          backgroundColor: '#999',
        },
        {
          label: 'Split-rate',
          data: bills.map((b) => Math.round(b.next)),
          backgroundColor: '#2a6f4d',
        },
        {
          label: 'Pure LVT',
          data: bills.map((b) => Math.round(b.pure)),
          backgroundColor: '#b85c00',
        },
      ],
    }),
    [bills],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Annual tax ($)' },
          beginAtZero: true,
          ticks: { callback: (v) => '$' + Number(v).toLocaleString() },
        },
        x: { ticks: { maxRotation: 35, minRotation: 35 } },
      },
      plugins: { legend: { position: 'bottom' } },
    }),
    [],
  );

  return <BarChart data={data} options={options} ariaLabel="Annual tax by parcel under three scenarios" />;
}
