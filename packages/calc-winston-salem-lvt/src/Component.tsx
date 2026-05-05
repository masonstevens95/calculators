import { useMemo, useState } from 'react';
import { AriaLive, CurrencyInput, FormField, ResultDisplay } from '@calc/ui';
import { formatCurrency, formatNumber, formatPercent } from '@calc/domain-utils';
import { computeLvt, computeParcelBill, computeRates } from './domain';
import type { LvtInputs, ParcelBill } from './domain';
import { SAMPLE_PARCELS, WS_BASE, WS_HOUSEHOLDS, WS_POPULATION } from './parcels';
import { ParcelComparisonChart } from './charts/ParcelComparisonChart';
import styles from './Component.module.css';

const DEFAULT_INPUTS: LvtInputs = {
  shift: 0,
  myParcel: { name: 'My parcel', land: 50_000, imp: 230_000 },
};

type TabId = 'city' | 'classes' | 'you' | 'raise';

type RevenueUse = 'dividend' | 'rebate' | 'teachers' | 'transit' | 'housing';

const REVENUE_USES: ReadonlyArray<{ id: RevenueUse; label: string; description: string }> = [
  {
    id: 'dividend',
    label: "Citizens' dividend",
    description: 'Split equally among W-S residents as a per-person cash payment.',
  },
  {
    id: 'rebate',
    label: 'Property-tax rebate',
    description: 'Returned to existing property owners as a per-household discount.',
  },
  {
    id: 'teachers',
    label: 'Hire teachers',
    description: 'Funds additional teachers in the W-S/Forsyth district.',
  },
  {
    id: 'transit',
    label: 'Expand transit',
    description: 'Pays for additional bus service hours on existing or new routes.',
  },
  {
    id: 'housing',
    label: 'Build affordable housing',
    description: 'Closes the subsidy gap on additional below-market units.',
  },
];

