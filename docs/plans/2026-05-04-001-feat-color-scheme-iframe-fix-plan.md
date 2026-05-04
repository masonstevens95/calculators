---
title: 'feat: Declare color-scheme to fix iframe canvas substitution'
type: feat
status: completed
date: 2026-05-04
deepened: 2026-05-04
---

# feat: Declare `color-scheme` to fix iframe canvas substitution

## Summary

Declare `color-scheme: light dark` on `:root` and pin `:root` background-color and color to explicit hex (`#ffffff` / `#111827`) matching the light-mode component palette already shipped, in both `apps/remote/index.html` and `apps/harness/index.html`. Eliminates the W3C-spec'd iframe opaque-canvas substitution failure that today causes a clashing background when the calc is embedded in a dark-OS Substack reader (or any host whose color-scheme differs from the iframe's). Independent of any larger theming architecture; this is the minimal correctness fix.

## Requirements

- R1. The iframe's `:root` declares `color-scheme: light dark` so the browser stops substituting an opaque canvas when the host's color-scheme differs from the iframe's
- R2. The iframe's `:root` sets explicit `background-color` and `color` so the browser does not fall back to its own canvas defaults
- R3. Pin `:root` background-color and color to explicit hex (`#ffffff` / `#111827`) matching the light-mode component palette already shipped, eliminating the iframe substitution clash without introducing a contrast regression on out-of-card text (per-calc page headings, home-page lede, form-control faces all sit directly on the canvas in the EmbedLayout iframe path)
- R4. Calc surfaces (cards, form inputs, chart panels, brand accents) remain unchanged in this scope — only the page-level canvas adapts
- R5. Apply the fix to both `apps/remote/index.html` (production iframe entry) and `apps/harness/index.html` (dev parity)
- R6. No JavaScript runtime change; no new stylesheet file; no `main.tsx` or component touch

## Scope Boundaries

- Calc surface dark-mode adaptation (cards, inputs, breakdown tables) — out of scope; covered by survivor #2 (token system) in the calculators-theming ideation
- Brand accent dark variants (Surry green, LGS dark, Olamina indigo, EU5 amber, LVT green, Birchwood pink) — out of scope; survivor #2
- `light-dark()` value functions for token authoring — out of scope; survivor #3
- postMessage theme handshake at the federation shell — out of scope; survivor #4
- User-facing theme toggle in calc UI — out of scope; survivor #5
- Form-control chrome (native scrollbar / `<select>` chevron / number-spinner glyphs may render in UA-dark colors on dark-OS visitors) — minor visual artifact, not addressed in this scope

### Deferred to Follow-Up Work

- A separate plan picking up survivor #2 (three-tier semantic token pipeline in `@calc/ui` + TS mirror for Chart.js + codemod) is the natural next step after this fix lands. This plan deliberately does not advance any token-system work — its scope is the canvas-correctness fix only.

## Context & Research

### Relevant Code and Patterns

