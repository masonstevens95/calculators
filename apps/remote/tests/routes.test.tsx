import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { CalculatorsRoutes } from '../src/CalculatorsRoutes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CalculatorsRoutes />
    </MemoryRouter>,
  );
}

describe('routes — layout selection per URL', () => {
  it('renders HomePage under AppLayout for "/"', () => {
    renderAt('/');
    // AppLayout renders <header>; HomePage announces itself
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /calculators/i })).toBeInTheDocument();
  });

  it('renders CalcPagePlaceholder under AppLayout for "/calc/:slug"', () => {
    renderAt('/calc/surry-county-offer');
    // Chrome present: header + footer
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    // Slug echoed
    expect(screen.getByText(/surry-county-offer/)).toBeInTheDocument();
  });

  it('renders CalcPagePlaceholder under EmbedLayout for "/embed/:slug"', () => {
    renderAt('/embed/surry-county-offer');
    // Chrome absent: no banner, no contentinfo
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    // Slug still rendered
    expect(screen.getByText(/surry-county-offer/)).toBeInTheDocument();
  });

  it('renders chrome-free for direct visit to /embed/:slug (no parent-context detection)', () => {
    // Same as the case above — explicitly captures the "no detection" intent.
    renderAt('/embed/lgs-dscr');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByText(/lgs-dscr/)).toBeInTheDocument();
  });

  it('renders NotFoundPage for an unknown /calc/:slug', () => {
    renderAt('/calc/this-slug-does-not-exist');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage for an unknown /embed/:slug', () => {
    renderAt('/embed/this-slug-does-not-exist');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage for an unmatched top-level path', () => {
    renderAt('/totally-unknown');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
