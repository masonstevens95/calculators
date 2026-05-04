import { useMemo, useState } from 'react';
import {
  AriaLive,
  CurrencyInput,
  FormField,
  NumberInput,
  PercentInput,
  ResultDisplay,
} from '@calc/ui';
import { formatCurrency, formatNumber, formatPercent } from '@calc/domain-utils';
import { computeEu5 } from './domain';
import type { Eu5Inputs, RateType, Verdict } from './domain';
import styles from './Component.module.css';

const DEFAULT_INPUTS: Eu5Inputs = {
  cost: 200,
  loanAmount: 10_000,
  ratePct: 10,
  rateType: 'annual',
  months: 60,
  profit3yr: 50,
  savings: 3,
  compoundAnnual: 1.05,
  horizonYears: 20,
  gift: 0,
};

const VERDICT_COPY: Record<Verdict, { icon: string; title: string }> = {
  'no-input': { icon: '⚠️', title: 'Enter expected 3-year profit' },
  strong: { icon: '✦', title: 'Strong — borrow aggressively' },
  viable: { icon: '✓', title: 'Viable — loan pays off within term' },
  marginal: { icon: '~', title: 'Marginal — profitable long-term only' },
  'not-worth-it': { icon: '✗', title: 'Not worth it at this rate' },
};

function fmtMonths(months: number): string {
  if (!Number.isFinite(months)) return '∞';
  if (months < 60) return `${Math.round(months)} mo`;
  return `${(months / 12).toFixed(1)} yrs`;
}

