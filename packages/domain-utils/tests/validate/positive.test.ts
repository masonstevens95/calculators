import { describe, it, expect } from 'vitest';
import { positive } from '../../src/validate/positive';

describe('positive validator', () => {
  it('treats 0 as valid by default (zero is non-negative)', () => {
    expect(positive(0)).toEqual({ valid: true });
  });

  it('treats positive numbers as valid', () => {
    expect(positive(1)).toEqual({ valid: true });
    expect(positive(0.001)).toEqual({ valid: true });
    expect(positive(1_000_000)).toEqual({ valid: true });
  });

  it('rejects negative numbers with a deterministic message', () => {
    expect(positive(-1)).toEqual({
      valid: false,
      message: 'Value must be zero or greater.',
    });
    expect(positive(-0.0001)).toEqual({
      valid: false,
      message: 'Value must be zero or greater.',
    });
  });

  it('rejects NaN, Infinity, -Infinity, null, undefined', () => {
    expect(positive(Number.NaN).valid).toBe(false);
    expect(positive(Number.POSITIVE_INFINITY).valid).toBe(false);
    expect(positive(Number.NEGATIVE_INFINITY).valid).toBe(false);
    expect(positive(null as unknown as number).valid).toBe(false);
    expect(positive(undefined as unknown as number).valid).toBe(false);
  });

  it('honors strict: true to reject zero', () => {
    expect(positive(0, { strict: true })).toEqual({
      valid: false,
      message: 'Value must be greater than zero.',
    });
    expect(positive(1, { strict: true })).toEqual({ valid: true });
  });

  it('honors a custom message', () => {
    expect(positive(-1, { message: 'No negatives allowed' })).toEqual({
      valid: false,
      message: 'No negatives allowed',
    });
  });
});
