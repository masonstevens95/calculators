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
import {
  BUILDER_LABELS,
  findModel,
  modelsForBuilder,
} from './models';
import type { Builder, KitTier } from './models';
import {
  defaultInputs,
  DEFAULT_HOMES_BY_BUILDER,
  presetsForBuilder,
} from './presets';
import styles from './Component.module.css';

const MIN_HOMES = 1;
const MAX_HOMES = 20;

export function ModularHomeDscrComponent() {
  const [inputs, setInputs] = useState<DscrInputs>(defaultInputs);

  const builderModels = useMemo(() => modelsForBuilder(inputs.builder), [inputs.builder]);
  const builderPresets = useMemo(() => presetsForBuilder(inputs.builder), [inputs.builder]);

  // Kit-tier control is only meaningful when at least one selected model uses
  // tier-based pricing (currently: any Momohomes model).
  const portfolioUsesTiers = useMemo(
    () =>
      inputs.homes.some((h) => {
        const m = findModel(h.modelId);
        return m !== undefined && m.tiers !== undefined;
      }),
    [inputs.homes],
  );

  function setField<K extends keyof DscrInputs>(key: K) {
    return (next: number | '') => {
      setInputs((prev) => ({ ...prev, [key]: next === '' ? 0 : next }));
    };
  }

  function setBuilder(builder: Builder) {
    if (builder === inputs.builder) return;
    // Reset the home portfolio to that builder's default starter set so we
    // never end up with cross-builder model IDs (validation would reject).
    setInputs((prev) => ({
      ...prev,
      builder,
      homes: DEFAULT_HOMES_BY_BUILDER[builder].map((h) => ({ ...h })),
    }));
  }

  function setHomeCount(count: number) {
    const clamped = Math.max(MIN_HOMES, Math.min(MAX_HOMES, Math.floor(count)));
    setInputs((prev) => {
      const next = [...prev.homes];
      const fillerId = DEFAULT_HOMES_BY_BUILDER[prev.builder][0]?.modelId ?? builderModels[0]?.id;
      while (next.length < clamped && fillerId) {
        next.push({ modelId: fillerId });
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
    const preset = builderPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setInputs((prev) => ({ ...prev, homes: preset.homes.map((h) => ({ ...h })) }));
  }

  const computation = useMemo(() => computeDscr(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Modular Home DSCR</h1>
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
    <section className={styles.layout} aria-labelledby="modular-dscr-heading">
      <div className={styles.header}>
        <h1 id="modular-dscr-heading" className={styles.heading}>
          Modular Home Development Calculator
        </h1>
        <p className={styles.subtitle}>
          Estimate per-home DSCR for a modular-home build portfolio. Pick the builder you&apos;re
          quoting, choose models, and the calculator handles kit pricing, build cost, infrastructure,
          and PITIA against a target debt-service-coverage ratio.
        </p>
        <p className={styles.privacyNote}>
          Inputs don&apos;t leave your browser. All math runs locally.
        </p>
      </div>

      <fieldset className={styles.builderFieldset}>
        <legend className={styles.builderLegend}>Builder</legend>
        {(['nationwide', 'momohomes'] as const).map((b) => (
          <label
            key={b}
            className={`${styles.builderOption} ${inputs.builder === b ? styles.builderOptionActive : ''}`}
          >
            <input
              type="radio"
              name="builder"
              value={b}
              checked={inputs.builder === b}
              onChange={() => setBuilder(b)}
            />
            <span className={styles.builderOptionLabel}>{BUILDER_LABELS[b]}</span>
            <span className={styles.builderOptionMeta}>
              {modelsForBuilder(b).length} models · {b === 'nationwide' ? 'SFH / Cape' : 'ADU / SPH'}
            </span>
          </label>
        ))}
      </fieldset>

      <div className={styles.presets} role="group" aria-label="Quick presets">
        {builderPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.presetBtn}
            onClick={() => applyPreset(p.id)}
            title={p.label}
          >
            Preset {p.id.toUpperCase()}
          </button>
        ))}
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Portfolio</h2>
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

        {portfolioUsesTiers ? (
          <FormField label="Kit tier">
            {({ id }) => (
              <select
                id={id}
                value={inputs.kitTier}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, kitTier: e.target.value as KitTier }))
                }
                className={styles.tierSelect}
              >
                <option value="plus">Plus</option>
                <option value="max">Max</option>
              </select>
            )}
          </FormField>
        ) : null}

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
                    {builderModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.upcoming ? ' *' : ''} ({m.bedrooms}BR/{m.bathrooms}BA,{' '}
                        {m.sqft.toLocaleString()} sqft)
                      </option>
                    ))}
                  </select>
                </label>
                {model ? (
                  <div className={styles.homeMeta}>
                    Kit {formatCurrency(ph?.kitPriceDiscounted ?? 0)} · build{' '}
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
      </section>

      <div className={styles.paramGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Loan Parameters</h2>
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
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Costs</h2>
          <FormField label="Bulk kit discount (%)">
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
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Cash Requirements</h2>
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
        </section>
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
                <th>Kit</th>
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
                  <td>{formatCurrency(ph.kitPriceDiscounted)}</td>
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
                <td>{formatCurrency(totals.kit)}</td>
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
            label={`Kit cost (${inputs.discountPct}% discount)`}
            value={formatCurrency(totals.kit)}
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

export default ModularHomeDscrComponent;
