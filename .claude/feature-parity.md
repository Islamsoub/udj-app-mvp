# Feature parity: what each product can do

Audited against develop @ `b193c149c560aa539cf35251fa3d31574f0502bf` on 2026-11-12.

Every `path:line` below refers to that commit. Paths are from the repo root.
`pwa/…` and `admin/…` are the PWA and the admin portal. `backend/…` is the API.
Every other path is the Expo app at the repo root.

## Legend

| Status | Meaning |
|---|---|
| **BUILT** | A user can reach it. Backend: the route exists and is mounted. Client: a rendered page or component calls it, traced from the helper to its caller and on to a route file. The cell cites the caller. |
| **PARTIAL — …** | A user can reach it, but part of it is missing: a parameter is ignored so data never shows up, a server value is recomputed, and so on. The cell cites the part that exists and the place where the gap shows. |
| **N/A — …** | The product cannot have it by design, and the reason is in code or in CLAUDE.md. N/A never stands for "probably not wanted". |
| **MISSING** | There is no code path. If a helper exists but nothing calls it, the cell reads `MISSING (helper <path:line>, no caller)`. When nobody has decided whether the gap is by design, it is still MISSING, never N/A (mission decision D3). |
| **UNSURE — …** | Tracing did not settle it. The cell says what was checked and what is still unknown. |

**Auth boundary (the source of every uncited N/A).** Student routes run
`authMiddleware` (`backend/src/middleware/auth.ts:19`), applied router-wide at
`backend/src/routes/student.ts:49` and `backend/src/routes/news.ts:26`, and on
`POST /auth/logout` at `backend/src/routes/auth.ts:241`. It only accepts a student
access token signed with `JWT_SECRET`. Staff only hold an admin token, which is
signed with `JWT_ADMIN_SECRET` and checked by `adminAuth`
(`backend/src/middleware/adminAuth.ts:46`). So a cell reading **N/A — auth boundary**
needs no citation of its own. In the other direction, `/admin` routes are N/A for
the app and the PWA. Three student-facing routes sit outside `authMiddleware`
(`/auth/login`, `/auth/refresh`, `/news/categories`). Their admin cells cite their
own reason.

## Method

- Branch `feature/feature-parity-skeleton`, cut from `origin/develop` at the SHA
  above after a `git fetch`.
- **Backend**: mounts in `backend/src/index.ts:53-56`. Handlers were listed with
  `grep -rnE "router\.(get|post|put|patch|delete)\(" backend/src/routes`, reading
  the next line where the path is on its own line. There are **18 student-facing
  handlers**: 3 in `auth.ts`, 12 in `student.ts` and 3 in `news.ts`. Each appears in
  exactly one row (see the index at the end).
- **App**: helpers in `services/api.ts`, `services/auth.ts` and
  `services/pushNotifications.ts`. I grepped each helper name and each raw path
  string across `app/`, `components/`, `hooks/`, `stores/` and `services/`, then
  traced each one to a route file under `app/`.
- **PWA**: helpers in `pwa/lib/api-client.ts` and `pwa/lib/auth-client.ts`, plus
  the route handlers in `pwa/app/api/auth/*/route.ts`. I traced each caller through
  `pwa/components/**` to one of the six pages under `pwa/app/(app)/` or to
  `pwa/app/login/`. `pwa/app/api/backend/[...path]/route.ts` is the PWA's own proxy,
  not a capability. It matters only where its method allow-list blocks a capability.
- **Admin**: I grepped `admin/` for any non-`/admin` API path. There are none. The
  `/news` strings in `admin/lib/constants.ts` and in the pages are page routes.
- **Derived values**: a client cell is BUILT only if the client renders the
  server's field. If the client computes the same kind of value itself, the cell is
  PARTIAL and cites the code that does it.
