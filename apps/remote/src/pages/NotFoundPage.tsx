import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Not found</h1>
      <p>The page you requested doesn&apos;t exist.</p>
      <p>
        <Link to="/">Return to the calculator index</Link>
      </p>
    </section>
  );
}
