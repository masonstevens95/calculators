import type { ValidationResult, ValidatorOptions } from './types';

const DEFAULT_MESSAGE = 'This field is required.';

export function required(
  value: unknown,
  options: ValidatorOptions = {},
): ValidationResult {
  const message = options.message ?? DEFAULT_MESSAGE;
  if (value === null || value === undefined) {
    return { valid: false, message };
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { valid: false, message };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, message };
  }
  return { valid: true };
}
