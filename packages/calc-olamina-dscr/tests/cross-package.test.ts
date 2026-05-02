// @vitest-environment node
//
// Cross-package agreement test per the U6 plan: validates that the
// shared formula (monthlyPayment) AND the per-home pitia computation
// agree numerically between calc-lgs-dscr and calc-olamina-dscr for
// inputs where neither package's catalog-specific logic differs (i.e.
// when each package is given an identically-priced home).
//
// Per KTD #4 the two packages have independently-typed math; this test
// is the drift sentinel — failure here means one of the two has a bug.

import { describe, it, expect } from 'vitest';
import { monthlyPayment as olaminaMP, computePerHome as olaminaPerHome } from '../src/domain';
import { monthlyPayment as lgsMP, computePerHome as lgsPerHome } from 'calc-lgs-dscr';

describe('cross-package monthlyPayment agreement (KTD #4 drift sentinel)', () => {
  const cases = [
    { p: 100_000, r: 6, n: 30 },
    { p: 250_000, r: 7.25, n: 30 },
    { p: 311_250, r: 6.75, n: 30 },
    { p: 500_000, r: 5, n: 15 },
    { p: 1_000_000, r: 0, n: 30 },
    { p: 75_000, r: 4.125, n: 20 },
  ];

  for (const c of cases) {
    it(`monthlyPayment agrees on $${c.p} @ ${c.r}% for ${c.n}yr`, () => {
      expect(olaminaMP(c.p, c.r, c.n)).toBeCloseTo(lgsMP(c.p, c.r, c.n), 6);
    });
  }
});

describe('cross-package per-home pitia agreement on equal-cost synthetic input', () => {
  // We pick a single Olamina ADU and a single LGS SFH whose totalCost
  // we pin equal via buildOverride; we then expect pitia to match
  // (since the formula is identical and the kit/module discount cancels
  // when we compute a known totalCost).
  it('produces identical pitia given an identical totalCost across packages', () => {
    // Olamina: seed_studio kit plus = 94000; default build = 25000;
    // discounted (5%) = 89300; total per home = 89300 + 25000 + 0/1 = 114300
    const olamina = olaminaPerHome(
      { modelId: 'seed_studio' },
      {
        homes: [{ modelId: 'seed_studio' }],
        ratePct: 7,
        downPct: 20,
        dscrTarget: 1.25,
        termYears: 30,
        discountPct: 5,
        infraTotal: 0,
        taxRatePct: 1.0,
        insRatePct: 0.35,
        reserveMonths: 6,
        origFeePct: 1,
        otherClosing: 12_000,
        kitTier: 'plus',
      },
    );
    expect(olamina).toBeDefined();
    if (!olamina) return;

    // LGS: pin via buildOverride to land the same totalCost.
    // farmhouse_v_cape modulePrice = 221760 → discounted (5%) = 210672.
    // Need totalCost = 114300; build override = 114300 - 210672 - 0 < 0 → can't.
    // Use a higher Olamina target: total ≈ 250000. Re-target by setting
    // Olamina to umbra_2br_xl (kitMax 205000 since kitPlus null) with
    // discount=0 and build=45000 → total = 250000.
    const olamina2 = olaminaPerHome(
      { modelId: 'umbra_2br_xl' },
      {
        homes: [{ modelId: 'umbra_2br_xl' }],
        ratePct: 7,
        downPct: 20,
        dscrTarget: 1.25,
        termYears: 30,
        discountPct: 0,
        infraTotal: 0,
        taxRatePct: 1.0,
        insRatePct: 0.35,
        reserveMonths: 6,
        origFeePct: 1,
        otherClosing: 12_000,
        kitTier: 'plus',
      },
    );
    expect(olamina2).toBeDefined();
    if (!olamina2) return;

    const lgs = lgsPerHome(
      // farmhouse_v_cape modulePrice 221760, discount 0 → 221760
      // need build to pin totalCost to olamina2.totalCost → build = total - 221760
      { modelId: 'farmhouse_v_cape', buildOverride: olamina2.totalCost - 221_760 },
      {
        homes: [{ modelId: 'farmhouse_v_cape' }],
        ratePct: 7,
        downPct: 20,
        dscrTarget: 1.25,
        termYears: 30,
        discountPct: 0,
        infraTotal: 0,
        taxRatePct: 1.0,
        insRatePct: 0.35,
        reserveMonths: 6,
        origFeePct: 1,
        otherClosing: 12_000,
      },
    );
    expect(lgs).toBeDefined();
    if (!lgs) return;

    expect(lgs.totalCost).toBeCloseTo(olamina2.totalCost, 4);
    expect(lgs.pi).toBeCloseTo(olamina2.pi, 6);
    expect(lgs.tax).toBeCloseTo(olamina2.tax, 6);
    expect(lgs.ins).toBeCloseTo(olamina2.ins, 6);
    expect(lgs.pitia).toBeCloseTo(olamina2.pitia, 6);
    expect(lgs.rentNeeded).toBeCloseTo(olamina2.rentNeeded, 6);
  });
});
