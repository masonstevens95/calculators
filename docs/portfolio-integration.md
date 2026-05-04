# Portfolio Integration — Calculators Remote

This document is the host-side contract for the `calculators` Module Federation 2.0 remote.
It pairs with the build configuration at `apps/remote/vite.config.ts` and the federation
manifest emitted at `dist/mf-manifest.json`.

## Federation entry

Production federation entry URL (filled in at U11):

```
<deployed origin>/remoteEntry.js
```

The `mf-manifest.json` companion lives at `<deployed origin>/mf-manifest.json` — MF 2.0
hosts can prefer manifest mode for richer type sharing and asset preloading.

## Exposed modules

| Expose path                      | Default export                     | When to use                                                                       |
| -------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| `./CalculatorsApp`               | React component (self-routing)     | Host **does not** own a React Router. Mounts a `<BrowserRouter>` of its own.      |
| `./CalculatorsRoutes`            | React component (router-less)      | Host **does** own a React Router. The calc routes mount as siblings of host routes. |
| `./CalculatorsLoadError`         | React component                    | Render this when remote fetch fails. **Sanitization-safe** — see below.            |
| `./calc/surry-county-offer`      | React component (the calc)         | Direct mount of a single calc, without the surrounding shell.                      |
| `./calc/lgs-dscr`                | React component                    | Direct mount.                                                                      |
| `./calc/olamina-dscr`            | React component                    | Direct mount.                                                                      |
| `./calc/eu5-loan`                | React component                    | Direct mount.                                                                      |
| `./calc/winston-salem-lvt`       | React component                    | Direct mount.                                                                      |
| `./calc/birchwood-rent-sell`     | React component                    | Direct mount.                                                                      |

## Decision criterion: `CalculatorsApp` vs `CalculatorsRoutes`

The remote ships two top-level mount points because most React-Router-based hosts can't
nest a second `<BrowserRouter>` (react-router 7 throws "cannot render `<Router>` inside
another `<Router>`"). KTD #20 in the plan documents the trade-off:

- **Pick `CalculatorsApp`** when the host has no router, or when you want the calc
  subtree namespaced under a separate router. Easiest integration.
- **Pick `CalculatorsRoutes`** when the host already provides a `<BrowserRouter>` or
  similar. The calc routes mount as siblings of host routes; you control the parent
  pathname prefix via the host's own routing.

Both render the same calc Components — they differ only in router ownership.

## Shared dependencies (KTD #14)

The remote declares `react`, `react-dom`, `react/jsx-runtime`, and `react-dom/client`
as `singleton: true` shared deps so the host and remote always see one React. The
trailing-slash patterns (`react/`, `react-dom/`) are essential — without them MF
will resolve `react/jsx-runtime` to a second React copy and you get the classic
"Invalid hook call" runtime crash.

The host **must** declare React 19.x compatible. Any breaking React major bump
between host and remote requires coordinated updates.

## Error fallback contract

`./CalculatorsLoadError` is a stable, importable component the host renders when the
remote fails to load. It takes one optional prop:

```ts
type CalculatorsLoadErrorProps = {
  /** Anything the host has on hand — Error, string, object, undefined. */
  error?: unknown;
};
```

**Sanitization contract (KTD #5):** the component renders the `error` value as text
only. It never uses `dangerouslySetInnerHTML`, never injects raw HTML. The host can
safely pass `<script>alert(1)</script>` as a string and it will appear as escaped text.
Tested at `apps/remote/tests/CalculatorsLoadError.test.tsx`.

## Example host usage (MF 2.0 runtime API)

```ts
import { init, loadRemote } from '@module-federation/runtime';

init({
  name: 'host',
  remotes: [
    {
      name: 'calculators',
      entry: 'https://<deployed-origin>/mf-manifest.json',
    },
  ],
  shared: {
    react: { singleton: true, requiredVersion: '^19.0.0' },
    'react/': { singleton: true },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
    'react-dom/': { singleton: true },
  },
});

// In a host component …
const { default: CalculatorsApp } = await loadRemote('calculators/CalculatorsApp');
// Or, when host owns the router:
const { default: CalculatorsRoutes } = await loadRemote('calculators/CalculatorsRoutes');
// Or a single calc:
const { default: SurryCounty } = await loadRemote('calculators/calc/surry-county-offer');
```

Wrap the dynamic import in an error boundary that renders `CalculatorsLoadError` on
fetch failure (TBD: lazy-load it via the same federation entry and pass the caught
error through).

## CORS

The CORS allowlist on the remote (set in `vercel.json`, U11) is a deployment
pre-condition per KTD #25. Production deploys require the **specific** portfolio host
origin in `Access-Control-Allow-Origin`; permissive values (`*`) are only acceptable
for preview deploys.

## Canvas color-scheme behavior

The remote declares `color-scheme: light dark` plus an explicit light page canvas
(`background-color: #ffffff; color: #111827`) on `:root` in both `apps/remote/index.html`
and `apps/harness/index.html`. This satisfies the W3C iframe-substitution rule (per the
[CSS Color Adjust spec](https://www.w3.org/TR/css-color-adjust-1/)) so a host with a
different `color-scheme` than the iframe does not get a browser-substituted opaque
canvas — the iframe declares its own canvas explicitly and renders deterministically
across light- and dark-OS visitors.

Calc surfaces (cards, form inputs, brand accents, chart panels) are light-only at v1.
Full OS-adaptive theming — including dark-mode calc surfaces, brand-accent dark
variants, a partner-brand-token override channel, and a user-facing toggle — is a
separate roadmap item, not delivered by this fix. Hosts that want to influence calc
appearance today have no programmatic surface beyond the federation expose contract
above.
