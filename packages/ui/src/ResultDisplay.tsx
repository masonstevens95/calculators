import type { ReactNode } from 'react';
import styles from './ResultDisplay.module.css';

export type ResultDisplayProps = {
  label: string;
  value: ReactNode;
  /** Highlight tier — affects visual emphasis only. */
  emphasis?: 'normal' | 'primary';
  /** Optional secondary line under the value. */
  detail?: ReactNode;
};

export function ResultDisplay({ label, value, emphasis = 'normal', detail }: ResultDisplayProps) {
  return (
    <dl className={styles.row} data-emphasis={emphasis}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
      {detail ? <dd className={styles.detail}>{detail}</dd> : null}
    </dl>
  );
}
