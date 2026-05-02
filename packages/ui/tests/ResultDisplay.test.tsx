import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultDisplay } from '../src/ResultDisplay';

describe('<ResultDisplay />', () => {
  it('renders label and value with semantic dl/dt/dd', () => {
    const { container } = render(<ResultDisplay label="Monthly payment" value="$1,234.56" />);
    expect(container.querySelector('dl')).not.toBeNull();
    expect(container.querySelector('dt')).toHaveTextContent('Monthly payment');
    expect(container.querySelectorAll('dd')[0]).toHaveTextContent('$1,234.56');
  });

  it('renders an optional detail line as a second dd', () => {
    const { container } = render(
      <ResultDisplay label="Total" value="$10,000" detail="Includes fees" />,
    );
    const dds = container.querySelectorAll('dd');
    expect(dds).toHaveLength(2);
    expect(dds[1]).toHaveTextContent('Includes fees');
  });

  it('exposes data-emphasis="primary" when emphasis="primary"', () => {
    const { container } = render(
      <ResultDisplay label="DSCR" value="1.32" emphasis="primary" />,
    );
    expect(container.querySelector('[data-emphasis="primary"]')).not.toBeNull();
  });

  it('renders ReactNode values (e.g., spans for inline emphasis)', () => {
    render(<ResultDisplay label="x" value={<span>special</span>} />);
    expect(screen.getByText('special')).toBeInTheDocument();
  });
});
