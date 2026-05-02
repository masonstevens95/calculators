import { useMemo, useState } from 'react';
import {
  AriaLive,
  CurrencyInput,
  FormField,
  NumberInput,
  PercentInput,
  ResultDisplay,
} from '@calc/ui';
import { formatCurrency, formatPercent } from '@calc/domain-utils';
import { computeDscr } from './domain';
import type { DscrInputs, HomeInput } from './domain';
import { MODELS, findModel } from './models';
import { defaultInputs, presets } from './presets';
import styles from './Component.module.css';

const MIN_HOMES = 1;
const MAX_HOMES = 20;

export function LgsDscrComponent() {
  const [inputs, setInputs] = useState<DscrInputs>(defaultInputs);

  function setField<K extends keyof DscrInputs>(key: K) {
    return (next: number | '') => {
      setInputs((prev) => ({ ...prev, [key]: next === '' ? 0 : next }));
    };
  }

  function setHomeCount(count: number) {
    const clamped = Math.max(MIN_HOMES, Math.min(MAX_HOMES, Math.floor(count)));
    setInputs((prev) => {
      const next = [...prev.homes];
      while (next.length < clamped) {
        next.push({ modelId: 'cumberland' });
      }
      next.length = clamped;
      return { ...prev, homes: next };
    });
  }

  function setHomeModel(index: number, modelId: string) {
    setInputs((prev) => {
      const next = prev.homes.map((h, i) => (i === index ? { ...h, modelId } : h));
      return { ...prev, homes: next };
    });
  }

  function setHomeBuildOverride(index: number, override: number | '') {
    setInputs((prev) => {
      const next = prev.homes.map((h, i): HomeInput => {
        if (i !== index) return h;
        if (override === '') {
          const { buildOverride: _ignored, ...rest } = h;
          return rest;
        }
        return { ...h, buildOverride: override };
      });
      return { ...prev, homes: next };
    });
  }

  function applyPreset(presetId: string) {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setInputs((prev) => ({ ...prev, homes: preset.homes.map((h) => ({ ...h })) }));
  }

  const computation = useMemo(() => computeDscr(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>LGS DSCR</h1>
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

  const { perHome, totals, summary, cash } = computation.result;

  return (
    <section className={styles.layout} aria-labelledby="lgs-heading">
      <div className={styles.header}>
        <h1 id="lgs-heading" className={styles.heading}>
          LGS DSCR Calculator
        </h1>
        <p className={styles.subtitle}>
          Estimate per-home DSCR for an LGS / Nationwide Homes build portfolio.
        </p>
        <p className={styles.privacyNote}>
          Inputs don&apos;t leave your browser. All math runs locally.
        </p>
      </div>

      <div className={styles.presets} role="group" aria-label="Quick presets">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.presetBtn}
            onClick={() => applyPreset(p.id)}
          >
            Preset {p.id.toUpperCase()}
          </button>
        ))}
      </div>

      <fieldset className={styles.card}>
        <legend className={styles.cardTitle}>Portfolio</legend>
        <FormField label="Number of homes" hint={`Range: ${MIN_HOMES}–${MAX_HOMES}`}>
          {({ id, describedBy }) => (
            <NumberInput
              id={id}
              aria-describedby={describedBy}
              value={inputs.homes.length}
              onChange={(v) => (typeof v === 'number' ? setHomeCount(v) : undefined)}
              allowDecimal={false}
            />
          )}
        </FormField>

        <div className={styles.homesGrid}>
          {inputs.homes.map((home, i) => {
            const model = findModel(home.modelId);
            const ph = perHome[i];
            return (
              <div key={i} className={styles.homeSlot}>
                <label className={styles.homeLabel}>
                  Home {i + 1}
                  <select
                    value={home.modelId}
                    onChange={(e) => setHomeModel(i, e.target.value)}
                    className={styles.modelSelect}
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.bedrooms}BR/{m.bathrooms}BA, {m.sqft.toLocaleString()} sqft)
                      </option>
                    ))}
                  </select>
                </label>
                {model ? (
                  <div className={styles.homeMeta}>
                    Module {formatCurrency(ph?.modulePriceDiscounted ?? 0)} · build{' '}
                    {formatCurrency(ph?.buildCost ?? 0)} · total{' '}
                    {formatCurrency(ph?.totalCost ?? 0)}
                  </div>
                ) : null}
                <FormField label="Build override (optional)">
                  {({ id }) => (
                    <CurrencyInput
                      id={id}
                      value={home.buildOverride ?? ''}
                      onChange={(v) => setHomeBuildOverride(i, v)}
                    />
                  )}
                </FormField>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.paramGrid}>
        <fieldset className={styles.card}>
          <legend className={styles.cardTitle}>Loan Parameters</legend>
          <FormField label="Mortgage rate (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.ratePct}
                onChange={setField('ratePct')}
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
          <FormField label="DSCR target">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.dscrTarget}
                onChange={setField('dscrTarget')}
              />
            )}
          </FormField>
          <FormField label="Term (years)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.termYears}
                onChange={setField('termYears')}
                allowDecimal={false}
              />
            )}
          </FormField>
        </fieldset>

        <fieldset className={styles.card}>
          <legend className={styles.cardTitle}>Costs</legend>
          <FormField label="Bulk module discount (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.discountPct}
                onChange={setField('discountPct')}
              />
            )}
          </FormField>
          <FormField label="Total infrastructure">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.infraTotal}
                onChange={setField('infraTotal')}
              />
            )}
          </FormField>
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
        </fieldset>

        <fieldset className={styles.card}>
          <legend className={styles.cardTitle}>Cash Requirements</legend>
          <FormField label="Reserve months">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.reserveMonths}
                onChange={setField('reserveMonths')}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Origination fee (%)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.origFeePct}
                onChange={setField('origFeePct')}
              />
            )}
          </FormField>
          <FormField label="Other closing costs">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.otherClosing}
                onChange={setField('otherClosing')}
              />
            )}
          </FormField>
        </fieldset>
      </div>

      <AriaLive className={styles.results}>
        <h2 className={styles.sectionHeading}>Per-Home Breakdown</h2>
        <div className={styles.scrollX}>
          <table className={styles.breakdownTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Model</th>
                <th>Sqft</th>
                <th>BR/BA</th>
                <th>Module</th>
                <th>Build</th>
                <th>Total</th>
                <th>Down</th>
                <th>PITIA/mo</th>
                <th>Rent needed/mo</th>
              </tr>
            </thead>
            <tbody>
              {perHome.map((ph, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{ph.model.name}</td>
                  <td>{ph.model.sqft.toLocaleString()}</td>
                  <td>
                    {ph.model.bedrooms}/{ph.model.bathrooms}
                  </td>
                  <td>{formatCurrency(ph.modulePriceDiscounted)}</td>
                  <td>{formatCurrency(ph.buildCost)}</td>
                  <td>{formatCurrency(ph.totalCost)}</td>
                  <td>{formatCurrency(ph.down)}</td>
                  <td>{formatCurrency(ph.pitia, { maximumFractionDigits: 0 })}</td>
                  <td>{formatCurrency(ph.rentNeeded, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td colSpan={2}>TOTAL ({perHome.length} homes)</td>
                <td>{totals.sqft.toLocaleString()}</td>
                <td />
                <td>{formatCurrency(totals.module)}</td>
                <td>{formatCurrency(totals.build)}</td>
                <td>{formatCurrency(totals.totalCost)}</td>
                <td>{formatCurrency(totals.down)}</td>
                <td>{formatCurrency(totals.pitia, { maximumFractionDigits: 0 })}</td>
                <td>{formatCurrency(totals.rent, { maximumFractionDigits: 0 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className={styles.sectionHeading}>Summary</h2>
        <div className={styles.summaryGrid}>
          <ResultDisplay label="Total project cost" value={formatCurrency(totals.totalCost)} />
          <ResultDisplay
            label={`Total down (${inputs.downPct}%)`}
            value={formatCurrency(totals.down)}
          />
          <ResultDisplay
            label={`Monthly rent needed (DSCR ${inputs.dscrTarget})`}
            value={formatCurrency(totals.rent, { maximumFractionDigits: 0 })}
            detail={`${formatCurrency(summary.avgRentPerHome, { maximumFractionDigits: 0 })} avg/home`}
            emphasis="primary"
          />
          <ResultDisplay
            label="Annual rent revenue"
            value={formatCurrency(summary.annualRent, { maximumFractionDigits: 0 })}
          />
          <ResultDisplay
            label={`Module cost (${inputs.discountPct}% discount)`}
            value={formatCurrency(totals.module)}
            detail={`Saved ${formatCurrency(summary.discountSavings)}`}
          />
          <ResultDisplay
            label="Total loan amount"
            value={formatCurrency(cash.loanAmount)}
            detail={`${formatPercent(summary.ltvPct / 100)} LTV`}
          />
        </div>

        <h2 className={styles.sectionHeading}>Cash Requirements</h2>
        <div className={styles.cashStack}>
          <ResultDisplay
            label={`Origination fee (${inputs.origFeePct}% of ${formatCurrency(cash.loanAmount)})`}
            value={formatCurrency(cash.origCost)}
          />
          <ResultDisplay label="Other closing costs" value={formatCurrency(inputs.otherClosing)} />
          <ResultDisplay label="Total closing costs" value={formatCurrency(cash.totalClosing)} />
          <ResultDisplay
            label={`Post-closing reserves (${inputs.reserveMonths} mo × PITIA)`}
            value={formatCurrency(cash.reserves, { maximumFractionDigits: 0 })}
          />
          <ResultDisplay
            label="Total cash needed"
            value={formatCurrency(cash.totalCashNeeded, { maximumFractionDigits: 0 })}
            emphasis="primary"
          />
        </div>
      </AriaLive>
    </section>
  );
}

export default LgsDscrComponent;
