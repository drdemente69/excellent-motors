# Deploying Excellent Motors to Vercel

The app is a single Next.js 16 full-stack app + PostgreSQL (Prisma). Vercel hosts
the Next.js side; PostgreSQL is a managed database (Neon recommended).

> **Real-time caveat:** the live cross-client stock sync uses an in-memory
> event bus + SSE. On Vercel's serverless functions this won't reliably push
> updates between instances (the DB stays correct — decrements are atomic — but
> badges update on load/refresh, not live). For true real-time either host the
> included `Dockerfile`/`docker-compose.yml` on Railway/Render/Fly, or swap the
> bus (`src/lib/realtime/bus.ts`) for Pusher/Ably/Upstash.

## What's already wired for Vercel
- `package.json` → `postinstall: prisma generate`, `vercel-build: prisma generate && prisma migrate deploy && next build`.
- `prisma/schema.prisma` → `directUrl` (runtime uses pooled connection, migrations use direct).
- `.gitignore` keeps `.env` secret, commits `.env.example`.

## 1. Database (Neon)
Create a project at https://neon.tech and copy the **pooled** and **direct**
connection strings (the pooled host contains `-pooler`).

## 2. Push to GitHub
```bash
git add -A && git commit -m "Excellent Motors platform"
git remote add origin https://github.com/<you>/excellent-motors.git
git push -u origin main
```

## 3. Import to Vercel
vercel.com → Add New → Project → import the repo (auto-detects Next.js).

## 4. Environment variables (Production + Preview)
| Key | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** string (append `&pgbouncer=true`) |
| `DIRECT_URL` | Neon **direct** string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |
| `NEXT_PUBLIC_BUSINESS_NAME` | `Excellent Motors` |
| `PAYMENT_PROVIDER` | `mock` |
| `EMAIL_PROVIDER` | `console` |

Set these **before** the first deploy (the build runs `prisma migrate deploy`).

## 5. Deploy
Vercel builds, runs migrations, and serves the app.

## 6. Seed demo data (optional, once)
```bash
DATABASE_URL="<Neon DIRECT url>" DIRECT_URL="<Neon DIRECT url>" npm run db:seed
```
Demo logins (password `password123`): `admin@excellentmotors.pk`, `cashier@excellentmotors.pk`, `customer@example.com`. **Change the admin password in production.**

### Start fresh (remove demo data) for a real launch
```bash
DATABASE_URL="<Neon DIRECT url>" DIRECT_URL="<Neon DIRECT url>" npx prisma migrate reset --force
```
…then add real products via the admin (`/admin/products`).

## Notes
- File uploads to `/public` don't persist on Vercel's read-only FS (currently
  unused — placeholder art is committed static SVGs). Use S3 if you add uploads.
- Set `EMAIL_PROVIDER` + SMTP/Resend keys for real order emails.
- Add a custom domain in Vercel, then update `NEXT_PUBLIC_APP_URL` and redeploy.
