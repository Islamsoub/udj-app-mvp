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
- **Unused parameters**: an unused parameter makes a cell PARTIAL when
  (a) it hides data in a view that client offers, or (b) another client offers
  the view it selects. Otherwise it is noted, not counted.
  - (a) example: pagination on `/news` (row N2). The app offers a news list but
    never sends `limit`/`offset`, so articles past the newest 10 never reach it.
  - Noted, not counted: `semesterId` on `/student/schedule` (row S2). No client
    offers a past-semester schedule.
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
| S6 | Notifications list and unread count | BUILT. `GET /student/notifications`, `backend/src/routes/student.ts:773`. `limit` defaults to 20, plus `offset` (`:776-777`). | PARTIAL: no pagination, and the unread count is not used. The list renders at `app/notifications.tsx:295`, but the helper sends no `limit`/`offset` (`services/api.ts:495-497`), so only the 20 newest are reachable (method rule (a)). The home bell badge is hard-wired off (`app/(tabs)/home.tsx:364`, `showBadge = false // TODO`). | PARTIAL: dashboard preview only. `pwa/components/dashboard/NotificationsCard.tsx:25` asks for 3 (`:14`) and shows titles and the unread count. There is no notifications page, and the card is not a link (`:17-21`). | N/A. Auth boundary. |
| S7 | Mark all notifications read | BUILT. `PATCH /student/notifications/read-all`, `backend/src/routes/student.ts:807`. | BUILT. `app/notifications.tsx:358`. | MISSING (helper `pwa/lib/api-client.ts:391`, no caller). Decided: gap to build (Islam, 2026-11-12). | N/A. Auth boundary. |
| S8 | Mark one notification read | BUILT. `PATCH /student/notifications/:id/read`, `backend/src/routes/student.ts:825`. | BUILT. `app/notifications.tsx:331`, with the local mirror at `:332`. | MISSING. No helper and no caller. The proxy would forward the PATCH (`pwa/app/api/backend/[...path]/route.ts:122`). Decided: gap to build (Islam, 2026-11-12). | N/A. Auth boundary. |
| S9 | Notification preferences and quiet hours | BUILT. `PATCH /student/preferences`, `backend/src/routes/student.ts:871`. | BUILT. Toggles: `app/settings.tsx:133`. Quiet hours: `app/settings.tsx:159`. | BUILT. `pwa/components/profile/NotificationPrefs.tsx:79`, rendered at `pwa/components/profile/Profile.tsx:79`. The PWA receives no pushes itself (row S10), so these settings only affect the student's app devices. | N/A. Auth boundary. |
| S10 | Register a device for push | BUILT. `POST /student/push-token`, `backend/src/routes/student.ts:905`. | BUILT. `services/pushNotifications.ts:34`, called from `app/_layout.tsx:163` once authenticated. | MISSING. No push registration in `pwa/` (no PushManager, no helper). The proxy forwards no POST except the justification upload (`pwa/app/api/backend/[...path]/route.ts:174`). Decided: gap to build (Islam, 2026-11-12). | N/A. Auth boundary. |
| S11 | Remove the device's push token on logout | BUILT. `DELETE /student/push-token`, `backend/src/routes/student.ts:949`. | BUILT. `services/auth.ts:67-68`, inside `logout()`, called from `app/settings.tsx:165`. Note: the token is looked up without `projectId` (`services/auth.ts:67`), while registration passes it (`services/pushNotifications.ts:20-22`). Failures are swallowed (`services/auth.ts:69-71`). | MISSING. The proxy exports no DELETE (`pwa/app/api/backend/[...path]/route.ts:117-174`). Decided: gap to build (Islam, 2026-11-12). | N/A. Auth boundary. |
| S12 | Signed QR student-card token (60 s) | BUILT. `GET /student/qr-token`, `backend/src/routes/student.ts:970`. Signed with `QR_SECRET`, expires in 60 s (`:985-997`). | BUILT. `app/(tabs)/profile.tsx:387`, refetched every 55 s (`:393`). | MISSING. No helper and no caller. `pwa/lib/offline-cache.ts:45-49` already says the token must never be cached if it is added. Decided: gap to build (Islam, 2026-11-12). | N/A. Auth boundary. |
| N1 | News categories (filter chip labels, FR/AR) | BUILT. `GET /news/categories`, `backend/src/routes/news.ts:13`. **Public**: registered before `authMiddleware` (`news.ts:10-12`, `:26`). | BUILT. `app/(tabs)/news.tsx:210`, with a SQLite fallback at `:215`. | MISSING. Chip labels come from the locale files for six hardcoded slugs (`pwa/components/news/model.ts:30-37`; reason at `:17-20`). A category added in admin gets no chip (`model.ts:26-28`). Decided: gap to build (Islam, 2026-11-12). | BUILT, through its own equivalent rather than this endpoint. The portal lists categories with `GET /admin/news/categories` (`backend/src/routes/admin/index.ts:36`), via `useNewsCategories` (`admin/hooks/queries/use-news.ts:71-74`). Callers: `admin/app/(dashboard)/news/create/page.tsx:45` and `admin/app/(dashboard)/settings/page.tsx:128`. It never calls the public `/news/categories`. |
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

### Client-only capabilities

These are things a client does with no endpoint of its own behind it. Where a
server part exists, the backend cell cites it; otherwise it is N/A (no server
part). In the admin column, "auth boundary" means the capability works on the
signed-in student's own data, which staff cannot reach (see the legend).

