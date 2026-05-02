import { useMemo } from 'react';
import { BarChart } from '@calc/charts';
import type { ChartData, ChartOptions } from 'chart.js';

export type CashChartScenario = { label: string; reserve: number };

export type CashChartProps = {
  scenarios: readonly CashChartScenario[];
};

function reserveColor(v: number): string {
  if (v >= 15_000) return '#2d6a4f';
  if (v >= 0) return '#e76f51';
  return '#c62828';
}

export function CashChart({ scenarios }: CashChartProps) {
  const data: ChartData<'bar'> = useMemo(() => {
    const values = scenarios.map((s) => Math.round(s.reserve));
    return {
      labels: scenarios.map((s) => s.label),
      datasets: [
        {
          label: 'Final Reserve',
          data: values,
          backgroundColor: values.map(reserveColor),
        },
      ],
    };
  }, [scenarios]);

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { ticks: { callback: (v) => '$' + Number(v).toLocaleString() } },
      },
    }),
    [],
  );

  return <BarChart data={data} options={options} ariaLabel="Final cash reserve by scenario" />;
}
