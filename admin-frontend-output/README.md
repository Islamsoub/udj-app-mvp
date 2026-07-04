# Unipocket Admin Portal — Frontend (Pass B)

Next.js 15 (App Router) admin dashboard for the Unipocket student portal —
Université de Djibouti. French-only UI, Djibouti working week (Dimanche →
Jeudi), jade design system, grades on /20.

Talks to the Express backend from Pass A (`admin-backend-output/`), mounted at
`/admin` (e.g. `POST /admin/auth/login`).

## Stack

Next.js 15 · React 19 · TypeScript (strict) · Tailwind CSS 4 · TanStack Query
v5 · TanStack Table v8 · react-hook-form + Zod · Recharts · Zustand ·
Lucide React · date-fns (fr). Primitives follow shadcn/ui patterns (cva +
`cn()`), fully re-styled with the prototype's tokens — no gray defaults.

## Setup

```bash
npm install
cp .env.example .env.local   # then set NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3001 (or next default 3000)
```

### Environment

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (routes live under `/admin`) | `https://udj-api.onrender.com` |

Default test login (from the backend seed): `hassan.aden@univ.dj` /
`admin1234` (SUPER_ADMIN).

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` (strict) |

## Architecture notes

- **Design tokens** — declared once as CSS custom properties in
  `styles/globals.css`, mapped into Tailwind in `tailwind.config.ts`, and
  mirrored as TS constants in `lib/tokens.ts` (for Recharts/SVG). Off-grid
  values (13.5px, 9px radius, `#EEF2F0`) are intentional prototype values.
- **Auth** — tokens in `stores/auth-store.ts` (Zustand + localStorage
  persist). `lib/api.ts` injects the bearer header and performs a
  single-flight silent refresh on 401; refresh failure clears state and
  redirects to `/login`.
- **Data** — one query-hook file per resource in `hooks/queries/`, matching
  the exact backend request/response shapes (`lib/types.ts`). Mutations
  invalidate their query keys and toast on success.
- **Modals** — global store (`AdminUI.open/close` pattern):
  `useModal().open(<Modal …/>)`; `ModalProvider` renders the scrim and closes
  on Esc / scrim click.
- **RBAC** — `lib/constants.ts#PAGE_ACCESS` gates sidebar items; restricted
  pages render `<AccessDenied/>` on direct navigation. FACULTY_ADMIN data
  scoping is enforced server-side.
- **NF formula** — `NF = wCc·CC + wCf·CF` with weights read live from
  `GET /admin/settings` (never hardcoded).
