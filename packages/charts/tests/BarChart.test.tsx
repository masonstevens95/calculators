import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BarChart } from '../src/BarChart';

describe('<BarChart /> smoke', () => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ label: 'Series', data: [1, 2, 3] }],
  };

  it('mounts without throwing in jsdom', () => {
    render(<BarChart data={data} ariaLabel="example bar chart" />);
    expect(screen.getByRole('img', { name: 'example bar chart' })).toBeInTheDocument();
  });

  it('renders a canvas with the supplied aria-label', () => {
    const { container } = render(<BarChart data={data} ariaLabel="my bars" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('aria-label', 'my bars');
  });

  it('unmounts cleanly without throwing', () => {
    const { unmount } = render(<BarChart data={data} ariaLabel="x" />);
    expect(() => unmount()).not.toThrow();
  });
});
