---
date: 2026-05-01
topic: calculators-microfrontend
---

# Calculators Microfrontend — React Rebuild

## Summary

A pnpm monorepo of 6–12 React calculators, each as a workspace package with a strict pure-logic / UI split, composed by a shell app exposed as a Module Federation remote consumed by the personal portfolio host. The same repo also serves chrome-free per-calculator URLs so a single calculator can be iframe-embedded into a Substack article. Pragmatic React-FP throughout with ≥ 80% of code living in pure functions; strict red→green→refactor TDD scoped to pure logic, with UI components covered by RTL without the strict cycle discipline.

---

## Problem Frame

A set of HTML calculators built earlier sits outside the portfolio's narrative — they are functional but show none of the React, FP, or TDD competence the portfolio is supposed to demonstrate. The portfolio site itself is a separate app; the calculators need to live alongside it as something the portfolio can compose, and at least one calculator needs to drop cleanly into a Substack article that is unrelated to the rebuild.

The pain has three shapes. First, the existing calculators don't generate signal for the engineering audience the portfolio is aimed at. Second, there is no shared substrate across calculators today, so each one reinvents validation, formatting, and result rendering. Third, the Substack article needs an embed surface that just works in a constrained host (iframes only, no script execution, no React expectations), independent of whatever the portfolio integration looks like. Without addressing all three, the rebuild either fails to land in the portfolio, fails to reuse work across calculators, or fails the article embed.

---

## Actors

- A1. **Portfolio visitor**: Reaches the portfolio site, sees calculators composed into portfolio pages via Module Federation. May land on an "all calculators" page or a deep-dive page for one calculator.
- A2. **Substack reader**: Reaches an unrelated Substack article that embeds one specific calculator as an iframe. Interacts with the calculator inline, never visits the calculators app directly.
- A3. **Direct visitor**: Lands on the deployed calculators app URL directly (possibly via shared link). Uses the shell index and per-calc routes as a standalone site.

---

## Key Flows

- F1. **Portfolio composition via federation**
  - **Trigger:** A1 navigates to a portfolio page that embeds calculator content.
  - **Actors:** A1.
  - **Steps:** Portfolio host fetches the federation entry from the deployed calculators URL. Host mounts either `<CalculatorsApp />` (the full experience) or a per-calculator component depending on the page. Visitor interacts with the calculator inside the portfolio's chrome.
  - **Outcome:** Calculator renders inside portfolio layout; only one copy of React executes; visitor experience is seamless across portfolio and calculator content.
  - **Covered by:** R3, R4, R5.

- F2. **Substack article iframe embed**
  - **Trigger:** A2 scrolls to the embedded calculator within an article.
  - **Actors:** A2.
  - **Steps:** Browser loads an iframe whose `src` points at a chrome-free per-calc URL on the calculators deployment. The calculator loads, validates inputs, and computes results entirely within the iframe.
  - **Outcome:** Reader uses the calculator without leaving the article; iframe works whether or not the portfolio host is reachable.
  - **Covered by:** R6, R7.

- F3. **Direct visit to the calculators app**
  - **Trigger:** A3 opens the deployed calculators URL in a browser.
  - **Actors:** A3.
  - **Steps:** Shell app renders an index of calculators; visitor navigates to a specific calc; per-calc page renders in framed (with-shell) mode by default.
  - **Outcome:** App is fully usable standalone; works as a fallback distribution channel.
  - **Covered by:** R3, R8.

---

## Inventory

The HTML originals live at `../old_calcs/` (adjacent to the repo, not inside it). Each is rewritten greenfield in React, with the HTML used as a behavior reference only.

- **I1. Birchwood Rent vs Sell Charts** — rent-vs-sell analysis with charted scenarios (real estate decision tool).
- **I2. EU5 Loan Break-Even Calculator** — loan break-even analysis covering loan terms, building value, tranche/gift inputs, wait-vs-borrow comparison, and net-profit-over-time charts.
- **I3. LGS DSCR Calculator** — DSCR calculator branded for LGS / Nationwide Homes; presets, build costs, loan parameters, per-home breakdown, summary.
- **I4. Olamina DSCR Calculator** — DSCR calculator with the same input model as I3 but different presets/branding (see Outstanding Questions for shared-core treatment).
- **I5. Winston-Salem LVT Calculator** — land value tax calculator with tax-base inputs, split-ratio → required-rates computation, parcel-type comparison bars, and a per-parcel estimate.
- **I6. Surry County Offer Calculator** — real estate offer calculator for Surry County, NC.

Six calculators is the floor of the 6–12 brainstormed range. Adding more is in scope but not required; planning should not assume additions.

---

## Requirements