export function Eu5LoanComponent() {
  const [inputs, setInputs] = useState<Eu5Inputs>(DEFAULT_INPUTS);

  function setField<K extends keyof Eu5Inputs>(key: K) {
    return (next: number | '') => {
      setInputs((prev) => ({ ...prev, [key]: next === '' ? 0 : next }));
    };
  }

  const computation = useMemo(() => computeEu5(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>EU5 Loan Break-Even</h1>
        <p role="alert">Some inputs are invalid. Adjust and try again.</p>
      </section>
    );
  }

  const r = computation.result;
  const verdict = VERDICT_COPY[r.verdict];

  return (
    <section className={styles.layout} aria-labelledby="eu5-heading">
      <div className={styles.header}>
        <h1 id="eu5-heading" className={styles.heading}>
          EU5 Loan Break-Even
        </h1>
        <p className={styles.subtitle}>
          Decide whether borrowing for a building beats waiting and saving — across an income horizon.
        </p>
      </div>

      <div className={styles.inputGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Loan</h2>
          <FormField label="Loan amount (g)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.loanAmount}
                onChange={setField('loanAmount')}
              />
            )}
          </FormField>
          <FormField label="Building cost (g)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.cost}
                onChange={setField('cost')}
              />
            )}
          </FormField>
          <FormField label="Interest rate (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.ratePct}
                onChange={setField('ratePct')}
              />
            )}
          </FormField>
          <FormField label="Rate type">
            {({ id }) => (
              <select
                id={id}
                value={inputs.rateType}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, rateType: e.target.value as RateType }))
                }
                className={styles.select}
              >
                <option value="annual">Annual</option>
                <option value="total">Total over term</option>
              </select>
            )}
          </FormField>
          <FormField label="Loan term (months)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.months}
                onChange={setField('months')}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Gift / tranche (g)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.gift}
                onChange={setField('gift')}
              />
            )}
          </FormField>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Building Income</h2>
          <FormField label="3-year cumulative profit (g)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.profit3yr}
                onChange={setField('profit3yr')}
              />
            )}
          </FormField>
          <FormField label="Annual income compounding (×)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.compoundAnnual}
                onChange={setField('compoundAnnual')}
              />
            )}
          </FormField>
          <FormField label="Monthly savings rate (g)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.savings}
                onChange={setField('savings')}
              />
            )}
          </FormField>
          <FormField label="Horizon (years)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.horizonYears}
                onChange={setField('horizonYears')}
                allowDecimal={false}
              />
            )}
          </FormField>
        </section>
      </div>

      <AriaLive className={styles.results}>
        <div className={styles.verdict} data-verdict={r.verdict}>
          <span className={styles.verdictIcon}>{verdict.icon}</span>
          <strong>{verdict.title}</strong>
        </div>

        <h2 className={styles.sectionHeading}>Loan Stats</h2>
        <div className={styles.statsGrid}>
          <ResultDisplay label="Effective rate" value={formatPercent(r.effectiveRatePct / 100)} />
          <ResultDisplay label="Real total cost" value={formatCurrency(r.realCost)} />
          <ResultDisplay label="Usable capital" value={formatCurrency(r.usableCapital)} />
          <ResultDisplay label="Effective interest" value={formatCurrency(r.effectiveInterest)} />
          <ResultDisplay
            label="Break-even income/mo"
            value={formatCurrency(r.breakEvenMin, { maximumFractionDigits: 2 })}
          />
          <ResultDisplay label="Payback period" value={fmtMonths(r.paybackMonths)} />
          <ResultDisplay
            label={`ROI at ${fmtMonths(inputs.months)}`}
            value={`${r.roiAtLoanPct >= 0 ? '+' : ''}${formatNumber(r.roiAtLoanPct)}%`}
          />
          <ResultDisplay
            label={`ROI at ${inputs.horizonYears} yr horizon`}
            value={`${r.roiAtHorizonPct >= 0 ? '+' : ''}${formatNumber(r.roiAtHorizonPct)}%`}
          />
        </div>

        <h2 className={styles.sectionHeading}>Net Profit Over Time</h2>
        <div className={styles.scrollX}>
          <table className={styles.horizonTable}>
            <thead>
              <tr>
                <th>Horizon</th>
                <th>Income</th>
                <th>Interest</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {r.horizonTable.map((row) => (
                <tr key={row.months} data-status={row.status}>
                  <td>{fmtMonths(row.months)}</td>
                  <td>{formatCurrency(row.income, { maximumFractionDigits: 1 })}</td>
                  <td>-{formatCurrency(row.interest, { maximumFractionDigits: 1 })}</td>
                  <td className={row.net >= 0 ? styles.pos : styles.neg}>
                    {row.net >= 0 ? '+' : ''}
                    {formatCurrency(row.net, { maximumFractionDigits: 1 })}
                  </td>
                  <td>
                    {row.status === 'profitable'
                      ? '✓ Profitable'
                      : row.status === 'breakeven'
                        ? '~ Break-even'
                        : '✗ Loss'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className={styles.sectionHeading}>Wait vs Borrow</h2>
        <div className={styles.compareGrid}>
          <div
            className={[styles.compareOption, r.borrowBetter ? styles.winner : ''].join(' ')}
          >
            <h3>Borrow now</h3>
            <ResultDisplay
              label={`Income over ${inputs.horizonYears} yrs`}
              value={formatCurrency(r.borrowTotalIncome, { maximumFractionDigits: 1 })}
            />
            <ResultDisplay
              label="Interest paid"
              value={`-${formatCurrency(r.effectiveInterest, { maximumFractionDigits: 1 })}`}
            />
            <ResultDisplay
              label="Net gain"
              value={`${r.borrowNet >= 0 ? '+' : ''}${formatCurrency(r.borrowNet, { maximumFractionDigits: 1 })}`}
              emphasis="primary"
            />
          </div>
          <div
            className={[styles.compareOption, !r.borrowBetter ? styles.winner : ''].join(' ')}
          >
            <h3>Wait & save</h3>
            <ResultDisplay label="Building available in" value={fmtMonths(r.waitMonths)} />
            <ResultDisplay
              label={`Income over ${inputs.horizonYears} yrs`}
              value={formatCurrency(r.waitTotalIncome, { maximumFractionDigits: 1 })}
            />
            <ResultDisplay
              label="Net gain"
              value={`+${formatCurrency(r.waitNet, { maximumFractionDigits: 1 })}`}
              emphasis="primary"
            />
          </div>
        </div>
        <p className={styles.note}>
          Break-even monthly income (the income at which both options tie):{' '}
          <strong>
            {Number.isFinite(r.breakEvenIncomePerMonth)
              ? formatCurrency(r.breakEvenIncomePerMonth, { maximumFractionDigits: 2 }) + '/mo'
              : 'N/A'}
          </strong>
        </p>
      </AriaLive>
    </section>
  );
}

export default Eu5LoanComponent;
