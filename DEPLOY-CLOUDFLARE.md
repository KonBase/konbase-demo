# Deploy to Cloudflare Workers (static assets)

The demo is a Vite SPA using a built-in mock backend (no database or keys needed).

## Workers Builds (Git integration)

Workers & Pages → Create → Import a repository (`main` branch). The Worker name must be `konbase-demo` (see `wrangler.jsonc`).

| Setting | Value |
| --- | --- |
| Build command | `npm run build:cf` |
| Deploy command | `npx wrangler deploy` |
| Root directory | _(empty)_ |

No environment variables are required. Optional build variables:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` – use a real Supabase instead of the mock.
- `VITE_USE_MOCK_SUPABASE=true` – force the mock even if the above are set.

## CLI

```bash
npm run preview:cf       # build + run locally on the Workers runtime
npx wrangler login
npm run deploy           # build + deploy
```

## Demo accounts (password `password123`)

`admin@konbase.cfd`, `manager@konbase.cfd`, `member@konbase.cfd`

Mock data is per browser tab and resets on reload; the login survives reloads (sessionStorage).

## Notes

- Routing uses `BrowserRouter` (HashRouter only on `github.io`); deep links work thanks to `not_found_handling: single-page-application`.
- Security headers and immutable caching for `/assets/*` come from `public/_headers`.
