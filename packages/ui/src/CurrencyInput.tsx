import { NumberInput } from './NumberInput';
import type { NumberInputProps } from './NumberInput';
import styles from './inputs.module.css';

export type CurrencyInputProps = Omit<NumberInputProps, 'allowDecimal'>;

/**
 * Visual-currency-prefixed number input. Internally a controlled NumberInput
 * — the value is the raw number (no currency symbol in state). Display
 * formatting via @calc/domain-utils/formatCurrency happens in the result UI,
 * not the input.
 */
export function CurrencyInput({ className, ...rest }: CurrencyInputProps) {
  return (
    <span className={styles.currencyWrapper}>
      <span className={styles.currencySymbol} aria-hidden="true">
        $
      </span>
      <NumberInput
        {...rest}
        allowDecimal={true}
        className={[styles.currencyInput, className].filter(Boolean).join(' ')}
      />
    </span>
  );
}
