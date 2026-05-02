import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { EmbedLayout } from './layouts/EmbedLayout';
import { HomePage } from './pages/HomePage';
import { CalcPagePlaceholder } from './pages/CalcPagePlaceholder';
import { NotFoundPage } from './pages/NotFoundPage';
import { findCalculator } from './calculators';

// Wraps the placeholder render with an unknown-slug check so route resolution
// always lands on NotFoundPage for slugs that aren't in the registry — this
// applies under both AppLayout and EmbedLayout.
function CalcOrNotFound() {
  const { slug } = useParams<{ slug: string }>();
  if (!findCalculator(slug)) {
    return <NotFoundPage />;
  }
  return <CalcPagePlaceholder />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/calc/:slug" element={<CalcOrNotFound />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<EmbedLayout />}>
        <Route path="/embed/:slug" element={<CalcOrNotFound />} />
      </Route>
      <Route path="/calc" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
