# Excellent Motors

A production-grade platform for a car-parts business, built as **two halves on one database**:

1. **A 3D, modern customer storefront** — browse, search by vehicle fitment, and buy parts online.
2. **An internal POS + Business Management System (ERP)** — billing, inventory, purchasing, accounts, HR and reporting.

Both halves read and write the **same product / inventory / order data in real time**. Every stock-changing action routes through one shared `InventoryService`, so a sale at the POS instantly reduces online stock and an online order instantly reflects in the back office. Stock decrements are **atomic** and can **never go below zero**.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript, single full-stack app |
| Styling | Tailwind CSS v4 + hand-authored shadcn-style primitives |
| 3D / motion | React Three Fiber + drei, Framer Motion, Lenis smooth scroll |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js v5 (credentials), 6 roles, route guards via Proxy |
| Real-time | Server-Sent Events fanned out from a shared event bus |
| Data/forms | TanStack Query, React Hook Form, Zod on every API boundary |
| Charts | Recharts *(used from Phase 4)* |
| Currency/locale | PKR throughout, Pakistan formatting, `+92` phones, strings layer for future Urdu |

> **Note on versions:** Next 16 renames `middleware.ts` → **`proxy.ts`** and makes `params`/`searchParams`/`cookies()` async. Tailwind v4 is CSS-first (no `tailwind.config.js`). Prisma is pinned to the v6 stable line.

---

## Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14 running locally (or via Docker — see below)

---

## Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
#    then set DATABASE_URL and generate a secret:
npx auth secret            # writes AUTH_SECRET, or use: openssl rand -base64 32

# 3. Create the schema, generate placeholder images, and seed demo data
npm run setup
#    (= prisma generate + migrate deploy + placeholders + seed)

