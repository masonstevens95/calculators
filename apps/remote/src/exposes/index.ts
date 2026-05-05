// Centralized re-exports for the federation surface. Each entry here maps
// 1:1 to a key in apps/remote/vite.config.ts `federation.exposes`. Listing
// them in one place makes the public surface easy to audit and changes show
// up cleanly in PR diffs.

export { CalculatorsApp } from '../CalculatorsApp';
export { CalculatorsRoutes } from '../CalculatorsRoutes';
export { CalculatorsLoadError } from '../CalculatorsLoadError';

// Per-calc components — host can mount any one without bringing in the
// surrounding shell layouts. Each is the package's default export.
export { default as RuralLandOffer } from 'calc-rural-land-offer';
export { default as LgsDscr } from 'calc-lgs-dscr';
export { default as OlaminaDscr } from 'calc-olamina-dscr';
export { default as Eu5Loan } from 'calc-eu5-loan';
export { default as WinstonSalemLvt } from 'calc-winston-salem-lvt';
export { default as RentSell } from 'calc-rent-sell';