- **Unused parameters**: an unused parameter is noted, not counted, only when
  **no** client offers the view it selects. Example: `semesterId` on
  `/student/schedule`. Neither client offers a past-semester schedule, so both
  cells stay BUILT with a note. If any client offers the view a parameter selects,
  the client that lacks it is PARTIAL, or the view gets its own row. Pagination
  falls under this rule: the PWA pages news and the app does not (row N2).
- Not used as sources: the Master Task List in any form, anything under
  `.claude/reports/` or `cowork/reports/`, status claims in README files, and
  feature claims in CLAUDE.md. All of it was derived from code.

## How this file stays true

When a milestone changes what a product can do, update this file in the same pull
request. That covers adding, removing or finishing a capability, and moving a
computation between server and client. Change the affected rows and cite `path:line`
at that branch's HEAD. Change the audit header only after re-auditing every row.

No agent configuration requires this yet. README.md, builder.md, lead.md and
reviewer.md do not mention this file. Wording that would make them require it is
waiting for a human (mission `2026-11-12-feature-parity`, Flag 1). Until then this
paragraph is a convention, not an enforced rule.

The Master Task List is **not** a source for this file and must not be used to
update it. Only code is.

---

## Student-facing (`/auth`, `/student`, `/news`)

### Endpoints

| # | Capability | backend | app | pwa | admin |
|---|---|---|---|---|---|
| A1 | Student login, with attempts-left and lockout | BUILT. `POST /auth/login`, `backend/src/routes/auth.ts:33`. Returns `lockedUntil` on 423 (`auth.ts:70`) and `attemptsLeft` on 401 (`auth.ts:98`). Rate limit is 10/min (`backend/src/middleware/rateLimiter.ts:125-127`). | BUILT. `app/(auth)/login.tsx:237` calls `login()` (`services/auth.ts:20-21`). Handles 401 `attemptsLeft` and the 423 `lockedUntil` countdown at `app/(auth)/login.tsx:243-252`. | BUILT. `pwa/components/login/LoginForm.tsx:97` calls `login()` (`pwa/lib/auth-client.ts:70`), which goes through `pwa/app/api/auth/login/route.ts:42`. Rendered from `pwa/components/login/LoginCard.tsx:40` and `pwa/app/login/page.tsx:20`. 423 is mapped at `pwa/components/login/LoginError.ts:51-52`, and 401 attempts at `LoginError.ts:47`. | N/A. The route looks up the `student` table only (`backend/src/routes/auth.ts:43`). Staff sign in through `/admin/auth` (`backend/src/routes/admin/index.ts:28`). |
| A2 | Session refresh (token rotation) | BUILT. `POST /auth/refresh`, `backend/src/routes/auth.ts:169`. Rotates the token. Answers 403 for a suspended account (`auth.ts:201-202`). | BUILT. The 401 interceptor on the shared axios instance (`services/api.ts:230-293`, refresh call at `services/api.ts:269-273`) covers every helper. Cold start: `restoreSession()` (`services/auth.ts:96-104`), called by `app/(auth)/splash.tsx:111`. | BUILT. `pwa/app/api/auth/refresh/route.ts:36` reads the httpOnly cookie. Called by `refreshAccessToken` (`pwa/lib/api-client.ts:89`), single-flighted at `pwa/lib/api-client.ts:143`. Cold load: `pwa/components/shell/session-guard.ts:60`, run from `pwa/components/shell/AppShell.tsx:75`. | N/A. The route looks up the `student` table only (`backend/src/routes/auth.ts:196`). The portal refreshes through `/admin/auth/refresh` (`admin/lib/api.ts:51`). |
| A3 | Logout (revoke refresh token) | BUILT. `POST /auth/logout`, `backend/src/routes/auth.ts:241`. | BUILT. `services/auth.ts:43` (retried at `:52`), called by `app/settings.tsx:165`. | BUILT. `pwa/app/api/auth/logout/route.ts:32`, reached through `pwa/lib/auth-client.ts:112-118`. Called by `pwa/components/profile/AccountActions.tsx:40` (rendered at `pwa/components/profile/Profile.tsx:103`) and `pwa/components/shell/AppShell.tsx:169`. | N/A. Auth boundary. |
| S1 | Student profile and stats | BUILT. `GET /student/me`, `backend/src/routes/student.ts:114`. | BUILT. `app/(tabs)/home.tsx:535`, `app/(tabs)/profile.tsx:369`, `services/auth.ts:111` (session restore). | BUILT. `pwa/components/profile/Profile.tsx:34`, rendered by `pwa/app/(app)/profile/page.tsx:9`. | N/A. Auth boundary. |
| S2 | Weekly schedule | BUILT. `GET /student/schedule`, `backend/src/routes/student.ts:272`. Optional `semesterId`. | BUILT. `app/(tabs)/home.tsx:551`, `app/(tabs)/schedule.tsx:400`. Current semester only: no caller passes `semesterId` (`services/api.ts:300`). The PWA does the same. | BUILT. `pwa/components/schedule/Schedule.tsx:27` (via `pwa/app/(app)/schedule/page.tsx:9`), `pwa/components/dashboard/NextClassCard.tsx:17`. Current semester only. | N/A. Auth boundary. |
| S3 | Grades: one semester, plus the all-semesters summary (`?allSemesters=true`) | BUILT. `GET /student/grades`, `backend/src/routes/student.ts:330`. Two modes: `allSemesters` at `:346-397` and a single semester at `:400-468`. | BUILT. Semester: `app/(tabs)/grades.tsx:166`. All semesters: `app/(tabs)/grades.tsx:184`. | BUILT. Semester: `pwa/components/grades/Grades.tsx:28` and `pwa/components/grades/useSemesterDetail.ts:114` (from `pwa/components/grades/GradesView.tsx:68`). All semesters: `Grades.tsx:28`, `pwa/components/dashboard/GpaCard.tsx:31`, `pwa/components/profile/Profile.tsx:37`. | N/A. Auth boundary. |
| S4 | Attendance summary (per subject and overall) | BUILT. `GET /student/attendance`, `backend/src/routes/student.ts:478`. | BUILT. `app/attendance.tsx:287`. The route is pushed from `app/(tabs)/home.tsx:408`. | BUILT. `pwa/components/attendance/Attendance.tsx:29` (via `pwa/app/(app)/attendance/page.tsx:9`), `pwa/components/dashboard/AttendanceCard.tsx:60`. | N/A. Auth boundary. |
| S5 | Upload an absence justification | BUILT. `POST /student/attendance/:recordId/justification`, `backend/src/routes/student.ts:1012`. multer, 5 MB, magic-byte check (`:1041-1042`), deadline enforced (`:1076-1081`). | BUILT. `app/attendance.tsx:177`, from the `JustifySheet` rendered at `app/attendance.tsx:206`. The app decides who may submit on its own rule; see row D7. | BUILT. `pwa/components/attendance/JustificationForm.tsx:200`, reached through `pwa/components/attendance/JustificationPanel.tsx:94`, `pwa/components/attendance/AttendanceView.tsx:211` and `pwa/components/attendance/Attendance.tsx:127`. The proxy allows only this one POST (`pwa/app/api/backend/[...path]/route.ts:127,174`). | N/A. Auth boundary. |
| S6 | Notifications list and unread count | BUILT. `GET /student/notifications`, `backend/src/routes/student.ts:773`. `limit` defaults to 20, plus `offset` (`:776-777`). | PARTIAL: no pagination, and the unread count is not used. The list renders at `app/notifications.tsx:295`, but the helper sends no `limit`/`offset` (`services/api.ts:495-497`), so only the 20 newest are reachable. The home bell badge is hard-wired off (`app/(tabs)/home.tsx:364`, `showBadge = false // TODO`). | PARTIAL: dashboard preview only. `pwa/components/dashboard/NotificationsCard.tsx:25` asks for 3 (`:14`) and shows titles and the unread count. There is no notifications page, and the card is not a link (`:17-21`). | N/A. Auth boundary. |
| S7 | Mark all notifications read | BUILT. `PATCH /student/notifications/read-all`, `backend/src/routes/student.ts:807`. | BUILT. `app/notifications.tsx:358`. | MISSING (helper `pwa/lib/api-client.ts:391`, no caller). | N/A. Auth boundary. |
| S8 | Mark one notification read | BUILT. `PATCH /student/notifications/:id/read`, `backend/src/routes/student.ts:825`. | BUILT. `app/notifications.tsx:331`, with the local mirror at `:332`. | MISSING. No helper and no caller. The proxy would forward the PATCH (`pwa/app/api/backend/[...path]/route.ts:122`). | N/A. Auth boundary. |
| S9 | Notification preferences and quiet hours | BUILT. `PATCH /student/preferences`, `backend/src/routes/student.ts:871`. | BUILT. Toggles: `app/settings.tsx:133`. Quiet hours: `app/settings.tsx:159`. | BUILT. `pwa/components/profile/NotificationPrefs.tsx:79`, rendered at `pwa/components/profile/Profile.tsx:79`. The PWA receives no pushes itself (row S10), so these settings only affect the student's app devices. | N/A. Auth boundary. |
| S10 | Register a device for push | BUILT. `POST /student/push-token`, `backend/src/routes/student.ts:905`. | BUILT. `services/pushNotifications.ts:34`, called from `app/_layout.tsx:163` once authenticated. | MISSING. No push registration in `pwa/` (no PushManager, no helper). The proxy forwards no POST except the justification upload (`pwa/app/api/backend/[...path]/route.ts:174`). | N/A. Auth boundary. |
| S11 | Remove the device's push token on logout | BUILT. `DELETE /student/push-token`, `backend/src/routes/student.ts:949`. | BUILT. `services/auth.ts:67-68`, inside `logout()`, called from `app/settings.tsx:165`. Note: the token is looked up without `projectId` (`services/auth.ts:67`), while registration passes it (`services/pushNotifications.ts:20-22`). Failures are swallowed (`services/auth.ts:69-71`). | MISSING. The proxy exports no DELETE (`pwa/app/api/backend/[...path]/route.ts:117-174`). | N/A. Auth boundary. |
| S12 | Signed QR student-card token (60 s) | BUILT. `GET /student/qr-token`, `backend/src/routes/student.ts:970`. Signed with `QR_SECRET`, expires in 60 s (`:985-997`). | BUILT. `app/(tabs)/profile.tsx:387`, refetched every 55 s (`:393`). | MISSING. No helper and no caller. `pwa/lib/offline-cache.ts:45-49` already says the token must never be cached if it is added. | N/A. Auth boundary. |
| N1 | News categories (filter chip labels, FR/AR) | BUILT. `GET /news/categories`, `backend/src/routes/news.ts:13`. **Public**: registered before `authMiddleware` (`news.ts:10-12`, `:26`). | BUILT. `app/(tabs)/news.tsx:210`, with a SQLite fallback at `:215`. | MISSING. Chip labels come from the locale files for six hardcoded slugs (`pwa/components/news/model.ts:30-37`; reason at `:17-20`). A category added in admin gets no chip (`model.ts:26-28`). | BUILT, through its own equivalent rather than this endpoint. The portal lists categories with `GET /admin/news/categories` (`backend/src/routes/admin/index.ts:36`), via `useNewsCategories` (`admin/hooks/queries/use-news.ts:71-74`). Callers: `admin/app/(dashboard)/news/create/page.tsx:45` and `admin/app/(dashboard)/settings/page.tsx:128`. It never calls the public `/news/categories`. |
| N2 | News list, with category filter and pagination | BUILT. `GET /news`, `backend/src/routes/news.ts:30`. `category`, `limit` (default 10, max 100) and `offset` (`:34-37`). | PARTIAL: only the 10 newest articles per fetch. `app/(tabs)/news.tsx:254` calls `getNews()` with no params, so it gets the server default of 10 (`backend/src/routes/news.ts:36`). The category filter runs locally over the SQLite cache (`app/(tabs)/news.tsx:247,257`), and `offset` is never sent. Home: `app/(tabs)/home.tsx:564` (limit 5). | BUILT. `loadAllNews` pages at `limit=100` (`pwa/components/news/model.ts:83,98`) until a short page. Called by `pwa/components/news/News.tsx:82`. Filtered client-side over the full set (`model.ts:74-76`). Dashboard: `pwa/components/dashboard/NewsCard.tsx:26`. | N/A. Auth boundary. |
| N3 | Read one article | BUILT. `GET /news/:id`, `backend/src/routes/news.ts:64`. | BUILT. `app/article-reader.tsx:336`, pushed from `app/(tabs)/news.tsx:312`. | BUILT. `pwa/components/news/Reader.tsx:147`, rendered at `pwa/components/news/News.tsx:247`. | N/A. Auth boundary. |

