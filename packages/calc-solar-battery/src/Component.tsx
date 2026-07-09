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
import { computeSolarBattery } from './domain';
import type { BatteryCostMode, FinanceMode, SoftCostMode, SolarBatteryInputs, SolarCostMode } from './domain';
import { SOLAR_BATTERY_INITIAL_INPUTS } from './constants';
import { AnnualBreakdownChart, CashFlowChart, SensitivityChart } from './charts/SolarBatteryCharts';
import styles from './Component.module.css';

const DEFAULT_INPUTS: SolarBatteryInputs = { ...SOLAR_BATTERY_INITIAL_INPUTS };

type NumericField = Exclude<keyof SolarBatteryInputs, 'financeMode'>;

export function SolarBatteryComponent() {
  const [inputs, setInputs] = useState<SolarBatteryInputs>(DEFAULT_INPUTS);

  function setNum(field: NumericField, fallback = 0) {
    return (v: number | '') => {
      setInputs((prev) => ({ ...prev, [field]: v === '' ? fallback : v }));
    };
  }

  const computation = useMemo(() => computeSolarBattery(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Solar + Battery</h1>
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
  const isLoan = inputs.financeMode === 'loan';
  const isSolarTotal = inputs.solarCostMode === 'total';
  const isBatteryTotal = inputs.batteryCostMode === 'total';
  const isSoftCostFlat = inputs.softCostsMode === 'flat';

  return (
    <section className={styles.layout} aria-labelledby="solar-battery-heading">
      <div className={styles.header}>
        <h1 id="solar-battery-heading" className={styles.heading}>
          Solar + Battery
        </h1>
        <p className={styles.subtitle}>
          You&apos;re weighing a home solar array and battery backup. The calculator nets the
          system cost against incentives and financing, then walks the year-by-year
          utility-bill savings to find the payback period and lifetime return.
        </p>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Solar</h2>
        <div className={styles.inputGrid}>
          <FormField label="Solar array size (kW)">
            {({ id, describedBy }) => (
              <NumberInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.solarSizeKw}
                onChange={setNum('solarSizeKw')}
              />
            )}
          </FormField>
          <FormField label="Solar cost basis">
            {({ id }) => (
              <select
                id={id}
                value={inputs.solarCostMode}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    solarCostMode: e.target.value as SolarCostMode,
                  }))
                }
                className={styles.select}
              >
                <option value="perWatt">Cost per watt</option>
                <option value="total">Total system cost</option>
              </select>
            )}
          </FormField>
          {isSolarTotal ? (
            <FormField label="Total solar cost">
              {({ id, describedBy }) => (
                <CurrencyInput
                  id={id}
                  aria-describedby={describedBy}
                  value={inputs.solarTotalCost}
                  onChange={setNum('solarTotalCost')}
                />
              )}
            </FormField>
          ) : (
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
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Battery</h2>
        <div className={styles.inputGrid}>
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
          <FormField label="Battery cost basis">
            {({ id }) => (
              <select
                id={id}
                value={inputs.batteryCostMode}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    batteryCostMode: e.target.value as BatteryCostMode,
                  }))
                }
                className={styles.select}
              >
                <option value="perKwh">Cost per kWh</option>
                <option value="total">Total system cost</option>
              </select>
            )}
          </FormField>
          {isBatteryTotal ? (
            <FormField label="Total battery cost">
              {({ id, describedBy }) => (
                <CurrencyInput
                  id={id}
                  aria-describedby={describedBy}
                  value={inputs.batteryTotalCost}
                  onChange={setNum('batteryTotalCost')}
                />
              )}
            </FormField>
          ) : (
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
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Costs &amp; incentives</h2>
        <div className={styles.inputGrid}>
          <FormField label="Soft costs basis">
            {({ id }) => (
              <select
                id={id}
                value={inputs.softCostsMode}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    softCostsMode: e.target.value as SoftCostMode,
                  }))
                }
                className={styles.select}
              >
                <option value="percent">Percent of hardware</option>
                <option value="flat">Flat dollar amount</option>
              </select>
            )}
          </FormField>
          {isSoftCostFlat ? (
            <FormField label="Soft costs (permitting/install)">
              {({ id, describedBy }) => (
                <CurrencyInput
                  id={id}
                  aria-describedby={describedBy}
                  value={inputs.softCostsFlat}
                  onChange={setNum('softCostsFlat')}
                />
              )}
            </FormField>
          ) : (
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
          )}
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
          {isLoan && (
            <>
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
            </>
          )}
          <FormField label="Index fund return (alt. investment)">
            {({ id, describedBy }) => (
              <PercentInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.indexFundReturnPct}
                onChange={setNum('indexFundReturnPct')}
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
          <p className={styles.headlineSub}>
            That same {formatCurrency(r.upfrontCash, { maximumFractionDigits: 0 })} in an index
            fund at {inputs.indexFundReturnPct}%/yr would gain{' '}
            <strong>{formatCurrency(r.indexFundGain, { maximumFractionDigits: 0 })}</strong> over{' '}
            {inputs.analysisYears} years —{' '}
            <strong>{r.solarBeatsIndexFund ? 'solar + battery wins' : 'the index fund wins'}</strong>{' '}
            by {formatCurrency(Math.abs(r.lifetimeNetProfit - r.indexFundGain), { maximumFractionDigits: 0 })}.
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
            detail={isLoan ? 'before loan payment' : 'cash purchase'}
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
          <ResultDisplay
            label="Est. annual production"
            value={`${formatNumber(r.annualProductionKwh)} kWh/yr`}
            detail={`${inputs.solarSizeKw} kW array`}
          />
          <ResultDisplay
            label={`Index fund alternative (${inputs.indexFundReturnPct}%)`}
            value={formatCurrency(r.indexFundGain, { maximumFractionDigits: 0 })}
            detail={r.solarBeatsIndexFund ? 'solar + battery wins' : 'index fund wins'}
          />
        </div>

        <h2 className={styles.sectionHeading}>Cumulative Cash Flow</h2>
        <div className={styles.chartWrap}>
          <CashFlowChart points={r.cashFlowOverTime} indexFundPoints={r.indexFundOverTime} />
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

export default SolarBatteryComponent;
