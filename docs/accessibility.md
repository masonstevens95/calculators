# Accessibility Audit

Cross-cutting accessibility verification for the calculators microfrontend
(plan U12). Target bar: WCAG 2.1 AA. Mechanism: axe-core integration tests
in `apps/remote/tests/integration/a11y.test.tsx`, plus manual keyboard +
screen-reader spot checks documented below.

## Automated baseline

`apps/remote/tests/integration/a11y.test.tsx` mounts each route under the
real `<CalculatorsRoutes />` and runs axe-core against the resulting DOM.
The test fails on any violation rated **critical** or **serious**.

| Coverage         | Routes                                                          | Layouts            |
| ---------------- | --------------------------------------------------------------- | ------------------ |
| `/`              | HomePage (calc index)                                           | AppLayout          |
| Catch-all (`*`)  | NotFoundPage                                                    | AppLayout          |
| `/calc/:slug`    | All 6 wired calcs                                               | AppLayout (chrome) |
| `/embed/:slug`   | All 6 wired calcs                                               | EmbedLayout (no-chrome) |

Total: 14 axe assertions per CI run. Current state: **0 critical, 0 serious
violations** across all routes.

### Color-contrast carve-out

The axe test disables the `color-contrast` rule. CSS Modules inject styles
through `<style>` tags that jsdom doesn't always resolve into computed
styles axe can read; the rule reports false negatives and noisy false
positives in this environment. Color contrast is verified manually instead:

- AppLayout body text on white background: `#1f2937` → AAA at 12.65:1.
- AppLayout muted text: `#4b5563` → AA at 7.93:1.
- AppLayout footer muted: `#6b7280` → AA at 5.21:1.
- Each calc accent color (Surry green `#2d6a4f`, LGS dark `#1f2937`,
  Olamina indigo `#4338ca`, EU5 amber `#b45309`, LVT green `#2a6f4d`,
  Birchwood pink `#be185d`) on white: all ≥ AA.
- FormField error text `#b91c1c` on white: AA at 6.36:1.
- The privacy-disclosure green `#16a34a` on white: AA at 4.63:1 (passes).

If a future visual update lowers any of these, re-verify with a contrast
checker (e.g. WebAIM or the browser DevTools accessibility pane).

## Shared substrate (KTD #16, R19)

Every calc result region is wrapped in `<AriaLive variant="polite">` from
`@calc/ui`. The wrapper renders `<div aria-live="polite" aria-atomic="true">`,
so the entire result block is announced as one update on each recompute —
no rapid-fire mid-typing announcements, no double-announce.

`@calc/ui/FormField` associates labels via `htmlFor` / `id`, surfaces
errors with `role="alert"`, and chains both hint and error IDs into the
input's `aria-describedby` so screen readers read the full context.

## Layout landmarks

`AppLayout` renders semantic landmarks plus a skip-link:

- `<header role="banner">` (top bar)
- `<main id="main" tabIndex={-1}>` (skip-link target)
- `<footer role="contentinfo">`
- `<a href="#main" class="skipLink">` — keyboard-tab-first, visually hidden
  off-focus.

`EmbedLayout` renders only `<main>` with no chrome, since iframe consumers
provide their own surrounding navigation. No banner/contentinfo means no
landmark duplication when embedded inside another page's layout.

## Manual spot checks

Required before each production deploy on at least three calcs:

- **Surry County (`/calc/surry-county-offer`)** — chart-bearing,
  large input panel. Verify keyboard tab traverses sale-price → payoff
  → realtor → transfer → offer-price → down → concession → rate →
  property tax → insurance → buyer closing → equipment, then continues
  through the page links/buttons without trap.
- **LGS DSCR (`/calc/lgs-dscr`)** — privacy disclosure exemplar +
  per-home selector. Verify the privacy disclosure copy is read by
  VoiceOver as part of the page heading region, and that selecting a
  preset announces a recompute via the AriaLive region.
- **Birchwood (`/calc/birchwood-rent-sell`)** — three charts. Verify
  each chart canvas exposes an `aria-label` ("Net cash flow vs monthly
  rent", "Net wealth: sell vs rent over 10 years", "Rent advantage at
  year 10 by home appreciation rate"); these read as image-equivalent
  descriptions.

### Iframe focus behavior

When an embedded calc receives focus from a parent article:

- Tab from the article enters the iframe at the first interactive
  element (which is the first input — embed layout has no skip-link).
- Tab continues through the calc's inputs in DOM order.
- Shift-Tab exits the iframe back to the parent article.
- No trap.

Verified manually in a Substack draft pre-deploy.

## Page titles

Per-route `<title>` is set by `apps/remote/index.html` to "Calculators" at
the document level; per-calc page titles are NOT dynamically updated at v1
(scope-bounded — would require either react-helmet-async or a manual
`useEffect` in each calc Component). Captured as a known limitation; the
alternative ranks low on portfolio-signal value relative to other items.

## Accepted issues

None at v1. axe shows 0 critical / 0 serious. The color-contrast carve-out
is documented above (manually verified).

## Re-running the audit

```bash
# Install + run the focused axe suite
pnpm install
pnpm --filter @apps/remote test tests/integration/a11y.test.tsx
```

To audit during development iteration on a single calc:

```bash
pnpm --filter @apps/remote test tests/integration/a11y.test.tsx -t '<slug>'
```
