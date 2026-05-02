// Centralizes Chart.js controller / scale / element registration so per-calc
// chart wrappers don't each have to repeat the boilerplate. Chart.js v4 is
// tree-shakeable and refuses to render until the relevant pieces are
// registered — this file does that exactly once per process.

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from 'chart.js';

let registered = false;

export function ensureChartJsRegistered() {
  if (registered) return;
  ChartJS.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Title,
    Filler,
  );
  registered = true;
}
