// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PitiChart } from '../../src/charts/PitiChart';

describe('<PitiChart /> smoke', () => {
  it('mounts with a single scenario', () => {
    render(
      <PitiChart
        scenarios={[{ label: 'Default', pi: 2018, tax: 224, ins: 155, pmiMo: 0 }]}
      />,
    );
    expect(screen.getByRole('img', { name: /piti/i })).toBeInTheDocument();
  });

  it('mounts with multiple scenarios and unmounts cleanly', () => {
    const { unmount } = render(
      <PitiChart
        scenarios={[
          { label: 'A', pi: 1000, tax: 100, ins: 50, pmiMo: 0 },
          { label: 'B', pi: 1500, tax: 150, ins: 70, pmiMo: 100 },
        ]}
      />,
    );
    expect(() => unmount()).not.toThrow();
  });
});
