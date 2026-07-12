# Unipocket Admin Portal — Pass C-2 (Frontend UX Architecture Updates)

This folder contains every **new or modified** frontend file that implements the
nine UX Architecture changes (implementation spec **§30**, architecture doc
**§1–11**) against the existing Next.js 15 admin portal at `admin/`.

Paths below are relative to `admin/`. **Modified files are complete** — drop them
in over the existing file. **New files** are added at the path shown. Every
import uses the `@/…` alias, so files are drop-in replacements.

---

## How to apply

1. Copy the tree in this folder over `admin/` (same relative paths).
2. `cd admin && npm install` (no new dependencies were added).
3. `npx tsc --noEmit` — passes clean (see **Verification** below).
4. `npm run dev`.

No backend changes here — this pass consumes the Pass C-1 backend
(`admin-pass-c-backend/`). Request/response shapes were read from those route
files, not assumed.

---

## Verification

`npx tsc --noEmit` (TypeScript **strict**, `no-any`) was run over the **entire
`admin/` project with these 24 files overlaid** (101 app/component/hook/lib/store
files, real `react` / `next` / `@tanstack/react-query` / `react-hook-form` /
`zod` / `zustand` types). **Result: 0 errors.** A negative-control probe
(injecting one bad assignment) was confirmed to fail the check, so the pass is
meaningful and not a no-op. A separate static pass verified all **307** `@/…`
named imports resolve to real exports.

---

## File map

### New files

| File | Purpose | Spec |
|---|---|---|
| `stores/scope-store.ts` | Zustand scope store — `facultyId`, `programmeId` (+ `scheduleMode`, `room`, `professorName` for §30.7). In-memory (resets on refresh). Changing faculty clears the programme. | §30.1 |
| `components/shell/context-bar.tsx` | The persistent Faculté → Programme strip (sticky `top:64`, ~46px). Default muted / active jade-tint + "Vue filtrée · N étudiants" + Réinitialiser. FACULTY_ADMIN faculty locked (shield+lock); NEWS_EDITOR hidden. On the schedule page in *par salle* / *par enseignant* mode it swaps to a room / enseignant dropdown. Exports `isScopedPath`. | §30.1 |
| `components/shared/lifecycle-badge.tsx` | `LifecycleBadge` + `STAGE_META` — the 7-stage lifecycle rendered with the existing `Badge` + tones. | §30.2 |
| `hooks/use-subject-stages.ts` | `computeSubjectStage(rows)` (pure, matches the backend publish rules) + `useSubjectStages(programmeId, semesterId)` returning per-subject stages, grouped grades, and the CC/NF publish-gating summary. | §30.2 |
| `components/modals/grade-correction-modal.tsx` | `GradeCorrectionModal` — "Correction de note" (current value read-only, new value, mandatory reason). Posts `/admin/grades/:id/change`; toasts "Correction consignée au journal d'audit". SUPER_ADMIN / REGISTRAR only. | §30.3 |
| `hooks/queries/use-attendance-overview.ts` | `useAttendanceOverview(programmeId)` → `GET /admin/attendance/overview` (enabled only when a programme is scoped). | §30.6 |

### Modified files

