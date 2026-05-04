import { useMemo } from 'react';
import { BarChart, readToken } from '@calc/charts';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ParcelBill } from '../domain';

export type ParcelComparisonChartProps = {
  bills: readonly ParcelBill[];
  /**
   * Current shift fraction (0–1). When at the boundaries, the Split-rate
   * dataset is identical to either Today (shift = 0) or Pure LVT (shift = 1)
   * — we drop it to avoid rendering a redundant bar.
   */
  shift: number;
};

const ENDPOINT_EPSILON = 0.001;

export function ParcelComparisonChart({ bills, shift }: ParcelComparisonChartProps) {
  const showSplitRate = shift > ENDPOINT_EPSILON && shift < 1 - ENDPOINT_EPSILON;

  const data: ChartData<'bar'> = useMemo(() => {
    const todayDataset = {
      label: 'Today (uniform)',
      data: bills.map((b) => Math.round(b.today)),
      backgroundColor: readToken('--calc-chart-lvt-today', '#999999'),
    };
    const splitDataset = {
      label: 'Split-rate',
      data: bills.map((b) => Math.round(b.next)),
      backgroundColor: readToken('--calc-chart-lvt-split', '#2a6f4d'),
    };
    const pureDataset = {
      label: 'Pure LVT',
      data: bills.map((b) => Math.round(b.pure)),
      backgroundColor: readToken('--calc-chart-lvt-pure', '#b85c00'),
    };
    return {
      labels: bills.map((b) => b.parcel.name),
      datasets: showSplitRate ? [todayDataset, splitDataset, pureDataset] : [todayDataset, pureDataset],
    };
  }, [bills, showSplitRate]);

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