### Server-computed values

In a client column, "reads server field" means the client renders the server's
value. Anything else names the client's own computation. The admin column is
N/A (auth boundary) throughout, because these values only arrive in student
responses. The grade calculators in both clients compute what-if averages by
design. They are client-only capabilities, recorded under milestone 3, and are not
counted against the rows below.

| # | Value | backend (computed at) | app | pwa | admin |
|---|---|---|---|---|---|
| D1 | Attendance `band` (ok / near / below) | BUILT. `backend/src/routes/student.ts:503-511` (rules from SystemSettings), `:711` (per subject), `:753` (overall). | BUILT: reads server field. Per subject: mapped from the cache at `app/attendance.tsx:383`, passed at `:197` to `components/attendance/AttendanceCard.tsx:28`, and mapped only to a tone (`components/attendance/verdict.ts:16-32`). Overall: the summary row's `band` (`app/attendance.tsx:347`) feeds the hero at `:467`. When the overall summary row is missing (a cache written before that row existed), the fallback at `:351-363` sets `band: null` and the hero shows neutral. | BUILT: reads server field. `pwa/components/attendance/Hero.tsx:29`, `pwa/components/attendance/SubjectBreakdown.tsx:28-29`, `pwa/components/attendance/model.ts:190`, `pwa/components/dashboard/AttendanceCard.tsx:98,112`. | N/A. Auth boundary. |
| D2 | `absencesLeft` | BUILT. `backend/src/routes/student.ts:712` (per subject), `:754` (overall). | BUILT: reads server field. `components/attendance/AttendanceCard.tsx:28-31` (via `app/attendance.tsx:198`), `components/attendance/verdict.ts:30-31`. | BUILT: reads server field. `pwa/components/attendance/SubjectBreakdown.tsx:28`, `pwa/components/attendance/model.ts:186-194`, `pwa/components/attendance/Hero.tsx:24`. | N/A. Auth boundary. |
| D3 | `gpa` (semester, history, `/me` stat) | BUILT. `computeGPA`, `backend/src/routes/student.ts:101-111`. Used at `:201` (`/me`), `:382` (all semesters) and `:456` (one semester). | PARTIAL: invents GPA history points. Reads server field at `app/(tabs)/grades.tsx:308` and `app/(tabs)/home.tsx:358` (via `services/cacheMappers.ts:52`). But when there is a single real semester, the history chart adds two made-up "estimate" GPAs derived from the current one (`app/(tabs)/grades.tsx:262-268`), drawn in `components/grades/GPAHistorySheet.tsx:56,164`. | BUILT: reads server field. `pwa/components/grades/GpaHero.tsx:79`, `pwa/components/dashboard/GpaCard.tsx:82`, `pwa/components/profile/StudentCard.tsx:32`. | N/A. Auth boundary. |
| D4 | `mention` | BUILT. `computeMention`, `backend/src/routes/student.ts:93-99`. Sent next to every `gpa`. | PARTIAL: recomputes on Grades and mistranslates on Home. The Grades hero ignores the server field and recomputes from GPA (`components/grades/GpaHeroCard.tsx:36`, using `utils/gradesMention.ts:13-27`). The thresholds happen to match today. Home reads the server field (`app/(tabs)/home.tsx:359,401`), but its translation map (`home.tsx:89-94`) has keys for `Ajourné` and `Félicitations`, which the server never sends, and none for `Insuffisant` (`backend/src/routes/student.ts:98`). So that value renders as raw French in Arabic. | BUILT: reads server field. `pwa/components/grades/GpaHero.tsx:79-80`, `pwa/components/dashboard/GpaCard.tsx:82-85`. Translated through `pwa/components/grades/model.ts:74-82`, which covers all five server values. | N/A. Auth boundary. |
| D5 | `credits {earned,total}` (semester, and total on `/me`) | BUILT. `earnedCredits` (`backend/src/utils/credits.ts:28`), used at `backend/src/routes/student.ts:204-206` (`/me` semester and total), `:384-385` (history) and `:458-459` (semester). | PARTIAL: ignores the `/me` total. Semester credits read the server field: `app/(tabs)/grades.tsx:309`, and `app/(tabs)/home.tsx:361-362` (via `services/cacheMappers.ts:55-56`). `stats.totalCredits` (`backend/src/routes/student.ts:206,252`) is never read. The only "total" the app shows is the programme's credit count (`services/cacheMappers.ts:45`, rendered at `app/(tabs)/profile.tsx:129-134`), so earned-over-programme progress is not shown. | BUILT: reads server field. `pwa/components/grades/GpaHero.tsx:79,127`, `pwa/components/profile/StudentCard.tsx:32,122-131` (semester, and earned/total from `stats.totalCredits`). | N/A. Auth boundary. |
| D6 | Attendance `percentage` / `/me` `attendancePercentage` | BUILT. `hoursBasedPercentage`, `backend/src/routes/student.ts:208-218`. `truncatedPercentage` at `:693` and `:733`. | BUILT: reads server field. `app/(tabs)/home.tsx:360`, `app/(tabs)/profile.tsx:121`. Note: two places show `0%` when the server sends `null`. Profile: `profile.tsx:121` (`?? 0`). Attendance hero: `app/attendance.tsx:302` stores `o?.percentage ?? 0`, rendered at `:464`. The server sends a null `overall.percentage` when no hours are held (`backend/src/routes/student.ts:733,752`). The PWA shows a no-data state there instead. | BUILT: reads server field. `pwa/components/profile/StudentCard.tsx:133-136` (shows a placeholder for null), `pwa/components/attendance/Attendance.tsx:115-117` (no-data state for a null overall percentage), `pwa/components/attendance/Hero.tsx:96`, `pwa/components/dashboard/AttendanceCard.tsx:92`. | N/A. Auth boundary. |
| D7 | Justification eligibility (`canSubmitJustification`, `justificationDeadlineDays`) | BUILT. `backend/src/routes/student.ts:657` (per record) and `:499-500`. Enforced on upload at `:1076-1081` (409 `DEADLINE_PASSED`). | PARTIAL: decides eligibility itself. Neither field is read anywhere in `app/` or `components/`. The sheet opens in edit mode for any record whose status is null or REJECTED (`components/attendance/JustifySheet.tsx:56`), so a past-deadline absence is offered and the server refuses it. Every absence, JUSTIFIED included, is relabelled `'ABSENT'` (`app/attendance.tsx:150`). | BUILT: reads server field. `pwa/components/attendance/model.ts:50,65`. Deadline: `pwa/components/attendance/Attendance.tsx:132`, passed on at `pwa/components/attendance/AttendanceView.tsx:213`. | N/A. Auth boundary. |
| D8 | `attendanceThreshold` (shown as the limit) | BUILT. `backend/src/routes/student.ts:498`, from SystemSettings. | BUILT: reads server field. Written at `app/attendance.tsx:310`, read on Home at `app/(tabs)/home.tsx:518`. Home shows no threshold until the Attendance screen has synced once (`home.tsx:510-511`). | BUILT: reads server field. `pwa/components/attendance/Attendance.tsx:131`, `pwa/components/dashboard/AttendanceCard.tsx:115`. | N/A. Auth boundary. |