| # | Capability | backend | app | pwa | admin |
|---|---|---|---|---|---|
| C1 | Grade calculator (what-if: mark needed at the final exam) | N/A. No server part. Note: both clients hardcode the CC/CF weights, but on the server they are editable by an admin (`backend/src/routes/admin/settings.ts:33-36`), and no student endpoint returns them. | PARTIAL: hardcoded weights. `components/grades/GradeCalculatorSheet.tsx:56` computes `(target - cc*0.4) / 0.6`. Rendered at `app/(tabs)/grades.tsx:450`. If an admin changes the formula, the result is wrong. | PARTIAL: hardcoded weights. `pwa/components/grades/calculator.ts:18-19,63` (0.4 / 0.6), rendered at `pwa/components/grades/GradesView.tsx:194`. Same drift risk as the app. | N/A. Auth boundary: it works on the signed-in student's own data, and staff hold no student token. |
| C2 | Offline cache: read path | N/A. No server part. | BUILT. Every data screen reads through `useOfflineQuery` (`hooks/useOfflineQuery.ts:21`): cached first, then fresh, then written to the cache. The store is SQLite encrypted with SQLCipher (`app.json:50`; key applied at `services/db.ts:103`). | BUILT. `apiFetch` falls back to IndexedDB on a network failure (`pwa/lib/api-client.ts:299-318`, read at `pwa/lib/offline-cache.ts:364`). That is the only entry point. | N/A. Auth boundary: it works on the signed-in student's own data, and staff hold no student token. |
| C3 | Offline cache: consent | N/A. No server part. | N/A. Always on by design: the app is "offline-first" (CLAUDE.md, project overview) and the cache is encrypted (`app.json:50`). There is no consent switch. | BUILT. Off by default (`pwa/lib/offline-cache.ts:86-96`). The switch is on the login form (`pwa/components/login/OfflineDataSwitch.tsx:26,47`, rendered at `pwa/components/login/LoginForm.tsx:172`) and mirrored in Profile (`pwa/components/profile/OfflineDataRow.tsx:10-20`, rendered at `pwa/components/profile/DeviceSettings.tsx:73`). Turning it off empties the store. | N/A. Auth boundary: it works on the signed-in student's own data, and staff hold no student token. |
| C4 | Offline cache: what is cached, what is not | N/A. No server part. | BUILT. Cached tables: schedules, grades, news, profile, attendance, notifications, news categories, absences, and attendance and grades summaries (`services/db.ts:199-311`). Course notes are local-only (`:268`). Not cached: the QR token, which is component state only (`app/(tabs)/profile.tsx:338`), and auth tokens, which are kept in SecureStore. | BUILT. Cached: `/student/me`, `/student/schedule`, `/student/grades` (both modes) and `/student/attendance` (`pwa/lib/offline-cache.ts:51-56`). Never cached: `/auth/*`, notifications, preferences, `/news` and every non-GET (`:42-43`). The service worker caches app shell assets only and never `/api` (`pwa/public/sw.js:4-11,219`). | N/A. Auth boundary: it works on the signed-in student's own data, and staff hold no student token. |
| C5 | QR student card: display | BUILT. `GET /student/qr-token` (row S12). | BUILT. `components/profile/StudentCard.tsx:124,175` (full size and mini), rendered at `app/(tabs)/profile.tsx:143`. Screenshots are blocked while the card is expanded (`StudentCard.tsx:76-85`). | MISSING. There is no QR. The student card shows the ID as text only (`pwa/components/profile/StudentCard.tsx:46`). Decided: gap to build (Islam, 2026-11-12), row S12. | N/A. Auth boundary. The portal also has no QR verifier; lecturer QR check-in is out of MVP scope (CLAUDE.md, "Out of scope for MVP"). |
| C6 | QR rotation / refresh | BUILT. The token expires after 60 s (`backend/src/routes/student.ts:985`). The response includes `expiresAt` (`:1004`). | PARTIAL: refresh on a timer, server expiry ignored. The app refetches every 55 s (`app/(tabs)/profile.tsx:393`) and keeps only `token`, never `expiresAt` (`:388`). The "expires in" countdown is a local 55 s loop that wraps around whether or not a refresh succeeded (`components/profile/StudentCard.tsx:24,69-74`), and failures are swallowed (`profile.tsx:389`). So after a failed refresh, an expired token is shown as still valid. | MISSING. Row S12. | N/A. Auth boundary. |
| C7 | QR offline behaviour | N/A. No server part. A token is only valid for 60 s (`backend/src/routes/student.ts:985`). | PARTIAL: an unsigned fallback. With no token (offline, or the first fetch failed), the QR encodes the plain student ID (`components/profile/StudentCard.tsx:99`), with the same look and countdown as a signed one. Nothing on the card says it is not a signed token. | MISSING. Row S12. `pwa/lib/offline-cache.ts:45-49` says a token must never be cached. | N/A. Auth boundary. |
| C8 | Push: permission prompt, token send, removal on logout, tap routing | BUILT. Rows S10 and S11. Sending is in `backend/src/utils/push.ts:20`, which honours the per-category toggles (`:15-17`). | BUILT. Asks permission (`services/pushNotifications.ts:10-16`), then sends the token (`:34`), starting from `app/_layout.tsx:163` once the student is authenticated. The token is removed on logout (`services/auth.ts:67-68`). A tap routes to the screen for its type (`app/_layout.tsx:171-186`). | MISSING. No push code. The proxy cannot forward the token calls (rows S10 and S11). Decided: gap to build (Islam, 2026-11-12). | N/A. Auth boundary. Staff send pushes rather than receive them (admin row NT1). |
| C9 | Quiet hours enforcement | PARTIAL: stored but not enforced. Quiet hours are saved through `PATCH /student/preferences` (`backend/src/routes/student.ts:871`), but sending checks only the category toggles (`backend/src/utils/push.ts:15-17`), not the quiet-hours window. | PARTIAL: foreground only. `app/_layout.tsx:166-170` dismisses a notification that arrives during quiet hours, but the received listener (`services/pushNotifications.ts:46`) only fires while the app is open. With the app closed or in the background, notifications still show. | MISSING. There is no push to suppress (C8). The PWA lets the student edit quiet hours (`pwa/components/profile/NotificationPrefs.tsx:79`), which affects only their app devices. | N/A. Auth boundary. |
| C10 | Justification upload, client side: file pick, checks before sending, offline | BUILT. The server accepts JPEG, PNG, WebP and PDF up to 5 MB (`backend/src/routes/student.ts:53-55`) and checks magic bytes (`:1041-1042`). | PARTIAL: images only, no checks before sending, no offline guard. The picker offers camera or photo library only, with `mediaTypes: 'images'` (`components/attendance/JustifySheet.tsx:84-110`), so a PDF cannot be chosen. The file size is stored but never checked (`:50,80`). An offline submit is attempted anyway, and the alert shows the raw error message (`:126-138`). | BUILT. Accepted types (`pwa/components/attendance/upload.ts:37-42`) and type and size are checked before any request (`upload.ts:56-61`, called at `pwa/components/attendance/JustificationForm.tsx:119`). The limit is 4.5 MB, below the server's 5 MB (`upload.ts:22`). Submit is disabled offline, with a message (`JustificationForm.tsx:182,249,405-412`). | N/A. Auth boundary. Staff review justifications instead (admin row AT5). |
| C11 | Language switching: FR / AR and RTL | N/A. No server part. Responses carry both `nameFr` and `nameAr`. | BUILT. `app/settings.tsx:141-144` changes the language, sets RTL (`stores/settingsStore.ts:28-31`) and reloads the app. Applied at boot in `app/_layout.tsx:137-141`. Also chosen during onboarding (`app/(auth)/onboarding.tsx:56`). | BUILT. `pwa/components/profile/DeviceSettings.tsx:67` (`setLang`). `dir` is set on `<html>` (`pwa/app/layout.tsx:71`) and numbers are isolated with `pwa/lib/bidi.tsx:26,31`. | N/A. The portal is French only by design (CLAUDE.md, "Admin portal: French only"). |
| C12 | Theme switching: light / dark / system | N/A. No server part. | BUILT. `stores/themeStore.ts:6,19` (default `system`), picker at `app/settings.tsx:289-290`. | BUILT. `pwa/lib/theme.tsx:45-56` (system via `matchMedia`, followed live at `:191-195`), picker at `pwa/components/profile/DeviceSettings.tsx:45`. | MISSING. No dark tokens in `admin/styles/globals.css` and no theme control. No decision recorded. |
| C13 | Biometric sign-in (re-unlock a stored session) | N/A. No server part. It reuses `POST /auth/refresh` (row A2). | BUILT. `app/(auth)/login.tsx:278` (`authenticateBiometric`), then `restoreSession` (`:305`). Opt-in at `:224`. The opt-in is cleared on logout (`services/auth.ts:76-77`). Uses `services/biometric.ts:59`. | MISSING. No WebAuthn or biometric code in `pwa/`. | MISSING. No staff biometric sign-in. |
| C14 | Course notes (local, per course slot) | N/A. No server part. Notes are never synced (`services/db.ts:268`). | BUILT. `components/schedule/CourseDetailSheet.tsx:80,94` (read and save), rendered at `app/(tabs)/home.tsx:801` and `app/(tabs)/schedule.tsx:588`. | MISSING. The comment at `pwa/components/schedule/CourseDetail.tsx:15-21` leaves notes out because the PWA has "no local database" (`:18`). That premise is out of date: `pwa/lib/offline-cache.ts:223-225` is an IndexedDB store. Still true: there is no notes endpoint, and the offline cache is allow-listed and written only from `apiFetch` (`pwa/lib/offline-cache.ts:51-56`), so notes would need a separate store. Undecided whether this is a gap to build or out of scope (D3). | N/A. Auth boundary: these are a student's own local notes. |
| C15 | Session-expired prompt without leaving the screen | N/A. No server part. Triggered by a 401 from any route. | BUILT. An app-wide modal (`app/_layout.tsx:234`), raised by the 401 interceptor (`services/api.ts:263-264,286-287`). | BUILT. `pwa/components/shell/SessionExpiredModal.tsx`, rendered at `pwa/components/shell/AppShell.tsx:262`. | N/A. By design, a failed refresh logs out and redirects to `/login` (`admin/lib/api.ts:9,62-64`). |
| C16 | Offline banner with last-sync time | N/A. No server part. | BUILT. `components/ui/OfflineBanner.tsx:17,25` (last-sync time from `hooks/useOfflineQuery.ts:121`), on home, schedule, grades, news, notifications and login (for example `app/(tabs)/home.tsx:667`). Attendance has its own banner (`app/attendance.tsx:443`). | BUILT. `pwa/components/shell/OfflineBanner.tsx`, rendered at `pwa/components/shell/AppShell.tsx:242`, with `staleSince` for data served from the cache. | MISSING. No offline indicator in the portal. |
| C17 | Clearing locally stored data | N/A. No server part. | BUILT. Per table (`app/storage-detail.tsx:158`) and everything (`:184`), reached from `app/settings.tsx:239`. Logout also clears it (`services/auth.ts:79`). | BUILT, whole store only. Turning the offline-data switch off empties it (`pwa/components/profile/OfflineDataRow.tsx:18`), and so does logout (`pwa/lib/auth-client.ts:112-118`). There is deliberately no separate "Vider le cache" button (`pwa/components/profile/AccountActions.tsx:14`). | N/A. Auth boundary: the portal stores no student data locally. |
| C18 | News bookmarks (Saved tab) | N/A. No server part. Bookmarks are stored on the device only. | BUILT. `app/article-reader.tsx:384` and `components/news/ArticleCard.tsx:9` (toggle), with a Saved filter at `app/(tabs)/news.tsx:239-246`. | MISSING. No bookmark code in `pwa/`. | N/A. Auth boundary. |
| C19 | Installable web app: service worker, install prompt, offline page | N/A. No server part. | N/A. A native app installed from the store (CLAUDE.md, project overview: "Platforms: Android-first"). | BUILT. The service worker is started from `pwa/components/pwa/PwaLayer.tsx:28` (registered at `pwa/components/pwa/service-worker.ts:49`). Install prompt: `pwa/components/pwa/install-prompt.ts:47`, with `InstallBanner` at `PwaLayer.tsx:37`. Offline page fallback at `pwa/public/sw.js:109`. | MISSING. The portal is not installable. No decision recorded. |
| C20 | Info center: FAQ, contacts, downloadable forms | Contacts: BUILT. They come from the student's faculty record via `GET /student/me` (row S1; read at `app/info-center.tsx:118-133`). FAQ: N/A, no server part, it is locale text. Forms: N/A, no server part. | PARTIAL: no forms. The FAQ (`app/info-center.tsx:109-112`) and tap-to-call or email faculty contacts (`:118-133`, `:145-147`) work. Both seeded forms have an empty `url`, so they are filtered out (`:138-141`), and the forms section renders only when there is at least one (`:196`). So no forms are ever shown. Reached from `app/settings.tsx:264` and `app/(tabs)/profile.tsx:150`. | PARTIAL: contacts only, no FAQ, no forms. Profile renders the faculty contacts with `mailto:` and `tel:` links (`pwa/components/profile/StudentCard.tsx:142,152-182`). There is no FAQ and no forms page in `pwa/`. | Contacts: BUILT via AC3. The faculty form edits phone, email, address and hours (`admin/components/forms/faculty-form.tsx:38-41`), saved with `PATCH /admin/faculties/:id`. FAQ: MISSING. It is hardcoded in the app's locale files and the portal cannot edit it. |
| C21 | Onboarding (first-run steps and language choice) | N/A. No server part. | BUILT. `app/(auth)/onboarding.tsx`, shown on first run from `app/(auth)/splash.tsx:117`. | MISSING. No onboarding route in `pwa/app/`. | MISSING. No first-run flow. |

