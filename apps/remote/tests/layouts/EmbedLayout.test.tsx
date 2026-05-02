import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { EmbedLayout } from '../../src/layouts/EmbedLayout';

describe('<EmbedLayout />', () => {
  function renderWithLayout() {
    return render(
      <MemoryRouter initialEntries={['/embed/surry-county-offer']}>
        <Routes>
          <Route element={<EmbedLayout />}>
            <Route path="/embed/:slug" element={<p>embedded content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders only its outlet children — no banner, no contentinfo, no app navigation', () => {
    renderWithLayout();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('still wraps content in a <main> landmark for screen-reader navigation', () => {
    renderWithLayout();
    expect(screen.getByRole('main')).toHaveTextContent('embedded content');
  });
});
