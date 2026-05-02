import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AriaLive } from '../src/AriaLive';

describe('<AriaLive />', () => {
  it('wraps children in a polite live region by default', () => {
    render(<AriaLive>Result: 42</AriaLive>);
    const region = screen.getByText(/Result: 42/);
    const live = region.closest('[aria-live]');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveAttribute('aria-atomic', 'true');
  });

  it('switches to an assertive live region when variant="assertive"', () => {
    render(<AriaLive variant="assertive">Critical update</AriaLive>);
    const region = screen.getByText(/Critical update/).closest('[aria-live]');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('forwards a className for layout integration', () => {
    const { container } = render(<AriaLive className="my-results">x</AriaLive>);
    expect(container.querySelector('.my-results')).not.toBeNull();
  });
});
