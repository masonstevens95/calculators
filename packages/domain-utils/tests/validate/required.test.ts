import { describe, it, expect } from 'vitest';
import { required } from '../../src/validate/required';

describe('required validator', () => {
  it('accepts non-empty strings as valid', () => {
    expect(required('hello')).toEqual({ valid: true });
    expect(required('0')).toEqual({ valid: true });
    expect(required(' x ')).toEqual({ valid: true });
  });

  it('accepts non-NaN finite numbers as valid (including zero)', () => {
    expect(required(0)).toEqual({ valid: true });
    expect(required(-1)).toEqual({ valid: true });
    expect(required(42)).toEqual({ valid: true });
  });

  it('rejects null with a deterministic message', () => {
    expect(required(null)).toEqual({ valid: false, message: 'This field is required.' });
  });

  it('rejects undefined with the same message', () => {
    expect(required(undefined)).toEqual({ valid: false, message: 'This field is required.' });
  });

  it('rejects empty string and whitespace-only string', () => {
    expect(required('')).toEqual({ valid: false, message: 'This field is required.' });
    expect(required('   ')).toEqual({ valid: false, message: 'This field is required.' });
  });

  it('rejects NaN', () => {
    expect(required(Number.NaN)).toEqual({ valid: false, message: 'This field is required.' });
  });

  it('honors a custom message when supplied', () => {
    expect(required(null, { message: 'Pick one' })).toEqual({
      valid: false,
      message: 'Pick one',
    });
  });
});
