import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import styles from './FormField.module.css';

export type FormFieldProps = {
  label: string;
  /**
   * Render-prop receiving the associated id and aria-describedby for the
   * input, so consumers wire the right attributes onto whatever element
   * they render (NumberInput, native <input>, etc.).
   */
  children: (renderProps: { id: string; describedBy: string | undefined }) => ReactElement;
  hint?: ReactNode;
  error?: ReactNode;
};

export function FormField({ label, children, hint, error }: FormFieldProps) {
  const reactId = useId();
  const inputId = `field-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field} data-invalid={error ? 'true' : undefined}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      {children({ id: inputId, describedBy })}
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
