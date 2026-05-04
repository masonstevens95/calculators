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

type TabId = 'city' | 'classes' | 'you';

function fmtRate(r: number): string {
  return `$${(r * 100).toFixed(4)}/$100`;
}

function fmtSignedCurrency(v: number): string {
  if (v === 0) return formatCurrency(0, { maximumFractionDigits: 0 });
  const sign = v > 0 ? '+' : '−';
  return `${sign}${formatCurrency(Math.abs(v), { maximumFractionDigits: 0 })}`;
}

export function WinstonSalemLvtComponent() {
  const [inputs, setInputs] = useState<LvtInputs>(DEFAULT_INPUTS);
  const [tab, setTab] = useState<TabId>('city');

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

  const kDisplay = Number.isFinite(rates.impliedK)
    ? `${formatNumber(rates.impliedK, { fractionDigits: 1 })}×`
    : '∞';
  const myDelta = myBill?.delta ?? 0;
  const mySubline = !myBill
    ? 'enter values'
    : myDelta < 0
      ? 'you pay less'
      : myDelta > 0
        ? 'you pay more'
        : 'no change';

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

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Shift toward LVT</h2>
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
      </section>

      <div role="tablist" aria-label="Impact perspective" className={styles.tabs}>
        <TabCard
          id="lvt-tab-city"
          panelId="lvt-panel-city"
          label="City budget"
          value={formatCurrency(rates.target, { maximumFractionDigits: 0 })}
          subline="held flat by design"
          active={tab === 'city'}
          onSelect={() => setTab('city')}
        />
        <TabCard
          id="lvt-tab-classes"
          panelId="lvt-panel-classes"
          label="Parcel types"
          value={kDisplay}
          subline="land vs. buildings ratio"
          active={tab === 'classes'}
          onSelect={() => setTab('classes')}
        />
        <TabCard
          id="lvt-tab-you"
          panelId="lvt-panel-you"
          label="Your bill"
          value={myBill ? fmtSignedCurrency(myDelta) : '—'}
          subline={mySubline}
          active={tab === 'you'}
          onSelect={() => setTab('you')}
        />
      </div>

      <AriaLive className={styles.results}>
        <div
          role="tabpanel"
          id="lvt-panel-city"
          aria-labelledby="lvt-tab-city"
          hidden={tab !== 'city'}
          className={styles.tabPanel}
        >
          <h2 className={styles.sectionHeading}>Required Rates</h2>
          <p className={styles.sectionIntro}>
            These four rates are what the city would need to set to keep total property-tax revenue
            at <strong>{formatCurrency(rates.target, { maximumFractionDigits: 0 })}</strong> while
            shifting {shiftPct}% of the burden onto land.
          </p>
          <dl className={styles.rateList}>
            <RateRow
              label="Land rate"
              value={fmtRate(rates.landRate)}
              description="Charged on the assessed value of land only. Climbs as you slide toward LVT — the city has to raise more from the same land base."
            />
            <RateRow
              label="Improvement rate"
              value={fmtRate(rates.impRate)}
              description="Charged on buildings and other improvements. Falls toward zero as the slider approaches 100%, which is the policy's whole point: stop punishing construction."
            />
            <RateRow
              label="Pure LVT rate"
              sublabel="reference: 100% shift"
              value={fmtRate(rates.pureLvtRate)}
              description="What the land rate would be if the city dropped the building tax entirely — the slider's far-right endpoint. Shown as a reference point even when you're not all the way there."
            />
            <RateRow
              label="Implied k"
              sublabel="land rate ÷ improvement rate"
              value={
                Number.isFinite(rates.impliedK)
                  ? `${formatNumber(rates.impliedK, { fractionDigits: 2 })}×`
                  : '∞'
              }
              description="How many times higher the land rate is than the improvement rate. 1× is today's uniform tax; ∞ is pure LVT. The bigger the ratio, the stronger the nudge to develop or sell underused land."
            />
          </dl>
          <p className={styles.tieBack}>
            Revenue is held flat — the shift is paid by{' '}
            <button type="button" className={styles.tieLink} onClick={() => setTab('classes')}>
              parcel-type redistribution →
            </button>
          </p>
        </div>

        <div
          role="tabpanel"
          id="lvt-panel-classes"
          aria-labelledby="lvt-tab-classes"
          hidden={tab !== 'classes'}
          className={styles.tabPanel}
        >
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

          <h2 className={styles.sectionHeading}>Parcel Comparison</h2>
          <div className={styles.chartWrap}>
            <ParcelComparisonChart bills={sampleBills} shift={inputs.shift} />
          </div>

          <p className={styles.tieBack}>
            See where your own parcel lands in{' '}
            <button type="button" className={styles.tieLink} onClick={() => setTab('you')}>
              Your bill →
            </button>
          </p>
        </div>

        <div
          role="tabpanel"
          id="lvt-panel-you"
          aria-labelledby="lvt-tab-you"
          hidden={tab !== 'you'}
          className={styles.tabPanel}
        >
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

          <p className={styles.tieBack}>
            Compare against the{' '}
            <button type="button" className={styles.tieLink} onClick={() => setTab('classes')}>
              parcel-type table →
            </button>{' '}
            to see who else moved.
          </p>
        </div>
      </AriaLive>
    </section>
  );
}

type TabCardProps = {
  id: string;
  panelId: string;
  label: string;
  value: string;
  subline: string;
  active: boolean;
  onSelect: () => void;
};

function TabCard({ id, panelId, label, value, subline, active, onSelect }: TabCardProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={panelId}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      className={`${styles.tab} ${active ? styles.tabActive : ''}`}
    >
      <span className={styles.tabLabel}>{label}</span>
      <span className={styles.tabValue}>{value}</span>
      <span className={styles.tabSubline}>{subline}</span>
    </button>
  );
}

type RateRowProps = {
  label: string;
  sublabel?: string;
  value: string;
  description: string;
};

function RateRow({ label, sublabel, value, description }: RateRowProps) {
  return (
    <div className={styles.rateRow}>
      <div className={styles.rateText}>
        <dt className={styles.rateLabel}>
          {label}
          {sublabel ? <span className={styles.rateLabelSub}> ({sublabel})</span> : null}
        </dt>
        <dd className={styles.rateDesc}>{description}</dd>
      </div>
      <div className={styles.rateValue}>{value}</div>
    </div>
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