---

## Admin portal

Rows: milestone 2 of this PR

---

## Student-facing capabilities only one of app / PWA has

This compares the app with the PWA only (mission decision D2). Admin rows never
appear here. Each entry names the client that has the capability, why the other
lacks it, and the source row.

### Endpoints consumed by one client only

| Capability | Has it | Other client | Row |
|---|---|---|---|
| Signed QR student-card token | app | pwa: MISSING | S12 |
| Register a device for push | app | pwa: MISSING | S10 |
| Remove the push token on logout | app | pwa: MISSING | S11 |
| News categories (server-driven chip labels) | app | pwa: MISSING (labels hardcoded in locale files) | N1 |
| Mark one notification read | app | pwa: MISSING | S8 |
| Mark all notifications read | app | pwa: MISSING (helper, no caller) | S7 |

### Consumed by both, but complete in one only

| Capability | Complete in | Other client | Row |
|---|---|---|---|
| News list beyond the 10 newest, with server-side pagination | pwa | app: PARTIAL (no `limit`/`offset`, local filter over 10 per fetch) | N2 |

Both clients are PARTIAL on the notifications list (S6), for different reasons.
The app has a full screen capped at 20. The PWA has a 3-item dashboard preview and
no screen. So S6 is not listed above.

### Server values read by one client, recomputed or ignored by the other

