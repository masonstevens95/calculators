// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CashChart } from '../../src/charts/CashChart';

describe('<CashChart /> smoke', () => {
  it('mounts with mixed positive/negative reserves', () => {
    render(
      <CashChart
        scenarios={[
          { label: 'Healthy', reserve: 20_000 },
          { label: 'Tight', reserve: 5_000 },
          { label: 'Short', reserve: -4_375 },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: /final cash reserve/i })).toBeInTheDocument();
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(<CashChart scenarios={[{ label: 'x', reserve: 0 }]} />);
    expect(() => unmount()).not.toThrow();
  });
});
