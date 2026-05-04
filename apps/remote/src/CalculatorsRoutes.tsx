import '@calc/ui/theme.css';
import { AppRoutes } from './routes';

// Router-less variant for federated hosts that already provide a router (KTD #20).
// The host renders this beneath its own <BrowserRouter> / <Routes> and the calc
// routes mount as siblings of host routes.
export function CalculatorsRoutes() {
  return <AppRoutes />;
}

export default CalculatorsRoutes;
