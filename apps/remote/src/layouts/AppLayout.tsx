import { Link, Outlet } from 'react-router-dom';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <>
      <a href="#main" className={styles.skipLink}>
        Skip to main content
      </a>
      <header className={styles.header} role="banner">
        <div className={styles.brand}>
          <Link to="/" className={styles.brandLink}>
            Calculators
          </Link>
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={styles.footer} role="contentinfo">
        <small>Open-source calculators &middot; <Link to="/">Home</Link></small>
      </footer>
    </>
  );
}
