import { Link } from 'react-router-dom';
import { calculators } from '../calculators';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <section className={styles.section} aria-labelledby="home-heading">
      <h1 id="home-heading" className={styles.heading}>
        Calculators
      </h1>
      <p className={styles.lede}>
        A small collection of calculators rebuilt in React. Each one stands alone, embeds inside an
        article, or mounts inside a federated host.
      </p>
      <ul className={styles.list}>
        {calculators.map((calc) => (
          <li key={calc.slug} className={styles.item}>
            <Link to={`/calc/${calc.slug}`} className={styles.itemLink}>
              <span className={styles.itemTitle}>{calc.title}</span>
              <span className={styles.itemBlurb}>{calc.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
