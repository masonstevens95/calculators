import { useMemo } from 'react';
import { BarChart, readToken } from '@calc/charts';
import type { ChartData, ChartOptions } from 'chart.js';

export type PitiChartScenario = {
  label: string;
  pi: number;
  tax: number;
  ins: number;
  pmiMo: number;
};

export type PitiChartProps = {
  scenarios: readonly PitiChartScenario[];
};

export function PitiChart({ scenarios }: PitiChartProps) {
  const data: ChartData<'bar'> = useMemo(
    () => ({
      labels: scenarios.map((s) => s.label),
      datasets: [
        {
          label: 'P&I',
          data: scenarios.map((s) => Math.round(s.pi)),
          backgroundColor: readToken('--calc-chart-series-pi', '#2d6a4f'),
        },
        {
          label: 'Tax',
          data: scenarios.map((s) => Math.round(s.tax)),
          backgroundColor: readToken('--calc-chart-series-tax', '#52b788'),
        },
        {
          label: 'Insurance',
          data: scenarios.map((s) => Math.round(s.ins)),
          backgroundColor: readToken('--calc-chart-series-ins', '#b7e4c7'),
        },
        {
          label: 'PMI',
          data: scenarios.map((s) => Math.round(s.pmiMo)),
          backgroundColor: readToken('--calc-chart-series-pmi', '#e76f51'),
        },
      ],
    }),
    [scenarios],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
      },
      scales: {
        x: { stacked: true, ticks: { font: { size: 10 } } },
        y: { stacked: true, ticks: { callback: (v) => '$' + Number(v).toLocaleString() } },
      },
    }),
    [],
  );

  return <BarChart data={data} options={options} ariaLabel="Monthly PITI by scenario" />;
}
