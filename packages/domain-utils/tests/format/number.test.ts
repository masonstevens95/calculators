import { describe, it, expect } from 'vitest';
import { formatNumber } from '../../src/format/number';

describe('formatNumber', () => {
  it('formats whole numbers with US thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats decimals with default 0 fractionDigits (rounds)', () => {
    expect(formatNumber(1234.56)).toBe('1,235');
    expect(formatNumber(1234.49)).toBe('1,234');
  });

  it('respects fractionDigits override', () => {
    expect(formatNumber(1234.5, { fractionDigits: 2 })).toBe('1,234.50');
    expect(formatNumber(1234.567, { fractionDigits: 3 })).toBe('1,234.567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(0, { fractionDigits: 2 })).toBe('0.00');
  });

  it('handles negatives', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });

  it('returns the placeholder em-dash for null/undefined/NaN', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber(Number.NaN)).toBe('—');
  });

  it('accepts a custom placeholder', () => {
    expect(formatNumber(undefined, { placeholder: '?' })).toBe('?');
  });
});
