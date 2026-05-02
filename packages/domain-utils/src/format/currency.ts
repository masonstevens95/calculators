export type CurrencyFormatOptions = {
  /** Maximum fractional digits to render. Defaults to 2. */
  maximumFractionDigits?: number;
  /** What to render when the input isn't a finite number. Defaults to "—". */
  placeholder?: string;
};

const DEFAULT_PLACEHOLDER = '—';

export function formatCurrency(
  value: number | null | undefined,
  options: CurrencyFormatOptions = {},
): string {
  const placeholder = options.placeholder ?? DEFAULT_PLACEHOLDER;
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return placeholder;
  }
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  const minimumFractionDigits = Math.min(maximumFractionDigits, 2);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}
