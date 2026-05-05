import { useMemo, useState } from 'react';
import { AriaLive, FormField, NumberInput, ResultDisplay } from '@calc/ui';
import { formatCurrency } from '@calc/domain-utils';
import { computeRentSell } from './domain';
import type { RentSellInputs } from './domain';
import { CashflowChart, WealthChart, SensitivityChart } from './charts/RentVsSellCharts';
import styles from './Component.module.css';

const DEFAULT_INPUTS: RentSellInputs = {
  rent: 2000,
  managed: false,
  appRate: 0.02,
  invRate: 0.07,
  moveoutYear: 2026,
};

export function RentSellComponent() {
  const [inputs, setInputs] = useState<RentSellInputs>(DEFAULT_INPUTS);

  const computation = useMemo(() => computeRentSell(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Rent vs Sell</h1>
        <p role="alert">Some inputs are invalid. Adjust and try again.</p>
      </section>
    );
  }

  const r = computation.result;

  return (
    <section className={styles.layout} aria-labelledby="rent-sell-heading">
      <div className={styles.header}>
        <h1 id="rent-sell-heading" className={styles.heading}>
          Rent vs Sell
        </h1>
        <p className={styles.subtitle}>
          You own a home you no longer plan to live in. Should you rent it out for the long-term
          cash flow and equity growth, or sell now and invest the proceeds? Tune the inputs to
          your property and the calculator compares both paths over a 10-year horizon — including
          the IRS Section 121 capital-gains exclusion deadline.
        </p>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Inputs</h2>
        <div className={styles.inputGrid}>
          <FormField label="Monthly rent">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.rent}
                onChange={(v) => setInputs((prev) => ({ ...prev, rent: v === '' ? 0 : v }))}
              />
            )}
          </FormField>
          <FormField label="Management mode">
            {({ id }) => (
              <select
                id={id}
                value={inputs.managed ? 'managed' : 'self'}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, managed: e.target.value === 'managed' }))
                }
                className={styles.select}
              >
                <option value="self">Self-managed</option>
                <option value="managed">Managed (9%)</option>
              </select>
            )}
          </FormField>
          <FormField label="Annual appreciation (decimal)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.appRate}
                onChange={(v) => setInputs((prev) => ({ ...prev, appRate: v === '' ? 0 : v }))}
              />
            )}
          </FormField>
          <FormField label="Annual investment return (decimal)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.invRate}
                onChange={(v) => setInputs((prev) => ({ ...prev, invRate: v === '' ? 0 : v }))}
              />
            )}
          </FormField>
          <FormField label="Move-out year">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.moveoutYear}
                onChange={(v) =>
                  setInputs((prev) => ({ ...prev, moveoutYear: v === '' ? 2026 : v }))
                }
                allowDecimal={false}
              />
            )}
          </FormField>
        </div>
      </section>

      <AriaLive className={styles.results}>
        <h2 className={styles.sectionHeading}>Stats</h2>
        <div className={styles.statsGrid}>
          <ResultDisplay
            label={`Net cash flow at $${inputs.rent.toLocaleString()} rent`}
            value={`${r.monthlyCashflow >= 0 ? '+' : ''}${formatCurrency(r.monthlyCashflow, { maximumFractionDigits: 0 })}/mo`}
            emphasis="primary"
            detail={inputs.managed ? 'managed' : 'self-managed'}
          />
          <ResultDisplay
            label="Break-even rent"
            value={`${formatCurrency(r.breakEvenRent, { maximumFractionDigits: 0 })}/mo`}
            detail={inputs.managed ? 'managed 9%' : 'self-managed'}
          />
          <ResultDisplay
            label={r.rentBeatsSellAt10 ? 'Rent ahead at year 10' : 'Sell ahead at year 10'}
            value={formatCurrency(Math.abs(r.rentVsSellAt10Delta), { maximumFractionDigits: 0 })}
            detail={`${(inputs.appRate * 100).toFixed(1)}% app / ${(inputs.invRate * 100).toFixed(1)}% inv`}
          />
          <ResultDisplay
            label="Fixed carrying costs"
            value={`${formatCurrency(r.fixedCarrying, { maximumFractionDigits: 0 })}/mo`}
            detail="P+I, taxes, insurance, maintenance"
          />
        </div>

        <h2 className={styles.sectionHeading}>Cash Flow vs Rent</h2>
        <div className={styles.chartWrap}>
          <CashflowChart points={r.cashflowVsRent} />
        </div>

        <h2 className={styles.sectionHeading}>Wealth Over 10 Years</h2>
        <div className={styles.chartWrap}>
          <WealthChart points={r.wealthOverTime} />
        </div>

        <h2 className={styles.sectionHeading}>Sensitivity to Appreciation Rate</h2>
        <div className={styles.chartWrap}>
          <SensitivityChart points={r.sensitivity} />
        </div>

        <h2 className={styles.sectionHeading}>Section 121 Capital-Gains Window</h2>
        <div className={styles.s121} data-urgency={r.section121.urgency}>
          <p className={styles.s121Lead}>
            Move out <strong>{r.section121.moveoutYear}</strong> → sell by{' '}
            <strong className={styles.deadline}>{r.section121.deadlineYear}</strong> to exclude up
            to $250k in capital gains (single filer).
          </p>
          <div className={styles.timelineTrack}>
            <div
              className={styles.timelineFill}
              style={{ width: `${r.section121.progressPct}%` }}
            />
          </div>
          <p className={styles.s121Msg}>{r.section121.message}</p>
        </div>
      </AriaLive>
    </section>
  );
}

export default RentSellComponent;
