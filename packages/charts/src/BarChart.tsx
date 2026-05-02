import { useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { ensureChartJsRegistered } from './registerChartJs';

export type BarChartProps = {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
  /** Accessible label for the canvas. Required — chart-as-image needs an alt-equivalent. */
  ariaLabel: string;
  className?: string;
};

export function BarChart({ data, options, ariaLabel, className }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  useEffect(() => {
    ensureChartJsRegistered();
    if (!canvasRef.current) return;
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data,
      options,
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // Re-create on data/options identity change. Calc components memoize
    // these via useMemo so we don't churn on every render.
  }, [data, options]);

  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} className={className} />;
}
