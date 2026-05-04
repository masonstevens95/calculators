/**
 * Read a CSS custom property from `:root` and return its resolved value.
 *
 * `light-dark()` resolves at the value-read moment based on the document's
 * used color-scheme — so calling this in a dark-OS session returns the dark
 * variant; in a light-OS session it returns the light variant. Charts
 * constructed at mount time pick up the right palette automatically.
 *
 * Live toggling of OS theme mid-session does not re-render charts; refresh
 * is acceptable for this scope. If we need live updates later, layer a
 * `matchMedia('(prefers-color-scheme: dark)')` listener that calls
 * `chart.update()` on the active chart instances.
 */
export function readToken(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Common Chart.js token bundle — axis text + grid colors. Pass these into
 * `options.scales.{x,y}.ticks.color` and `options.scales.{x,y}.grid.color`
 * so axis labels and gridlines flip with the theme.
 */
export function chartAxisTokens() {
  return {
    text: readToken('--calc-chart-axis-text', '#6b7280'),
    grid: readToken('--calc-chart-axis-grid', '#e5e7eb'),
  };
}
