import { useMemo, useState } from 'react';
import { AriaLive, CurrencyInput, FormField, ResultDisplay } from '@calc/ui';
import { formatCurrency, formatNumber, formatPercent } from '@calc/domain-utils';
import { computeLvt } from './domain';
import type { LvtInputs, ParcelBill } from './domain';
import { ParcelComparisonChart } from './charts/ParcelComparisonChart';
import styles from './Component.module.css';

const DEFAULT_INPUTS: LvtInputs = {
  shift: 0,
  myParcel: { name: 'My parcel', land: 50_000, imp: 200_000 },
};

function fmtRate(r: number): string {
  return `$${(r * 100).toFixed(4)}/$100`;
}

export function WinstonSalemLvtComponent() {
  const [inputs, setInputs] = useState<LvtInputs>(DEFAULT_INPUTS);

  const computation = useMemo(() => computeLvt(inputs), [inputs]);

  if (!computation.ok) {
    return (
      <section className={styles.layout}>
        <h1>Winston-Salem LVT</h1>
        <p role="alert">Some inputs are invalid. Adjust and try again.</p>
      </section>
    );
  }

  const { rates, sampleBills, myBill } = computation.result;
  const shiftPct = Math.round(Math.max(0, Math.min(1, inputs.shift)) * 100);
  const badge =
    inputs.shift <= 0 ? '(current practice)' : inputs.shift >= 0.999 ? '(pure LVT)' : '(split-rate)';

  return (
    <section className={styles.layout} aria-labelledby="lvt-heading">
      <div className={styles.header}>
        <h1 id="lvt-heading" className={styles.heading}>
          Winston-Salem LVT Calculator
        </h1>
        <p className={styles.subtitle}>
          See how a split-rate (Land Value Tax) shift redistributes the property-tax base across
          parcel types in Winston-Salem.
        </p>
      </div>

      <fieldset className={styles.card}>
        <legend className={styles.cardTitle}>Shift toward LVT</legend>
        <FormField
          label={`Shift fraction (${shiftPct}% LVT) ${badge}`}
          hint="0% = current uniform practice; 100% = pure land-value tax"
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              type="range"
              min={0}
              max={100}
              step={1}
              value={shiftPct}
              onChange={(e) =>
                setInputs((prev) => ({ ...prev, shift: Number(e.target.value) / 100 }))
              }
              className={styles.slider}
            />
          )}
        </FormField>
      </fieldset>

      <AriaLive className={styles.results}>
        <h2 className={styles.sectionHeading}>Required Rates</h2>
        <div className={styles.statsGrid}>
          <ResultDisplay label="Land rate" value={fmtRate(rates.landRate)} emphasis="primary" />
          <ResultDisplay
            label="Improvement rate"
            value={fmtRate(rates.impRate)}
            emphasis="primary"
          />
          <ResultDisplay label="Pure LVT rate (100% shift)" value={fmtRate(rates.pureLvtRate)} />
          <ResultDisplay
            label="Implied k (land ÷ imp)"
            value={
              Number.isFinite(rates.impliedK) ? formatNumber(rates.impliedK, { fractionDigits: 2 }) : '∞'
            }
          />
          <ResultDisplay
            label="Revenue target"
            value={formatCurrency(rates.target, { maximumFractionDigits: 0 })}
          />
        </div>

        <h2 className={styles.sectionHeading}>Sample Parcels</h2>
        <div className={styles.scrollX}>
          <table className={styles.parcelTable}>
            <thead>
              <tr>
                <th>Parcel</th>
                <th>Land</th>
                <th>Improvements</th>
                <th>Today</th>
                <th>New</th>
                <th>Δ</th>
              </tr>
            </thead>
            <tbody>
              {sampleBills.map((b) => (
                <tr key={b.parcel.name}>
                  <td>{b.parcel.name}</td>
                  <td>{formatCurrency(b.parcel.land, { maximumFractionDigits: 0 })}</td>
                  <td>{formatCurrency(b.parcel.imp, { maximumFractionDigits: 0 })}</td>
                  <td>{formatCurrency(b.today, { maximumFractionDigits: 0 })}</td>
                  <td>{formatCurrency(b.next, { maximumFractionDigits: 0 })}</td>
                  <td className={b.delta > 0 ? styles.up : b.delta < 0 ? styles.down : ''}>
                    {b.delta > 0 ? '+' : ''}
                    {formatCurrency(b.delta, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className={styles.sectionHeading}>Your Parcel</h2>
        <div className={styles.myParcelGrid}>
          <FormField label="Your land value">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.myParcel?.land ?? 0}
                onChange={(v) =>
                  setInputs((prev) => ({
                    ...prev,
                    myParcel: {
                      name: prev.myParcel?.name ?? 'My parcel',
                      land: v === '' ? 0 : v,
                      imp: prev.myParcel?.imp ?? 0,
                    },
                  }))
                }
              />
            )}
          </FormField>
          <FormField label="Your improvement value">
            {({ id, describedBy }) => (
              <CurrencyInput
                id={id}
                aria-describedby={describedBy}
                value={inputs.myParcel?.imp ?? 0}
                onChange={(v) =>
                  setInputs((prev) => ({
                    ...prev,
                    myParcel: {
                      name: prev.myParcel?.name ?? 'My parcel',
                      land: prev.myParcel?.land ?? 0,
                      imp: v === '' ? 0 : v,
                    },
                  }))
                }
              />
            )}
          </FormField>
        </div>
        {myBill ? <YourBillCard bill={myBill} shiftPct={shiftPct} /> : null}

        <h2 className={styles.sectionHeading}>Parcel Comparison</h2>
        <div className={styles.chartWrap}>
          <ParcelComparisonChart bills={sampleBills} />
        </div>
      </AriaLive>
    </section>
  );
}

function YourBillCard({ bill, shiftPct }: { bill: ParcelBill; shiftPct: number }) {
  const pct = bill.today > 0 ? (bill.delta / bill.today) * 100 : 0;
  return (
    <div className={styles.myBill}>
      <ResultDisplay label="Today's tax" value={formatCurrency(bill.today, { maximumFractionDigits: 0 })} />
      <ResultDisplay
        label={`New tax at ${shiftPct}% shift`}
        value={formatCurrency(bill.next, { maximumFractionDigits: 0 })}
        emphasis="primary"
      />
      <ResultDisplay
        label="Change"
        value={`${bill.delta >= 0 ? '+' : ''}${formatCurrency(bill.delta, { maximumFractionDigits: 0 })} (${formatPercent(pct / 100)})`}
      />
      <ResultDisplay
        label="Pure LVT (100% shift)"
        value={formatCurrency(bill.pure, { maximumFractionDigits: 0 })}
      />
    </div>
  );
}

export default WinstonSalemLvtComponent;
