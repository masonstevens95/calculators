import { useParams, Link } from 'react-router-dom';
import { findCalculator } from '../calculators';

export function CalcPagePlaceholder() {
  const { slug } = useParams<{ slug: string }>();
  const calc = findCalculator(slug);

  if (!calc) {
    // routes.tsx wraps this with a NotFound check too, but defending in depth
    // keeps the placeholder honest if it's mounted directly.
    return (
      <section aria-labelledby="placeholder-heading">
        <h1 id="placeholder-heading">Not found</h1>
        <p>
          No calculator is registered for slug <code>{slug}</code>.
        </p>
        <p>
          <Link to="/">Return to the calculator index</Link>
        </p>
      </section>
    );
  }

  if (calc.Component) {
    const Component = calc.Component;
    return <Component />;
  }

  return (
    <section aria-labelledby="placeholder-heading">
      <h1 id="placeholder-heading">{calc.title}</h1>
      <p>{calc.blurb}</p>
      <p>
        <em>
          Calculator <code>{calc.slug}</code> is registered but not yet wired. Tracked in the
          plan&apos;s implementation units U4&ndash;U9.
        </em>
      </p>
    </section>
  );
}
