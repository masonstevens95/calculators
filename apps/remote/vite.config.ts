import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// MF federation plugin is intentionally NOT wired here — added in U10.
// This config is the dev/build setup for the standalone remote.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
