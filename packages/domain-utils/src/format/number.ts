export type NumberFormatOptions = {
  /** Digits after the decimal point. Defaults to 0. */
  fractionDigits?: number;
  /** What to render when the input isn't a finite number. Defaults to "—". */
  placeholder?: string;
};

const DEFAULT_PLACEHOLDER = '—';

export function formatNumber(
  value: number | null | undefined,
  options: NumberFormatOptions = {},
): string {
  const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return placeholder;
  }
  const fractionDigits = options.fractionDigits ?? 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
