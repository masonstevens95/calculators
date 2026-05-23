import { useMemo, useState } from 'react';
import {
  AriaLive,
  CurrencyInput,
  FormField,
  NumberInput,
  PercentInput,
  ResultDisplay,
} from '@calc/ui';
import { formatCurrency } from '@calc/domain-utils';
import { computeRentSell } from './domain';
import type { RentSellInputs, S121Mode } from './domain';
import { RENT_SELL_INITIAL_INPUTS } from './constants';
import { CashflowChart, WealthChart, SensitivityChart } from './charts/RentVsSellCharts';
import styles from './Component.module.css';

const DEFAULT_INPUTS: RentSellInputs = { ...RENT_SELL_INITIAL_INPUTS };

type NumericField = Exclude<keyof RentSellInputs, 'managed' | 's121'>;

export function RentSellComponent() {
  const [inputs, setInputs] = useState<RentSellInputs>(DEFAULT_INPUTS);

  function setNum(field: NumericField, fallback = 0) {
    return (v: number | '') => {
      setInputs((prev) => ({ ...prev, [field]: v === '' ? fallback : v }));
    };
  }

  const computation = useMemo(() => computeRentSell(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Rent vs Sell</h1>
        <p role="alert">Some inputs are invalid. Adjust and try again.</p>
        <ul>
          {Object.entries(computation.errors).map(([field, message]) => (
            <li key={field}>
              <strong>{field}:</strong> {message}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const r = computation.result;
  const verdict = r.sellBeatsRent ? 'Sell' : 'Hold';
  const s121Open = inputs.s121 !== 'none';
  const beyondS121 = inputs.holdingYears + (2026 - inputs.moveoutYear) > 3;

  return (
    <section className={styles.layout} aria-labelledby="rent-sell-heading">
      <div className={styles.header}>
        <h1 id="rent-sell-heading" className={styles.heading}>
          Rent vs Sell
        </h1>
        <p className={styles.subtitle}>
          You own a home you no longer plan to live in. Should you sell now and invest the
          proceeds, or rent it out for the long-term cash flow and equity growth? The calculator
          compares both paths over your chosen holding period and solves for the sale price at
          which the two strategies break even.
        </p>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Property</h2>
        <div className={styles.inputGrid}>
          <FormField label="Sale price today">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.salePrice}
                onChange={setNum('salePrice')}
              />
            )}
          </FormField>
          <FormField label="Purchase price">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.purchasePrice}
                onChange={setNum('purchasePrice')}
              />
            )}
          </FormField>
          <FormField label="Mortgage balance">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.mortgageBalance}
                onChange={setNum('mortgageBalance')}
              />
            )}
          </FormField>
          <FormField label="Mortgage rate">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.mortgageRatePct}
                onChange={setNum('mortgageRatePct')}
              />
            )}
          </FormField>
          <FormField label="Monthly P&I">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.monthlyPI}
                onChange={setNum('monthlyPI')}
              />
            )}
          </FormField>
          <FormField label="Annual appreciation">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.appRatePct}
                onChange={setNum('appRatePct')}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Rental scenario</h2>
        <div className={styles.inputGrid}>
          <FormField label="Monthly rent">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.rent}
                onChange={setNum('rent')}
              />
            )}
          </FormField>
          <FormField label="Property taxes (monthly)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.taxesMonthly}
                onChange={setNum('taxesMonthly')}
              />
            )}
          </FormField>
          <FormField label="Landlord insurance (monthly)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.insuranceMonthly}
                onChange={setNum('insuranceMonthly')}
              />
            )}
          </FormField>
          <FormField label="Maintenance reserve">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.maintenancePctYr}
                onChange={setNum('maintenancePctYr')}
              />
            )}
          </FormField>
          <FormField label="Vacancy rate">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.vacancyPct}
                onChange={setNum('vacancyPct')}
              />
            )}
          </FormField>
          <FormField label="Accounting (annual)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.accountingAnnual}
                onChange={setNum('accountingAnnual')}
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
                <option value="managed">Managed</option>
              </select>
            )}
          </FormField>
          <FormField label="Mgmt fee">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.managedPct}
                onChange={setNum('managedPct')}
              />
            )}
          </FormField>
          <FormField label="Marginal tax rate">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.marginalTaxPct}
                onChange={setNum('marginalTaxPct')}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Sale costs &amp; investment</h2>
        <div className={styles.inputGrid}>
          <FormField label="Realtor commission">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.commissionPct}
                onChange={setNum('commissionPct')}
              />
            )}
          </FormField>
          <FormField label="Closing costs">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.closingPct}
                onChange={setNum('closingPct')}
              />
            )}
          </FormField>
          <FormField label="LTCG rate">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.ltcgPct}
                onChange={setNum('ltcgPct')}
              />
            )}
          </FormField>
          <FormField label="Section 121 exclusion">
            {({ id }) => (
              <select
                id={id}
                value={inputs.s121}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, s121: e.target.value as S121Mode }))
                }
                className={styles.select}
              >
                <option value="none">None</option>
                <option value="single">Single ($250k)</option>
                <option value="mfj">MFJ ($500k)</option>
              </select>
            )}
          </FormField>
          <FormField label="Land value (depreciation)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.landValue}
                onChange={setNum('landValue')}
              />
            )}
          </FormField>
          <FormField label="Investment return">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.invRatePct}
                onChange={setNum('invRatePct')}
              />
            )}
          </FormField>
          <FormField label="Holding period (years)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.holdingYears}
                onChange={setNum('holdingYears', 10)}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Move-out year">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.moveoutYear}
                onChange={setNum('moveoutYear', 2026)}
                allowDecimal={false}
              />
            )}
          </FormField>
        </div>
      </section>

      <AriaLive className={styles.results}>
        <h2 className={styles.sectionHeading}>Breakeven</h2>
        <div className={styles.breakeven} data-verdict={verdict.toLowerCase()}>
          <p className={styles.breakevenLead}>
            {r.breakevenSalePrice == null ? (
              <>No breakeven sale price in the search range — one strategy dominates.</>
            ) : (
              <>
                Sell at{' '}
                <strong>{formatCurrency(r.breakevenSalePrice, { maximumFractionDigits: 0 })}</strong>{' '}
                or higher to beat renting over {inputs.holdingYears} years.
              </>
            )}
          </p>
          <p className={styles.breakevenSub}>
            At your{' '}
            <strong>{formatCurrency(inputs.salePrice, { maximumFractionDigits: 0 })}</strong>{' '}
            sale price: <strong>{verdict}</strong> by{' '}
            {formatCurrency(Math.abs(r.sellMinusRentAtN), { maximumFractionDigits: 0 })} at year{' '}
            {inputs.holdingYears}.
          </p>
          {s121Open && beyondS121 && (
            <p className={styles.breakevenWarn}>
              Holding period puts the sale past the Section 121 window — exclusion will not apply
              on the rent-path sale.
            </p>
          )}
        </div>

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
            detail={inputs.managed ? `managed ${inputs.managedPct}%` : 'self-managed'}
          />
          <ResultDisplay
            label={r.sellBeatsRent ? `Sell ahead at year ${inputs.holdingYears}` : `Rent ahead at year ${inputs.holdingYears}`}
            value={formatCurrency(Math.abs(r.sellMinusRentAtN), { maximumFractionDigits: 0 })}
            detail={`${inputs.appRatePct.toFixed(1)}% app / ${inputs.invRatePct.toFixed(1)}% inv`}
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

        <h2 className={styles.sectionHeading}>Wealth Over {inputs.holdingYears} Years</h2>
        <div className={styles.chartWrap}>
          <WealthChart points={r.wealthOverTime} />
        </div>

        <h2 className={styles.sectionHeading}>Sensitivity to Appreciation Rate</h2>
        <div className={styles.chartWrap}>
          <SensitivityChart points={r.sensitivity} holdingYears={inputs.holdingYears} />
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
