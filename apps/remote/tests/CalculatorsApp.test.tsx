import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalculatorsApp } from '../src/CalculatorsApp';

describe('<CalculatorsApp />', () => {
  it('mounts without requiring an external router (self-wraps BrowserRouter)', () => {
    // No <MemoryRouter> here on purpose — verifies the self-routing contract per KTD #20.
    render(<CalculatorsApp />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /calculators/i })).toBeInTheDocument();
  });
});
