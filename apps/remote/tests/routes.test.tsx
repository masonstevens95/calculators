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

  it('renders chrome-free for direct visit to /embed/:slug (no parent-context detection)', () => {
    // Use a registered & wired slug — every calc renders chrome-free under
    // /embed regardless of how the visitor arrived (no detection).
    renderAt('/embed/birchwood-rent-sell');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /birchwood rent vs sell/i, level: 1 }),
    ).toBeInTheDocument();
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
