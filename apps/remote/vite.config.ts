import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

// Module Federation 2.0 (KTD #1). Shared deps with trailing-slash patterns
// (KTD #14) so MF resolves react/jsx-runtime through the same React the host
// is using — eliminates the classic "Invalid hook call" double-React bug.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'calculators',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: {
        './CalculatorsApp': './src/CalculatorsApp.tsx',
        './CalculatorsRoutes': './src/CalculatorsRoutes.tsx',
        './CalculatorsLoadError': './src/CalculatorsLoadError.tsx',
        './calc/surry-county-offer': 'calc-surry-county-offer',
        './calc/lgs-dscr': 'calc-lgs-dscr',
        './calc/olamina-dscr': 'calc-olamina-dscr',
        './calc/eu5-loan': 'calc-eu5-loan',
        './calc/winston-salem-lvt': 'calc-winston-salem-lvt',
        './calc/rent-sell': 'calc-rent-sell',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react/': { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom/': { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^7.0.0' },
      },
    }),
  ],
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