# 4. Run
npm run dev                # http://localhost:3000
```

### Don't have Postgres locally?

Either install it (`brew install postgresql@16 && brew services start postgresql@16 && createdb excellent_motors`)
or use Docker:

```bash
docker run --name em-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=excellent_motors -p 5432:5432 -d postgres:16
# then set DATABASE_URL="postgresql://postgres:postgres@localhost:5432/excellent_motors?schema=public"
```

---

## Demo logins

Seeded with `npm run db:seed`. Password for **all** demo users: `password123`

| Email | Role | Lands on |
| --- | --- | --- |
| `customer@example.com` | customer | `/account` |
| `cashier@excellentmotors.pk` | cashier | `/pos` |
| `inventory@excellentmotors.pk` | inventory_manager | `/admin` |
| `accountant@excellentmotors.pk` | accountant | `/admin` |
| `hr@excellentmotors.pk` | hr | `/admin` |
| `admin@excellentmotors.pk` | admin | `/admin` |

Seed data also includes **50 car parts** across 8 categories, 12 brands, 10 Pakistan-market vehicles with fitments, 2 vendors, a warehouse with stock, and an employee record.

---

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run setup` | Generate client, migrate, placeholders, seed (one-shot) |
| `npm run db:migrate` | Create & apply a dev migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run placeholders` | Regenerate category placeholder SVGs |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

---

## Architecture highlights

- **One source of truth for stock** — `src/lib/inventory/service.ts`. Decrements use a conditional `UPDATE ... WHERE quantity >= n` (atomic, never-negative) inside a transaction, and write a signed `StockMovement` for a full audit trail. No feature touches the `Inventory` table directly.
- **Real-time** — `src/lib/realtime/bus.ts` (in-process pub/sub) → `/api/realtime/stream` (SSE) → `RealtimeBridge` client provider updates a Zustand store, so storefront badges and the POS show the same number the instant it changes. *To scale horizontally, swap the bus for Redis pub/sub or Postgres LISTEN/NOTIFY — the publish/subscribe surface stays the same.*
- **Auth & roles** — split Auth.js config: `auth.config.ts` (edge-safe, used by `proxy.ts` for optimistic route gating) and `auth.ts` (Node, credentials + bcrypt). Authoritative checks also run server-side via `requireRole()`.
- **Payments** — swappable `PaymentProvider` interface (`src/lib/payments/`). A fully working **mock/test** provider ships today; COD and in-store pickup need no gateway. Plug JazzCash / Easypaisa / a card gateway in `payments/index.ts`.
- **Notifications** — `src/lib/notify.ts` emails (console provider in dev, swappable to SMTP/Resend) + in-app `Notification` records.

---

## Project structure

```
prisma/schema.prisma        # full data model (~30 entities) + seed.ts
src/app/(storefront)/        # public store: home, shop, product, checkout, account, track…
src/app/(auth)/              # login, register
src/app/admin, src/app/pos   # role-gated back-office (Phases 2–4)
src/app/api/                 # checkout, register, contact, realtime/stream, auth
src/auth.ts, auth.config.ts  # Auth.js (Node + edge-safe split)
src/proxy.ts                 # Next 16 "Proxy" (was middleware) — route guards
src/lib/inventory/           # shared InventoryService (the one gate for stock)
src/lib/realtime/            # SSE event bus + client store
src/lib/payments/            # swappable payment providers
src/components/three/        # R3F scenes (procedural brake rotor, product viewer)
src/components/ui/           # shadcn-style primitives
```

---

## Build phases

- **Phase 0 — Foundation** ✅ schema, DB, seed, design system, InventoryService, SSE, auth + roles, route guards.
- **Phase 1 — Storefront** ✅ 3D hero, catalogue, search & filters, vehicle-fitment finder, product detail with 3D/360 viewer, cart, checkout (delivery/pickup, COD + mock gateway), customer dashboard, order tracking, about & contact. Plus a light/dark theme toggle (light default).
- **Phase 2 — POS billing + inventory core** ✅ back-office shell + dashboard, POS billing (barcode/search, GST, discounts, split + cash/card payments, hold/recall, 80mm thermal receipt), product CRUD, stock management (movement ledger, adjustments, transfers, low-stock alerts, warehouses), returns & exchanges with restock. Every transaction moves stock through the shared `InventoryService` and broadcasts live.
- **Phase 3 — Purchasing & suppliers** ✅ vendor management (profiles, contacts, purchase history, outstanding balances), purchase orders (builder, status flow draft→sent→partially/completed), goods receiving (GRN with good/damaged/missing tracking, auto-restock through the shared service + auto PO status), short-stock reorder suggestions, vendor payment tracking.
- **Phase 4 — Accounts, HR & reporting + admin portal** ✅ accounts & expenses (P&L statement, cash-flow chart, expense tracking with ledger mirror), financial reporting dashboard (sales trend, sales-by-category, top products, expense breakdown, inventory analysis — Recharts), HR & payroll (employees, attendance, payroll runs → payslips → mark-paid with expense posting), admin portal (role-based user management with self-lockout protection, system settings, audit log).
- **Phase 5 — Integration, polish & deploy** ✅ concurrency oversell test (`npm run test:concurrency`), email + in-app notification system (bell), SEO (dynamic `sitemap.xml`, `robots.txt`, Product JSON-LD), security hardening (rate limiting on public POSTs, secure headers, role-gated routes), `docker-compose` + Dockerfile, and DB backup guidance.

### Not yet implemented (stubbed and labelled)
- Real `.glb` product models — the product viewer uses a procedural brake-rotor model as a fallback; products with a `model3dUrl` will load their GLB automatically.
- Downloadable PDF invoices (web/thermal receipts already work).
- The in-memory rate limiter and SSE event bus are single-instance; swap for Redis when scaling horizontally.

## Deploy

### Docker (one command)

```bash
# Set a real secret (else the compose default is used):
export AUTH_SECRET=$(openssl rand -base64 32)
docker compose up --build
# → http://localhost:3000  (Postgres + app; migrations + first-run seed are automatic)
```

`docker-compose.yml` runs Postgres 16 and the app; [`docker-entrypoint.sh`](docker-entrypoint.sh) applies migrations and seeds an empty database on first boot. For other hosts (Vercel, a VM, Fly.io), set the env vars from `.env.example`, run `prisma migrate deploy`, then `npm run build && npm start`.

### Concurrency guarantee

```bash
npm run test:concurrency   # races 25 orders at a 5-unit SKU → exactly 5 succeed, stock hits 0, never negative
```

### Backups & operations

The whole system is one Postgres database — back it up with `pg_dump`:

```bash
pg_dump "$DATABASE_URL" -Fc -f "backup-$(date +%F).dump"        # nightly (cron)
pg_restore --clean --no-owner -d "$DATABASE_URL" backup-YYYY-MM-DD.dump
```

Sensitive actions (sales, returns, PO receipts, payments, order placement) are written to the **AuditLog** (`/admin/audit`). Role-based access is enforced in the Proxy and re-checked server-side via `requireRole()`.
