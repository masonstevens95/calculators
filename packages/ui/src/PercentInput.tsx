import { NumberInput } from './NumberInput';
import type { NumberInputProps } from './NumberInput';
import styles from './inputs.module.css';

export type PercentInputProps = Omit<NumberInputProps, 'allowDecimal'>;

/**
 * Percent input — value semantics are "human percent" (e.g. 12.5 means 12.5%),
 * NOT the 0-1 ratio. The decision to convert to ratio for math lives in the
 * calling domain, so the input contract stays predictable.
 */
export function PercentInput({ className, ...rest }: PercentInputProps) {
  return (
    <span className={styles.percentWrapper}>
      <NumberInput
        {...rest}
        allowDecimal={true}
        className={[styles.percentInput, className].filter(Boolean).join(' ')}
      />
      <span className={styles.percentSymbol} aria-hidden="true">
        %
      </span>
    </span>
  );
}
