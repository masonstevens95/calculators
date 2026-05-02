import styles from './CalculatorsLoadError.module.css';

export type CalculatorsLoadErrorProps = {
  /**
   * Optional error info from the host. Typed `unknown` because callers may pass
   * an Error, a string, an object, or anything else they have on hand.
   *
   * Sanitization contract per KTD #5: this value is rendered as TEXT only.
   * Never via dangerouslySetInnerHTML, never as raw HTML. Host can pass
   * "<script>alert(1)</script>" and it will appear as escaped text in the DOM.
   */
  error?: unknown;
};

function formatError(error: unknown): string | undefined {
  if (error === undefined || error === null) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return String(error);
  } catch {
    return undefined;
  }
}

/**
 * Stable error fallback exposed via Module Federation. The portfolio host
 * renders this when the remote fails to load — it never reaches into the host
 * runtime, never executes script content from the error value, and provides
 * a stable role="alert" for assistive tech and host queries.
 */
export function CalculatorsLoadError({ error }: CalculatorsLoadErrorProps) {
  const detail = formatError(error);
  return (
    <div role="alert" className={styles.container}>
      <h2 className={styles.heading}>We couldn&apos;t load the calculators</h2>
      <p className={styles.body}>
        Try refreshing the page. If the problem continues, the calculators service may be
        temporarily unavailable.
      </p>
      {detail ? <pre className={styles.detail}>{detail}</pre> : null}
    </div>
  );
}

export default CalculatorsLoadError;
