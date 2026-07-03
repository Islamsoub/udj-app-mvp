# Unipocket Admin Portal — Backend

Server-side code for the admin portal: Prisma additions, middleware, all `/admin/*`
route handlers, and a seed. Built to match the existing backend conventions
(Express 5 Router, async handlers, `try/catch` → `next(err)`, `AppError`, zod,
Prisma singleton, `bcrypt`, `hashToken`).

> **Verified:** every file in this folder type-checks (`tsc --noEmit`, exit 0)
> against the real generated Prisma client for existing models, with the four new
> models merged into the schema. Existing student routes are untouched.

## Integration steps

1. **Schema** — merge `schema-additions.prisma` into `backend/prisma/schema.prisma`
   (add the enum + 4 models, and the single `admins Admin[]` line to `Faculty`),
   then `npx prisma migrate dev --name admin_portal` (uses `--legacy-peer-deps`
   for any install).
2. **Files** — copy into `backend/src`:
   - `config/adminEnv.ts` → `src/config/adminEnv.ts`
   - `middleware/*.ts` → `src/middleware/`
   - `utils/adminHelpers.ts` → `src/utils/`
   - `routes/admin/*.ts` → `src/routes/admin/`
   - `seed-admin.ts` → `backend/prisma/seed-admin.ts`
3. **Mount** — in `src/index.ts`:
   ```ts
   import adminRouter from './routes/admin';
   app.use('/admin', adminRouter);
   ```
4. **Env** — add to `backend/.env` (and `.env.example`):
   ```
   JWT_ADMIN_SECRET=<32+ chars, different from JWT_SECRET>
   JWT_ADMIN_REFRESH_SECRET=<32+ chars, different from REFRESH_SECRET>
   ADMIN_CORS_ORIGIN=https://admin-unipocket.vercel.app
   ```
   Update the CORS `origin` in production to `[env.ADMIN_CORS_ORIGIN]` (reconciliation §7).
5. **Seed** — `npx tsx prisma/seed-admin.ts` (run the main seed first).
   Log in with `hassan.aden@univ.dj` / `admin1234` (SUPER_ADMIN).

## Design notes / decisions

- **`bcrypt`, not `bcryptjs`** — the existing student auth uses `bcrypt` (cost 12);
  matched it for consistency rather than introducing a second hashing lib.
- **Grade NF** is always computed from `SystemSettings` weights, never hardcoded.
- **Notification history** is derived from `AuditLog` rows where `action =
  'notification.send'` (the `after` snapshot carries target + count) — the schema
  intentionally adds no separate notification-batch model.
- **FACULTY_ADMIN scoping** is enforced at the query level via
  `facultyScopeWhere(req, path)` + explicit ownership checks on single-entity routes.
- **Audit actions** follow the exact dot-notation of reconciliation §6; academic
  CRUD (faculty/programme/subject/semester create/update) follows the same
  convention. `attendance.approve`/`reject` and `admin.deactivate`/`reactivate`
  are derived dynamically per request.

## Files

| File | Description |
|---|---|
| `schema-additions.prisma` | `AdminRole` enum + `Admin`, `AdminRefreshToken`, `AuditLog`, `SystemSettings` models, and the `Faculty.admins` relation. |
| `config/adminEnv.ts` | Validates admin JWT secrets; exports token TTLs (1h access / 30d refresh) and bcrypt cost. |
| `middleware/adminAuth.ts` | Verifies the admin JWT (`JWT_ADMIN_SECRET`), attaches typed `req.admin` `{adminId, role, facultyId}`; 401 on invalid/expired. |
| `middleware/rbac.ts` | `rbac(...roles)` factory (403 on mismatch); sets `req.adminScope` for FACULTY_ADMIN; `facultyScopeWhere()` query helper. |
| `middleware/auditLog.ts` | `audit(action, entityType)` — snapshots before/after, writes `AuditLog` with IP after a 2xx response; redacts secrets. |
| `routes/admin/auth.ts` | login, refresh (rotating), logout, `me`, change-password. |
| `routes/admin/dashboard.ts` | `stats` (computed from real queries) + `recent-activity` (last 20 audit entries). |
| `routes/admin/students.ts` | list (search/filter/paginate), detail (+grades/attendance/schedule), create, update, reset-password, CSV import, status change. |
| `routes/admin/academics.ts` | Full CRUD for faculties, programmes, semesters (current-unset logic), subjects (unique tuple guard). |
| `routes/admin/schedule.ts` | list (filters), create/update (end>start + room-conflict warning), delete. |
| `routes/admin/grades.ts` | list, update (recompute NF from settings), bulk upsert, publish (+ `GRADES` notifications). |
| `routes/admin/attendance.ts` | overview + pending count, record session, approve/reject justification, pending list. |
| `routes/admin/news.ts` | list, detail, create, update, delete (SUPER_ADMIN). |
| `routes/admin/notifications.ts` | send (target: all/faculty/programme/students) + history (from audit log). |
| `routes/admin/users.ts` | admin user CRUD (SUPER_ADMIN only); delete = soft (isActive=false). |
| `routes/admin/audit.ts` | audit-log search/filter (admin, entityType, action prefix, date range), paginated. |
| `routes/admin/settings.ts` | get settings; patch grade-formula (weights sum to 1.0), attendance-threshold (50–100), automations. |
| `routes/admin/index.ts` | Aggregates all sub-routers into `adminRouter`. |
| `seed-admin.ts` | 6 admins (`admin1234`), SystemSettings singleton, 19 audit entries, 5 notification-history entries. |
