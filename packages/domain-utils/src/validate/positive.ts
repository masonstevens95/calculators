import type { ValidationResult, ValidatorOptions } from './types';

export type PositiveOptions = ValidatorOptions & {
  /** When true, rejects 0 in addition to negatives. Default false. */
  strict?: boolean;
};

const NON_NEGATIVE_MESSAGE = 'Value must be zero or greater.';
const STRICTLY_POSITIVE_MESSAGE = 'Value must be greater than zero.';

export function positive(value: unknown, options: PositiveOptions = {}): ValidationResult {
  const strict = options.strict ?? false;
  const fallback = strict ? STRICTLY_POSITIVE_MESSAGE : NON_NEGATIVE_MESSAGE;
  const message = options.message ?? fallback;

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { valid: false, message };
  }
  if (value < 0) {
    return { valid: false, message };
  }
  if (strict && value === 0) {
    return { valid: false, message };
  }
  return { valid: true };
}
