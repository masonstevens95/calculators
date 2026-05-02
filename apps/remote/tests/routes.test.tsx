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

  it('renders the wired calc under AppLayout for "/calc/:slug" (Surry County)', () => {
    renderAt('/calc/surry-county-offer');
    // Chrome present: AppLayout banner + contentinfo
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    // Real Surry County calc heading rendered
    expect(
      screen.getByRole('heading', { name: /surry county offer/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the wired calc under EmbedLayout for "/embed/:slug" (chrome-free)', () => {
    renderAt('/embed/surry-county-offer');
    // Chrome absent: no AppLayout banner / contentinfo
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    // Calc itself still rendered
    expect(
      screen.getByRole('heading', { name: /surry county offer/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders a placeholder under AppLayout for an unwired slug', () => {
    renderAt('/calc/eu5-loan');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    // Placeholder echoes the slug while wiring is pending its U-ID
    expect(screen.getByText(/eu5-loan/)).toBeInTheDocument();
  });

  it('renders chrome-free for direct visit to /embed/:slug (no parent-context detection)', () => {
    // Same as the case above — explicitly captures the "no detection" intent.
    // Use an unwired slug so the placeholder slug-echo is observable.
    renderAt('/embed/eu5-loan');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByText(/eu5-loan/)).toBeInTheDocument();
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
