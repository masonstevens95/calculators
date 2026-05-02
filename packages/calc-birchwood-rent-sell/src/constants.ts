// Static Birchwood scenario constants — extracted from
// reference/html-originals/Birchwood Rent vs Sell Charts.html.
export const BIRCHWOOD_DEFAULTS = {
  /** Mortgage balance at the analysis epoch. */
  balance: 162_317.07,
  /** Mortgage interest rate (decimal, e.g. 0.0375 = 3.75%). */
  rate: 0.0375,
  /** Monthly P&I payment. */
  monthlyPI: 825.74,
  /** Monthly property tax. */
  taxes: 280,
  /** Monthly landlord insurance. */
  insurance: 275,
  /** Monthly maintenance reserve (1% of home value annualized / 12). */
  maintenance: 254,
  /** Current home value. */
  homeValue: 305_000,
  /** Net proceeds from a sale today (after commission, closing, payoff). */
  netProceeds: 122_858,
  /** Current calendar year (Section 121 timeline). */
  currentYear: 2026,
  /** Vacancy allowance, percent of rent. */
  vacancyPct: 8,
  /** Property-management fee, percent of rent (when managed). */
  managedPct: 9,
} as const;

export type BirchwoodConstants = typeof BIRCHWOOD_DEFAULTS;
