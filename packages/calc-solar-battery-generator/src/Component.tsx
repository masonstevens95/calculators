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
import { computeSolarBatteryGenerator } from './domain';
import type { FinanceMode, SolarBatteryGeneratorInputs } from './domain';
import { SOLAR_BATTERY_GENERATOR_INITIAL_INPUTS } from './constants';
import {
  AnnualBreakdownChart,
  CashFlowChart,
  SensitivityChart,
} from './charts/SolarBatteryGeneratorCharts';
import styles from './Component.module.css';

const DEFAULT_INPUTS: SolarBatteryGeneratorInputs = { ...SOLAR_BATTERY_GENERATOR_INITIAL_INPUTS };

type NumericField = Exclude<keyof SolarBatteryGeneratorInputs, 'financeMode'>;

export function SolarBatteryGeneratorComponent() {
  const [inputs, setInputs] = useState<SolarBatteryGeneratorInputs>(DEFAULT_INPUTS);

  function setNum(field: NumericField, fallback = 0) {
    return (v: number | '') => {
      setInputs((prev) => ({ ...prev, [field]: v === '' ? fallback : v }));
    };
  }

  const computation = useMemo(() => computeSolarBatteryGenerator(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Solar + Battery + Generator</h1>
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
  const paysBack = r.paybackYears !== null;

  return (
    <section className={styles.layout} aria-labelledby="solar-battery-generator-heading">
      <div className={styles.header}>
        <h1 id="solar-battery-generator-heading" className={styles.heading}>
          Solar + Battery + Generator
        </h1>
        <p className={styles.subtitle}>
          You&apos;re weighing a home solar array, battery backup, and standby generator. The
          calculator nets the system cost against incentives and financing, then walks the
          year-by-year utility-bill savings and generator operating cost to find the payback
          period and lifetime return.
        </p>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>System &amp; cost</h2>
        <div className={styles.inputGrid}>
          <FormField label="Solar array size">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.solarSizeKw}
                onChange={setNum('solarSizeKw')}
              />
            )}
          </FormField>
          <FormField label="Solar cost per watt">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.solarCostPerWatt}
                onChange={setNum('solarCostPerWatt')}
              />
            )}
          </FormField>
          <FormField label="Battery capacity (kWh)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.batteryCapacityKwh}
                onChange={setNum('batteryCapacityKwh')}
              />
            )}
          </FormField>
          <FormField label="Battery cost per kWh">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.batteryCostPerKwh}
                onChange={setNum('batteryCostPerKwh')}
              />
            )}
          </FormField>
          <FormField label="Generator cost">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.generatorCost}
                onChange={setNum('generatorCost')}
              />
            )}
          </FormField>
          <FormField label="Soft costs (permitting/install)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.softCostsPct}
                onChange={setNum('softCostsPct')}
              />
            )}
          </FormField>
          <FormField label="Federal ITC">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.federalItcPct}
                onChange={setNum('federalItcPct')}
              />
            )}
          </FormField>
          <FormField label="State/utility rebate">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.stateRebate}
                onChange={setNum('stateRebate')}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Financing</h2>
        <div className={styles.inputGrid}>
          <FormField label="Payment method">
            {({ id }) => (
              <select
                id={id}
                value={inputs.financeMode}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, financeMode: e.target.value as FinanceMode }))
                }
                className={styles.select}
              >
                <option value="cash">Cash</option>
                <option value="loan">Loan</option>
              </select>
            )}
          </FormField>
          <FormField label="Down payment">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.downPaymentPct}
                onChange={setNum('downPaymentPct')}
              />
            )}
          </FormField>
          <FormField label="Loan rate">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.loanRatePct}
                onChange={setNum('loanRatePct')}
              />
            )}
          </FormField>
          <FormField label="Loan term (years)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.loanTermYears}
                onChange={setNum('loanTermYears', 15)}
                allowDecimal={false}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Energy usage</h2>
        <div className={styles.inputGrid}>
          <FormField label="Annual usage (kWh)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.annualUsageKwh}
                onChange={setNum('annualUsageKwh')}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Utility rate ($/kWh)">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.utilityRatePerKwh}
                onChange={setNum('utilityRatePerKwh')}
              />
            )}
          </FormField>
          <FormField label="Annual rate escalation">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.rateEscalationPct}
                onChange={setNum('rateEscalationPct')}
              />
            )}
          </FormField>
          <FormField label="Production per kW (kWh/yr)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.productionPerKw}
                onChange={setNum('productionPerKw')}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Self-consumption share">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.selfConsumptionPct}
                onChange={setNum('selfConsumptionPct')}
              />
            )}
          </FormField>
          <FormField label="Net-metering credit (% of retail)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.netMeteringPct}
                onChange={setNum('netMeteringPct')}
              />
            )}
          </FormField>
          <FormField label="Annual panel degradation">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.systemDegradationPct}
                onChange={setNum('systemDegradationPct')}
              />
            )}
          </FormField>
          <FormField label="Analysis period (years)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.analysisYears}
                onChange={setNum('analysisYears', 25)}
                allowDecimal={false}
              />
            )}
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Generator &amp; backup</h2>
        <div className={styles.inputGrid}>
          <FormField label="Fuel cost per gallon">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.fuelCostPerGallon}
                onChange={setNum('fuelCostPerGallon')}
              />
            )}
          </FormField>
          <FormField label="Burn rate (gal/hr)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.generatorBurnRateGalPerHr}
                onChange={setNum('generatorBurnRateGalPerHr')}
              />
            )}
          </FormField>
          <FormField label="Expected outage hours/yr">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.annualOutageHours}
                onChange={setNum('annualOutageHours')}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Annual maintenance">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.generatorMaintenanceAnnual}
                onChange={setNum('generatorMaintenanceAnnual')}
              />
            )}
          </FormField>
          <FormField label="Replacement year">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.generatorReplaceYear}
                onChange={setNum('generatorReplaceYear', 12)}
                allowDecimal={false}
              />
            )}
          </FormField>
          <FormField label="Replacement cost">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.generatorReplaceCost}
                onChange={setNum('generatorReplaceCost')}
              />
            )}
          </FormField>
        </div>
      </section>

      <AriaLive className={styles.results}>
        <h2 className={styles.sectionHeading}>Payback</h2>
        <div className={styles.headline} data-verdict={paysBack ? 'yes' : 'never'}>
          <p className={styles.headlineLead}>
            {paysBack ? (
              <>
                Pays back in <strong>{r.paybackYears!.toFixed(1)} years</strong>, then nets{' '}
                <strong>{formatCurrency(r.lifetimeNetProfit, { maximumFractionDigits: 0 })}</strong>{' '}
                over {inputs.analysisYears} years.
              </>
            ) : (
              <>Doesn&apos;t break even within {inputs.analysisYears} years at these inputs.</>
            )}
          </p>
          <p className={styles.headlineSub}>
            Net system cost{' '}
            <strong>{formatCurrency(r.netCost, { maximumFractionDigits: 0 })}</strong> after
            incentives · upfront cash{' '}
            <strong>{formatCurrency(r.upfrontCash, { maximumFractionDigits: 0 })}</strong>.
          </p>
        </div>

        <h2 className={styles.sectionHeading}>Stats</h2>
        <div className={styles.statsGrid}>
          <ResultDisplay
            label="Net system cost"
            value={formatCurrency(r.netCost, { maximumFractionDigits: 0 })}
            emphasis="primary"
            detail={`${formatCurrency(r.itcAmount, { maximumFractionDigits: 0 })} ITC applied`}
          />
          <ResultDisplay
            label="Year 1 bill savings"
            value={`${formatCurrency(r.year1Savings, { maximumFractionDigits: 0 })}/yr`}
            detail={inputs.financeMode === 'loan' ? 'before loan payment' : 'cash purchase'}
          />
          <ResultDisplay
            label="Payback period"
            value={paysBack ? `${r.paybackYears!.toFixed(1)} yrs` : 'never'}
            detail={`over ${inputs.analysisYears}-year analysis`}
          />
          <ResultDisplay
            label="Lifetime ROI"
            value={formatPercent(r.roiPct / 100, { fractionDigits: 0 })}
            detail={`${formatCurrency(r.lifetimeNetProfit, { maximumFractionDigits: 0 })} net profit`}
          />
        </div>

        <h2 className={styles.sectionHeading}>Cumulative Cash Flow</h2>
        <div className={styles.chartWrap}>
          <CashFlowChart points={r.cashFlowOverTime} />
        </div>

        <h2 className={styles.sectionHeading}>Annual Savings vs Cost</h2>
        <div className={styles.chartWrap}>
          <AnnualBreakdownChart points={r.annualBreakdown} />
        </div>

        <h2 className={styles.sectionHeading}>Sensitivity to Utility Rate Escalation</h2>
        <div className={styles.chartWrap}>
          <SensitivityChart points={r.sensitivity} />
        </div>
      </AriaLive>
    </section>
  );
}

export default SolarBatteryGeneratorComponent;