| File | What changed | Spec |
|---|---|---|
| `lib/types.ts` | `Grade`/`StudentGrade`: `publishedAt` → `publishedCcAt` + `publishedNfAt`. `AttendanceStatus`: drop `LATE`, add `PARTIAL`. `AttendanceRecordRow`/`StudentAttendanceRecord`: add `hoursAttended`. New `NewsCategory`, `NotificationType` (adds `NEWS`), `SystemSettings.justificationDeadlineDays`, `GradeChangeInput`, `AttendanceOverview` (per-subject row) + `AttendanceOverviewResponse`, `PublishGradesInput`/updated `PublishGradesResult`, schedule `ScheduleFilters`/`ScheduleConflict(s)Result`, `CreateNewsInput.categoryId`/`sendNotification`. | §10 |
| `lib/validations.ts` | New `gradeCorrectionSchema`, `attendanceRecordSchema` + `attendanceSessionSchema` (PARTIAL + hoursAttended), `newsCategorySchema`. | §10 |
| `app/(dashboard)/layout.tsx` | Renders `<ContextBar/>` between the TopBar and content, only on scoped routes (`isScopedPath`). | §30.1 |
| `hooks/queries/use-academics.ts` | Verified the faculty/programme dropdown queries; added a `useProgramme(id)` selector. | §30.1 |
| `hooks/queries/use-grades.ts` | `usePublishGrades` now takes `{ type:'cc'\|'nf', semesterId, subjectId?/programmeId? }`; new `useCorrectGrade`; type refs updated. | §30.2/§30.3 |
| `hooks/queries/use-attendance.ts` | `useRecordSession` handles PARTIAL + `hoursAttended`; endpoint-response type renamed to `AttendanceSummary` (see Notes). | §30.5 |
| `hooks/queries/use-schedule.ts` | `useSchedule` accepts `room`/`professorName`; new `useScheduleConflicts`. | §30.7 |
| `hooks/queries/use-news.ts` | New `useNewsCategories`, `useCreateCategory`, `useDeleteCategory`, `useReorderCategories`; create/update return `NewsMutationResult`. | §30.8/§30.9 |
| `hooks/queries/use-settings.ts` | New `useUpdateJustificationDeadline`; `useUpdateAutomations` kept but marked deprecated. | §30.9 |
| `app/(dashboard)/grades/page.tsx` | Requires a scoped programme (empty state otherwise); lifecycle badges replace progress bars; the two semester-level publication actions (CC → NF → "Résultats publiés" pill). | §30.2 |
| `app/(dashboard)/grades/[subjectId]/page.tsx` | Stage-based cell locking (CC published → CC read-only + lock glyph; NF published → all read-only); status line; per-subject Publier removed; locked cells open the correction modal. | §30.3 |
| `app/(dashboard)/students/[id]/page.tsx` | Notes tab uses editable `GradeCell` CC/CF with the same lock rules, live NF recompute, a compact save bar, and the correction modal for locked cells. | §30.4 |
| `app/(dashboard)/attendance/session/page.tsx` | Présent / Partiel / Absent (Retard removed); inline hours stepper for Partiel ("Xh / Yh", ±0.25, clamped); Heures-suivies card + updated sticky summary; PARTIAL sends `hoursAttended`. | §30.5 |
| `app/(dashboard)/attendance/page.tsx` | Programme-scoped overview table (threshold tinting + status icons) above the always-visible justification queue, under a "File des justificatifs" divider. | §30.6 |
| `app/(dashboard)/schedule/page.tsx` | Segmented control (Par programme / Par salle / Par enseignant); read-only cross-programme views with conflict detection ("⚠ Conflit", "Lecture seule"); a block click in a read-only view jumps to its programme, pre-selected to edit. | §30.7 |
| `components/forms/schedule-form.tsx` | Real-time soft room-conflict warning below the Salle field (amber; does not block save). | §30.7 |
| `app/(dashboard)/news/create/page.tsx` | Push toggle below Urgent — auto-enables + locks ("Auto" pill) when urgent; urgent-limit warning naming the oldest; categories fetched from the API; publish sends `sendNotification`. | §30.8 |
| `app/(dashboard)/settings/page.tsx` | "Catégories d'actualités" card (drag-to-reorder + add + delete-with-confirm); "Délai de justification" field in Assiduité; the three automation toggles greyed out behind "Notifications automatiques toujours actives". | §30.9 |

---

## Notes & decisions

- **`AttendanceOverview` name collision.** The task asks for a type
  `AttendanceOverview = { subjectId, … }`, but that name was already the
  `GET /admin/attendance` response shape. To keep the codebase compiling, the
  existing response type was renamed **`AttendanceSummary`** (only referenced by
  `use-attendance.ts`, which is updated), and `AttendanceOverview` now carries
  the per-subject rollup as requested, with `AttendanceOverviewResponse` for the
  endpoint envelope.
- **`LATE` removed.** The Pass C-1 backend enum is
  `PRESENT · ABSENT · PARTIAL · JUSTIFIED` (no `LATE`), so the frontend
  `AttendanceStatus` matches. `NewsArticle.publishedAt` is unchanged — only the
  two grade types lost `publishedAt`.
- **Publish targets a programme.** The picker publishes with `{ programmeId }`
  (backend resolves every subject in that programme + semester), which is exactly
  the "publish all subjects in the selected semester" action §30.2 describes.
- **Locked-subject import.** On the grade-entry page the CSV "Importer" button is
  hidden once CC is published, so a bulk import can't silently overwrite a
  published CC (corrections must go through the audit-logged modal).
- **Scope store extensions.** `scope-store.ts` keeps the task's required
  interface (`facultyId`/`programmeId`/`setFaculty`/`setProgramme`/`reset`) and
  adds `scheduleMode`/`room`/`professorName`, which §30.7 explicitly stores in
  the scope.
- **Context bar on students / academics / notifications.** The bar renders on all
  six scoped pages (§30.1), but wiring the scope *into* those three page bodies
  is outside this pass's file list — only grades, attendance and schedule consume
  it here. Selection still persists across navigation.
- **Attendance overview rows** are informational (no row-click navigation); the
  §30.6 detail modal (`AttendanceSubjectModal`) was not in the file list, so no
  half-wired link was introduced.
- **Deprecated automation toggles** read their values from settings and are
  disabled; they do not call the API (publication is two-phase manual, system
  notifications are always-on).