**Architecture & composition**
- R1. The repo is structured as a pnpm workspace monorepo.
- R2. Each calculator is its own workspace package containing a pure-logic module (no React imports) and React UI components, with a clear public API.
- R3. A shell app composes calculator packages, providing routing, navigation, and the framed (with-shell) layout.
- R4. The shell app is built as a Module Federation remote that exposes both a full `<CalculatorsApp />` component and individual per-calculator components.
- R5. Federation is configured with shared dependencies (at minimum React and ReactDOM) and version pinning so a host that already loads React does not load a duplicate copy.

**Embed surfaces**
- R6. Each calculator is reachable at a stable per-calc URL that renders chrome-free (no shell navigation, header, or footer), suitable for iframe embedding.
- R7. The iframe embed path functions independently of Module Federation: a calculator embedded via iframe works even if the federation host is unreachable.
- R8. The shell app serves a framed mode at the root URL when accessed directly, so the deployed app is functional standalone.

**Functional programming discipline**
- R9. Calculator domain logic (input validation, math, formatting, error shaping) lives in pure TS modules with no React imports and no I/O.
- R10. Component code uses only function components, hooks, and immutable state updates — no class components, no `this`-based state.
- R11. The project maintains ≥ 80% of its non-test code in pure functions, measured periodically against an agreed heuristic (heuristic chosen during planning).
- R12. The project does not depend on fp-ts, Effect, or other orthodox-FP effect-system libraries.

**TDD discipline**
- R13. Pure logic is developed via strict red→green→refactor TDD. The commit history shows the cycle, either through commit-per-cycle granularity or through commit messages that distinguish red, green, and refactor steps.
- R14. UI components have RTL test coverage, but are not required to follow strict red→green→refactor.
- R15. Tests are runnable per workspace package in isolation (single-package test runs work without booting the rest of the monorepo).
- R16. The default test command produces per-package coverage output sufficient to identify which package owns which assertions.

**Migration & inventory**
- R17. The HTML-to-React rewrite treats each existing HTML calculator as a behavior reference. Output code is greenfield; no HTML or JS is ported as code.
- R18. The concrete inventory of calculators (I1–I6) is captured in the Inventory section above. Adding new calculators beyond I1–I6 is in scope; planning sizes work against I1–I6 unless the user explicitly extends the list.

**Accessibility**
- R19. Each calculator UI is keyboard-operable end-to-end (tab order, focus management, no mouse-only interactions) and uses semantic HTML / ARIA where appropriate.

**Deployment & integration**
- R20. This repo deploys independently of the portfolio host on its own URL.
- R21. The deployment serves the federation entry with CORS configured to permit fetches from the portfolio host's origin.

---

## Acceptance Examples

- AE1. **Covers R6, R7.** Given the calculators deployment is reachable but the portfolio host is offline, when a Substack reader opens an article containing the iframe-embedded calculator, the iframe loads and the calculator functions normally.
- AE2. **Covers R4, R5.** Given the portfolio host already loads React in its own bundle, when it federates `<CalculatorsApp />` from the calculators remote, only one copy of React executes in the page (verified via `react-devtools` or runtime check).
- AE3. **Covers R11.** Given the codebase at any point after v1, when the pure-function ratio is measured, ≥ 80% of non-test code lives in modules or functions classified as pure (no React imports, no I/O, deterministic given inputs).
- AE4. **Covers R13.** Given a new calculator behavior is added, when reviewing git history for that behavior, a sequence of commits distinguishably shows a failing test, the implementation passing it, and any subsequent refactor — readable from commit messages or commit-per-cycle granularity.
- AE5. **Covers R7, R20.** Given the portfolio host has not yet been updated to consume the federated remote, when this repo is deployed, the calculators app is fully usable at its standalone URL and via iframe embed without any host integration in place.

---

## Success Criteria

- A reader of the repo (recruiter, peer engineer) can within ~5 minutes identify both the FP discipline (pure-logic modules separate from React) and the TDD discipline (commit history evidencing red→green→refactor) without prompting.
- The portfolio host, once integrated, successfully loads `<CalculatorsApp />` and individual calculator components via Module Federation in production with a single copy of React.
- The chosen calculator embeds in a Substack article via iframe and is fully usable inline.
- `ce-plan` can pick this doc up and produce an actionable plan without re-litigating product behavior, scope boundaries, or success criteria.

---

## Scope Boundaries

