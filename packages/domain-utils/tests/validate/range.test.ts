import { describe, it, expect } from 'vitest';
import { range } from '../../src/validate/range';

describe('range validator', () => {
  it('accepts values within [min, max] inclusive by default', () => {
    expect(range(5, { min: 0, max: 10 })).toEqual({ valid: true });
    expect(range(0, { min: 0, max: 10 })).toEqual({ valid: true });
    expect(range(10, { min: 0, max: 10 })).toEqual({ valid: true });
  });

  it('rejects values below min with a deterministic message', () => {
    expect(range(-1, { min: 0, max: 10 })).toEqual({
      valid: false,
      message: 'Value must be between 0 and 10.',
    });
  });

  it('rejects values above max with a deterministic message', () => {
    expect(range(11, { min: 0, max: 10 })).toEqual({
      valid: false,
      message: 'Value must be between 0 and 10.',
    });
  });

  it('supports min-only or max-only ranges', () => {
    expect(range(100, { min: 0 })).toEqual({ valid: true });
    expect(range(-1, { min: 0 })).toEqual({ valid: false, message: 'Value must be at least 0.' });
    expect(range(-100, { max: 0 })).toEqual({ valid: true });
    expect(range(1, { max: 0 })).toEqual({ valid: false, message: 'Value must be at most 0.' });
  });

  it('rejects non-numeric inputs uniformly', () => {
    expect(range(Number.NaN, { min: 0, max: 10 }).valid).toBe(false);
    expect(range(Number.POSITIVE_INFINITY, { min: 0, max: 10 }).valid).toBe(false);
    expect(range(null as unknown as number, { min: 0, max: 10 }).valid).toBe(false);
    expect(range(undefined as unknown as number, { min: 0, max: 10 }).valid).toBe(false);
    expect(range('5' as unknown as number, { min: 0, max: 10 }).valid).toBe(false);
  });

  it('honors a custom message override', () => {
    expect(range(11, { min: 0, max: 10, message: 'Out of range, friend' })).toEqual({
      valid: false,
      message: 'Out of range, friend',
    });
  });

  it('treats min === max as a single-value range', () => {
    expect(range(5, { min: 5, max: 5 })).toEqual({ valid: true });
    expect(range(4, { min: 5, max: 5 }).valid).toBe(false);
  });
});
