import { Outlet } from 'react-router-dom';
import styles from './EmbedLayout.module.css';

export function EmbedLayout() {
  return (
    <main className={styles.main}>
      <Outlet />
    </main>
  );
}
