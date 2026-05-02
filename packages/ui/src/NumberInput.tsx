import type { ChangeEvent, InputHTMLAttributes } from 'react';
import styles from './inputs.module.css';

type Base = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
>;

export type NumberInputProps = Base & {
  value: number | '';
  onChange: (value: number | '') => void;
  /** When true, allows decimal entry (default true). */
  allowDecimal?: boolean;
};

export function NumberInput({
  value,
  onChange,
  allowDecimal = true,
  className,
  ...rest
}: NumberInputProps) {
  function handle(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    if (raw === '') {
      onChange('');
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    onChange(parsed);
  }

  return (
    <input
      {...rest}
      type="number"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      step={allowDecimal ? 'any' : 1}
      value={value}
      onChange={handle}
      className={[styles.input, className].filter(Boolean).join(' ')}
    />
  );
}