---

## Admin portal (`/admin`)

This section has its own table (mission decision D2). It does not feed the
closing list, which compares the app with the PWA only.

**App and PWA columns.** Every `/admin` handler runs `adminAuth`
(`backend/src/middleware/adminAuth.ts:46`), except `POST /admin/auth/login`,
`/refresh` and `/logout`, which authenticate staff credentials or a staff cookie.
Neither student client calls any `/admin` path. A grep of `services/`, `app/`,
`components/`, `hooks/`, `stores/`, `pwa/lib/`, `pwa/components/` and `pwa/app/`
finds none, and the PWA proxy only forwards `student` and `news`
(`pwa/app/api/backend/[...path]/route.ts:13`). So every app and pwa cell below is
**N/A — auth boundary**.

**RBAC notes.** The portal decides which pages a role sees in `PAGE_ACCESS`
(`admin/lib/constants.ts:140-152`). Only the sidebar applies it
(`admin/components/shell/sidebar.tsx:69`). Pages themselves are not guarded,
except Admins, Audit and Settings (`AccessDenied`) and a few in-page `canWrite` /
`canCorrect` checks. A cell says "RBAC: … is refused" wherever the portal shows
an action to a role that the server's `rbac(...)` rejects. RBAC was not audited
beyond that.

**Count.** 63 handlers across 13 sub-routers. Each appears in exactly one row
(see the index at the end).

