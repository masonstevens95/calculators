import { useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { ensureChartJsRegistered } from './registerChartJs';

export type LineChartProps = {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  ariaLabel: string;
  className?: string;
};

export function LineChart({ data, options, ariaLabel, className }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  useEffect(() => {
    ensureChartJsRegistered();
    if (!canvasRef.current) return;
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'line',
      data,
      options,
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, options]);

  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} className={className} />;
}