- `apps/remote/index.html` — production SPA shell loaded via Vite + Module Federation 2.0; mounts at `<div id="root">` and bootstraps via `/src/main.tsx` (which dynamic-imports `./bootstrap.tsx` for the MF async boundary).
- `apps/harness/index.html` — dev-only parallel shell; same minimal structure as remote; consumes `@apps/remote` via workspace `exports` (KTD #21 in the upstream rebuild plan at `docs/plans/2026-05-01-001-feat-calculators-microfrontend-react-rebuild-plan.md`).
- No existing global stylesheet — the project uses CSS Modules per component (`packages/ui/src/*.module.css`, per-calc `Component.module.css`). Theme work historically had no global anchor point, which is why this fix lives inline in `index.html` rather than reaching for a global file that doesn't exist.
- `vercel.json` — sends multi-directive CSP including `frame-ancestors 'self' https://*.substack.com https://substack.com` (KTD #11 in the upstream plan). No CSP change needed for this work — the fix is pure markup/CSS, served from `'self'`, and sets only standard CSS properties.

### External References

- [W3C CSS Color Adjustment Module Level 1 — Used Color Scheme](https://www.w3.org/TR/css-color-adjust-1/) — normative spec for `color-scheme` and the iframe opaque-canvas substitution rule
- [CSSWG Issue #4772 — color-scheme should affect embedded iframes](https://github.com/w3c/csswg-drafts/issues/4772) — the working-group resolution that codified the substitution behavior
- [MDN — `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) — used color scheme + iframe substitution behavior. (`Canvas` / `CanvasText` system colors were considered as the value for `:root` but rejected per KTD #1 — see Document Review round 1 for the contrast-regression analysis.)
- [Florens Verschelde — Transparent iframes and dark mode](https://fvsch.com/transparent-iframes) — production-grade analysis of the failure mode by browser
- Vimeo player and Figma embed players resolved this with the same shape (see fvsch.com analysis); this is established prior art at scale

## Key Technical Decisions

- **Use pinned hex (`#ffffff` / `#111827`) on `:root`, NOT `Canvas` / `CanvasText`.** Rationale: every calc CSS file pins light-mode hex (Surry green `#2d6a4f`, Olamina indigo `#4338ca`, EU5 amber `#b45309`, LGS dark `#1f2937`, etc.); matching the canvas removes the contrast debt entirely. The EmbedLayout iframe path renders `.main { background: transparent }`, so calc page headings and the home-page lede paint directly on whatever the canvas is — `Canvas`/`CanvasText` would make `#1f2937` near-invisible on a dark-OS visitor's auto-adapted dark canvas. Pinning to light hex eliminates this regression while still resolving the W3C iframe substitution rule (the substitution is governed by the presence of an explicit `:root` background-color, not by which color is chosen). When survivor #2's token system arrives, both the canvas pin and the component hex flip to `light-dark()` together as one coherent unit — today's hex pin is the natural seam.
- **Keep `color-scheme: light dark` on `:root` for forward-compat.** The W3C iframe substitution rule fires on `color-scheme` mismatch between host and iframe; declaring `light dark` plus an explicit background satisfies the rule. Forward-compat: when survivor #2 ships `light-dark()` token authoring, it requires `color-scheme: light dark` to be declared — establishing it now means the token migration is a value-only change.
- **Inline the rule as a `<style>` block in each `index.html`.** No new global stylesheet file. Two `index.html` files are the right boundary for a fix that exists at the canvas/document level — adding a `global.css` imported into `main.tsx` would force this rule through the bundler and through React mount, defeating the "applies before any paint" property that makes the fix trustworthy and CSP-friendly under `script-src 'self'`.
- **Apply to both production (`apps/remote/index.html`) and harness (`apps/harness/index.html`).** Harness is dev-only but mirrors the production shell. Keeping them aligned avoids a class of "looks fine in dev, broken in prod" surprises (or the inverse).
- **No JavaScript change.** This fix is intentionally CSS-only and applies before any React mount or MF chunk load. It survives the strict CSP `script-src 'self'` regardless and eliminates an entire class of timing failure modes (no FOUC, no race against the MF runtime).
- **CSP dependency: `style-src 'self' 'unsafe-inline'` permits the inline `<style>` block.** The current `vercel.json` declares this. If a future hardening pass removes `'unsafe-inline'` (a common audit recommendation), this fix breaks silently and the three properties must be relocated into either a same-origin stylesheet linked from `<head>` or a hashed/nonced inline style. Recorded here so the dependency is visible to any future CSP-tightening review.
- **Pair the CSS rule with a `<meta name="color-scheme" content="light dark">` declaration.** The CSS rule is the load-bearing one (the MDN-documented mechanism MUST be respected); the meta tag is the legacy-UA supplement and signals intent to crawlers / preview generators that may not parse CSS.

## Open Questions

### Resolved During Planning

- System colors vs pinned hex → chose pinned hex (`#ffffff` / `#111827`) — Canvas/CanvasText would auto-adapt the page canvas but make per-calc page headings, home-page lede, and form-control faces low-contrast on dark-OS visits in the EmbedLayout iframe path (where `.main` is `background: transparent`). Pinning canvas to match the existing light-mode component palette removes the regression. See KTD #1.
- `color-scheme: light dark` retained → satisfies the W3C iframe substitution rule and preserves the forward-compat path for survivor #2's `light-dark()` token authoring
- Inline `<style>` vs separate global stylesheet → chose inline in each `index.html`
- Scope of harness parity → include harness for dev/prod alignment
- CSS-only vs JS-driven → CSS-only; no main.tsx or bootstrap touch
- CSP dependency on `style-src 'unsafe-inline'` → recorded explicitly in KTD so future CSP-hardening reviews know to migrate the inline rule rather than silently breaking it

### Deferred to Implementation

- Manual visual confirmation that Vite's HTML processing preserves the `<style>` block verbatim (it should — Vite treats `<head>`-level inline CSS in HTML as opaque content unless `transformIndexHtml` is overridden, and `apps/remote/vite.config.ts` does not override it). Verify by inspecting `apps/remote/dist/index.html` after `pnpm build`.
- Confirm Substack-iframe-in-dark-OS behavior post-deploy in a real Substack draft (lives in U1's verification — listed here only because the confirmation requires the deployed URL).

## Implementation Units

- U1. **Add `color-scheme` declaration and pinned-hex `:root` styles to both shell entry HTMLs**

**Goal:** Eliminate the W3C iframe opaque-canvas substitution failure by declaring the canvas color contract in both production and dev HTML shells.

**Requirements:** R1, R2, R3, R5, R6

**Dependencies:** None

**Files:**
- Modify: `apps/remote/index.html`
- Modify: `apps/harness/index.html`
- Test: none — pure markup change

**Approach:**
- In each `<head>`, after the existing `<meta name="viewport">`, add `<meta name="color-scheme" content="light dark">` so legacy UAs that don't read CSS `color-scheme` still receive the signal.
- Also in each `<head>`, add a `<style>` block with `:root { color-scheme: light dark; background-color: #ffffff; color: #111827; }`. Three properties, one selector. The CSS rule is the load-bearing one (the MDN-documented mechanism); the meta is belt-and-suspenders.
- Place the `<style>` block before the existing `</head>` closing tag, above any script tags Vite/MF inject. The MF Vite plugin appends `<script type="module" src="/mf-entry-bootstrap-0.js">` and a `<link rel="modulepreload">` into `<head>` at build time; the no-FOUC property requires the `<style>` to parse before the bootstrap script executes. Inserting after the existing `<meta name="viewport">` (and before any script tags) satisfies this.
- Place the rule on `:root` (the document root), not `body` or `#root`. The W3C substitution behavior is driven by the document's used color scheme, which is governed by `:root`.
- Do not add `min-height`, padding, font, or any other rule beyond the three properties needed for the canvas contract — we are explicitly not styling content here, just declaring the canvas. Future token work owns content styling.

**Patterns to follow:**
- Vimeo / Figma embed players resolved this with the same `:root { color-scheme; background-color; color }` shape (see fvsch.com analysis in External References).

**Test scenarios:**
- Test expectation: none — pure markup change with no behavioral surface in the existing Vitest suite. Verification is manual visual + a single `grep` correctness check.

**Verification:**
- `grep -n "color-scheme" apps/remote/index.html apps/harness/index.html` shows the new lines in both files.
- `pnpm --filter @apps/remote build` succeeds; `apps/remote/dist/index.html` contains the inline `<style>` block (Vite preserves head-level inline CSS by default).
- Manual visual check 1 (light OS, direct visit to harness `http://localhost:5173/`): page renders unchanged from current behavior — light page, light calc cards.
- Manual visual check 2 (dark OS, direct visit): page renders an explicitly-light page canvas (no clash with surrounding dark Substack page; no contrast regression on calc heading, subtitle, or home-page lede). Spot-check (a) per-calc page heading + subtitle, (b) home-page lede paragraph, (c) form-input and `<select>` faces, (d) card edges — all should match today's light-mode appearance. The fix replaces UA opaque-canvas substitution with a deterministic light canvas pinned to the existing component palette.
- Manual visual check 3 (post-deploy, Substack draft with iframe block, dark-OS reader): the iframe declares its own light canvas instead of getting browser-substituted with an arbitrary opaque background, so no clash with the surrounding Substack dark page. Confirm no console errors; calc remains interactive.
- Note any UA artifact on number-spinner arrows or `<select>` chevrons in dark-OS visits; document under "known minor" rather than fixing in this scope (covered by Scope Boundaries).

---

- U2. **Document the canvas-substitution fix in `docs/portfolio-integration.md` and `docs/deployment.md`**

**Goal:** Make the new canvas-color contract discoverable for host integrators and deploy-runbook readers, since the change alters iframe rendering behavior for dark-OS visitors.

**Requirements:** R3 (downstream visibility); supports the larger product framing — host integrators should know the iframe adapts to OS preference and that this is the *only* current adaptation mechanism (no full token system yet).

**Dependencies:** U1

**Files:**
- Modify: `docs/portfolio-integration.md`
- Modify: `docs/deployment.md`
- Test: none — pure docs change

**Approach:**
- In `docs/portfolio-integration.md`, add a short subsection (4–6 lines) under a new heading like `Canvas color-scheme behavior` explaining: the iframe declares `color-scheme: light dark` plus an explicit light canvas (`background-color: #ffffff; color: #111827`) on `:root`, which prevents the W3C UA opaque-canvas substitution rule from firing on host/iframe color-scheme mismatch. Calc surfaces are light-only at v1 — full dark-mode adaptation is a separate roadmap item (survivor #2 token system).
- In `docs/deployment.md`, add the same paragraph or a one-line cross-reference under the existing post-deploy verification list, naming a dark-OS visual check as part of the spot-check.
- Be precise about scope: this is a canvas-correctness fix, not a theming feature. Do NOT promise dark-mode calc surfaces in either doc.

**Patterns to follow:**
- The existing `docs/portfolio-integration.md` "CORS" and "Error fallback contract" subsections — same level of brevity, same prose register.

**Test scenarios:**
- Test expectation: none — docs prose.

**Verification:**
- New subsection in `docs/portfolio-integration.md` accurately describes the contract ("iframe declares an explicit light page canvas to prevent UA opaque-canvas substitution; calc surfaces remain light at v1; full OS-adaptive theming is a future roadmap item").
- `docs/deployment.md` post-deploy verification names a dark-OS visual check.
- A reader new to the project can find the iframe-canvas behavior contract by grepping docs for `color-scheme`.

## Documentation / Operational Notes

- The post-deploy verification list in `docs/deployment.md` gains a manual dark-OS visual check (covered by U2).
- No CSP-header change in this plan. The inline `<style>` works because `vercel.json` declares `style-src 'self' 'unsafe-inline'` (KTD #11 in the upstream rebuild plan). Recorded in KTD here so a future CSP-hardening pass that drops `'unsafe-inline'` knows to migrate the three `:root` properties into a same-origin stylesheet linked from `<head>` rather than silently breaking this fix.
- No CORS or rollout change. The fix is invisible to monitoring and logs — its effect is purely in browser rendering.
- Future work on full dark-mode adaptation (survivors #2–#5 from the calculators-theming ideation) builds on the foundation laid here. Specifically, when a token-system semantic layer arrives, those tokens will be authored as `light-dark()` calls — but `light-dark()` requires `color-scheme: light dark` to be declared, which this plan establishes. The pinned-hex `:root` values flip to `light-dark()` calls at the same time as component values, as one coherent token migration.

## Sources & References

- Origin (ideation): in-conversation `/ce-ideate` survivor #1; not persisted to `docs/ideation/`. Raw candidates and survivors archived at `/tmp/compound-engineering/ce-ideate/a22a5e7d/raw-candidates.md` and `/tmp/compound-engineering/ce-ideate/a22a5e7d/survivors.md` for this session.
- Brainstorm: in-conversation announce-mode synthesis from `/ce-brainstorm solution 1` (immediately prior); no `docs/brainstorms/*-requirements.md` was written for this fix.
- W3C CSS Color Adjust Module Level 1: https://www.w3.org/TR/css-color-adjust-1/
- CSSWG resolution: https://github.com/w3c/csswg-drafts/issues/4772
- MDN `color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme
- MDN system colors: https://developer.mozilla.org/en-US/docs/Web/CSS/system-color
- Florens Verschelde — Transparent iframes and dark mode: https://fvsch.com/transparent-iframes
- Related upstream plan (KTD #11 CSP, KTD #21 harness/remote workspace exports, KTD #20 federation router shape): `docs/plans/2026-05-01-001-feat-calculators-microfrontend-react-rebuild-plan.md`