// Rough per-unit cost assumptions for the "what could it fund" framing.
// Deliberately kept ballpark — the panel labels these as illustrative.
const UNIT_COSTS = {
  /** Loaded teacher salary (median NC base ~$54k + benefits). */
  teacher: 70_000,
  /** Annual fixed-route bus service hour, FTA-style operating cost. */
  busHour: 100,
  /** Per-unit subsidy gap typical of LIHTC affordable-housing financing. */
  housingUnit: 100_000,
} as const;

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
  const [revenueScale, setRevenueScale] = useState<number>(1);
  const [revenueUse, setRevenueUse] = useState<RevenueUse>('dividend');

  const computation = useMemo(() => computeLvt(inputs), [inputs]);

  // Extrapolation lives in its own scope so revenueScale changes don't disturb
  // the other three (revenue-neutral) tabs.
  const raise = useMemo(() => {
    const ratesScaled = computeRates(inputs.shift, WS_BASE, revenueScale);
    const ratesBaseline = computeRates(inputs.shift, WS_BASE, 1);
    const sampleScaled = SAMPLE_PARCELS.map((p) => computeParcelBill(p, ratesScaled, WS_BASE.rate));
    const sampleBaseline = SAMPLE_PARCELS.map((p) =>
      computeParcelBill(p, ratesBaseline, WS_BASE.rate),
    );
    const extra = ratesScaled.target - ratesBaseline.target;
    const dividend = extra / WS_POPULATION;
    const myScaled = inputs.myParcel
      ? computeParcelBill(inputs.myParcel, ratesScaled, WS_BASE.rate)
      : undefined;
    return { ratesScaled, sampleScaled, sampleBaseline, extra, dividend, myScaled };
  }, [inputs.shift, inputs.myParcel, revenueScale]);

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

  // Citywide revenue moved from improvement-heavy parcels to land-heavy ones.
  // Equals the building-tax revenue no longer collected (= s × baseRate × I),
  // which by revenue-neutrality equals the extra land-tax revenue
  // (= (landRate − baseRate) × L). Computed from the rates so the relationship
  // to the published WS_BASE figures stays visible.
  const cityWideShift = (rates.landRate - WS_BASE.rate) * WS_BASE.L;
  const myDelta = myBill?.delta ?? 0;
  const mySubline = !myBill
    ? 'enter values'
    : myDelta < 0
      ? 'you pay less'
      : myDelta > 0
        ? 'you pay more'
        : 'no change';
  const scalePct = Math.round((revenueScale - 1) * 100);

  return (
    <section className={styles.layout} aria-labelledby="lvt-heading">
      <div className={styles.header}>
        <h1 id="lvt-heading" className={styles.heading}>
          Winston-Salem LVT Calculator
        </h1>
        <p className={styles.subtitle}>
          A <strong>Land Value Tax (LVT)</strong> taxes land at a higher rate than the buildings on
          it — leaving today&apos;s property-tax revenue untouched, but shifting <em>who</em> pays. The
          case for it: vacant lots and surface parking start paying their share, productive use of
          land is rewarded, and (advocates argue) housing supply, redevelopment, and downtown
          vibrancy improve over time. This calculator shows how the trade-off lands across
          Winston-Salem property types — and on your own bill.
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
          value={
            cityWideShift > 0
              ? `${formatCurrency(cityWideShift, { maximumFractionDigits: 0 })} shifts`
              : '—'
          }
          subline="from buildings to land, citywide"
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
        <TabCard
          id="lvt-tab-raise"
          panelId="lvt-panel-raise"
          label="Raise revenue"
          value={
            raise.extra > 0
              ? `+${formatCurrency(raise.extra, { maximumFractionDigits: 0 })}`
              : '—'
          }
          subline="above current city collection"
          active={tab === 'raise'}
          onSelect={() => setTab('raise')}
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
          <p className={styles.sectionIntro}>
            At {shiftPct}% shift,{' '}
            <strong>
              {cityWideShift > 0
                ? formatCurrency(cityWideShift, { maximumFractionDigits: 0 })
                : '$0'}
            </strong>{' '}
            of citywide property tax moves from buildings to land — that&apos;s the building-tax revenue
            the city no longer collects, picked up instead from the same land base. The seven
            archetypes below show <em>which kinds</em> of parcels feel that shift in either
            direction.
          </p>

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

        <div
          role="tabpanel"
          id="lvt-panel-raise"
          aria-labelledby="lvt-tab-raise"
          hidden={tab !== 'raise'}
          className={styles.tabPanel}
        >
          <h2 className={styles.sectionHeading}>Raise revenue</h2>
          <p className={styles.sectionIntro}>
            The other tabs hold city revenue flat — a pure shift in <em>who</em> pays. Drag this
            slider to ask a different question: what if Winston-Salem also collected{' '}
            <em>more</em> via land tax? At {scalePct === 0 ? 'baseline' : `${scalePct}% above baseline`},
            the city would raise{' '}
            <strong>{formatCurrency(raise.ratesScaled.target, { maximumFractionDigits: 0 })}</strong>
            {raise.extra > 0 ? (
              <>
                {' '}— that&apos;s{' '}
                <strong>+{formatCurrency(raise.extra, { maximumFractionDigits: 0 })}</strong> above
                today.
              </>
            ) : (
              <> — same as today.</>
            )}
          </p>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Revenue multiplier</h3>
            <FormField
              label={`${revenueScale.toFixed(2)}× current revenue${
                scalePct > 0 ? ` (+${scalePct}%)` : ''
              }`}
              hint="1.00× = today's $193M target. 2.00× = double today's collection."
            >
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  type="range"
                  min={100}
                  max={200}
                  step={5}
                  value={Math.round(revenueScale * 100)}
                  onChange={(e) => setRevenueScale(Number(e.target.value) / 100)}
                  className={styles.slider}
                />
              )}
            </FormField>
          </section>

          <h3 className={styles.sectionHeading}>Where the extra comes from</h3>
          <div className={styles.scrollX}>
            <table className={styles.parcelTable}>
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Today</th>
                  <th>At {revenueScale.toFixed(2)}×</th>
                  <th>Extra paid</th>
                </tr>
              </thead>
              <tbody>
                {raise.sampleScaled.map((b, i) => {
                  const baseline = raise.sampleBaseline[i]!;
                  const extra = b.next - baseline.next;
                  return (
                    <tr key={b.parcel.name}>
                      <td>{b.parcel.name}</td>
                      <td>{formatCurrency(baseline.next, { maximumFractionDigits: 0 })}</td>
                      <td>{formatCurrency(b.next, { maximumFractionDigits: 0 })}</td>
                      <td className={extra > 0 ? styles.up : ''}>
                        {extra > 0 ? '+' : ''}
                        {formatCurrency(extra, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className={styles.sectionHeading}>
            What could {raise.extra > 0 ? formatCurrency(raise.extra, { maximumFractionDigits: 0 }) : 'this revenue'} fund?
          </h3>
          <fieldset className={styles.useFieldset}>
            <legend className={styles.visuallyHidden}>How the extra revenue could be used</legend>
            {REVENUE_USES.map((use) => (
              <label
                key={use.id}
                className={`${styles.useOption} ${revenueUse === use.id ? styles.useOptionActive : ''}`}
              >
                <input
                  type="radio"
                  name="revenue-use"
                  value={use.id}
                  checked={revenueUse === use.id}
                  onChange={() => setRevenueUse(use.id)}
                />
                <span className={styles.useOptionLabel}>{use.label}</span>
                <span className={styles.useOptionDesc}>{use.description}</span>
              </label>
            ))}
          </fieldset>

          <RevenueUseCard
            use={revenueUse}
            extra={raise.extra}
            myExtra={
              raise.myScaled && inputs.myParcel
                ? raise.myScaled.next -
                  computeParcelBill(
                    inputs.myParcel,
                    computeRates(inputs.shift, WS_BASE, 1),
                    WS_BASE.rate,
                  ).next
                : null
            }
          />
          <p className={styles.useFootnote}>
            Per-unit costs are rough illustrations, not budget-grade estimates. Actual figures
            depend on contracts, salaries, and project mix in any given year.
          </p>

          <p className={styles.tieBack}>
            This tab leaves revenue-neutrality. The other three tabs assume the city collects the
            same total it does today —{' '}
            <button type="button" className={styles.tieLink} onClick={() => setTab('city')}>
              return to the City Budget view →
            </button>
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

type RevenueUseCardProps = {
  use: RevenueUse;
  extra: number;
  /** Extra dollars this user's parcel pays at the current scale, or null. */
  myExtra: number | null;
};

function RevenueUseCard({ use, extra, myExtra }: RevenueUseCardProps) {
  if (extra <= 0) {
    return (
      <div className={styles.myBill}>
        <ResultDisplay
          label="Drag the multiplier above 1.00× to see funding scenarios"
          value="—"
        />
      </div>
    );
  }

  switch (use) {
    case 'dividend': {
      const perPerson = extra / WS_POPULATION;
      return (
        <div className={styles.myBill}>
          <ResultDisplay
            label={`Per-resident dividend (W-S pop. ${formatNumber(WS_POPULATION, { fractionDigits: 0 })})`}
            value={formatCurrency(perPerson, { maximumFractionDigits: 0 })}
            emphasis="primary"
          />
          {myExtra !== null ? (
            <ResultDisplay
              label="Your net (extra paid − your dividend)"
              value={fmtSignedCurrency(myExtra - perPerson)}
            />
          ) : null}
        </div>
      );
    }
    case 'rebate': {
      const perHousehold = extra / WS_HOUSEHOLDS;
      return (
        <div className={styles.myBill}>
          <ResultDisplay
            label={`Per-household rebate (${formatNumber(WS_HOUSEHOLDS, { fractionDigits: 0 })} households)`}
            value={formatCurrency(perHousehold, { maximumFractionDigits: 0 })}
            emphasis="primary"
          />
          {myExtra !== null ? (
            <ResultDisplay
              label="Your net (extra paid − your rebate)"
              value={fmtSignedCurrency(myExtra - perHousehold)}
            />
          ) : null}
        </div>
      );
    }
    case 'teachers': {
      const teachers = Math.floor(extra / UNIT_COSTS.teacher);
      return (
        <div className={styles.myBill}>
          <ResultDisplay
            label="Additional teachers funded for one year"
            value={`≈ ${formatNumber(teachers, { fractionDigits: 0 })}`}
            emphasis="primary"
          />
          <ResultDisplay
            label="Assumed loaded salary"
            value={formatCurrency(UNIT_COSTS.teacher, { maximumFractionDigits: 0 })}
          />
        </div>
      );
    }
    case 'transit': {
      const hours = Math.floor(extra / UNIT_COSTS.busHour);
      return (
        <div className={styles.myBill}>
          <ResultDisplay
            label="Annual bus service hours funded"
            value={`≈ ${formatNumber(hours, { fractionDigits: 0 })}`}
            emphasis="primary"
          />
          <ResultDisplay
            label="Assumed cost per service hour"
            value={formatCurrency(UNIT_COSTS.busHour, { maximumFractionDigits: 0 })}
          />
        </div>
      );
    }
    case 'housing': {
      const units = Math.floor(extra / UNIT_COSTS.housingUnit);
      return (
        <div className={styles.myBill}>
          <ResultDisplay
            label="Affordable units financed (subsidy gap closed)"
            value={`≈ ${formatNumber(units, { fractionDigits: 0 })}`}
            emphasis="primary"
          />
          <ResultDisplay
            label="Assumed gap funding per unit"
            value={formatCurrency(UNIT_COSTS.housingUnit, { maximumFractionDigits: 0 })}
          />
        </div>
      );
    }
  }
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
      <dt className={styles.rateLabelRow}>
        <span className={styles.rateLabel}>
          {label}
          {sublabel ? <span className={styles.rateLabelSub}> ({sublabel})</span> : null}
        </span>
        <span className={styles.rateValue}>{value}</span>
      </dt>
      <dd className={styles.rateDesc}>{description}</dd>
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