- single-spa, qiankun, or other runtime composition systems beyond Module Federation.
- fp-ts, Effect, or any orthodox-FP effect-system library.
- Algebraic data types (Either, Option, Task) for error or effect handling — pragmatic React-FP only.
- Server-side rendering, Next.js, or Remix.
- Web Components / custom elements as the embed primitive.
- A documentation or blog-post deliverable about the rebuild process itself (the user's article uses one calculator as a tool, not as a topic).
- Multi-repo splitting (each calculator as its own repo).
- Telemetry, analytics, A/B testing, or any product-tier instrumentation.
- Backwards compatibility with existing HTML calculator URLs, markup, or DOM IDs.
- Internationalization beyond a single language.
- Version-pinning the federation entry URL: portfolio host always fetches the latest deployed remote.
- Distributed type-sharing infrastructure (`@module-federation/typescript` or equivalent) at v1.
- CI-enforced pure-function ratio at v1: the 80% target is a discipline, not a build gate.

---

## Key Decisions

- **Module Federation is the integration mechanism between this repo and the portfolio host.** Rationale: portfolio (host) and calculators (remote) are separately developed and deployed; this is the textbook MF case. The user's framing — "this calculator app is a module in my portfolio" — makes MF a real architectural fit, not a tutorial showcase.
- **Federation expose shape is multi-target: full `<CalculatorsApp />` plus per-calculator components.** Rationale: gives the portfolio composition flexibility (full-app page vs deep-dive pages) and the multi-expose surface itself signals intentional API design.
- **Substack embed uses iframes pointing at a chrome-free per-calc URL, not federation.** Rationale: Substack cannot run federation; iframes work universally; decoupling article availability from federation availability is a real reliability win.
- **Tooling stack: Vite + React + TypeScript; Vitest + React Testing Library; pnpm workspaces; Vite federation plugin (or Module Federation 2.0 if planning prefers).** Rationale: lowest-friction stack that satisfies the embed model, FP target, and TDD ergonomics; Vitest gives the fast feedback loops strict TDD wants.
- **80% pure-function target as discipline, not CI gate, at v1.** Rationale: setting the bar is the discipline-shaping move; mechanical enforcement is a planning concern and adds toolchain weight not justified at this scope.
- **Strict TDD on pure logic only; pragmatic RTL coverage on UI.** Rationale: red→green is most legible and most valuable on pure functions; component-TDD via RTL is slower per cycle and pays off less for portfolio signal.
- **Pragmatic React-FP without an effect system.** Rationale: fp-ts/Effect is a large learning surface and adds verbosity without proportionate portfolio signal at this scope; pragmatic FP done seriously (the 80% pure target) reads cleaner to most React-fluent reviewers.
- **No version pinning on the federation entry URL.** Rationale: portfolio host always sees the latest calculators deployment; canary/version-pin strategy is deferred until the portfolio integration reveals it as a real need.

---

## Dependencies / Assumptions

- The portfolio host can be modified to consume a federated remote. If the portfolio is built with a stack that does not support Module Federation, R4 and R5 need revisiting before planning.
- The portfolio host runs React. If the portfolio uses a different framework, the federation expose shape (currently shipping React components) requires a different boundary (Web Component wrapper, render-target callback, etc.).
- A deployment target supporting CORS configuration is available (Vercel, Cloudflare Pages, Netlify, or similar).
- The existing HTML calculators are accessible somewhere as behavior references during the rewrite (paths or URLs supplied during planning).
- The Substack article will publish on standard Substack hosting where iframes are permitted with their default constraints.

---

## Outstanding Questions

### Resolve Before Planning

*(none — inventory resolved via the Inventory section above)*

### Deferred to Planning

- [Affects I3, I4, R2][Technical] Modeling of the LGS DSCR (I3) and Olamina DSCR (I4) overlap. Three plausible shapes: (a) one workspace package with brand/preset variants, (b) two packages sharing a `@calc/dscr-core` domain library, (c) two independent packages duplicating logic. Choice affects package boundaries, test layout, and how clearly the FP discipline reads on the DSCR pair.
- [Affects R11][Technical] Heuristic for measuring the 80% pure-function ratio (line-based, function-count-based, AST-based with a tool like `eslint-plugin-functional`, or periodic manual review).
- [Affects R4][Technical] Federation tooling pick: `@originjs/vite-plugin-federation` versus Module Federation 2.0 with Rspack. Both are 2026-current; the choice affects build pipeline ergonomics and dev-server behavior.
- [Affects R6, R7][Technical] URL contract for chrome-free embed mode: query parameter (`?embed=1`), separate route prefix (`/embed/:slug`), or a separate subdomain. Affects portfolio integration, Substack URL, and SEO posture.
- [Affects R20, R21][Technical] Specific deployment target and CORS configuration.
- [Affects R16][Technical] Coverage tool and threshold policy (e.g., per-package floor vs aggregate floor).
- [Affects R13][Technical] Convention for distinguishing red/green/refactor in commit history (commit-per-cycle vs prefixed messages vs co-authored trailers).
- [Affects all calcs] Whether to copy the HTML originals from `../old_calcs/` into the repo (e.g. as `reference/` material) for posterity and side-by-side behavior diffs, or leave them external.
