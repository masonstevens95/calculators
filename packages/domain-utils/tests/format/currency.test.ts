import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../src/format/currency';

describe('formatCurrency', () => {
  it('formats a positive number as USD with thousands separators and 2 decimals', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats a negative number with a leading minus inside the symbol', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  it('formats a very large number with full thousand-grouping', () => {
    expect(formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
  });

  it('rounds to 2 decimals by default', () => {
    expect(formatCurrency(0.005)).toMatch(/^\$0\.01$/);
    expect(formatCurrency(0.004)).toBe('$0.00');
  });

  it('respects maximumFractionDigits when supplied', () => {
    expect(formatCurrency(1234.56, { maximumFractionDigits: 0 })).toBe('$1,235');
    expect(formatCurrency(1234.5, { maximumFractionDigits: 0 })).toBe('$1,235');
    expect(formatCurrency(1234, { maximumFractionDigits: 0 })).toBe('$1,234');
  });

  it('returns the placeholder em-dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('returns the placeholder em-dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('returns the placeholder em-dash for NaN', () => {
    expect(formatCurrency(Number.NaN)).toBe('—');
  });

  it('accepts a custom placeholder', () => {
    expect(formatCurrency(null, { placeholder: 'n/a' })).toBe('n/a');
  });
});
