import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

// Self-routing variant for direct visit, iframe embed, and the harness app
// (KTD #20). Hosts that already own a router should mount <CalculatorsRoutes />
// instead — see docs/portfolio-integration.md (added in U10).
export function CalculatorsApp() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default CalculatorsApp;
