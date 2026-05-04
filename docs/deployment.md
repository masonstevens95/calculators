# Deployment Runbook

Deploys the federated calculators remote to Vercel. The deployment exposes three
parallel surfaces over the same artifact:

- **Federation host** — `<deployed origin>/remoteEntry.js` and `/mf-manifest.json`
  for the portfolio host (per `docs/portfolio-integration.md`).
- **Direct visit** — `<deployed origin>/calc/:slug` and `<deployed origin>/` for
  anyone landing on the URL directly.
- **Iframe embed** — `<deployed origin>/embed/:slug` for Substack and other hosts
  that embed via `<iframe src=...>`.

## First-time setup

1. Connect the GitHub repository to a Vercel project.
2. **Framework preset:** "Other" (we manage the build via `vercel.json`).
3. Vercel automatically reads `vercel.json` for build command, output dir,
   headers, and rewrites. No env vars required for v1.
4. Verify Node 20 in the Vercel project settings (matches `.nvmrc`).
5. Trigger an initial preview deploy by pushing a feature branch.

## Build pipeline

`vercel.json` declares:

```jsonc
"buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @apps/remote build"
"outputDirectory": "apps/remote/dist"
```

This produces:

```
apps/remote/dist/
├── index.html
├── remoteEntry.js              # MF bootstrap module
├── mf-manifest.json            # MF 2.0 manifest
├── mf-stats.json               # MF stats (debug)
├── mf-entry-bootstrap-*.js
├── @mf-types.zip               # auto-generated TS types for the host
└── assets/                     # all hashed app + per-calc bundles
```

## CSP (KTD #11)

Applied to every route via the `headers` rule on `source: /(.*)`:

```
default-src 'self';
script-src 'self';
connect-src 'self';
img-src 'self' data:;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
frame-ancestors 'self' https://*.substack.com https://substack.com;
```

Why each directive:

- **`default-src 'self'` + `script-src 'self'`** — transport-enforces the
  "inputs don't leave your browser" claim. If anyone accidentally re-introduces
  a CDN reference (e.g. the original Chart.js jsDelivr URL), the browser blocks
  it and surfaces a console error.
- **`connect-src 'self'`** — calculators do no outbound `fetch` at v1.
- **`frame-ancestors 'self' https://*.substack.com https://substack.com`** —
  controls iframe embedding. Allows direct visits (`'self'`) and any Substack
  publication (`*.substack.com` plus the bare domain). KTD #11 acknowledges
  the wildcard is intentionally permissive — Substack does not expose
  per-publication subdomain in an allowlistable form.
- **`style-src 'self' 'unsafe-inline'`** — Vite + CSS Modules emit a few
  inline `<style>` tags during HMR; in production this could tighten further
  if visual-regression / Storybook is added later.

## CORS (KTD #25 — production gate)

Federation entry assets need to be cross-origin loadable by the portfolio host:

| Path                | Header                                |
| ------------------- | ------------------------------------- |
| `/remoteEntry.js`   | `Access-Control-Allow-Origin: *`      |
| `/mf-manifest.json` | `Access-Control-Allow-Origin: *`      |
| `/assets/*`         | `Access-Control-Allow-Origin: *`      |

**Production gate:** Per KTD #25, `*` is acceptable only on preview deploys.
Before merge-to-production, edit `vercel.json` and replace the three `*`
values with the **specific** portfolio host origin (e.g. `https://stevens.dev`).
The verification step below confirms this with `curl -I`.

Production-merge checklist:

- [ ] `vercel.json` `Access-Control-Allow-Origin: <exact-portfolio-origin>` for
      `/remoteEntry.js`, `/mf-manifest.json`, and `/assets/*`.
- [ ] Preview deploy from the merge candidate passes the curl checks below.
- [ ] Substack embed test in a real draft passes (no console errors).

## Routing (SPA rewrite)

The `rewrites` rule sends every path that isn't an MF artifact (or a static
asset) to `/index.html`, so React Router handles `/`, `/calc/:slug`, and
`/embed/:slug` client-side.

The negative lookahead in the source pattern protects MF artifacts from being
swallowed by the SPA fallback:

```
^/((?!assets/|remoteEntry\.js|mf-manifest\.json|mf-stats\.json|mf-entry-bootstrap.*|favicon\.ico|@mf-types).*)$
```

If a future MF release adds another sibling artifact, add it to this list.

## Verification (post-deploy)

Manual checks. Run all five after every production deploy:

### 1. CSP headers present

```bash
curl -sI https://<deployed-origin>/embed/surry-county-offer | grep -i "content-security-policy"
```

Expected output contains all six directives from the table above, including
`frame-ancestors 'self' https://*.substack.com https://substack.com`.

### 2. Federation entry CORS (production gate)

```bash
curl -sI https://<deployed-origin>/remoteEntry.js | grep -i "access-control-allow-origin"
```

Expected: the **specific** portfolio host origin, NOT `*`. If you see `*`,
roll back and update `vercel.json` per the checklist above.

```bash
curl -sI https://<deployed-origin>/mf-manifest.json | grep -i "access-control-allow-origin"
```

Same expectation.

### 3. HTTPS-only

```bash
curl -sI http://<deployed-origin>/ | head -1
```

Expected: `301 Moved Permanently` or `308 Permanent Redirect` to the HTTPS
URL. Vercel handles this automatically.

### 4. Substack embed smoke test

1. Open a Substack draft.
2. Add an iframe block: `<iframe src="https://<deployed-origin>/embed/surry-county-offer" />`.
3. Confirm the calc renders, inputs are interactive, no console errors.

### 5. Dark-OS canvas check

The iframe declares `color-scheme: light dark` plus an explicit light canvas on
`:root` (see `Canvas color-scheme behavior` in `docs/portfolio-integration.md`). On a
dark-OS visit the canvas should remain explicitly light, not substituted by the UA.

1. Toggle your OS to dark mode.
2. Open `https://<deployed-origin>/embed/surry-county-offer` directly in a fresh
   browser tab (no Substack frame).
3. Confirm the page background is white (`#ffffff`), the calc page heading reads in
   `#111827` text, and there is no clashing dark substituted canvas. If the page
   renders dark or the heading is low-contrast, the inline `<style>` in
   `apps/remote/index.html` did not survive the build — inspect `dist/index.html` to
   confirm the `:root { color-scheme: light dark; background-color: #ffffff; ... }`
   block is present **before** the `mf-entry-bootstrap-0.js` `<script>` tag.

## Rollback

Vercel maintains a per-deploy revert button in the dashboard:

1. Open Vercel dashboard → Project → **Deployments**.
2. Find the last known-good deploy.
3. Click **Promote to Production**.

If the issue is in `vercel.json` (CSP / CORS misconfiguration), the rollback
brings the previous header config back along with the previous bundle.

## Cloudflare Pages fallback

Per KTD #10, Cloudflare Pages is the noted fallback if Vercel limits hit.
The `vercel.json` `headers` rules map roughly to `_headers` and `_redirects`
files in CF Pages — different syntax, same intent. Migration is straightforward
but requires a small porting pass; not undertaken at v1.

## Operational notes

- **No env vars required at v1.** All scenario constants are baked into the
  per-calc packages.
- **No telemetry.** Per origin scope; "rollout" is essentially merge + deploy +
  this verification list + Substack spot-check.
- **Branch strategy:** feature branches per implementation unit, no squash on
  merge (KTD #7) so the red→green→refactor history stays auditable.
