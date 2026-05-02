import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Per KTD #21: harness consumes apps/remote as a workspace package
// using the package's "exports" field. vite-tsconfig-paths plus the
// default Vite source-condition resolution lets TS sources be imported
// directly without a build step on the remote side.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    open: false,
  },
  resolve: {
    // Make pnpm-symlinked workspace deps resolve cleanly through Vite.
    preserveSymlinks: false,
  },
});
