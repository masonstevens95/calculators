# Calculators Microfrontend

A React rebuild of six HTML calculators, packaged as a [Module Federation 2.0](https://module-federation.io/) remote
that mounts inside a portfolio host, embeds in Substack via `iframe`, and stands alone at a direct URL.

The repo is structured as a pnpm monorepo with a shared infrastructure substrate (`@calc/domain-utils`, `@calc/ui`,
`@calc/charts`) and one fully independent package per calculator. Domain logic is pure TypeScript tested in `node`;
React UI is tested in `jsdom`. The split is enforced by Vitest "projects" mode, not just convention.

## Status

Active rebuild. See [the plan](docs/plans/2026-05-01-001-feat-calculators-microfrontend-react-rebuild-plan.md)
and [the brainstorm origin](docs/brainstorms/2026-05-01-calculators-microfrontend-requirements.md).

## Stack

- pnpm 10 workspaces
- React 19 + TypeScript 5.7 + Vite 6
- React Router 6+
- `@module-federation/vite` (MF 2.0) for portfolio integration
- Vitest 3+ ("projects" mode) + React Testing Library
- Chart.js 4 (bundled, no CDN)
- Vercel hosting with `frame-ancestors` CSP for Substack embeds

## Calculators

| Slug | Source HTML | Charts |
| --- | --- | --- |
| `surry-county-offer` | `reference/html-originals/Surry County Offer Calculator.html` | yes |
| `lgs-dscr` | `reference/html-originals/lgs-dscr-calculator.html` | no |
| `olamina-dscr` | `reference/html-originals/olamina-dscr-calculator.html` | no |
| `eu5-loan` | `reference/html-originals/eu5-loan-calculator.html` | no (numeric table) |
| `winston-salem-lvt` | `reference/html-originals/lvt-calculator.html` | yes |
| `birchwood-rent-sell` | `reference/html-originals/Birchwood Rent vs Sell Charts.html` | yes |

## Layout

```
apps/
  remote/        Federated shell — exposes <CalculatorsApp />, <CalculatorsRoutes />,
                 <CalculatorsLoadError />, and per-calc components
  harness/       Non-federated dev mount — consumes apps/remote as a workspace package
packages/
  domain-utils/  Pure formatters + validators (node env)
  ui/            FormField, NumberInput, AriaLive, ResultDisplay (jsdom env)
  charts/        Chart.js wrappers (jsdom env)
  calc-*/        Six calculator packages — each has src/domain.ts (pure) + src/Component.tsx (React)
reference/
  html-originals/  Six HTML calculators copied from old_calcs/ for behavior reference
docs/
  brainstorms/   Origin requirements
  plans/         Execution plan
```

## Development

```bash
pnpm install
pnpm dev             # harness app on http://localhost:5173
pnpm test            # run all tests across workspace
pnpm test:coverage   # coverage report (80% line target on domain modules)
pnpm typecheck
pnpm lint
```

## Surfaces

- `/` — calc index (chrome)
- `/calc/:slug` — calc with chrome
- `/embed/:slug` — chrome-free, designed for `iframe` embed in Substack

## Discipline (visible in `git log`)

Pure domain logic is built strict red→green→refactor. Commits on calc `domain.ts` files are prefixed
`red:` / `green:` / `refactor:` so the cycle is auditable; calc feature branches do not squash on merge.

## License

MIT — see [LICENSE](LICENSE).
