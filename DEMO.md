# KonBase demo (Cloudflare Workers, no external services)

With no `POSTGRES_URL` / `DATABASE_URL` the app runs in **demo mode**:

| Service       | Real        | Demo replacement                                                                                                 |
| ------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| PostgreSQL    | `pg`        | in-memory [pg-mem](https://github.com/oguimbal/pg-mem) running the real migrations + seed (`src/lib/db/demo.ts`) |
| File storage  | Vercel Blob | in-memory map, served by `/api/files/*`                                                                          |
| Mail (SMTP)   | nodemailer  | logged to console                                                                                                |
| Redis / OAuth | optional    | not used (credentials login only)                                                                                |

Data lives in the worker isolate: it resets on cold start and is **not shared between isolates**.

## Accounts (password `password123`)

- `admin@konbase.cfd` (super admin) · `manager@konbase.cfd` · `member@konbase.cfd`

## Run / deploy

```bash
cp .dev.vars.example .dev.vars
npm run preview:cf     # local, Workers runtime
npx wrangler login && npm run deploy:cf
```

Set `NEXTAUTH_SECRET` (`wrangler secret put NEXTAUTH_SECRET`) and `NEXTAUTH_URL` (your workers.dev URL) before deploying.

## Notes

- The SQL layer under demo mode drops triggers, RLS, extensions and plpgsql (pg-mem doesn't support them); `citext` becomes `text`.
- Setting `POSTGRES_URL` switches back to the real database.
