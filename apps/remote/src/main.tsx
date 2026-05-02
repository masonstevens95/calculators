import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CalculatorsApp } from './CalculatorsApp';

const root = document.getElementById('root');
if (!root) throw new Error('#root mount point missing from index.html');

createRoot(root).render(
  <StrictMode>
    <CalculatorsApp />
  </StrictMode>,
);
