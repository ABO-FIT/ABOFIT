# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server (port 5173)
npm run build       # tsc -b && vite build (build fails on type errors)
npm run lint         # oxlint
npm run preview      # preview a production build
```

No test runner is configured in this project (unit tests for the shared logic live in the sibling `Backend` project). Requires `VITE_API_URL` in `.env` (see `.env.example`) — the base URL of the ABOFIT Backend API this app talks to.

## Architecture

Vite + React 19 + React Router v6 SPA. Plain hand-written CSS (no Tailwind/CSS-in-JS/component library) — `src/index.css` is the single global stylesheet; CSS custom properties on `:root` (`--ink`, `--accent`, `--accent2`, `--bg`, `--line`, `--muted`, `--disp`/`--body` fonts, etc.) are the design-token system. There is exactly one responsive breakpoint (`max-width: 860px`) where the sidebar becomes an off-canvas drawer.

This app is a pure client for the separate `Backend` (Next.js API) project — no server code lives here. It talks to it over plain `fetch`, not a proxy.

### API layer

`src/api/client.ts` (1000+ lines) is the **single file** where every backend call and its response type live — a `request<T>(path, method, body?, token?)` wrapper around `fetch`, plus one exported typed function per endpoint (e.g. `obtenerMiPlan`, `cancelarPlanEntrenador`). Pages and components never call `fetch` directly; when adding a backend call, add the typed function here first, matching the existing naming convention (Spanish, verb-first: `obtener*`, `crear*`, `actualizar*`, `cancelar*`, `marcar*`).

### Auth & routing

`AuthContext` holds the JWT + user object, persisted to `localStorage` (`abofit_token`/`abofit_usuario`). `RutaProtegida` wraps each top-level `<Route>` and both requires a token and enforces the expected role, redirecting to the correct portal root (`/portal`, `/entrenador`, `/admin`) if the logged-in role doesn't match. There are three parallel "portal shells" — `PortalClienteLayout`, `PortalEntrenadorLayout`, `PortalAdminLayout` — each just supplies a role-specific nav array (`EnlaceNav[]`) to the shared `SidebarLayout` component; add a new page to a portal by adding both the `<Route>` in `App.tsx` and the nav entry in that portal's layout file.

### Cart (dual-mode)

`CartContext` supports two independent carts: the normal authenticated cart (backed by `/api/cart`) and a **local/anonymous cart** for the public catalog (`/catalogo`, no login required), persisted to `localStorage` (`abofit_carrito_local`). On login, any items sitting in the local cart are pushed to the real backend cart one by one and the local cart is cleared — see the merge effect in `CartContext.tsx` keyed on `token` transitioning from null to set.

### Printable documents

Two independent, intentionally-not-unified printing mechanisms exist:
- **`FacturaModal`** (invoices) — pixel-exact reproduction of a reference design; prints via `#invoice-print` + a dedicated `@media print` block + `window.print()`, rendered inline inside its modal.
- **`DocumentoImprimible`** (routine/diet/history exports) — generic branded document (logo + accent-color rule only, deliberately not styled like the invoice). It mounts via `createPortal(..., document.body)` specifically to escape the app shell's flex/sidebar layout, which otherwise clips multi-page printed content to one page. Has its own `.doc-imprimible` print CSS block. If you add a new exportable report, reuse `DocumentoImprimible`, not the invoice's machinery.

### Conventions

- Component/variable names, comments, and all user-facing copy are in Spanish; keep new code consistent with that.
- Pages that list+mutate a resource follow a repeating shape: a `cargar()`/`cargarX()` function called from `useEffect`, local `error`/`mensaje` state shown inline (`role="alert"`/`role="status"`), and a `cargado` boolean gate before rendering an empty-state message (added specifically to avoid a false "no records" flash before the first fetch resolves — don't drop it when copying the pattern).
- Destructive/state-changing actions (cancel, delete) use `window.confirm(...)` before calling the API; there is no custom confirmation-modal component.
