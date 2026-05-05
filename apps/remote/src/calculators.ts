// Slug → calc-package metadata. Per-calc components are registered here
// as they ship (U4–U9). The shell uses this list to drive route resolution
// and HomePage discovery — no hardcoding scattered across components.

import type { ComponentType, LazyExoticComponent } from 'react';
import RuralLandOffer from 'calc-rural-land-offer';
import ModularHomeDscr from 'calc-modular-home-dscr';
import Eu5Loan from 'calc-eu5-loan';
import WinstonSalemLvt from 'calc-winston-salem-lvt';
import RentSell from 'calc-rent-sell';

export type CalcDescriptor = {
  slug: string;
  title: string;
  blurb: string;
  /** When undefined, the slug renders as a placeholder pending its U-ID. */
  Component?: ComponentType | LazyExoticComponent<ComponentType>;
};

// U2 lands the slugs as placeholders; U4–U9 wire the real components.
export const calculators: readonly CalcDescriptor[] = [
  {
    slug: 'rural-land-offer',
    title: 'Rural Land Offer',
    blurb: 'Estimate offer terms for a rural property purchase, with PITI and cash-flow charts.',
    Component: RuralLandOffer,
  },
  {
    slug: 'modular-home-dscr',
    title: 'Modular Home DSCR',
    blurb: 'Debt service coverage ratio for modular-home build portfolios across Nationwide Homes and Momohomes.',
    Component: ModularHomeDscr,
  },
  {
    slug: 'eu5-loan',
    title: 'EU5 Loan Break-Even',
    blurb: 'Break-even and net-profit-over-time analysis for an EU5 loan scenario.',
    Component: Eu5Loan,
  },
  {
    slug: 'winston-salem-lvt',
    title: 'Winston-Salem LVT',
    blurb: 'Land Value Tax modelling: per-parcel bills under different split ratios.',
    Component: WinstonSalemLvt,
  },
  {
    slug: 'rent-sell',
    title: 'Rent vs Sell',
    blurb: 'Rent-vs-sell scenario analysis with charted comparisons over time.',
    Component: RentSell,
  },
] as const;

export function findCalculator(slug: string | undefined): CalcDescriptor | undefined {
  if (!slug) return undefined;
  return calculators.find((c) => c.slug === slug);
}
