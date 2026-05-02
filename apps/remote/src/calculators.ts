// Slug → calc-package metadata. Per-calc components are registered here
// as they ship (U4–U9). The shell uses this list to drive route resolution
// and HomePage discovery — no hardcoding scattered across components.

import type { ComponentType, LazyExoticComponent } from 'react';
import SurryCountyOffer from 'calc-surry-county-offer';
import LgsDscr from 'calc-lgs-dscr';
import OlaminaDscr from 'calc-olamina-dscr';
import Eu5Loan from 'calc-eu5-loan';

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
    slug: 'surry-county-offer',
    title: 'Surry County Offer',
    blurb: 'Estimate offer terms for a Surry County purchase, with PITI and cash-flow charts.',
    Component: SurryCountyOffer,
  },
  {
    slug: 'lgs-dscr',
    title: 'LGS DSCR',
    blurb: 'Debt service coverage ratio for LGS / Nationwide Homes builds.',
    Component: LgsDscr,
  },
  {
    slug: 'olamina-dscr',
    title: 'Olamina DSCR',
    blurb: 'Debt service coverage ratio for Olamina builds, with kit-price addons.',
    Component: OlaminaDscr,
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
  },
  {
    slug: 'birchwood-rent-sell',
    title: 'Birchwood Rent vs Sell',
    blurb: 'Rent-vs-sell scenario analysis with charted comparisons over time.',
  },
] as const;

export function findCalculator(slug: string | undefined): CalcDescriptor | undefined {
  if (!slug) return undefined;
  return calculators.find((c) => c.slug === slug);
}
