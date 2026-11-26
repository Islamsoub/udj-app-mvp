# End-to-end test plan: admin portal → student website

Part 1 of the E2E work: the plan only. Nothing in this document has been run.
No data was created, changed or deleted while writing it.

- Branch: `test/e2e-plan`
- Written: 2026-11-26, from the code on `develop` at `df304c5`
- Scope: the admin portal (`admin/`) and the student website (`pwa/`), both
  talking to the one live backend and its live database.

Every claim about behaviour below cites the file it comes from. Paths are
relative to the repo root.

---

## 0. Decisions needed before Part 2 starts

Reading the code turned up four places where your rules and the code
collide. Each needs a yes/no from you before anything is created.

| # | Question | Recommendation |
|---|---|---|
| D1 | **Semester.** Test subjects *must* point at a semester, and the student website only shows the *current* one (see §2). May the test subjects reference the real current semester by ID, without the semester row itself ever being edited? | Yes (Option B in §2). If no, Option A runs, and areas 3, 4 and part of 2 cannot be checked on the website. |
| D2 | **Scheduled article.** The admin portal has no publication-date field (`admin/app/(dashboard)/news/create/page.tsx`). A future `publishedAt` can only be sent by calling the API directly. May we make that one call with your admin session, or should the scheduled-article check be dropped? | Drop it from Part 2, and file the missing date field as a bug. Calling the API by hand breaks the "like a real user" rule. |
| D3 | **News is global.** Every article is visible to *every* student, real ones included (`backend/src/routes/news.ts:19-21`). There is no faculty or programme targeting. OK to publish one "[TEST E2E]" article for the few minutes the check takes, then delete it? | Yes, with notifications off and "urgent" off (§6, area 5). |
| D4 | **Records the app cannot delete.** There is no delete for faculties, programmes, subjects, students, grades or attendance records anywhere in the API (`backend/src/routes/admin/academics.ts`, `students.ts`). Since direct database writes are ruled out, these stay in the database after the tests, renamed and/or suspended. OK? | Yes for Part 2. Decide the final removal method in the cleanup part (§8). |

---

## 1. Setup

### 1.1 Which apps

