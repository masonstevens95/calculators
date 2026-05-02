import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppLayout } from '../../src/layouts/AppLayout';

function renderWithLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<p>home content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('<AppLayout />', () => {
  it('renders semantic header, main, and footer landmarks', () => {
    renderWithLayout();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders <Outlet /> children inside <main>', () => {
    renderWithLayout();
    expect(screen.getByRole('main')).toHaveTextContent('home content');
  });

  it('exposes a skip-link as the first focusable element', async () => {
    renderWithLayout();
    const user = userEvent.setup();
    await user.tab();
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveFocus();
  });
});
