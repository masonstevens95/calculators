export type PercentFormatOptions = {
  /** Digits after the decimal point. Defaults to 1. */
  fractionDigits?: number;
  /** What to render when the input isn't a finite number. Defaults to "—". */
  placeholder?: string;
};

const DEFAULT_PLACEHOLDER = '—';

export function formatPercent(
  ratio: number | null | undefined,
  options: PercentFormatOptions = {},
): string {
  const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) {
    return placeholder;
  }
  const fractionDigits = options.fractionDigits ?? 1;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(ratio);
}
