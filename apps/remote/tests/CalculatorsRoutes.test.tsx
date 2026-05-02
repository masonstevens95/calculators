import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { CalculatorsRoutes } from '../src/CalculatorsRoutes';

describe('<CalculatorsRoutes /> — federated-host integration shape', () => {
  it('renders correctly when nested under a host-supplied router (no self-wrap)', () => {
    // Simulates a portfolio host that owns the BrowserRouter.
    render(
      <MemoryRouter initialEntries={['/']}>
        <CalculatorsRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /calculators/i })).toBeInTheDocument();
  });

  it('composes inside host <Routes> without throwing the "<Router> inside <Router>" error', () => {
    // The host might also nest us via its own <Routes>; we should still resolve.
    render(
      <MemoryRouter initialEntries={['/calc/surry-county-offer']}>
        <Routes>
          <Route path="/*" element={<CalculatorsRoutes />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/surry-county-offer/)).toBeInTheDocument();
  });
});