| Value | Reads the server field | Other client | Row |
|---|---|---|---|
| `mention` | pwa | app: PARTIAL (recomputed on Grades; `Insuffisant` untranslated on Home) | D4 |
| `gpa` history | pwa | app: PARTIAL (made-up estimate points) | D3 |
| `canSubmitJustification` / deadline | pwa | app: PARTIAL (own eligibility rule) | D7 |
| `/me` `stats.totalCredits` (earned / programme total) | pwa | app: PARTIAL (never read; shows only the programme's credit count) | D5 |

### Student-facing endpoints neither the app nor the PWA consumes

None. All 18 have at least one consuming client.

---

## Endpoint-to-row index

<details>
<summary>18 student-facing handlers, each in exactly one row</summary>

| Handler | Defined at | Row |
|---|---|---|
| `POST /auth/login` | `backend/src/routes/auth.ts:33` | A1 |
| `POST /auth/refresh` | `backend/src/routes/auth.ts:169` | A2 |
| `POST /auth/logout` | `backend/src/routes/auth.ts:241` | A3 |
| `GET /student/me` | `backend/src/routes/student.ts:114` | S1 |
| `GET /student/schedule` | `backend/src/routes/student.ts:272` | S2 |
| `GET /student/grades` | `backend/src/routes/student.ts:330` | S3 |
| `GET /student/attendance` | `backend/src/routes/student.ts:478` | S4 |
| `POST /student/attendance/:recordId/justification` | `backend/src/routes/student.ts:1012` | S5 |
| `GET /student/notifications` | `backend/src/routes/student.ts:773` | S6 |
| `PATCH /student/notifications/read-all` | `backend/src/routes/student.ts:807` | S7 |
| `PATCH /student/notifications/:id/read` | `backend/src/routes/student.ts:825` | S8 |
| `PATCH /student/preferences` | `backend/src/routes/student.ts:871` | S9 |
| `POST /student/push-token` | `backend/src/routes/student.ts:905` | S10 |
| `DELETE /student/push-token` | `backend/src/routes/student.ts:949` | S11 |
| `GET /student/qr-token` | `backend/src/routes/student.ts:970` | S12 |
| `GET /news/categories` | `backend/src/routes/news.ts:13` | N1 |
| `GET /news` | `backend/src/routes/news.ts:30` | N2 |
| `GET /news/:id` | `backend/src/routes/news.ts:64` | N3 |

`/admin` handlers: milestone 2 of this PR.

</details>
