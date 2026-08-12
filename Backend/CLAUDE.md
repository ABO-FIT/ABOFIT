# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # start Next.js dev server (port 3000)
npm run build              # production build
npm run start               # run production build

npm run migrate             # apply pending Knex migrations
npm run migrate:rollback    # roll back the last migration batch
npm run seed                 # run db/seeds (dev sample data only — see Migrations note below)

npm test                     # run all Vitest tests
npx vitest run src/lib/pagosPlan.test.ts   # run a single test file
```

No lint script is configured. `.env` requires `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `FRONTEND_URL`, `JWT_SECRET` (see `.env.example`). SMTP is **not** configured via env vars — it's stored in the `smtp_settings` DB table and edited from the admin panel (Configuración → SMTP).

Dev-server gotcha: don't run `next build` while `next dev` is running against the same `.next` directory — it corrupts the cache. If routes start 404ing unexpectedly, kill the dev process, `rm -rf .next`, and restart `npm run dev`.

## Architecture

This is an **API-only Next.js App Router backend** — there are no pages, layouts, or rendered UI here (`src/app` contains only `api/**/route.ts` handlers). The actual UI lives in the separate `Fronend` Vite/React project, which talks to this backend over HTTP as a different origin.

### Auth model

No NextAuth, no cookies/sessions. Each request carries `Authorization: Bearer <jwt>`; every route handler calls `obtenerSesion(request)` (`lib/auth.ts`) to decode the JWT and manually checks `sesion.rol !== "Administrador" | "Entrenador" | "Cliente"` at the top of the handler. There is no centralized RBAC middleware — authorization is inline, per-route, by convention. `lib/trainerClient.ts`'s `obtenerClienteDelEntrenador(trainerId, clientId)` is the standard ownership-check helper for trainer-scoped resources (returns the row only if `trainer_id` matches).

`src/middleware.ts` only adds CORS headers (matched to `/api/:path*`) since the frontend runs on a different port/origin — it does not do auth.

### Route organization

Routes are namespaced by actor: `api/admin/**`, `api/trainer/**`, `api/client/**`, plus a handful of endpoints that are intentionally public (no session required) because they back the public catalog and pre-login flows: `api/catalog`, `api/catalog/[id]`, `api/goals`, `api/plans`, `api/periodicidades`. When adding a new public read, check `obtenerSesion` usage in the sibling public routes for the established pattern (session is optional there, only used to personalize the response, e.g. "recomendado" flags).

### Database

Knex + MySQL. `lib/db.ts` exports a singleton `db` cached on `global` so Next's dev-mode hot-reload doesn't open a new connection pool per edit. Migrations/seeds live in `src/db/migrations` and `src/db/seeds` (config in `src/db/knexfile.ts`, run from `src/db` as cwd per the `npm run migrate` script).

**Fixed reference data goes in the migration's `up()`, not only in seeds.** Data required for referential integrity regardless of environment (e.g. the `roles` rows, the `periodicidades` lookup table, the default `invoice_template`/`smtp_settings` singleton row) is inserted directly inside the migration that creates the table. `npm run seed` is reserved for dev-only sample/demo data (test users, sample products) that a fresh prod database should not need.

Two ownership patterns coexist deliberately on `plans`: `trainer_id IS NULL` means an admin-managed system plan (edited only via `api/admin/plans`), `trainer_id` set means a trainer-owned plan (edited only via `api/trainer/plans`, scoped to that trainer). This is intentional, not partially-migrated legacy state.

### Business logic in `lib/`

Non-trivial logic is extracted out of route handlers into `src/lib/*.ts` so it can be shared and unit-tested:

- **`pagosPlan.ts`** — computes/creates the client's next plan payment based on their plan's `periodicidad_key` (weekly/monthly/quarterly/etc., looked up from the `periodicidades` table) and their last paid period. `obtenerOCrearPagoPendiente` wraps its read-then-insert in a `db.transaction` with `SELECT ... FOR UPDATE` on the user row specifically to serialize concurrent calls (double-tab, cron racing a page load) and avoid duplicate pending charges — don't simplify this back to a plain read/insert.
- **`cancelacionPlan.ts`** — plan cancellation: no refunds, access continues until the already-paid period's `periodo_fin`; finalization (clearing `plan_key`) happens later via the scheduler once that date passes.
- **`scheduler.ts`** — a daily `node-cron` job registered once from `src/instrumentation.ts` (Next's official hook for run-once-at-boot server code). Guards against double-execution (both within one process and across multiple Node processes/replicas) via a `scheduler_runs` table with a unique `run_date` column — the job attempts an insert and only proceeds if it wins the race. `POST /api/admin/tareas/ejecutar` triggers the same logic on demand, bypassing the daily-lock (`forzar: true`), for manual ops/testing.
- **`alertas.ts`, `dietaEstado.ts`, `rutinaEstado.ts`** — adherence/compliance calculations (workout completion %, diet adherence) shared between the client's own dashboards and the trainer's client-detail view.
- **`historial.ts`** — permanent completion history, separate from the mutable `workout_completions`/`diet_completions` tables (which get deleted on un-toggle). Writes here are insert-only and idempotent per day, so unchecking a workout/meal never erases the historical record of it having been done.
- **`auditoria.ts` / `notificaciones.ts`** — `registrarAuditoria()` and `crearNotificacion()` are called consistently from mutating admin/trainer actions; follow that pattern for new mutating endpoints rather than logging ad hoc.
- **`upload.ts`** — the only sanctioned path for saving user-uploaded images (progress photos, product images, payment comprobantes). Validates real size/MIME via `sharp` before writing to `public/uploads/<carpeta>/`; don't write uploaded files directly with `fs`.
- **`email.ts`** — sends via `nodemailer` using SMTP credentials read from the `smtp_settings` table (not env vars) so the admin can configure them from the UI. Falls back to `console.log` if unconfigured, so registration/password flows don't hard-fail in dev.
- **`salud.ts`** — Katch-McArdle (when body-fat % is known) vs. Mifflin-St Jeor calorie/macro calculation; has unit tests (`salud.test.ts`) covering both formula branches.

### Testing

Vitest, config at `vitest.config.mts`, tests co-located as `*.test.ts` next to the module they cover in `src/lib`. Because `lib/db.ts` exports a live Knex singleton, tests mock the whole module (`vi.mock("@/lib/db")`) with a small hand-rolled fluent query-builder stub rather than hitting a real database — see `pagosPlan.test.ts` for the pattern (a per-table FIFO queue of canned rows, consumed in the exact order the code under test calls `db(table)...first()`/`.insert()`). When changing call order or adding a new `db()` call inside a tested function, you must update the corresponding test's queues to match.
