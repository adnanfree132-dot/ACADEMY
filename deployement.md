# CLOUDFLARE DEPLOYMENT ARCHITECTURE

Account ID: `64ce0da1d6bde1c338aa1eed69626c73`
(Wrangler authentication via `CLOUDFLARE_API_TOKEN` in `.env`, never commit secrets).

---

## The Two Live Pieces

| Component | Cloudflare Product | Name | URLs |
| :--- | :--- | :--- | :--- |
| **Screens (Vite SPA)** | Pages | `academy` (NOT `academy-pro-os`) | `https://edu.toolnestr.com`<br>`https://academy-el0.pages.dev` |
| **Save/Delete API (Express)** | Workers | `academy-api` | `https://academy-api.adnanfree132.workers.dev` |

- **Root `wrangler.toml`**: Cloudflare Pages only (`name = "academy"`, `pages_build_output_dir = "dist"`).
- **API `server/wrangler.toml`**: Worker configuration (`name = "academy-api"`, `compatibility_date = "2026-09-04"`, `compatibility_flags = ["nodejs_compat"]`).
- **Laptop is NOT needed for public hosting**: Screens are on Pages, saves are on Worker `academy-api`.
- **Ignore leftover**: Netlify `academy131.netlify.app`. No GitHub Actions workflows (PAT lacks workflow scope).

---

## How a Git Push Goes Live

Push to GitHub `main` branch triggers the Cloudflare Pages build script (`scripts/cf-pages-build.sh`):

1. `npx vite build` (builds SPA screens into `dist/`)
2. On branch `main` only:
   ```bash
   cd server && npm ci && npx prisma generate
   npx wrangler deploy --config server/wrangler.toml
   ```

### Pages Production Environment Variables
- `CLOUDFLARE_API_TOKEN` (Secret)
- `CLOUDFLARE_ACCOUNT_ID` (`64ce0da1d6bde1c338aa1eed69626c73`)
- `NODE_VERSION`

### Manual Pages Upload
```bash
npx wrangler pages deploy dist --project-name academy --branch main
```

---

## Worker (Express on Cloudflare)

Implemented via `server/src/worker.ts` + `httpServerHandler` from `cloudflare:node`.

### Mandatory Worker Configuration & Constraints
1. **`iconv-lite` stub**: `server/src/iconv-stub.js` aliased via `server/wrangler.toml` `[alias]`.
2. **`pg-cloudflare` alias**: Must point to `dist/index.js` (default export is empty).
3. **User-Agent spoof**: `navigator.userAgent = 'Cloudflare-Workers'` forced prior to importing app code so `pg` uses Cloudflare sockets instead of Node sockets.
4. **Database connectivity**: Direct connection string via Worker secret `DIRECT_URL` with `ssl: false` (`ssl: true` causes premature connection termination).
5. **Per-request Prisma client**: Managed via `AsyncLocalStorage` in `server/src/prisma.ts` and `attachRequestPrisma` middleware.
6. **No interactive `$transaction`**: `prisma.$transaction(async tx => ...)` hangs on Cloudflare Worker. Proxied in `server/src/prisma.ts` to run sequentially on the active request client.
7. **No CPU limits**: Never add `[limits] cpu_ms` in `wrangler.toml` (fails builds on Free plan).
8. **Never deploy `workers/academy-api/`**: That contains the obsolete proxy to laptop tunnel.

### Worker Secrets (Configured in Cloudflare)
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
*(Note: Hyperdrive is not used; API token lacks Hyperdrive permissions).*

---

## Client-to-API Routing & Known Splits

- Live SPA requests `/api/v1` on the same origin (`edu.toolnestr.com`).
- **Pages Routing**: Handled via `functions/api/[[path]].js` and `public/_redirects`:
  ```
  /api/* -> https://academy-api.adnanfree132.workers.dev/api/:splat
  ```
- **Worker-to-Worker Auth Warning**: Cloudflare Pages Functions proxying to Workers may drop the `Authorization` header on certain requests. If an entity save or update returns 401 via the site but 201 when hitting `academy-api.adnanfree132.workers.dev` directly, inspect the header forwarding in `functions/api/[[path]].js`.
- **Local Development**: Vite dev server (`:3001`) proxies `/api` to local Express on `127.0.0.1:5000`.

---

## Strict Prohibitions
- DO NOT use Cloudflare Tunnels to local laptop as production hosting.
- DO NOT rename Pages project to `academy-pro-os`.
- DO NOT configure `[limits] cpu_ms` on Worker Free plan.
- DO NOT add GitHub Actions workflow files for Cloudflare deployment.
- DO NOT treat Cloudflare Pages as the API backend (Pages only serves the static SPA build in `dist`).