| # | Capability | backend | app | pwa | admin |
|---|---|---|---|---|---|
| | **`/admin/auth`, `backend/src/routes/admin/auth.ts`, mounted at `backend/src/routes/admin/index.ts:28`** | | | | |
| AU1 | Admin login | BUILT. `POST /admin/auth/login`, `backend/src/routes/admin/auth.ts:86`. Roles: none (public). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useLogin` (`admin/hooks/use-auth.ts:20-23`), called from `admin/app/(auth)/login/page.tsx:26`. |
| AU2 | Silent token refresh (cookie) | BUILT. `POST /admin/auth/refresh`, `backend/src/routes/admin/auth.ts:187`. Roles: none (refresh cookie). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. Single-flight `refreshTokens` in the 401 interceptor (`admin/lib/api.ts:44-51`). It runs on any hook's 401, and since the access token lives only in memory, the first request after a reload triggers it. It is not in `hooks/queries/`: `lib/api.ts` is the layer those hooks wrap. |
| AU3 | Admin logout (revoke + clear cookie) | BUILT. `POST /admin/auth/logout`, `backend/src/routes/admin/auth.ts:239`. Roles: none (deliberately not behind `adminAuth`, `auth.ts:235-238`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useLogout` (`admin/hooks/use-auth.ts:31-37`), called from `admin/components/shell/avatar-menu.tsx:23` and `admin/components/shell/sidebar.tsx:62`. |
| AU4 | Current admin identity | BUILT. `GET /admin/auth/me`, `backend/src/routes/admin/auth.ts:259`. Roles: `adminAuth` only. | N/A. Auth boundary. | N/A. Auth boundary. | MISSING. No hook and no caller. The identity, role included, comes from the login response (`admin/hooks/use-auth.ts:24-25`) and is persisted in localStorage (`admin/stores/auth-store.ts:32,43`). So a role change or deactivation made on the server only shows up in the portal after the next login. |
| AU5 | Change own password | BUILT. `PATCH /admin/auth/password`, `backend/src/routes/admin/auth.ts:284`. Roles: `adminAuth` only. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useChangePassword` (`admin/hooks/use-auth.ts:44-47`), called from `admin/components/modals/password-modal.tsx:23`, opened from `admin/components/shell/avatar-menu.tsx:72`. |
| | **`/admin/dashboard`, `dashboard.ts`, `index.ts:29`** | | | | |
| DB1 | Dashboard KPIs | BUILT. `GET /admin/dashboard/stats`, `backend/src/routes/admin/dashboard.ts:24`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN (`dashboard.ts:17-21`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useDashboardStats` (`admin/hooks/queries/use-dashboard.ts:8`), called from `admin/app/(dashboard)/page.tsx:86`. RBAC: the portal shows the dashboard to every role, NEWS_EDITOR included (`admin/lib/constants.ts:141`), but the server refuses NEWS_EDITOR. |
| DB2 | Recent activity feed | BUILT. `GET /admin/dashboard/recent-activity`, `backend/src/routes/admin/dashboard.ts:168`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useRecentActivity` (`admin/hooks/queries/use-dashboard.ts:16`), called from `admin/app/(dashboard)/page.tsx:87`. RBAC: same as DB1, so NEWS_EDITOR is shown it and refused. |
| | **`/admin/students`, `students.ts`, `index.ts:30`** | | | | |
| ST1 | Student list (paginated, filters) | BUILT. `GET /admin/students`, `backend/src/routes/admin/students.ts:82`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN (`students.ts:31-35`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useStudents` (`admin/hooks/queries/use-students.ts:20`), called from `admin/app/(dashboard)/students/page.tsx:92`, plus pickers and counts in `admin/app/(dashboard)/page.tsx:88`, `admin/app/(dashboard)/notifications/page.tsx:49-52`, `admin/app/(dashboard)/attendance/session/page.tsx:56`, `admin/app/(dashboard)/grades/[subjectId]/page.tsx:59`, and the shell's global search `admin/components/shell/global-search.tsx:40`, rendered for every role by `admin/components/shell/top-bar.tsx:51`. RBAC: the top bar renders for every role, so NEWS_EDITOR's shell calls this on every page and is refused (`backend/src/routes/admin/students.ts:32-34`). NEWS_EDITOR is also refused on the dashboard and the notifications page, which both call it. |
| ST2 | Student detail | BUILT. `GET /admin/students/:id`, `backend/src/routes/admin/students.ts:190`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useStudent` (`admin/hooks/queries/use-students.ts:28`), called from `admin/app/(dashboard)/students/[id]/page.tsx:131`. |
| ST3 | Create student | BUILT. `POST /admin/students`, `backend/src/routes/admin/students.ts:271`. Roles: SUPER_ADMIN, REGISTRAR (`students.ts:36`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useCreateStudent` (`admin/hooks/queries/use-students.ts:36`), called from `admin/components/forms/student-form.tsx:54`, opened at `admin/app/(dashboard)/students/page.tsx:236`. RBAC: FACULTY_ADMIN sees the Students page (`admin/lib/constants.ts:142`) and the create button, which is not role-gated, and is refused. |
| ST4 | Edit student | BUILT. `PATCH /admin/students/:id`, `backend/src/routes/admin/students.ts:342`. Roles: SUPER_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateStudent` (`admin/hooks/queries/use-students.ts:48`), called from `admin/components/forms/student-form.tsx:55`, opened at `admin/app/(dashboard)/students/[id]/page.tsx:373`. RBAC: FACULTY_ADMIN is shown the "Modifier" button, which is not gated by `canWrite` (`students/[id]/page.tsx:129`), and is refused. |
| ST5 | Reset student password | BUILT. `POST /admin/students/:id/reset-password`, `backend/src/routes/admin/students.ts:393`. Roles: SUPER_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useResetStudentPassword` (`admin/hooks/queries/use-students.ts:62`), called from `admin/components/modals/reset-pw-modal.tsx:24`, opened at `admin/app/(dashboard)/students/[id]/page.tsx:362`. RBAC: FACULTY_ADMIN is shown the button, which is not gated, and is refused. |
| ST6 | Change student status (suspend / graduate / reactivate) | BUILT. `PATCH /admin/students/:id/status`, `backend/src/routes/admin/students.ts:445`. Roles: SUPER_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. Built with a template path, which is why a plain grep misses it: `useUpdateStudentStatus` (`admin/hooks/queries/use-students.ts:69-74`), called from `admin/components/modals/status-modal.tsx:96`, opened at `admin/app/(dashboard)/students/[id]/page.tsx:292-298`. RBAC: FACULTY_ADMIN is shown it, not gated, and is refused. |
| ST7 | Bulk import students (CSV) | BUILT. `POST /admin/students/import`, `backend/src/routes/admin/students.ts:511`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useImportStudents` (`admin/hooks/queries/use-students.ts:84`), called from `admin/app/(dashboard)/students/import/page.tsx:99`, linked at `admin/app/(dashboard)/students/page.tsx:232`. RBAC: REGISTRAR and FACULTY_ADMIN are shown the import button and page, and are refused. |
| | **`/admin/schedule`, `schedule.ts`, `index.ts:31`** | | | | |
| SC1 | Schedule conflict check | BUILT. `GET /admin/schedule/conflicts`, `backend/src/routes/admin/schedule.ts:107`. Roles: all four roles (`schedule.ts:13-18`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useScheduleConflicts` (`admin/hooks/queries/use-schedule.ts:31`), called from `admin/components/forms/schedule-form.tsx:97`. |
| SC2 | Schedule list | BUILT. `GET /admin/schedule`, `backend/src/routes/admin/schedule.ts:151`. Roles: all four roles. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSchedule` (`admin/hooks/queries/use-schedule.ts:19`), called from `admin/app/(dashboard)/schedule/page.tsx:66`, `admin/app/(dashboard)/attendance/session/page.tsx:61` and `admin/components/shell/context-bar.tsx:211`. |
| SC3 | Create schedule entry | BUILT. `POST /admin/schedule`, `backend/src/routes/admin/schedule.ts:213`. Roles: SUPER_ADMIN, FACULTY_ADMIN (`schedule.ts:19`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useCreateScheduleEntry` (`admin/hooks/queries/use-schedule.ts:62`), called from `admin/components/forms/schedule-form.tsx:53`, opened at `admin/app/(dashboard)/schedule/page.tsx:144`. RBAC: REGISTRAR sees the Schedule page (`admin/lib/constants.ts:146`), the form is not gated, and REGISTRAR is refused. |
| SC4 | Edit schedule entry | BUILT. `PATCH /admin/schedule/:id`, `backend/src/routes/admin/schedule.ts:262`. Roles: SUPER_ADMIN, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateScheduleEntry` (`admin/hooks/queries/use-schedule.ts:75`), called from `admin/components/forms/schedule-form.tsx:54`, opened at `admin/app/(dashboard)/schedule/page.tsx:107`. RBAC: same as SC3. |
| SC5 | Delete schedule entry | BUILT. `DELETE /admin/schedule/:id`, `backend/src/routes/admin/schedule.ts:322`. Roles: SUPER_ADMIN, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useDeleteScheduleEntry` (`admin/hooks/queries/use-schedule.ts:89`), called from `admin/components/forms/schedule-form.tsx:55`. RBAC: same as SC3. |
| | **`/admin/grades`, `grades.ts`, `index.ts:32`** | | | | |
| GR1 | Grade sheet for a subject | BUILT. `GET /admin/grades`, `backend/src/routes/admin/grades.ts:71`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN (`grades.ts:21-25`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useGrades` (`admin/hooks/queries/use-grades.ts:24`), called from `admin/app/(dashboard)/grades/[subjectId]/page.tsx:60`. |
| GR2 | Edit one grade (before publication) | BUILT. `PATCH /admin/grades/:id`, `backend/src/routes/admin/grades.ts:109`. Roles: SUPER_ADMIN, REGISTRAR (`grades.ts:26`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateGrade` (`admin/hooks/queries/use-grades.ts:32`), called from `admin/app/(dashboard)/students/[id]/page.tsx:133`. Edits are gated by `canWrite` (`:129,169-170`), which matches the server. |
| GR3 | Correct a published grade (audited) | BUILT. `POST /admin/grades/:id/change`, `backend/src/routes/admin/grades.ts:172`. Roles: SUPER_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useCorrectGrade` (`admin/hooks/queries/use-grades.ts:82`), called from `admin/components/modals/grade-correction-modal.tsx:44`, opened at `admin/app/(dashboard)/grades/[subjectId]/page.tsx:175` and `admin/app/(dashboard)/students/[id]/page.tsx:225`. Gated by `canCorrect` (`grades/[subjectId]/page.tsx:54,172`), which matches the server. |
| GR4 | Bulk grade entry / import | BUILT. `POST /admin/grades/bulk`, `backend/src/routes/admin/grades.ts:242`. Roles: SUPER_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useBulkGrades` (`admin/hooks/queries/use-grades.ts:44`), called from `admin/app/(dashboard)/grades/[subjectId]/page.tsx:62,191` and `admin/components/modals/grade-import-modal.tsx:56`. RBAC: FACULTY_ADMIN sees Grades (`admin/lib/constants.ts:143`), the save button (`grades/[subjectId]/page.tsx:450`) is not role-gated, and FACULTY_ADMIN is refused. |
| GR5 | Publish CC / NF results | BUILT. `POST /admin/grades/publish`, `backend/src/routes/admin/grades.ts:357`. Roles: SUPER_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `usePublishGrades` (`admin/hooks/queries/use-grades.ts:61`), called from `admin/app/(dashboard)/grades/page.tsx:48,93`. RBAC: FACULTY_ADMIN is shown the publish action, which is not role-gated, and is refused. |
| | **`/admin/attendance`, `attendance.ts`, `index.ts:33`** | | | | |
| AT1 | Attendance records list | BUILT. `GET /admin/attendance`, `backend/src/routes/admin/attendance.ts:87`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN (`attendance.ts:61-65`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useAttendance` (`admin/hooks/queries/use-attendance.ts:15`), called from `admin/app/(dashboard)/attendance/page.tsx:68`, `admin/components/shell/bell-menu.tsx:17` and `admin/components/shell/sidebar.tsx:63`. RBAC: the top bar and sidebar render for every role, so NEWS_EDITOR's shell makes this call and is refused. |
| AT2 | Attendance overview (by programme) | BUILT. `GET /admin/attendance/overview`, `backend/src/routes/admin/attendance.ts:129`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useAttendanceOverview` (`admin/hooks/queries/use-attendance-overview.ts:13`), called from `admin/app/(dashboard)/attendance/page.tsx:69`. |
| AT3 | Pending justifications queue | BUILT. `GET /admin/attendance/pending-justifications`, `backend/src/routes/admin/attendance.ts:256`. Roles: SUPER_ADMIN, REGISTRAR, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | MISSING (helper `admin/hooks/queries/use-attendance.ts:23`, no caller). The attendance page lists justifications from AT1's data instead (`admin/app/(dashboard)/attendance/page.tsx:68`). |
| AT4 | Record a session (roll call) | BUILT. `POST /admin/attendance/record`, `backend/src/routes/admin/attendance.ts:295`. Roles: SUPER_ADMIN, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useRecordSession` (`admin/hooks/queries/use-attendance.ts:34`), called from `admin/app/(dashboard)/attendance/session/page.tsx:49,117`. RBAC: REGISTRAR sees Attendance (`admin/lib/constants.ts:144`), the session page is not role-gated, and REGISTRAR is refused. |
| AT5 | Approve / reject a justification | BUILT. `PATCH /admin/attendance/:id/justification`, `backend/src/routes/admin/attendance.ts:355`. Roles: SUPER_ADMIN, FACULTY_ADMIN, REGISTRAR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. Built with a template path, which is why a plain grep misses it: `useDecideJustification` (`admin/hooks/queries/use-attendance.ts:49-56`), called from `admin/app/(dashboard)/attendance/page.tsx:71` and `admin/components/modals/doc-viewer.tsx:24` (rendered at `admin/app/(dashboard)/attendance/page.tsx:359`). |
| | **`/admin/news/categories`, `categories.ts`, `index.ts:36`** | | | | |
| NC1 | List news categories | BUILT. `GET /admin/news/categories`, `backend/src/routes/admin/categories.ts:55`. Roles: all four roles (`categories.ts:18-23`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useNewsCategories` (`admin/hooks/queries/use-news.ts:71-74`), called from `admin/app/(dashboard)/news/create/page.tsx:45` and `admin/app/(dashboard)/settings/page.tsx:128`. |
| NC2 | Create category | BUILT. `POST /admin/news/categories`, `backend/src/routes/admin/categories.ts:73`. Roles: SUPER_ADMIN, NEWS_EDITOR (`categories.ts:24`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useCreateCategory` (`admin/hooks/queries/use-news.ts:79`), called from `admin/app/(dashboard)/settings/page.tsx:129`. Note: the Settings page is SUPER_ADMIN only (`admin/lib/constants.ts:151`, `settings/page.tsx:304`), so NEWS_EDITOR, whom the server allows, is never shown it. |
| NC3 | Reorder categories | BUILT. `PATCH /admin/news/categories/reorder`, `backend/src/routes/admin/categories.ts:106`. Roles: SUPER_ADMIN, NEWS_EDITOR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useReorderCategories` (`admin/hooks/queries/use-news.ts:107`), called from `admin/app/(dashboard)/settings/page.tsx:131`. Same Settings-page note as NC2. |
| NC4 | Rename / edit category | BUILT. `PATCH /admin/news/categories/:id`, `backend/src/routes/admin/categories.ts:148`. Roles: SUPER_ADMIN, NEWS_EDITOR. | N/A. Auth boundary. | N/A. Auth boundary. | MISSING. No hook and no caller. `admin/hooks/queries/use-news.ts` has create, delete and reorder only. |
| NC5 | Delete category | BUILT. `DELETE /admin/news/categories/:id`, `backend/src/routes/admin/categories.ts:180`. Roles: SUPER_ADMIN, NEWS_EDITOR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useDeleteCategory` (`admin/hooks/queries/use-news.ts:93`), called from `admin/app/(dashboard)/settings/page.tsx:130`. Same Settings-page note as NC2. |
| | **`/admin/news`, `news.ts`, `index.ts:37`** | | | | |
| NW1 | News articles list | BUILT. `GET /admin/news`, `backend/src/routes/admin/news.ts:95`. Roles: all four roles (`news.ts:14-19`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useNews` (`admin/hooks/queries/use-news.ts:16`), called from `admin/app/(dashboard)/news/page.tsx:34`, `admin/app/(dashboard)/news/create/page.tsx:44` and `admin/components/shell/global-search.tsx:42`. |
| NW2 | One article (admin view) | BUILT. `GET /admin/news/:id`, `backend/src/routes/admin/news.ts:108`. Roles: all four roles. | N/A. Auth boundary. | N/A. Auth boundary. | MISSING (helper `admin/hooks/queries/use-news.ts:24`, no caller). The edit page finds the article in NW1's list instead (`admin/app/(dashboard)/news/create/page.tsx:41-46`). |
| NW3 | Create article | BUILT. `POST /admin/news`, `backend/src/routes/admin/news.ts:135`. Roles: SUPER_ADMIN, NEWS_EDITOR (`news.ts:20`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useCreateNews` (`admin/hooks/queries/use-news.ts:32`), called from `admin/app/(dashboard)/news/create/page.tsx:47` and `admin/app/(dashboard)/news/page.tsx:35`. RBAC: REGISTRAR sees News (`admin/lib/constants.ts:145`) and the create button (`news/page.tsx:76`), which is not role-gated, and is refused. |
| NW4 | Edit article | BUILT. `PATCH /admin/news/:id`, `backend/src/routes/admin/news.ts:190`. Roles: SUPER_ADMIN, NEWS_EDITOR. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateNews` (`admin/hooks/queries/use-news.ts:43`), called from `admin/app/(dashboard)/news/create/page.tsx:48`. RBAC: same as NW3, so REGISTRAR is shown it and refused. |
| NW5 | Delete article | BUILT. `DELETE /admin/news/:id`, `backend/src/routes/admin/news.ts:248`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useDeleteNews` (`admin/hooks/queries/use-news.ts:56`), called from `admin/components/modals/delete-news-modal.tsx:12`, opened at `admin/app/(dashboard)/news/page.tsx:177` and `admin/components/modals/news-reader.tsx:44`. RBAC: NEWS_EDITOR and REGISTRAR are shown delete, which is not gated, and are refused. |
| | **`/admin/notifications`, `notifications.ts`, `index.ts:38`** | | | | |
| NT1 | Send notification (targeted) | BUILT. `POST /admin/notifications/send`, `backend/src/routes/admin/notifications.ts:69`. Roles: SUPER_ADMIN, NEWS_EDITOR (`notifications.ts:18`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSendNotification` (`admin/hooks/queries/use-notifications.ts:14`), called from `admin/app/(dashboard)/notifications/page.tsx:53,82`. RBAC: REGISTRAR sees Notifications (`admin/lib/constants.ts:148`), the composer is not role-gated, and REGISTRAR is refused. See ST1 for NEWS_EDITOR's recipient search on this page. |
| NT2 | Sent-notification history | BUILT. `GET /admin/notifications/history`, `backend/src/routes/admin/notifications.ts:120`. Roles: all four roles (`notifications.ts:12-17`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useNotificationHistory` (`admin/hooks/queries/use-notifications.ts:28`), called from `admin/app/(dashboard)/notifications/page.tsx:54`. |
| | **`/admin/users`, `users.ts`, `index.ts:39`** | | | | |
| US1 | Admin accounts list | BUILT. `GET /admin/users`, `backend/src/routes/admin/users.ts:39`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useAdmins` (`admin/hooks/queries/use-admins.ts:9`), called from `admin/app/(dashboard)/admins/page.tsx:55`. The page is SUPER_ADMIN only (`admins/page.tsx:59`). |
| US2 | Create admin account | BUILT. `POST /admin/users`, `backend/src/routes/admin/users.ts:66`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useCreateAdmin` (`admin/hooks/queries/use-admins.ts:16`), called from `admin/components/forms/admin-form.tsx:35`, opened at `admin/app/(dashboard)/admins/page.tsx:83`. |
| US3 | Edit admin account | BUILT. `PATCH /admin/users/:id`, `backend/src/routes/admin/users.ts:110`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateAdmin` (`admin/hooks/queries/use-admins.ts:28`), called from `admin/app/(dashboard)/admins/page.tsx:57` and `admin/components/forms/admin-form.tsx:36`. |
| US4 | Deactivate admin account | BUILT. `DELETE /admin/users/:id`, `backend/src/routes/admin/users.ts:158`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useDeactivateAdmin` (`admin/hooks/queries/use-admins.ts:44`), called from `admin/components/modals/deactivate-admin-modal.tsx:16`, opened at `admin/app/(dashboard)/admins/page.tsx:171`. |
| | **`/admin/audit`, `audit.ts`, `index.ts:40`** | | | | |
| AD1 | Audit log (paginated, filterable) | BUILT. `GET /admin/audit`, `backend/src/routes/admin/audit.ts:12`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. Called with the filters as query params, so a grep for the full path misses it: `useAudit` (`admin/hooks/queries/use-audit.ts:8-11`), called from `admin/app/(dashboard)/audit/page.tsx:106`. The page is SUPER_ADMIN only (`audit/page.tsx:126`). |
| | **`/admin/settings`, `settings.ts`, `index.ts:41`** | | | | |
| SE1 | Read system settings | BUILT. `GET /admin/settings`, `backend/src/routes/admin/settings.ts:23`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSettings` (`admin/hooks/queries/use-settings.ts:9`), called from `admin/app/(dashboard)/settings/page.tsx:283`, and also from `admin/app/(dashboard)/attendance/page.tsx:70`, `admin/app/(dashboard)/grades/[subjectId]/page.tsx:61`, `admin/app/(dashboard)/students/page.tsx:74`, `admin/app/(dashboard)/students/[id]/page.tsx:132` and `admin/components/modals/grade-import-modal.tsx:55`. RBAC: the server allows only SUPER_ADMIN (`backend/src/routes/admin/settings.ts:23`). REGISTRAR and FACULTY_ADMIN are shown the Students list, student detail, Grades and Attendance pages (`admin/lib/constants.ts:142-144`), and their settings read on each of those pages is refused. |
| SE2 | Grade formula (CC / CF weights) | BUILT. `PATCH /admin/settings/grade-formula`, `backend/src/routes/admin/settings.ts:38`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateGradeFormula` (`admin/hooks/queries/use-settings.ts:17`), called from `admin/app/(dashboard)/settings/page.tsx:287`. |
| SE3 | Attendance threshold | BUILT. `PATCH /admin/settings/attendance-threshold`, `backend/src/routes/admin/settings.ts:71`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateAttendanceThreshold` (`admin/hooks/queries/use-settings.ts:31`), called from `admin/app/(dashboard)/settings/page.tsx:288`. |
| SE4 | Justification deadline (days) | BUILT. `PATCH /admin/settings/justification-deadline`, `backend/src/routes/admin/settings.ts:100`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useUpdateJustificationDeadline` (`admin/hooks/queries/use-settings.ts:48`), called from `admin/app/(dashboard)/settings/page.tsx:289`. |
| SE5 | Automations toggles | BUILT. `PATCH /admin/settings/automations`, `backend/src/routes/admin/settings.ts:132`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | N/A. Deliberately disabled as deprecated. The Settings page renders the three automation toggles (`autoPublishGrades`, `notifyOnPublish`, `weeklyRecap`) disabled, with a no-op `onChange` (`admin/app/(dashboard)/settings/page.tsx:483-489`). The page comment records that decision: publication is a manual two-step process and system notifications are always on (`admin/app/(dashboard)/settings/page.tsx:52`). So the write helper `admin/hooks/queries/use-settings.ts:67` has no caller. |
| | **`/admin/faculties`, `/admin/programmes`, `/admin/semesters`, `/admin/subjects`, `academics.ts`, mounted at the `/admin` root, `index.ts:44`** | | | | |
| AC1 | Faculties list | BUILT. `GET /admin/faculties`, `backend/src/routes/admin/academics.ts:23`. Roles: all four roles (`academics.ts:12-17`). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useFaculties` (`admin/hooks/queries/use-academics.ts:11`). Callers include `admin/app/(dashboard)/academics/page.tsx:78`, `admin/app/(dashboard)/admins/page.tsx:56` and `admin/app/(dashboard)/notifications/page.tsx:47`. |
| AC2 | Create faculty | BUILT. `POST /admin/faculties`, `backend/src/routes/admin/academics.ts:48`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveFaculty` (no id → POST, `admin/hooks/queries/use-academics.ts:18-23`), called from `admin/components/forms/faculty-form.tsx:26`, opened at `admin/app/(dashboard)/academics/page.tsx:136`. RBAC: REGISTRAR and FACULTY_ADMIN see Academics (`admin/lib/constants.ts:147`), the add button is not role-gated, and they are refused. |
| AC3 | Edit faculty | BUILT. `PATCH /admin/faculties/:id`, `backend/src/routes/admin/academics.ts:67`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveFaculty` (id → PATCH, `admin/hooks/queries/use-academics.ts:18-23`), called from `admin/components/forms/faculty-form.tsx:26`, opened at `admin/app/(dashboard)/academics/page.tsx:165`. RBAC: same as AC2. |
| AC4 | Programmes list | BUILT. `GET /admin/programmes`, `backend/src/routes/admin/academics.ts:90`. Roles: all four roles. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useProgrammes` (`admin/hooks/queries/use-academics.ts:38`). Callers include `admin/app/(dashboard)/academics/page.tsx:80` and `admin/app/(dashboard)/notifications/page.tsx:48`. |
| AC5 | Create programme | BUILT. `POST /admin/programmes`, `backend/src/routes/admin/academics.ts:121`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveProgramme` (no id → POST, `admin/hooks/queries/use-academics.ts:52-57`), called from `admin/components/forms/programme-form.tsx:29`, opened at `admin/app/(dashboard)/academics/page.tsx:136`. RBAC: same as AC2. |
| AC6 | Edit programme | BUILT. `PATCH /admin/programmes/:id`, `backend/src/routes/admin/academics.ts:140`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveProgramme` (id → PATCH, `admin/hooks/queries/use-academics.ts:52-57`), called from `admin/components/forms/programme-form.tsx:29`, opened at `admin/app/(dashboard)/academics/page.tsx:237`. RBAC: same as AC2. |
| AC7 | Semesters list | BUILT. `GET /admin/semesters`, `backend/src/routes/admin/academics.ts:166`. Roles: all four roles. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSemesters` (`admin/hooks/queries/use-academics.ts:67`). Callers include `admin/app/(dashboard)/academics/page.tsx:87`, `admin/app/(dashboard)/grades/page.tsx:34` and `admin/app/(dashboard)/grades/[subjectId]/page.tsx:58`. |
| AC8 | Create semester | BUILT. `POST /admin/semesters`, `backend/src/routes/admin/academics.ts:185`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveSemester` (no id → POST, `admin/hooks/queries/use-academics.ts:80-85`), called from `admin/components/forms/semester-form.tsx:29`, opened at `admin/app/(dashboard)/academics/page.tsx:136`. RBAC: same as AC2. |
| AC9 | Edit semester (incl. set current) | BUILT. `PATCH /admin/semesters/:id`, `backend/src/routes/admin/academics.ts:218`. Roles: SUPER_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveSemester` (id → PATCH, `admin/hooks/queries/use-academics.ts:80-85`), called from `admin/components/forms/semester-form.tsx:29` (opened at `admin/app/(dashboard)/academics/page.tsx:338`), `admin/app/(dashboard)/academics/page.tsx:88`, `admin/app/(dashboard)/settings/page.tsx:286` and `admin/components/modals/close-semester-modal.tsx:21` (opened at `admin/app/(dashboard)/settings/page.tsx:539`). RBAC: same as AC2 on the Academics page. |
| AC10 | Subjects list | BUILT. `GET /admin/subjects`, `backend/src/routes/admin/academics.ts:262`. Roles: all four roles. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSubjects` (`admin/hooks/queries/use-academics.ts:95`). Callers include `admin/app/(dashboard)/academics/page.tsx:84`, `admin/app/(dashboard)/attendance/session/page.tsx:48` and `admin/app/(dashboard)/grades/[subjectId]/page.tsx:56`. |
| AC11 | Create subject | BUILT. `POST /admin/subjects`, `backend/src/routes/admin/academics.ts:306`. Roles: SUPER_ADMIN, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveSubject` (no id → POST, `admin/hooks/queries/use-academics.ts:102-107`), called from `admin/components/forms/subject-form.tsx:27`, opened at `admin/app/(dashboard)/academics/page.tsx:136`. RBAC: REGISTRAR sees Academics (`admin/lib/constants.ts:147`), the button is not role-gated, and REGISTRAR is refused. |
| AC12 | Edit subject | BUILT. `PATCH /admin/subjects/:id`, `backend/src/routes/admin/academics.ts:331`. Roles: SUPER_ADMIN, FACULTY_ADMIN. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `useSaveSubject` (id → PATCH, `admin/hooks/queries/use-academics.ts:102-107`), called from `admin/components/forms/subject-form.tsx:27`, opened at `admin/app/(dashboard)/academics/page.tsx:283`. RBAC: same as AC11. |

### Admin client-only capabilities

These are portal capabilities with no endpoint of their own behind them. App and
PWA cells are N/A (staff tools; auth boundary). They do not enter the closing list
(D2).

| # | Capability | backend | app | pwa | admin |
|---|---|---|---|---|---|
| AX1 | CSV parsing and row validation before import (students, grades) | BUILT. It feeds `POST /admin/students/import` (ST7) and `POST /admin/grades/bulk` (GR4). | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `parseCsv` (`admin/lib/utils.ts:96`), used at `admin/app/(dashboard)/students/import/page.tsx:110-111` (with row validation at `:145-177`) and `admin/components/modals/grade-import-modal.tsx:70`. |
| AX2 | Global search (top bar) | BUILT. It reads ST1, AC10 and NW1. | N/A. Auth boundary. | N/A. Auth boundary. | BUILT. `admin/components/shell/global-search.tsx:20,40-42` (debounced search over students, subjects and news), rendered for every role at `admin/components/shell/top-bar.tsx:51`. RBAC: see ST1. |

### Admin endpoints no client consumes

No portal page calls these, and neither student client can (auth boundary).

| Handler | Defined at | Row | Why |
|---|---|---|---|
| `GET /admin/auth/me` | `backend/src/routes/admin/auth.ts:259` | AU4 | no hook, no caller |
| `GET /admin/attendance/pending-justifications` | `backend/src/routes/admin/attendance.ts:256` | AT3 | helper exists, no caller |
| `PATCH /admin/news/categories/:id` | `backend/src/routes/admin/categories.ts:148` | NC4 | no hook, no caller |
| `GET /admin/news/:id` | `backend/src/routes/admin/news.ts:108` | NW2 | helper exists, no caller |
| `PATCH /admin/settings/automations` | `backend/src/routes/admin/settings.ts:132` | SE5 | write path unused: UI toggles deliberately disabled as deprecated (`admin/app/(dashboard)/settings/page.tsx:52`) |

---

## Student-facing capabilities only one of app / PWA has

This compares the app with the PWA only (mission decision D2). Admin rows never
appear here. Each entry names the client that has the capability, why the other
lacks it, and the source row.

### Endpoints consumed by one client only

| Capability | Has it | Other client | Row |
|---|---|---|---|
| Signed QR student-card token | app | pwa: MISSING. Decided: gap to build (Islam, 2026-11-12). | S12 |
| Register a device for push | app | pwa: MISSING. Decided: gap to build (Islam, 2026-11-12). | S10 |
| Remove the push token on logout | app | pwa: MISSING. Decided: gap to build (Islam, 2026-11-12). | S11 |
| News categories (server-driven chip labels) | app | pwa: MISSING (labels hardcoded in locale files). Decided: gap to build (Islam, 2026-11-12). | N1 |
| Mark one notification read | app | pwa: MISSING. Decided: gap to build (Islam, 2026-11-12). | S8 |
| Mark all notifications read | app | pwa: MISSING (helper, no caller). Decided: gap to build (Islam, 2026-11-12). | S7 |

QR is launch-blocking for the PWA: without row S12 there is no signed QR student card (Islam, 2026-11-12).

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

### Client-only capabilities present in only one of app / PWA

| Capability | Has it | Other client | Row |
|---|---|---|---|
| QR student card: display | app (BUILT) | pwa: MISSING. Decided: gap to build (Islam, 2026-11-12). | C5 |
| QR rotation / refresh | app (PARTIAL: server expiry ignored, countdown cosmetic) | pwa: MISSING | C6 |
| QR offline behaviour | app (PARTIAL: unsigned student-ID fallback) | pwa: MISSING | C7 |
| Push: prompt, token send and removal, tap routing | app (BUILT) | pwa: MISSING. Decided: gap to build (Islam, 2026-11-12). | C8 |
| Quiet hours enforcement | app (PARTIAL: foreground only) | pwa: MISSING (no push) | C9 |
| Biometric sign-in | app (BUILT) | pwa: MISSING | C13 |
| Course notes | app (BUILT) | pwa: MISSING (undecided, D3; the code comment's reason is out of date) | C14 |
| News bookmarks | app (BUILT) | pwa: MISSING | C18 |
| Info center FAQ | app (PARTIAL: FAQ and contacts, no forms) | pwa: PARTIAL (faculty contacts in Profile, no FAQ). Contacts exist in both clients; only the FAQ is app-only. | C20 |
| Onboarding | app (BUILT) | pwa: MISSING | C21 |
| Offline-cache consent switch | pwa (BUILT) | app: N/A (always on by design) | C3 |
| Installable web app (service worker, install prompt) | pwa (BUILT) | app: N/A (native app) | C19 |

**Client-only, in both, but complete in one only:** justification upload on the
client side (C10). The PWA is BUILT, with type and size checks before sending and
an offline guard. The app is PARTIAL: images only, no checks before sending, no
offline guard.

**Present in both, and PARTIAL in both:** the grade calculator (C1). Both hardcode
the 0.4 / 0.6 weights, which an admin can change on the server.

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

</details>

<details>
<summary>63 admin handlers, each in exactly one row</summary>

| Handler | Defined at | Row |
|---|---|---|
| `POST /admin/auth/login` | `backend/src/routes/admin/auth.ts:86` | AU1 |
| `POST /admin/auth/refresh` | `backend/src/routes/admin/auth.ts:187` | AU2 |
| `POST /admin/auth/logout` | `backend/src/routes/admin/auth.ts:239` | AU3 |
| `GET /admin/auth/me` | `backend/src/routes/admin/auth.ts:259` | AU4 |
| `PATCH /admin/auth/password` | `backend/src/routes/admin/auth.ts:284` | AU5 |
| `GET /admin/dashboard/stats` | `backend/src/routes/admin/dashboard.ts:24` | DB1 |
| `GET /admin/dashboard/recent-activity` | `backend/src/routes/admin/dashboard.ts:168` | DB2 |
| `GET /admin/students` | `backend/src/routes/admin/students.ts:82` | ST1 |
| `GET /admin/students/:id` | `backend/src/routes/admin/students.ts:190` | ST2 |
| `POST /admin/students` | `backend/src/routes/admin/students.ts:271` | ST3 |
| `PATCH /admin/students/:id` | `backend/src/routes/admin/students.ts:342` | ST4 |
| `POST /admin/students/:id/reset-password` | `backend/src/routes/admin/students.ts:393` | ST5 |
| `PATCH /admin/students/:id/status` | `backend/src/routes/admin/students.ts:445` | ST6 |
| `POST /admin/students/import` | `backend/src/routes/admin/students.ts:511` | ST7 |
| `GET /admin/schedule/conflicts` | `backend/src/routes/admin/schedule.ts:107` | SC1 |
| `GET /admin/schedule` | `backend/src/routes/admin/schedule.ts:151` | SC2 |
| `POST /admin/schedule` | `backend/src/routes/admin/schedule.ts:213` | SC3 |
| `PATCH /admin/schedule/:id` | `backend/src/routes/admin/schedule.ts:262` | SC4 |
| `DELETE /admin/schedule/:id` | `backend/src/routes/admin/schedule.ts:322` | SC5 |
| `GET /admin/grades` | `backend/src/routes/admin/grades.ts:71` | GR1 |
| `PATCH /admin/grades/:id` | `backend/src/routes/admin/grades.ts:109` | GR2 |
| `POST /admin/grades/:id/change` | `backend/src/routes/admin/grades.ts:172` | GR3 |
| `POST /admin/grades/bulk` | `backend/src/routes/admin/grades.ts:242` | GR4 |
| `POST /admin/grades/publish` | `backend/src/routes/admin/grades.ts:357` | GR5 |
| `GET /admin/attendance` | `backend/src/routes/admin/attendance.ts:87` | AT1 |
| `GET /admin/attendance/overview` | `backend/src/routes/admin/attendance.ts:129` | AT2 |
| `GET /admin/attendance/pending-justifications` | `backend/src/routes/admin/attendance.ts:256` | AT3 |
| `POST /admin/attendance/record` | `backend/src/routes/admin/attendance.ts:295` | AT4 |
| `PATCH /admin/attendance/:id/justification` | `backend/src/routes/admin/attendance.ts:355` | AT5 |
| `GET /admin/news/categories` | `backend/src/routes/admin/categories.ts:55` | NC1 |
| `POST /admin/news/categories` | `backend/src/routes/admin/categories.ts:73` | NC2 |
| `PATCH /admin/news/categories/reorder` | `backend/src/routes/admin/categories.ts:106` | NC3 |
| `PATCH /admin/news/categories/:id` | `backend/src/routes/admin/categories.ts:148` | NC4 |
| `DELETE /admin/news/categories/:id` | `backend/src/routes/admin/categories.ts:180` | NC5 |
| `GET /admin/news` | `backend/src/routes/admin/news.ts:95` | NW1 |
| `GET /admin/news/:id` | `backend/src/routes/admin/news.ts:108` | NW2 |
| `POST /admin/news` | `backend/src/routes/admin/news.ts:135` | NW3 |
| `PATCH /admin/news/:id` | `backend/src/routes/admin/news.ts:190` | NW4 |
| `DELETE /admin/news/:id` | `backend/src/routes/admin/news.ts:248` | NW5 |
| `POST /admin/notifications/send` | `backend/src/routes/admin/notifications.ts:69` | NT1 |
| `GET /admin/notifications/history` | `backend/src/routes/admin/notifications.ts:120` | NT2 |
| `GET /admin/users` | `backend/src/routes/admin/users.ts:39` | US1 |
| `POST /admin/users` | `backend/src/routes/admin/users.ts:66` | US2 |
| `PATCH /admin/users/:id` | `backend/src/routes/admin/users.ts:110` | US3 |
| `DELETE /admin/users/:id` | `backend/src/routes/admin/users.ts:158` | US4 |
| `GET /admin/audit` | `backend/src/routes/admin/audit.ts:12` | AD1 |
| `GET /admin/settings` | `backend/src/routes/admin/settings.ts:23` | SE1 |
| `PATCH /admin/settings/grade-formula` | `backend/src/routes/admin/settings.ts:38` | SE2 |
| `PATCH /admin/settings/attendance-threshold` | `backend/src/routes/admin/settings.ts:71` | SE3 |
| `PATCH /admin/settings/justification-deadline` | `backend/src/routes/admin/settings.ts:100` | SE4 |
| `PATCH /admin/settings/automations` | `backend/src/routes/admin/settings.ts:132` | SE5 |
| `GET /admin/faculties` | `backend/src/routes/admin/academics.ts:23` | AC1 |
| `POST /admin/faculties` | `backend/src/routes/admin/academics.ts:48` | AC2 |
| `PATCH /admin/faculties/:id` | `backend/src/routes/admin/academics.ts:67` | AC3 |
| `GET /admin/programmes` | `backend/src/routes/admin/academics.ts:90` | AC4 |
| `POST /admin/programmes` | `backend/src/routes/admin/academics.ts:121` | AC5 |
| `PATCH /admin/programmes/:id` | `backend/src/routes/admin/academics.ts:140` | AC6 |
| `GET /admin/semesters` | `backend/src/routes/admin/academics.ts:166` | AC7 |
| `POST /admin/semesters` | `backend/src/routes/admin/academics.ts:185` | AC8 |
| `PATCH /admin/semesters/:id` | `backend/src/routes/admin/academics.ts:218` | AC9 |
| `GET /admin/subjects` | `backend/src/routes/admin/academics.ts:262` | AC10 |
| `POST /admin/subjects` | `backend/src/routes/admin/academics.ts:306` | AC11 |
| `PATCH /admin/subjects/:id` | `backend/src/routes/admin/academics.ts:331` | AC12 |

</details>
