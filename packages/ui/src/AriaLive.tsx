import type { ReactNode } from 'react';

export type AriaLiveProps = {
  children: ReactNode;
  /** "polite" (default) waits for a pause; "assertive" interrupts. */
  variant?: 'polite' | 'assertive';
  className?: string;
};

/**
 * Wrap any computed result region in <AriaLive> so screen readers announce
 * updates without authors having to think about live-region semantics
 * per-calc. Tightens R19 per KTD #16.
 */
export function AriaLive({ children, variant = 'polite', className }: AriaLiveProps) {
  return (
    <div aria-live={variant} aria-atomic="true" className={className}>
      {children}
    </div>
  );
}
