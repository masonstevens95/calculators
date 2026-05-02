// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ParcelComparisonChart } from '../../src/charts/ParcelComparisonChart';

describe('<ParcelComparisonChart /> smoke', () => {
  it('mounts and renders the chart canvas', () => {
    render(
      <ParcelComparisonChart
        bills={[
          {
            parcel: { name: 'Test', land: 50_000, imp: 200_000 },
            today: 1_500,
            next: 1_400,
            pure: 800,
            delta: -100,
          },
        ]}
      />,
    );
    expect(screen.getByRole('img', { name: /annual tax by parcel/i })).toBeInTheDocument();
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(
      <ParcelComparisonChart bills={[]} />,
    );
    expect(() => unmount()).not.toThrow();
  });
});
