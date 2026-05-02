import { describe, it, expect } from 'vitest';
import { formatPercent } from '../../src/format/percent';

describe('formatPercent', () => {
  it('formats 0.125 as "12.5%" with 1dp by default', () => {
    expect(formatPercent(0.125)).toBe('12.5%');
  });

  it('formats integer ratios cleanly', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('respects fractionDigits override', () => {
    expect(formatPercent(0.123456, { fractionDigits: 0 })).toBe('12%');
    expect(formatPercent(0.123456, { fractionDigits: 3 })).toBe('12.346%');
  });

  it('handles negative ratios', () => {
    expect(formatPercent(-0.05)).toBe('-5.0%');
  });

  it('returns the placeholder em-dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('returns the placeholder em-dash for undefined', () => {
    expect(formatPercent(undefined)).toBe('—');
  });

  it('returns the placeholder em-dash for NaN', () => {
    expect(formatPercent(Number.NaN)).toBe('—');
  });

  it('accepts a custom placeholder', () => {
    expect(formatPercent(undefined, { placeholder: 'n/a' })).toBe('n/a');
  });
});
