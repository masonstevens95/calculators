import { useMemo, useState } from 'react';
import {
  AriaLive,
  CurrencyInput,
  FormField,
  PercentInput,
  ResultDisplay,
} from '@calc/ui';
import { formatCurrency, formatPercent } from '@calc/domain-utils';
import { computeOffer, concessionLimit } from './domain';
import type { OfferInputs, ScenarioOutput } from './domain';
import { defaultInputs, presets } from './presets';
import { PitiChart } from './charts/PitiChart';
import { CashChart } from './charts/CashChart';
import styles from './Component.module.css';

export function RuralLandOfferComponent() {
  const [inputs, setInputs] = useState<OfferInputs>(defaultInputs);

  function setField<K extends keyof OfferInputs>(key: K) {
    return (next: number | '') => {
      setInputs((prev) => ({ ...prev, [key]: next === '' ? 0 : next }));
    };
  }

  const computation = useMemo(() => computeOffer(inputs), [inputs]);

  // Pre-compute scenario rows (4 presets + custom).
  const scenarioRows = useMemo(() => {
    return [
      ...presets.map((p) => ({
        label: p.label,
        highlight: p.highlight ?? false,
        custom: false,
        result: computeOffer({ ...inputs, ...p.overrides }),
      })),
      {
        label: 'Custom ↑',
        highlight: false,
        custom: true,
        result: computation,
      },
    ];
  }, [inputs, computation]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Rural Land Offer</h1>
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

  const r: ScenarioOutput = computation.result;
  const concessionAtLimit = inputs.concPct > r.concessionLimitPct;

  return (
    <section className={styles.layout} aria-labelledby="rural-land-heading">
      <div className={styles.header}>
        <h1 id="rural-land-heading" className={styles.heading}>
          Rural Land Offer Calculator
        </h1>
        <p className={styles.subtitle}>
          Plan a rural property purchase end-to-end: roll proceeds from selling your current home
          into the down payment, model seller concessions against conventional loan limits, and
          see the resulting PITI + monthly cash position. Tune the inputs to your scenario; the
          presets below illustrate common offer shapes.
        </p>
      </div>

      <div className={styles.inputGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Current Home Sale</h2>
          <FormField label="Sale price">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.salePrice}
                onChange={setField('salePrice')}
              />
            )}
          </FormField>
          <FormField label="Mortgage payoff">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.payoff}
                onChange={setField('payoff')}
              />
            )}
          </FormField>
          <FormField label="Realtor commission (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.realtorPct}
                onChange={setField('realtorPct')}
              />
            )}
          </FormField>
          <FormField label="Transfer + closing, sell side (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.transferPct}
                onChange={setField('transferPct')}
              />
            )}
          </FormField>
          <ResultDisplay
            label="Net proceeds (after payoff + costs)"
            value={formatCurrency(r.netProceeds)}
            emphasis="primary"
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Offer Parameters</h2>
          <FormField label="Offer price">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.offerPrice}
                onChange={setField('offerPrice')}
              />
            )}
          </FormField>
          <FormField label="Down payment (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.downPct}
                onChange={setField('downPct')}
              />
            )}
          </FormField>
          <FormField
            label="Seller concession (%)"
            hint={`Conventional max at ${formatPercent(r.ltvPct / 100)} LTV: ${concessionLimit(r.ltvPct)}%`}
            error={
              concessionAtLimit
                ? `At ${formatPercent(r.ltvPct / 100)} LTV, max conventional concession is ${concessionLimit(r.ltvPct)}% — this exceeds the limit.`
                : undefined
            }
          >
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.concPct}
                onChange={setField('concPct')}
              />
            )}
          </FormField>
          <FormField label="Mortgage rate (% / 30-yr fixed)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.ratePct}
                onChange={setField('ratePct')}
              />
            )}
          </FormField>
          <div className={styles.twoCol}>
            <FormField label="Property tax (%/yr)">
              {({ id, describedBy }) => (
                <PercentInput
                  id={id}
                  aria-describedby={describedBy}
                  value={inputs.taxRatePct}
                  onChange={setField('taxRatePct')}
                />
              )}
            </FormField>
            <FormField label="Insurance (%/yr)">
              {({ id, describedBy }) => (
                <PercentInput
                  id={id}
                  aria-describedby={describedBy}
                  value={inputs.insRatePct}
                  onChange={setField('insRatePct')}
                />
              )}
            </FormField>
          </div>
          <FormField label="Buyer closing costs (% of offer)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.closingPct}
                onChange={setField('closingPct')}
              />
            )}
          </FormField>
          <FormField label="Equipment budget">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.equipment}
                onChange={setField('equipment')}
              />
            )}
          </FormField>
        </section>
      </div>

      <AriaLive className={styles.results}>
        <h2 className={styles.sectionHeading}>Key Metrics</h2>
        <div className={styles.metricsGrid}>
          <ResultDisplay label="Net proceeds" value={formatCurrency(r.netProceeds)} />
          <ResultDisplay label="Loan amount" value={formatCurrency(r.loan)} />
          <ResultDisplay
            label="PITI / mo"
            value={formatCurrency(r.piti, { maximumFractionDigits: 0 })}
          />
          <ResultDisplay label="Repair cash" value={formatCurrency(r.repairCash)} />
          <ResultDisplay
            label="Final reserve"
            value={formatCurrency(r.reserve)}
            emphasis="primary"
          />
        </div>
      </AriaLive>

      <div className={styles.tableGrid}>
        <section className={styles.card} aria-labelledby="concession-heading">
          <h2 id="concession-heading" className={styles.cardTitle}>
            Concession → Cash Breakdown
          </h2>
          <ResultDisplay label="Offer price" value={formatCurrency(inputs.offerPrice)} />
          <ResultDisplay
            label={`Seller concession (${inputs.concPct}%)`}
            value={`+${formatCurrency(r.concession)}`}
          />
          <ResultDisplay
            label={`Buyer closing costs (${inputs.closingPct}%)`}
            value={`-${formatCurrency(r.closingAmt)}`}
          />
          <ResultDisplay
            label="Repair / flexible cash"
            value={formatCurrency(r.repairCash)}
            emphasis="primary"
          />
          <p className={styles.note}>
            LTV: <strong>{formatPercent(r.ltvPct / 100)}</strong>{' '}
            {r.pmiMo > 0
              ? `· PMI ~${formatCurrency(r.pmiMo, { maximumFractionDigits: 0 })}/mo`
              : '· No PMI'}
          </p>
        </section>

        <section className={styles.card} aria-labelledby="proceeds-heading">
          <h2 id="proceeds-heading" className={styles.cardTitle}>
            Proceeds Allocation
          </h2>
          <ResultDisplay label="Net sale proceeds" value={formatCurrency(r.netProceeds)} />
          <ResultDisplay label="− Down payment" value={`-${formatCurrency(r.downAmt)}`} />
          <ResultDisplay label="= Proceeds after down" value={formatCurrency(r.afterDown)} />
          <ResultDisplay
            label="+ Repair cash (concession residual)"
            value={`+${formatCurrency(Math.max(0, r.repairCash))}`}
          />
          <ResultDisplay label="= Total cash at closing" value={formatCurrency(r.totalCash)} />
          <ResultDisplay label="− Equipment budget" value={`-${formatCurrency(inputs.equipment)}`} />
          <ResultDisplay
            label="= Final cash reserve"
            value={formatCurrency(r.reserve)}
            emphasis="primary"
          />
        </section>
      </div>

      <section className={styles.card} aria-labelledby="scenario-heading">
        <h2 id="scenario-heading" className={styles.cardTitle}>
          Scenario Comparison
        </h2>
        <div className={styles.scrollX}>
          <table className={styles.scTable}>
            <thead>
              <tr>
                <th />
                {scenarioRows.map((row) => (
                  <th key={row.label} className={row.highlight ? styles.hlCol : row.custom ? styles.customCol : undefined}>
                    {row.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ScenarioRow rows={scenarioRows} label="Offer Price" pick={(s) => s.offerPrice} />
              <ScenarioRow rows={scenarioRows} label="Down Payment" pick={(s) => s.downAmt} />
              <ScenarioRow rows={scenarioRows} label="Loan" pick={(s) => s.loan} />
              <ScenarioRow
                rows={scenarioRows}
                label="LTV"
                pick={(s) => s.ltvPct}
                fmt={(v) => formatPercent(v / 100)}
              />
              <ScenarioRow rows={scenarioRows} label="Seller Concession" pick={(s) => s.concession} />
              <ScenarioRow rows={scenarioRows} label="Repair Cash" pick={(s) => s.repairCash} />
              <ScenarioRow
                rows={scenarioRows}
                label="P&I / mo"
                pick={(s) => s.pi}
                fmt={(v) => formatCurrency(v, { maximumFractionDigits: 0 })}
              />
              <ScenarioRow
                rows={scenarioRows}
                label="PITI / mo"
                pick={(s) => s.piti}
                fmt={(v) => formatCurrency(v, { maximumFractionDigits: 0 })}
              />
              <ScenarioRow
                rows={scenarioRows}
                label="Final Reserve"
                pick={(s) => s.reserve}
              />
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.chartsGrid}>
        <section className={styles.card} aria-labelledby="piti-chart-heading">
          <h2 id="piti-chart-heading" className={styles.cardTitle}>
            Monthly PITI by Scenario
          </h2>
          <div className={styles.chartWrap}>
            <PitiChart
              scenarios={scenarioRows
                .filter((row) => row.result.ok)
                .map((row) => ({
                  label: row.label,
                  pi: row.result.ok ? row.result.result.pi : 0,
                  tax: row.result.ok ? row.result.result.tax : 0,
                  ins: row.result.ok ? row.result.result.ins : 0,
                  pmiMo: row.result.ok ? row.result.result.pmiMo : 0,
                }))}
            />
          </div>
        </section>
        <section className={styles.card} aria-labelledby="cash-chart-heading">
          <h2 id="cash-chart-heading" className={styles.cardTitle}>
            Final Cash Reserve by Scenario
          </h2>
          <div className={styles.chartWrap}>
            <CashChart
              scenarios={scenarioRows
                .filter((row) => row.result.ok)
                .map((row) => ({
                  label: row.label,
                  reserve: row.result.ok ? row.result.result.reserve : 0,
                }))}
            />
          </div>
        </section>
      </div>
    </section>
  );
}

type ScenarioRowItem = {
  label: string;
  highlight: boolean;
  custom: boolean;
  result: ReturnType<typeof computeOffer>;
};

function ScenarioRow({
  rows,
  label,
  pick,
  fmt = formatCurrency,
}: {
  rows: ScenarioRowItem[];
  label: string;
  pick: (s: ScenarioOutput) => number;
  fmt?: (v: number) => string;
}) {
  return (
    <tr>
      <td className={styles.rowLabel}>{label}</td>
      {rows.map((row, i) => (
        <td
          key={`${label}-${i}`}
          className={[
            styles.cellNum,
            row.highlight ? styles.hlCol : row.custom ? styles.customCol : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {row.result.ok ? fmt(pick(row.result.result)) : '—'}
        </td>
      ))}
    </tr>
  );
}

export default RuralLandOfferComponent;