- **Admin portal:** the live one at https://udj-app-mvp.vercel.app only.
- **Student website: run `pwa/` locally, as a production build, against the
  live backend.** No deployed PWA address exists anywhere in the repo. There
  is no `vercel.json` and no PWA URL in any README, mission file or
  `.env.example`; only the backend's own address appears. A production build
  (`npm run build`, then `npm run start`, on http://localhost:3000) is needed
  instead of `npm run dev`. The service worker only registers in a
  production build (`pwa/components/pwa/service-worker.ts:39`), and area 10
  (offline) depends on it.
- `pwa/.env.local` (gitignored) gets `NEXT_PUBLIC_API_URL` set to the live
  backend. `PWA_PROXY_SECRET` stays empty. The backend treats it as optional
  (`backend/src/utils/env.ts:31`), and without it the proxy simply sends no
  forwarded-IP header (`pwa/lib/proxy.ts:69-73`). The file is never
  committed.
- The browser only ever calls the PWA's own `/api/backend/*` and `/api/auth/*`
  routes (`pwa/lib/api-client.ts`), so CORS does not get in the way of a
  local PWA.

### 1.2 Who does what

- **You** sign in on both sides, type or copy every password, and copy the
  one-time password the admin portal shows after a reset. Claude never asks
  for, reads, writes down or stores any password.
- No screenshot is taken while a password field is filled in or the
  "reset password" modal is open.
- **Claude** gives the steps, records IDs and results in a run log
  (`docs/e2e/run-log.md`, IDs and outcomes only, never credentials), and
  reads the screens to check expected values.
- Your admin account must be **SUPER_ADMIN**. Creating faculties,
  programmes and students needs it (`academics.ts:49-161`, `students.ts:271`).

### 1.3 Things that shape every check

- **No live updates.** No PWA screen polls. Data loads when a screen mounts,
  on retry, and on reconnect only (`pwa/components/dashboard/useCardData.ts:129`).
  After every admin action, the student **reloads the page** before checking.
- **Login lockout never decays.** Three wrong passwords lock the account for
  5 minutes, and the counter is only cleared by a successful login or an
  admin reset (`backend/src/routes/auth.ts:69-116`). Every
  "wrong password" check is a single attempt, followed straight away by a
  correct login.
- **Login rate limit:** 10 attempts a minute per IP (`backend/src/middleware/rateLimiter.ts:125-132`).
  With no proxy secret, every login from this machine shares that limit.
- **The backend may be asleep.** "Serveur en cours de démarrage" on first
  load is normal; wait and retry.
- The Djibouti teaching week runs Sunday to Thursday; `dayOfWeek` 0 = Sunday.

---

## 2. Semesters: how they work, and how the tests avoid touching real ones

### What the code does

- `Semester` is a **single global table**. It has no faculty or programme
  link (`backend/prisma/schema.prisma:124-138`).
- The current semester is **computed from dates, for everyone at once**
  (`backend/src/utils/currentSemester.ts`). The `is_current` column is
  ignored. The rule, using calendar days in Africa/Djibouti with the end date
  included:
  1. A semester where start ≤ today ≤ end.
  2. If several match, the one that **started most recently** wins.
  3. If none match (a break), the most recently started one.
  4. If none has started, the earliest upcoming one.
- Creating a semester is allowed to overlap others. The admin form only
  warns (`admin/components/forms/semester-form.tsx:56-64`). The backend only
  checks that the end is after the start (`academics.ts:198-202`).
- **There is no semester delete endpoint** (`academics.ts` has GET, POST and
  PATCH only).
- Every subject requires a `semesterId` (`schema.prisma:143`,
  `academics.ts:303`). Grades and schedule entries carry one too.
- The student website reads the current semester for:
  - Présence (`backend/src/routes/student.ts:510-570`): **current only**,
    with no way to ask for another.
  - Planning (`student.ts:290-339`): current, unless a `semesterId` is passed.
    The PWA never passes one.
  - Notes (`student.ts:418-425`): current by default. Other semesters
    appear as tabs only if the student has grades in them (`student.ts:364-377`).
  - The dashboard (`/student/me`, `student.ts:149`).
- The admin attendance overview is also current-semester only
  (`backend/src/routes/admin/attendance.ts:149-159`).
- `Student.currentSemester` (a number such as 3) is display text only
  ("Semestre 3"). No query uses it.

### Why no test semester is created

A test semester **would change the current semester for every student**
whenever its dates include today and it starts later than the real current
semester (rule 2), or whenever the calendar is in a break (rule 3). Because
there is no delete, a mistake could not be undone through the app.
Therefore **no test semester will be created.**

### Option B (recommended, needs your yes on D1)

The test subjects are created inside the test programme with `semesterId` =
the **real current semester**, picked from the existing list. The semester
row itself is never edited.

- **Effect on real students: none.** Every student query that touches
  subjects, grades, schedule or attendance filters by the student's own
  programme or own ID (`student.ts:186-216`, `:313-318`, `:556-557`). Real
  students are never in the test programme.
- **Effect on admins:** the two test subjects appear in admin lists for that
  semester, under the "[TEST E2E]" faculty and programme.
- This *does* attach something to a real semester, which is why it needs
  your yes.

### Option A (fallback if D1 is no)

Create one test semester dated entirely in the past (for example
"[TEST E2E] S-test", academic year "[TEST E2E]", 2000-01-01 to 2000-06-30).

- By the rules above it can only become current if **no real semester has
  ever started**, which is not the case.
- It is still a permanent global row that cannot be deleted.
- **What is lost:**
  - Présence (area 3): the student website never shows a non-current
    semester.
  - Planning (area 4): same reason.
  - The admin attendance overview, for the same reason.
  - Notes (area 2): the test semester shows only as a non-default tab.
- So most of areas 2–4 could not be checked on the website.

### Area 8 needs neither option

See area 8: that check is read-only.

---

## 3. Test data

All names start with "[TEST E2E]". Codes cannot hold spaces or brackets, so
they use the `TSTE2E` prefix instead.

| Record | Values |
|---|---|
| Faculty | nameFr "[TEST E2E] Faculté de test", nameAr "[TEST E2E] كلية الاختبار", code `TSTE2E`, email `e2e-faculty@example.com`, phone "000" |
| Programme | nameFr "[TEST E2E] Licence de test", nameAr "[TEST E2E] إجازة الاختبار", code `TSTE2E-L1`, level LICENCE, 6 semesters, 180 credits, in the test faculty |
| Subject A | nameFr "[TEST E2E] Algèbre", nameAr "[TEST E2E] الجبر", code `TSTE2E-ALG`, coefficient 2, credits 6, semester per D1 |
| Subject B | nameFr "[TEST E2E] Biologie", nameAr "[TEST E2E] الأحياء", code `TSTE2E-BIO`, coefficient 1, credits 4, semester per D1 |
| Student 1 | first name "[TEST E2E]", last name "Alpha", matricule `UDJ-2099-9901`, email `e2e-alpha@example.com`, semester number 1, ACTIVE |
| Student 2 | first name "[TEST E2E]", last name "Beta", matricule `UDJ-2099-9902`, email `e2e-beta@example.com`, semester number 1, ACTIVE |

Notes on the values:
- Faculty fields: `academics.ts:39-47`. Subject coefficient must be 1–10
  and credits 1–30 (`academics.ts:303`).
- The matricule is the login, must match `UDJ-\d{4}-\d{3,4}`, and cannot be
  changed later (`admin/lib/validations.ts:12`, `auth.ts:28,54`).
- Before creating the students, search the admin student list for both
  matricules and both emails. Each must not exist yet; a duplicate returns
  409.
- `example.com` is reserved, so no real mailbox can receive anything.

Every ID is copied into the run log as it is created. They can be read from
admin URLs such as `/students/<id>`, or from the audit log at `/audit`.

---

## 4. Areas

The order matters: area 1 creates the students that every later area uses.
Each area lists what the admin does, what the student should see, and how
it is checked.

### Area 1. Accounts

**Admin:**
1. In `/academics`, create the faculty, the programme and the two subjects
   from §3.
2. In `/students`, create Student 1 and Student 2. You type the password, or
   click "Générer" and copy it yourself (`admin/components/forms/student-form.tsx:226-243`).
   It is not emailed and not shown again.

**Student:**
3. On http://localhost:3000/login, sign in as Student 1 with
   "Numéro étudiant" = `UDJ-2099-9901`.
4. Expected: the dashboard opens with "Bonjour, [TEST E2E]" and
   "Semestre 1". Profil shows the test faculty and programme names.

**Admin, password reset:**
5. On `/students/<Student 1 id>`, reset the password. The server makes a new
   12-character password, shown once in a modal with "Copier"
   (`admin/components/modals/reset-pw-modal.tsx`).
6. The reset revokes all of the student's refresh tokens and clears the
   lockout counter (`backend/src/routes/admin/students.ts:415-424`). You copy
   the new password; Claude does not look at the modal.

**Student, after the reset:**
7. **Open session.** Reload the still-open Student 1 tab. Expected: it is
   sent back to `/login`, because restoring the session fails
   (`pwa/components/shell/AppShell.tsx:129-133`). Without a reload, the tab
   keeps working for up to 15 minutes, until its access token expires, then
   shows "Votre session a expiré" with "Se reconnecter".
8. **Old password, exactly once.** Expected: "Identifiants incorrects" and
   "Il vous reste 2 tentatives."
9. **New password, immediately.** Expected: the dashboard opens, and the
   failure counter resets.

**How it's checked:** screen text at steps 4, 7, 8 and 9; the audit log at
`/audit` shows `student.create` and `student.resetPassword` (with the
password redacted) for that student ID.

### Area 2. Grades

**Expected values.** The final note is `wCc × CC + wCf × CF`, rounded to 2
decimals (`backend/src/utils/adminHelpers.ts:20-28`). The weights are read
(read-only) from `/settings` before starting; the defaults are 0.40 / 0.60.
The average is weighted by coefficient over subjects whose final results
are published (`student.ts:121-130`, `:472-473`). Pass mark: 10
(`adminHelpers.ts:48`).

With the default weights:

| Student | Subject (coef) | CC | CF | Final |
|---|---|---|---|---|
| Alpha | Algèbre (2) | 12 | 14 | 13.20 |
| Alpha | Biologie (1) | 8 | 10 | 9.20 |
| Beta | Algèbre (2) | 16 | 18 | 17.20 |
| Beta | Biologie (1) | 15 | 17 | 16.20 |

- **Alpha's average:** (13.20×2 + 9.20) / 3 = **11.87**, mention
  "Passable", credits **6/10** (Biologie fails, so its 4 credits are not
  earned).
- **Beta's average:** (17.20×2 + 16.20) / 3 = **16.87**, "Très bien",
  credits 10/10.
- Beta's numbers are deliberately different from Alpha's, so any leak in
  area 7 is obvious.

If `/settings` shows other weights, recompute the table before starting and
write the new expected values in the run log. **Do not change the weights:**
they are global.

**Admin:**
1. In `/grades/<subject id>`, enter CC and CF for both students in both
   subjects and save (`POST /admin/grades/bulk`).
2. In `/grades`, filtered to the test programme, publish **CC**. The publish
   button covers the whole programme it is filtered to (`admin/app/(dashboard)/grades/page.tsx:93`),
   so **check the programme filter says "[TEST E2E] Licence de test"
   before clicking.**

**Student 1, after the CC publish (reload):**
3. Notes shows only the CC column: 12 and 8.
4. Expected banner: "Seules les notes de contrôle continu sont publiées
   pour ce semestre. Les notes finales suivront."
5. The average reads "Moyenne non publiée"; the status reads "En attente".

**Admin:**
6. Publish **NF** for the test programme.

**Student 1, after the NF publish (reload):**
7. Notes shows CC, CF and the final notes 13.20 and 9.20.
8. Expected: average "11.87 /20", mention "Passable", "Crédits : 6/10".
9. The default tab is the current semester (`pwa/components/grades/GradesView.tsx:65-69`).
10. The dashboard's "Moyenne générale" card shows the same 11.87.

**How it's checked:** the screen values against the table above. In
`/audit`, `grade.bulkCreate` and two `grade.publish` entries.

### Area 3. Attendance (needs Option B)

**Session plan.** Two Algèbre sessions on Sundays, using the Sunday schedule
slot from area 4. Run area 4 first, or create that slot first:
- S1: the Sunday one week before S2.
- S2: the most recent Sunday on or before the run day. It must be within the
  8-day justification deadline (`justificationDeadlineDays`, read-only from
  `/settings`; `backend/src/utils/attendance.ts:387-421`).

**Admin:**
1. In `/attendance/session`, choose subject "[TEST E2E] Algèbre".
2. Take the roll call for **S1**: everyone PRESENT.
3. Take the roll call for **S2**: Alpha ABSENT, Beta PRESENT.
   - The roll call writes a row for every student in the programme roster
     (`admin/app/(dashboard)/attendance/session/page.tsx:56,120`). The test
     programme holds only Alpha and Beta.
   - Roll calls need SUPER_ADMIN or FACULTY_ADMIN (`attendance.ts:296-348`).

**Student 1, after the roll calls (reload Présence):**
4. Expected: Algèbre at **50 %**, since both sessions are the same length
   and the rate is hours-based (`backend/src/utils/attendance.ts:86-101`).
   That is below the 75 % default threshold, so it shows in the "below" band.
5. The S2 absence is listed as **"À justifier"**.

**Refused-proof flow:**
6. **Student 1** opens the S2 absence and uploads a one-page PDF named
   "[TEST E2E] justificatif.pdf", with the note "[TEST E2E] refus".
   - Accepted types: JPEG, PNG, WebP or PDF, up to 4.5 MB
     (`pwa/components/attendance/upload.ts:22-42`).
   - Expected: "Justificatif envoyé", status "En attente". The dashboard's
     "Justifier une absence" count is 1.
7. **Admin:** in `/attendance`, find the pending proof for Alpha and
   **reject** it (`PATCH /admin/attendance/:id/justification`,
   `attendance.ts:356-432`).
8. **Student 1 (reload).** Expected:
   - status **"Refusée"**;
   - the panel says "Justificatif refusé" and that the absence counts in the
     rate;
   - Algèbre stays at 50 %;
   - inside the deadline, "Vous pouvez envoyer un nouveau justificatif…"
     with the upload form again (`pwa/components/attendance/JustificationPanel.tsx:186-215`).

**Optional approve path:**
9. Student 1 re-uploads a proof; the admin **approves** it.
10. Expected: "Justifiée", and Algèbre rises to **100 %** (a justified
    session counts in full).

**How it's checked:** the screen values, the notifications in area 6, and
`attendance.record` / `attendance.reject` (and `attendance.approve`) in
`/audit`.

### Area 4. Schedule

**Admin:** in `/schedule`, add two entries (`POST /admin/schedule`,
`backend/src/routes/admin/schedule.ts:213-341`):

| Subject | Day | Time | Type | Room | Professor |
|---|---|---|---|---|---|
| [TEST E2E] Algèbre | Dimanche (`dayOfWeek` 0) | 08:00–09:30 | CM | "[TEST E2E] Salle 1" | "[TEST E2E] Prof A" |
| [TEST E2E] Biologie | Lundi (`dayOfWeek` 1) | 10:00–12:00 | TD | "[TEST E2E] Salle 2" | "[TEST E2E] Prof B" |

`effectiveDate` defaults to "now" (`schedule.ts:233`), so both entries apply
immediately.

**Student 1 (reload Planning):**
- **Placement.** Algèbre is in the "Dim" column from 08:00 to 09:30;
  Biologie is in the "Lun" column from 10:00 to 12:00. The grid shows Sunday
  to Thursday (`pwa/lib/teaching-week.ts:17-27`). Each type label is printed
  as text, "CM" and "TD" (`pwa/components/schedule/course-type.ts`).
- **Colour.** Colour comes from the subject's French name, sorted among the
  student's own subjects, and indexed into a 12-colour palette
  (`pwa/lib/subject-colors.ts:136-143`). The test programme has exactly two
  subjects, so:
  - "[TEST E2E] Algèbre" is index 0, **indigo** (light #6366F1);
  - "[TEST E2E] Biologie" is index 1, **blue** (light #2F7DD1).
- **Consistency.** Each subject keeps the same colour in the week grid, the
  day list and the dashboard's "Aujourd'hui" card.

**How it's checked:** the visual placement; the colour read from the
element's `--subj-l` style value; `schedule.create` in `/audit`.

### Area 5. News (see D2 and D3)

**Hazards in the admin news form:**
- **"Enregistrer le brouillon" publishes immediately, to everyone.** There
  are no drafts: `publishedAt` cannot be empty (`schema.prisma:257`,
  `backend/src/routes/admin/news.ts:165`). **Never click it.**
- With "urgent" on, or the "Notification push" toggle on, **every active
  student** is notified, including real ones (`backend/src/routes/admin/news.ts:171-180`).
  **Both stay off.**
- Do not create a news category: categories are public to everyone
  (`backend/src/routes/news.ts:26`).

**5a. Published now.**
- **Admin:** in `/news/create`, title "[TEST E2E] Article publié", a short
  body, the default category, urgent off, notification off, then
  **Publier**. Record its ID.
- **Student 1 (reload Actualités).** Expected: the article is in the list
  under "Tout", labelled with its category, and opens in the reader at
  `/news?article=<id>`.
- **Then, straight away:** the admin deletes it in `/news` (SUPER_ADMIN only,
  `admin/news.ts:248`). Student 1 reloads; the article is gone. Total
  exposure: a few minutes.

**5b. Scheduled for later (only if D2 = yes).**
- One article "[TEST E2E] Article programmé", with `publishedAt` 10 minutes
  ahead. The portal cannot set this date, so it is a direct API call.
- **Student, before that time.** The article is not in the list, and
  `/news?article=<id>` shows nothing: the backend returns 404 for an article
  scheduled in the future (`backend/src/routes/news.ts:19-21,53,83-85`).
- **Student, after that time (reload).** The article is in the list.
- Then delete it as in 5a.
- **If D2 = no:** this check is recorded as "not testable through the
  portal" and filed as a bug: the portal has no publication-date field.

**How it's checked:** list contents before and after; `news.create` and
`news.delete` in `/audit`.

### Area 6. Notifications

Notifications are read from `/student/notifications` when the page loads,
when the bell opens, and on reconnect; there is no polling
(`pwa/components/shell/useNotifications.ts`). Checks happen through the
bell popover and the dashboard's Notifications card, after a reload.

| Trigger (area) | Type | Expected text for Alpha (and Beta, where it applies) | Source |
|---|---|---|---|
| CC publish (2) | GRADES | "Vos notes de contrôle continu (<semester>) sont disponibles"; both students | `admin/grades.ts:441-456` |
| NF publish (2) | GRADES | "Vos résultats finaux (<semester>) sont disponibles"; both | same |
| Schedule create, ×2 (4) | SCHEDULE | "Votre emploi du temps a été mis à jour"; both, once per entry | `admin/schedule.ts:85-103` |
| Proof rejected (3) | ATTENDANCE | "Votre justificatif pour [TEST E2E] Algèbre (DD/MM/YYYY) a été rejeté"; **Alpha only** | `admin/attendance.ts:407-420` |
| Proof approved (3, optional) | ATTENDANCE | "… a été approuvé"; Alpha only | same |

Things that do **not** create a notification:
- roll calls (`attendance.ts:296-348`);
- the admin password reset;
- the 5a article, because notifications are off on purpose.

**Checks:**
- **Click-through.** Clicking each item goes to its screen: GRADES → Notes,
  SCHEDULE → Planning, ATTENDANCE → Présence (`pwa/components/notifications/NotificationParts.tsx:55-59`).
- **Read state.** "Mark as read" clears the unread dot and survives a
  reload.
- **The manual composer at `/notifications` is not used.** Its default
  target is "all", meaning every student (`admin/app/(dashboard)/notifications/page.tsx:38`).

### Area 7. Privacy (Student 2 must not see Student 1's data)

The checks are run signed in as Student 2 (Beta), in the same browser after
signing Alpha out.

**Beta should see:**
- **Notes:** only Beta's own values (16/18/17.20 and 15/17/16.20, average
  16.87). Never 12, 8, 13.20, 9.20 or 11.87.
- **Présence:** 100 % on Algèbre. No absence, no "Refusée", no proof.
- **Notifications:** the GRADES and SCHEDULE ones. **No** ATTENDANCE
  rejection.
- **Planning:** the same entries as Alpha. That is expected: the timetable
  belongs to the programme, not to one student.

**Cache isolation.** After the switch to Beta, the offline cache holds no
Alpha data. Logging in as a different student wipes it
(`pwa/lib/offline-cache.ts:510-528`). Check this in area 10's setup.

**Direct-ID probes.** These are read-only GET requests, typed into Beta's
browser address bar:
- `/api/backend/student/attendance/<Alpha's record id>` and the
  justification route. Expected: 404 or 403, never Alpha's data. Ownership is
  checked server-side (`student.ts:1079-1081`, `:858-866`).
- The only write probe allowed is "mark as read" on **Alpha's** notification
  ID from Beta's session. Expected: 404, and Alpha's item is still unread.
  This is optional, and only if you agree when we get there.

**How it's checked:** screen values, and the HTTP status of each probe in
the browser's network panel.

### Area 8. Semester (read-only)

1. In `/academics` → semesters (read-only), note each semester's start and
   end dates, and which one the portal marks "en cours". The backend
   computes that flag with the same rule (`academics.ts:167-176`).
2. Apply the rule from §2 by hand to today's date in Djibouti and write
   the expected semester in the run log.
3. **Student 1:** Notes opens on the tab with that semester's label. The
   dashboard shows that semester's data; on Planning and Présence, the
   test data appears only under Option B.
4. **Mismatch probe** (any mismatch is a bug). Nothing is changed; this
   only tells us what to look at:
   - **Djibouti boundary.** If today is a semester's first or last day,
     check the boundary rule (Djibouti midnight, end day included).
   - **Display number vs computed semester.** "Semestre 1" on the dashboard
     is the student's display number, not the computed semester. Note any
     confusing wording, but it is not a failure.

**How it's checked:** the tab label against the hand-computed expectation.
No semester is created or edited.

### Area 9. Arabic and right-to-left

**Switch.** Profil → Préférences → Langue → AR (`pwa/components/profile/DeviceSettings.tsx:32-42`).
It is stored in the `unipocket_lang` cookie and localStorage only, never on
the server (`pwa/lib/i18n-shared.ts`).

**Repeat with Student 1:**
- **Layout.** `<html dir="rtl" lang="ar">` (`pwa/app/layout.tsx:61-71`). The
  navigation and cards mirror, and text starts on the right.
- **Notes.** Subjects show their Arabic names ("[TEST E2E] الجبر"). Numbers
  stay in Latin digits and in order: "11.87", "6/10", not reversed. Time
  ranges show as "08:00–09:30" left to right inside RTL text
  (`pwa/lib/bidi.tsx` handles this).
- **Planning.** The day columns run right to left. Algèbre still sits under
  Sunday (الأحد) and keeps its indigo colour: colours key on the French name
  (`subject-colors.ts:132-135`).
- **Présence.** "50 %" is not mirrored. The rejected-proof label shows in
  Arabic.
- **Notifications.** The GRADES, SCHEDULE and ATTENDANCE items show their
  Arabic text, if the backend writes it. Record what appears.
- **News 5a** (if repeated in AR). The admin form has **no Arabic title or
  body** field, so record what the reader shows in AR (empty title, or a
  French fallback). That is an observation, not a failure.
- **Reload persistence.** After a reload, the page stays in AR with
  `dir="rtl"` from the first paint, with no flash of LTR.
- Finally, switch back to FR.

**How it's checked:** screenshots in AR; reading `document.documentElement.dir`
in the console.

### Area 10. Offline

**Setup:**
1. On the PWA production build, sign in as Student 1 with **"Garder mes
   données hors ligne sur cet appareil"** turned on (`pwa/components/login/OfflineDataSwitch.tsx`).
2. Visit Accueil, Planning, Notes, Présence and Profil once each, so they
   are cached.
3. Check Profil → "Stockage hors ligne" shows a "Dernière synchronisation"
   time.

**Cut the network:** browser devtools → Network → Offline.

**Expected while offline:**
- **Banner:** "Vous êtes hors ligne." with "Dernière synchronisation : …"
  (`pwa/components/shell/OfflineBanner.tsx`).
- **Cached screens show the cached data:** the dashboard, Notes (11.87),
  Planning (both entries), Présence (50 % or 100 %) and notifications.
  The cached paths are `offline-cache.ts:58-64`.
- **Actualités** is not cached: "Les actualités ne sont pas disponibles hors
  ligne."
- **Uploading a proof** shows "L'envoi nécessite une connexion. Un
  justificatif ne peut pas être mis en attente."
- **Saved articles:** "Connexion requise pour afficher vos articles
  enregistrés."
- **A full page reload while offline** still loads the app shell from the
  service worker, then the data from IndexedDB (`pwa/public/sw.js`). An
  uncached route shows the "Unipocket — Hors ligne" page.

**Without consent** (sign out, sign in again with the switch off, then go
offline):
- There is no cached data.
- Each screen shows its "… n'est pas disponible hors ligne." message.

**Reconnect:** set the network back to Online. Expected: the toast
"Connexion rétablie", the banner disappears, and the data refreshes.

**Logout** wipes the cache. Check that Profil's offline storage is empty
after signing in again.

**How it's checked:** screen text; devtools → Application → IndexedDB,
which must be empty after logout.

---

## 5. Order of the run

1. Read-only first: area 8 steps 1–2, plus the weights and justification
   deadline from `/settings`.
2. Area 1 (accounts and test structure), then area 4 (schedule).
3. Area 2 (grades).
4. Area 3 (attendance and the refused proof).
5. Area 6 is checked along the way and summarised here.
6. Area 7 (privacy, as Beta).
7. Area 9 (Arabic), then area 10 (offline).
8. Area 5 (news) last and fast, so the global article is live for the
   shortest time.

## 6. Hard stops during Part 2

Stop and ask if any of these happens:
- **Wrong scope.** Any admin screen's faculty or programme filter shows
  anything other than "[TEST E2E]" just before a publish, roll call or save.
- **Real data affected.** A count of affected students in a confirmation
  dialog is above 2, or any real student's name appears in a roster.
- **Semester changed.** The admin portal's "en cours" semester changes during
  the run.
- **Lockout.** A test account gets locked. Wait 5 minutes; do not retry.
- **Form doesn't match the code.** Any form asks for something this plan
  says it does not (for example, a semester date field on news). Re-read the
  code before going on.

---

## 7. What these tests do not touch

- Real semesters (not edited under either option; not referenced under
  Option A).
- Real faculties, programmes, subjects and students.
- `/settings`: read only. Its weights, threshold and deadline are global.
- News categories, the manual notification composer, student import, and
  admin users.
- The database directly: every write goes through the admin portal or the
  student website.

---

## 8. Cleanup inventory (to be planned and run later; nothing here is run now)

**How to find everything:**
- every name starts with "[TEST E2E]" (codes start with `TSTE2E`);
- every ID is in `docs/e2e/run-log.md`;
- `/audit`, filtered on those entity IDs and the run's time window, lists
  every write the tests made.

| # | Record type (table) | Created by | Expected count | How to find it | Removable through the app? |
|---|---|---|---|---|---|
| 1 | Faculty (`faculties`) | Area 1 | 1 | name "[TEST E2E] Faculté de test", code `TSTE2E`, ID in log | No delete endpoint |
| 2 | Programme (`programmes`) | Area 1 | 1 | code `TSTE2E-L1`, faculty ID | No delete endpoint |
| 3 | Subject (`subjects`) | Area 1 | 2 | codes `TSTE2E-ALG`, `TSTE2E-BIO`, programme ID | No delete endpoint |
| 4 | Semester (`semesters`) | **Option A only** | 0 or 1 | label "[TEST E2E] S-test" | No delete endpoint |
| 5 | Student (`students`) | Area 1 | 2 | matricules `UDJ-2099-9901`, `-9902`; emails `e2e-*@example.com`; last names Alpha/Beta | No delete; can be set to SUSPENDED (`students.ts:440-492`) |
| 6 | Refresh tokens (`refresh_tokens`) | Every sign-in, revoked by the reset | several | `student_id` = test student IDs | Revoked by reset or suspend; rows remain |
| 7 | Grade (`grades`) | Area 2 | 4 | `student_id` = test students; `subject_id` = test subjects | No delete endpoint |
| 8 | Schedule entry (`schedule_entries`) | Area 4 | 2 | `subject_id` = test subjects; rooms "[TEST E2E] Salle 1/2" | **Yes**, admin `/schedule` delete. It notifies the test programme only |
| 9 | Attendance record (`attendance_records`) | Area 3 | 4 (2 sessions × 2 students) | `subject_id` = Algèbre test subject | No delete endpoint |
| 10 | Justification file (Supabase storage, justification bucket) | Area 3 | 1–2 | `justification_url` on Alpha's S2 record | Not through the app |
| 11 | Notification (`notifications`) | Areas 2, 3, 4 | about 10 | `student_id` = test student IDs | No delete endpoint |
| 12 | News article (`news_articles`) | Area 5 | 1–2 | title starting "[TEST E2E] Article", ID in log | **Yes**, deleted in-test (SUPER_ADMIN) |
| 13 | Saved article (`saved_articles`) | Only if "Enregistrer" is clicked in 5a | 0–1 | `student_id` = test student | Cascades when the article is deleted |
| 14 | Audit log (`audit_logs`) | Every admin write | many | `entity_id` in the IDs above; your admin ID; the run's time window | Kept as the trail on purpose; no delete endpoint |
| 15 | Local browser state on the test machine | Areas 9, 10 | n/a | IndexedDB, the `unipocket_lang` cookie, the `unipocket_offline_cache` localStorage entry, service-worker caches for localhost:3000 | Logout plus clearing site data for localhost:3000 |
| 16 | `pwa/.env.local` | Setup | 1 file | gitignored, never committed | Delete the file |

Not expected, but check anyway:
- **Push tokens (`push_tokens`).** The PWA does not register FCM tokens.
  Search by test student IDs anyway.
- **Course notes (`course_notes`).** Only if someone writes a note during the
  tests. They cascade with the student.
