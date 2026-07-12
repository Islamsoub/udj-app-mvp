# Unipocket Admin Portal — Pass C-1 (Backend Schema + Route Updates)

This folder contains every **new or modified** backend file needed to support the
UX architecture decisions (architecture doc §9–10, implementation spec §30).
Modified files are **complete** — drop them in over the existing file. New files
are added at the path shown. No existing middleware (`adminAuth`, `rbac`,
`auditLog`) was changed.

Paths below are relative to `backend/`.

---

## How to apply

1. **Merge the schema.** Fold `schema-changes.prisma` into
   `prisma/schema.prisma` (it is an annotated patch, not a standalone schema —
   each block says what to replace/add).
2. **Regenerate + migrate.**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name admin_pass_c   # or `prisma db push` in dev
   ```
3. **Copy the files** in `src/**` and `prisma/**` over the existing tree.
4. **Backfill data.**
   ```bash
   npx tsx prisma/seed-admin-update.ts
   ```
5. **Type-check.** `npx tsc --noEmit` (passes clean alongside existing code).

---

## File map

### Schema

| File | Change |
|---|---|
| `schema-changes.prisma` | **NEW (patch).** `Grade.publishedAt` → `publishedCcAt` + `publishedNfAt`; `AttendanceStatus += PARTIAL`; `AttendanceRecord.hoursAttended Float?`; `SystemSettings.justificationDeadlineDays Int @default(8)` (+ deprecates `autoPublishGrades`/`notifyOnPublish`/`weeklyRecap`, kept but ignored); new `NewsCategory` model; `NewsArticle.categoryId` + `categoryRel` relation (keeps `category String`); `NotificationType += NEWS`. |

### New shared utilities

| File | Purpose |
|---|---|
| `src/utils/notify.ts` | **NEW.** `createNotification(studentIds, type, title, body, client?)` — the single reusable helper every route uses to fan out automated notifications (French-only; `titleAr`/`bodyAr` empty, matching the existing composer). Accepts an optional transaction client and returns the created count. |
| `src/utils/attendance.ts` | **NEW.** Hours-based attendance math (§4.3): `buildSessionHoursResolver` (derives per-session hours from `ScheduleEntry` start/end, subject+weekday with average/`DEFAULT_SESSION_HOURS` fallback), `attendedHours`, `hoursBasedPercentage`. Shared by the admin overview and student routes. |

### Admin routes

| File | Change |
|---|---|
| `src/routes/admin/grades.ts` | `POST /publish` now takes `type: 'cc' \| 'nf'` + `semesterId` (+ optional `subjectId`/`programmeId`); validates CC-entered (cc) or CC-published + CF-entered + NF-computed (nf); sets the matching timestamp; notifies students via `createNotification` (type `GRADES`). **New `POST /:id/change`** — post-publication correction `{field:'cc'\|'cf', value, reason}`, recomputes NF, records `reason`/old/new in the audit `after` (action `grade.change`), SUPER_ADMIN/REGISTRAR only. Dropped the `notifyOnPublish` gate (notifications always on). |
| `src/routes/admin/attendance.ts` | `POST /record` accepts `PARTIAL` + per-record `hoursAttended` (required & `0 < h ≤` session length for PARTIAL; null otherwise); session length derived from the subject's `ScheduleEntry`. `PATCH /:id/justification` now fires an `ATTENDANCE` notification to the student on approve/reject. **New `GET /overview?programmeId=`** — per-subject sessions (completed/total), hours-based class average, students-at-risk (below `SystemSettings.attendanceThreshold`). Pending-justifications list re-sorted oldest-first. |
| `src/routes/admin/schedule.ts` | `GET /` adds `?room=` / `?professorName=` filters (cross-programme, faculty scope still enforced; programme filter ignored in those modes). New `checkRoomConflict(room, dayOfWeek, startTime, endTime, excludeId?)` util exposed as **`GET /conflicts`**; create/update reuse it for the soft same-semester warning. Create/update/delete now send a `SCHEDULE` notification to all students in the affected programme. |
| `src/routes/admin/news.ts` | Max-3-urgent enforcement (`enforceUrgentLimit` unpins the oldest urgent, returned as `unpinned`); accepts `categoryId` and dual-writes with `category`; `GET` endpoints `include: { categoryRel }`. Urgent publish (or `sendNotification:true`) fans out a `NEWS` notification to all active students; PATCH notifies on the false→true urgent transition or explicit `sendNotification`. |
| `src/routes/admin/categories.ts` | **NEW.** News-category CRUD under `/admin/news/categories`: `GET /`, `POST /` (slug auto-generated from `nameFr`, deduped), `PATCH /reorder` (drag-and-drop), `PATCH /:id`, `DELETE /:id` (409 if any article still references it by `categoryId` or legacy slug). Audit actions `news.category.*`. |
| `src/routes/admin/settings.ts` | `GET /` now returns `justificationDeadlineDays` (whole singleton row). **New `PATCH /justification-deadline`** (`days` 1–30). `PATCH /automations` kept but documented as deprecated/ignored. |
| `src/routes/admin/dashboard.ts` | `grade.publishedAt` reference replaced with `publishedNfAt` (GPA/distribution count only final-published grades). Required so the codebase still compiles after the field rename. |
| `src/routes/admin/index.ts` | Mounts the new categories router at `/news/categories` **before** `/news` (so it isn't captured by the news `GET /:id` route). |

### Student routes (mobile API)

| File | Change |
|---|---|
| `src/routes/student.ts` | `GET /grades`: dual-timestamp visibility — unpublished grades omitted, CC-only masks CF/NF as null, GPA/mention/credits count only NF-published; adds `ccPublished`/`nfPublished` flags (both single-semester and `allSemesters` history). `GET /attendance`: hours-based percentages via the shared helper, adds a `partial` count. `GET /me`: attendance percentage switched to hours-based and GPA gated on NF publication (consistency with the grades screen). `POST /attendance/:id/justification`: enforces the configurable `justificationDeadlineDays` window (§4.4). |

### Seed

| File | Change |
|---|---|
| `prisma/seed-admin-update.ts` | **NEW.** Upserts the 6 `NewsCategory` rows (Officiel, Événements, Scolarité, Sport, Youth, Sponsors), backfills `NewsArticle.categoryId` from each article's existing `category` slug, and ensures `justificationDeadlineDays = 8`. Idempotent. |

---

## Notes & decisions

- **Type updates (task §3).** There is no separate shared types file in the
  backend — routes use the Prisma-generated types (`AttendanceStatus`,
  `NotificationType`, `Grade`, `AttendanceRecord`) directly. Adding `PARTIAL` /
  `NEWS` to the enums and the new columns to the schema propagates the type
  changes on `prisma generate`; the inline union annotations in `student.ts`
  were updated to the `AttendanceStatus` enum.
- **`grade.change` audit action.** New endpoints need an action string not in
  reconciliation §6; `grade.change` is used for post-publication corrections
  (distinct from `grade.update`) so corrections are easy to isolate in the
  audit trail. Category actions use `news.category.{create,update,delete,reorder}`.
- **Notification helper contract.** `createNotification(studentIds, type,
  title, body, client?)` maps `title`→`titleFr`, `body`→`bodyFr` and leaves the
  Arabic columns empty (admin portal is French-only). The optional `client`
  lets grade publication run the publish + notify inside one `$transaction`.
- **Session hours.** PRESENT/JUSTIFIED count the full derived session length,
  PARTIAL counts `hoursAttended`, ABSENT counts 0. Session length comes from the
  subject's `ScheduleEntry` (subject + weekday), falling back to the subject's
  average slot, then `DEFAULT_SESSION_HOURS` (1.5h) — so the math is robust even
  when a session date's weekday doesn't line up exactly.
- **Faculty scope preserved.** `par salle` / `par enseignant` ignore the
  *programme* filter but still apply `FACULTY_ADMIN` faculty scope (a scoped
  admin never sees another faculty's bookings). `GET /attendance/overview`
  rejects a programme outside the admin's faculty with 403.
- **Deprecated toggles.** `autoPublishGrades` / `notifyOnPublish` / `weeklyRecap`
  remain in the schema and the `/settings/automations` endpoint for backward
  compatibility but no longer affect any behaviour.
