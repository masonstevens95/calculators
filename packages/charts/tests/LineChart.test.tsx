import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LineChart } from '../src/LineChart';

describe('<LineChart /> smoke', () => {
  const data = {
    labels: ['2020', '2021', '2022'],
    datasets: [{ label: 'Net', data: [10, 12, 14] }],
  };

  it('mounts without throwing in jsdom', () => {
    render(<LineChart data={data} ariaLabel="example line" />);
    expect(screen.getByRole('img', { name: 'example line' })).toBeInTheDocument();
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(<LineChart data={data} ariaLabel="x" />);
    expect(() => unmount()).not.toThrow();
  });
});
