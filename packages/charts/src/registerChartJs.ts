// Centralizes Chart.js controller / scale / element registration so per-calc
// chart wrappers don't each have to repeat the boilerplate. Chart.js v4 is
// tree-shakeable and refuses to render until the relevant pieces are
// registered — this file does that exactly once per process.
//
// Also applies theme-aware defaults read from @calc/ui's CSS custom
// properties, so every chart's axis text / borders pick up the active
// light or dark token without per-chart wiring.

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
import { readToken } from './themeColors';

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

  // Theme-aware defaults. Read once at first-mount; charts use these for
  // axis text and gridlines unless per-chart options override.
  const axisText = readToken('--calc-chart-axis-text');
  const axisGrid = readToken('--calc-chart-axis-grid');
  if (axisText) ChartJS.defaults.color = axisText;
  if (axisGrid) ChartJS.defaults.borderColor = axisGrid;

  registered = true;
}
