# PWA Présence screen (/attendance): first-pass design review, end to end

## Goal
The PWA Présence screen (`/attendance`) and its justification panel, in every
sub-state, have been measured against the prototype's `view-attendance` and
`#justify-panel`. The comparison ran at 1280, 800 and 400px, in French, light theme,
with realistic fixture data. Every difference is accounted for in one of three ways:
- fixed, in small commits on ONE branch, `agent/lead/pwa-attendance-pass`, which goes
  out as ONE push request;
- listed for Islam to decide;
- covered by a standing decision.

A Reviewer has re-checked the final commit at three widths, in FR and AR, light and
dark, across all six screen states and every panel sub-state. Islam is left with a
short decision list, and nothing he has to point at himself.

## Product
pwa

## Source
Islam's command 60, 2026-11-21. It is the same brief as the Notes pass (command 30),
with this screen's standing decisions. His message was cut off after "Record any
intentional difference from the prototype in .claude/design-known-divergences.md
(pro…". This plan reads that as "(product owner, date)", the format the file
already uses.

## Revision r2, 2026-11-21 (Islam's command 61, the rest of the brief)
This revision overrides anything below that disagrees with it.
- **No screenshots for Islam.** He checks the result himself. Milestone 10 is dropped.
  The harness still takes shots for measuring and QA, in the work folder. The "before"
  set becomes optional: take it only if it helps the measuring.
- **Restore afterwards.** Every agent who changes the language or the theme in the
  browser puts them back to French and light before ending its turn. Fixtures only,
  never a real 401, and never a real account.
- **Chrome stop rule.** If Chrome freezes, or reports a 0×0 viewport, twice in a row:
  stop browser work, finish what can be done in code, and list it under "Couldn't
  check". Do not loop.
- **QA (milestone 9).** Every panel and flow is opened, used and closed: the
  justification panel in each sub-state, and the upload, the filter and the retry.
  Each one closes with Escape and with the close button, and focus returns to the
  element that opened it. Contrast numbers are given for every text colour changed.
- **Divergence rows.** Islam asks for them in `.claude/design-known-divergences.md`
  ("Product owner, 2026-11-21"). The guard still blocks every agent from that file, so
  the rows go into DIVERGENCES.md, ready to paste. The Lead asks Islam to add them, or
  to allow the edit.
  - Nobody works around the guard.
  - The Builder tries the edit once. If it is blocked, they report it and move on.
- **Branch and PR.** Islam asks for `feature/pwa-attendance-pass`. The push helper only
  accepts `agent/lead/*`, so the PR goes from `agent/lead/pwa-attendance-pass` into
  `develop`, and is not merged. The Lead tells Islam why the name differs.
- **The report (milestone 11)** follows Islam's format exactly:
  - "Fixed": one line per fix, as a student sees it.
  - "Needs your decision": at most 5, numbered. Each has the difference in one
    sentence, 2 or 3 options, and a recommendation with its reason in one line.
  - "Smaller decisions for later": one line each.
  - "Couldn't check".
  - "Details for review": commits, measurements and contrast.
  - It uses plain English, with no code terms.
- **Success check before the push:**
  - typecheck is clean, and the PWA builds;
  - no harness file is in the repo, and the work folder's `harness/` is deleted;
  - language and theme are back to French / light.

## Standing decisions (Islam, command 60). Apply them; do not ask again
Every entry in `.claude/design-known-divergences.md` stands. Never report anything
listed there.
1. **One page title.** The topbar shows it and there is no visible in-page title. The
   page keeps exactly one h1, visually hidden, as Planning (`Schedule.tsx:62`) and
   Notes (`Grades.tsx:68`) do, through `styles.srOnly`.
   - Today `Attendance.tsx:62` renders a VISIBLE 24px/800 `<h1 className={styles.heading}>`.
     That breaks this decision.
2. **Subject colours.** Wherever a subject is coloured, use `pwa/lib/subject-colors.ts`.
   Never colour a subject by type or position.
   - The ok / near / below band colours describe a status, not a subject, so they are
     not subject colours.
   - This decision does NOT mean adding subject colour where the prototype has none;
     that would be ASK.
3. **Switches.** A switch that looks like the prototype's `.segmented` uses the compact
   34px variant, `SegmentedControl size="compact"`, as `ScheduleView.tsx:141` does.
   - Today the absences filter (`AttendanceView.tsx:153`) uses the regular size.
4. **Cards.** Cards use the dashboard card style: 20px padding, `--r-lg`, 1px `--hair`,
   `--shadow-card`, headings 14px/700 with 14px below. The exception is where the
   prototype clearly specifies otherwise for this screen.
   - The prototype HAS a green hero here (`#pres-hero`, `.hero-jade`, prototype line
     792). So it uses the Notes/dashboard hero: tokens `--hero-card-bg`, `--hero-ink`
     and `--hero-badge` (`pwa/app/globals.css`), with text kept out of the depth
     circle.
   - Today the hero is a white card with a ring (`.hero`, `attendance.module.css:41`).
5. **Breathing room.** A heading sits at least 14px above the next element. Nothing
   touches lines, headers or other cards. Content inside a row is inset.
6. **Shadows.** No shadow is cut off by a neighbouring element or a parent's overflow.
   On Notes, the hero's shadow was clipped by the table card.
7. **Missing data is never 0.** Use the existing "no figure" wording. `absencesLeft:
   null` renders nothing, never "0" (`lib/api-types.ts:199`).
8. **Wording.** The attendance card and the screen title stay "Présence". Status and
   mention words are the dashboard's (the `dashboard.attendance.*` keys); no new words.
9. **Nothing is removed.** The PWA keeps every feature and data field it already has.
   Changes are visual only, unless something is broken.
10. **Finished screens.** Topbar, sidebar, dashboard, Planning and Notes are finished.
    Don't touch them, except shared code with no visual change there.

## Classification (Islam's rules, verbatim from command 60)
**FIX** (the team does it):
- size, spacing, alignment, typography or colour differs from the prototype, and no
  standing decision says otherwise;
- anything touching, overlapping, cut off, clipped (shadows included) or misaligned;
- anything repeated;
- any button, tab or link that does nothing;
- inconsistent with Planning, Notes or the dashboard;
- text under 4.5:1 contrast, or icons and borders under 3:1;
- a missing screen state: loaded, loading, empty, error, offline, session expired;
- Arabic not mirrored, or dark theme broken.

**ASK** (do not change; list it for Islam):
- the prototype shows something the PWA doesn't have, or the reverse;
- following the prototype would remove or hide something the PWA has;
- layout or look choices where both versions are reasonable;
- wording changes;
- anything that needs a backend, API or database change.

If one difference fits both lists, it is ASK.

## Hard rules for every agent
- **No real accounts.** Never log in to a real account, and never point the harness at
  a real backend.
- **One browser.** Use ONE tab and at most ONE copy of the app at a time. The app
  rotates the sign-in token on load, so parallel copies sign Islam out.
- **Harness files.** Harness and test files live only in the work folder. They are
  never committed, and they are deleted at the end (milestone 11).
- **No new scope.** No new dependency in `pwa/package.json`. No backend, API or schema
  change. No locale change (`pwa/locales/*` is in no milestone's Paths): a fix that
  needs new words becomes an ASK item.
- **Divergence file.** Agents cannot write `.claude/design-known-divergences.md`. The
  runner only allows `.claude/missions/`, and the Notes pass hit this guard. So every
  intentional difference goes as a ready-to-paste row into this mission's
  `DIVERGENCES.md`, in the file's format ("Product owner, 2026-11-21", or "Code wins,
  2026-11-21" with the measured ratio). Islam adds the rows. Never try to get around
  the guard.
- **Browser failure.** If the headless browser crashes or shows a blank page twice in a
  row, stop browser work. Finish what can be done in code, record it under "Couldn't
  check", and do not loop.
- **Scope limit.** This one screen only. If FIX grows past roughly 25 items, or a fix
  needs a file outside its milestone's Paths, stop and tell the Lead. The Lead tells
  Islam before going on.
- **Commits.** One logical group per commit, so any one commit can be reverted alone.
  Messages are `fix(pwa): …`, with the F ids in the body.

## Verified facts (planner, 2026-11-21, from the code at origin/develop 26d1c89)
### The screen
- `Attendance.tsx` owns these states:
  - loading: the skeleton, through Grades' `StateLayers`;
  - error, with a retry;
  - offline, with no cache;
  - "nothing recorded" (`overall` null, `percentage` null or `total` 0).
  Session expired is the shell's modal. `AttendanceView` adds two list empties: none at
  all, and none to justify.
- `AttendanceView` renders, top to bottom:
  - `Hero`: `PresenceRing` plus label, figure, sessions line, threshold line and counts;
  - `SubjectBreakdown`: an h2 "Par matière", a threshold note, and one shadowed card
    per subject with a bar and a threshold mark;
  - an "Absences" section: an h2, the regular `SegmentedControl`, a crossfaded
    `AbsenceList` (one shadowed card per row: icon, subject + code, date, chip,
    chevron) and a live count line;
  - the shared `SlidePanel` holding `JustificationPanel`. Its sub-states are none
    (with the upload form), expired, pending, approved, excused and rejected.
- The sections are bare `<section>`s with 16px h2 titles. None of them is a card.
- The default filter is `'all'` (`AttendanceView.tsx:59`). The prototype's default is
  "À justifier".
- **Shared files. Do not change their behaviour.**
  - `model.ts` is imported by the dashboard (`AttendanceCard.tsx:4`, `attendanceLine`).
  - `useReducedMotion.ts` is imported by News.
  - `StateLayers` (grades), `Crossfade` (schedule), `SegmentedControl`, `SlidePanel`
    and `Interpolated` belong to finished screens.
- **Endpoints.**
  - `GET /student/attendance` (`api-client.ts:387`) is cached offline and
    contract-checked by `lib/attendance-contract.ts`.
  - `POST /student/attendance/:id/justification` sends multipart data, with the field
    name `justification` (`api-client.ts:469`).

### The prototype (`design/spec-pack/specs/pwa/prototype-v1/…v1.html`)
- **Layout.** The view uses `data-attend-layout="b"` (lines 773-788): a column of hero,
  then a card. In layout b the ring is scaled 1.15 with a 32px gap, and
  `.hj-breakdown` is shown.
- **Hero** (`#pres-hero`, CSS lines 404-421):
  - a 96px white ring with the percentage inside;
  - "Taux de présence" in uppercase;
  - a status pill "Régulier";
  - "12 absences sur 90 séances";
  - a breakdown of counts at the end: Validées / Limite / À risque.
- **Par matière** is a `.card` with an h3 and a `data-table`: Matière, Présences, Taux,
  Absences restantes.
  - At every width the table is what shows. `#attend-cards` and `#attend-subject-list`
    both carry inline `display:none` and are never switched on.
  - The `.attend-subject` row CSS (lines 454-469) is unused in layout b.
- **Mes absences** is a `.card` with a `.card-head`: the h3 plus a `.segmented` "À
  justifier / Tout".
  - Its rows are `.absence-row` (lines 334-339): a 46px date tile, the subject at
    13.5/700, and a `pill-status`, with hairlines between rows.
  - The empty text is centred 13px.
- **`#justify-panel`** (lines 961-964, JS lines 1311-1333):
  - head: the subject as title and the date as subtitle;
  - the body depends on the status: a dropzone, three quick chips, a note textarea and
    a progress bar; or a doc-chip and the note; or an errcard;
  - foot: an "Envoyer" button, hidden for pending and approved.
- **Spec §9 (Attendance).** The ring fill-on-load is the hero moment. Filtering
  crossfades the list. The panel's sub-states switch with no transition.
  - §5 covers the ring animation: once per session.
  - §3 covers the dropzone states.
  - §10 says submit is disabled offline, labelled "Connexion requise".

### Found while planning (Design confirms with numbers)
- **Probably FIX.** Each one names the rule it falls under. The Lead's sorting is
  provisional, and Design's measurements decide.
  - P1, the visible h1: decision 1.
  - P2, the regular filter switch: decision 3.
  - P3, the white hero against the prototype's green hero: decision 4.
  - P4, the sections are not cards (bare sections, 16px titles): decision 4 and the
    prototype's `.card` + h3.
  - P5, every subject and absence row is a separate shadowed card, where the prototype
    has hairline-divided rows inside one card. Check decision 6 (shadows touching) as
    well.
  - P6, any band colour on the new green hero under 4.5:1.
- **Probably ASK.**
  - A, Par matière as a table (prototype) against our bar list. Our list has the code,
    the bar, the threshold mark and the "Encore n absences" flag.
  - B, the hero breakdown counts (Validées / Limite / À risque) and the "Régulier"
    pill. The PWA has neither, and no words for them.
  - C, the 46px date tile against our icon + date line.
  - D, the quick-reason chips, which the PWA doesn't have.
  - E, the default filter "À justifier" against "Tout".
  - F, the "Envoyer" button in a panel footer against ours inside the form.
  - G, status chip words: prototype "Approuvée / Rejetée", ours "Justifiée / Refusée".
- **Backend-shaped (ASK, cannot be fixed here).** The server sends a subject's
  percentage as `0` when no session hours can be resolved
  (`backend/src/routes/student.ts:696`, `truncatedPercentage(hours) ?? 0`). That shows
  a real "0%" for what is missing data, which breaks decision 7. The PWA cannot tell
  this apart from a true 0. It needs an API change, so it goes on the list for Islam.

## Work folder (outside the repo, never committed)
`/home/agents/rooms/unipocket/reports/pwa-attendance-pass/`
- `harness/`: start from a COPY of `../pwa-grades-pass/harness/` (Playwright with
  `page.route()` fixtures, `npm run dev` in `pwa/` with no backend). Replace the grades
  fixtures with attendance ones.
- `INVENTORY.md`.
- `shots/`, named `<who>-<width>-<lang>-<theme>-<state>.png`, where `who` is `ours`,
  `proto` or `side`.
- `shots/before/`: taken before the Builder's first commit.

FIX.md, ASK.md and DIVERGENCES.md are planning notes. They live in the mission folder,
so the Builder can read them from the branch.

## Branch mechanics
Islam asked for `feature/pwa-attendance-pass`. The push helper accepts only
`agent/lead/*`, so the branch is `agent/lead/pwa-attendance-pass`, the same as the
Notes pass.

All worktrees share one repo, so the branch can be checked out in only one of them at
a time. Whoever commits checks it out, commits, and returns to their own base branch
before handing off.

## Milestones
Every milestone appends a dated section to PROGRESS.md: what was done, and the commit
id. For any code change, it also records the output of `npm run typecheck` and
`npm run build`, run in `pwa/`. There is no CI job for `pwa/`, so this is its only
compile check.

### 1. Harness and "before" shots (Design)
- Goal: our `/attendance` and the prototype's Présence view both render headless from
  fixtures, with no login and no repo change, in every state and every panel sub-state.
  The "before" set is saved.
- Paths: `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md` only.
  Everything else goes in the work folder.
- Fixtures must cover:
  - bands ok, near and below;
  - an ended semester (`absencesLeft: null`, overall and per subject);
  - `partial > 0`;
  - at least six subjects, with long French and Arabic names;
  - absences in each of none, expired, pending, approved, excused (approved with no
    document) and rejected, with and without a note;
  - more than eight absences;
  - a semester with no absences at all;
  - "nothing recorded" (`overall: null`).
  The response must pass `lib/attendance-contract.ts`, or the screen lands in its
  error state.
- States: loaded, loading (a delayed response), the empties, error (a 500), offline
  (`context.setOffline` with no cache), and session expired (a 401, then a failed
  refresh).
- Panel: open on each sub-state. On "none", also:
  - a file chosen;
  - a rejected file type;
  - uploading (a delayed POST);
  - success;
  - the submit while offline.
- Done when: one command in the README produces the full PNG set, and
  `shots/before/` holds 1280 FR light for every state and every panel sub-state.
  `git status` in the worktree shows only PROGRESS.md.

### 2. Inventory and classification (Design)
- Goal: every visible element of both screens, panel included, is written down top to
  bottom, at 1280, 800 and 400px, FR light. Each one has its measured box, its spacing
  to its neighbours, its font size and weight, and its colour (the token name where one
  matches). Every difference sits on exactly one list.
- Paths:
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/ASK.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
  - work folder: `INVENTORY.md`
- Rules:
  - Measure with `getBoundingClientRect` and `getComputedStyle`. Do not eyeball.
  - Also sweep the rules that are not prototype comparisons:
    - contrast of every text and icon colour on its real background;
    - shadow clipping;
    - consistency with Planning, Notes and the dashboard (cards, switch, state boxes,
      the hero);
    - Arabic mirroring and the dark theme, at 1280 and 400.
  - Confirm or reject each of P1-P6 and A-G above, with numbers.
  - FIX items are F1, F2, … Each gives the element, ours against the target (numbers),
    the rule or prototype line behind it, and its owning milestone (3-8).
  - ASK items are A1, A2, … Each gives the difference in one sentence, 2 or 3 options
    in plain words, and a recommendation with a one-line reason. Rank them, most
    important first.
- Done when: every differing INVENTORY row maps to one F or A id, every F id names its
  milestone, and the F count is under the scope limit.

### 3. Page title and filter switch (Builder)
- Goal: the visible h1 is gone, and exactly one visually hidden h1 remains. The
  absences filter is `SegmentedControl size="compact"`. Behaviour is unchanged: the
  tablist, the arrow keys, the `aria-controls` panel and the crossfade.
- Paths:
  - `pwa/components/attendance/Attendance.tsx`
  - `pwa/components/attendance/AttendanceView.tsx`
  - `pwa/components/attendance/skeletons.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- Done when:
  - at 1280, 800 and 400, FR and AR, there is exactly one `h1`, and its box is not
    visible;
  - the strip measures the same height as `/schedule`'s compact strip;
  - the skeleton no longer reserves the old title's height, so the loaded content does
    not jump.

### 4. Green hero (Builder)
- Goal: the hero follows decision 4 (the Notes/dashboard hero tokens, the depth
  circle, text kept out of the circle) with the prototype's measures (padding 22px,
  radius, ring size and gap).
  - Every data line the hero has today stays: figure, sessions, threshold sentence with
    its icon, absences, justified, partial.
  - The ring still animates once, and respects reduced motion.
- Paths:
  - `pwa/components/attendance/Hero.tsx`
  - `pwa/components/attendance/PresenceRing.tsx`
  - `pwa/components/attendance/skeletons.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/DIVERGENCES.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- Notes:
  - Band warning and danger must stay readable on the green: text ≥ 4.5:1 and icons
    ≥ 3:1, measured in both themes.
  - If no existing token reaches that, do NOT invent a colour. Make it an A item, and
    keep the band said in words and icon.
  - Do not import `grades.module.css`. Use the tokens.
  - The hero's shadow must not be clipped by the card below it (decision 6).
- Done when: FIX.md's targets for each owned F id measure right at the three widths,
  in light and dark, for the ok, near, below and ended fixtures. The contrast numbers
  are written in PROGRESS.md.

### 5. "Par matière" card (Builder)
- Goal: the per-subject section is one dashboard-style card with a 14px/700 heading.
  The subjects are rows inside it, inset and separated by hairlines, instead of
  separate shadowed cards. Bars, threshold marks, codes and flags all stay.
  `absencesLeft: null` renders nothing.
- Paths:
  - `pwa/components/attendance/SubjectBreakdown.tsx`
  - `pwa/components/attendance/skeletons.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/DIVERGENCES.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- Not here: the table question (A). Only if Design's FIX.md confirms P4/P5 as FIX does
  this milestone change structure. Otherwise it fixes spacing only.
- Done when: at 400 no text is clipped (`scrollWidth <= clientWidth`), nothing touches,
  and the ended-semester fixture shows no "0".

### 6. "Absences" card and rows (Builder)
- Goal: the absences section is one dashboard-style card. Its head (heading and
  compact switch) is on one line where it fits, with no wrap jump at 400. Rows sit
  inside it, hairline-divided and inset, with a hover response. The empties and the
  count line are spaced per decision 5.
  - Every row stays a button, opens its panel, and keeps its icon, code, date, chip
    and chevron.
- Paths:
  - `pwa/components/attendance/AttendanceView.tsx`
  - `pwa/components/attendance/AbsenceList.tsx`
  - `pwa/components/attendance/AbsenceDate.tsx`
  - `pwa/components/attendance/skeletons.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/DIVERGENCES.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- Not here: the default filter (E), the date tile (C) and the chip words (G), which
  are all ASK.
- Done when:
  - with more than eight absences, nothing clips or touches at 400, FR and AR;
  - the chip contrast is ≥ 4.5:1 in both themes;
  - the keyboard focus ring on a row is fully visible, not clipped by the card.

### 7. Justification panel (Builder)
- Goal: inside the shared `SlidePanel`, every sub-state matches the prototype's
  `#justify-panel` measures, or a standing decision: banner, note, document link,
  dropzone (idle, dragging, error, busy), progress, submit, disabled offline submit.
  Nothing touches or clips at 400, FR and AR. No control is dead.
- Paths:
  - `pwa/components/attendance/JustificationPanel.tsx`
  - `pwa/components/attendance/JustificationForm.tsx`
  - `pwa/components/attendance/icons.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/DIVERGENCES.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- Not here:
  - `pwa/components/panel/` (shared). A fault inside SlidePanel becomes an A item.
  - `upload.ts`: no change to validation or the request.
  - The quick chips (D) and the footer button (F), which are ASK.
- Done when: each sub-state fixture renders with the owned F ids measuring right.
  Escape and the close button both close the panel, and focus returns to the row that
  opened it.

### 8. Missing states, Arabic and dark leftovers (Builder), only if FIX.md names any
- Goal: each F id that milestones 3-7 do not own is fixed: state boxes, empties,
  mirroring, dark theme. Each uses existing copy and the screen's existing state-box
  pattern.
- Paths:
  - `pwa/components/attendance/Attendance.tsx`
  - `pwa/components/attendance/skeletons.tsx`
  - `pwa/components/attendance/attendance.module.css`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/FIX.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- Done when: each owned F id has a harness shot at 1280 and 400. If none is owned,
  PROGRESS.md records "not needed".

### 9. QA pass (Reviewer)
- Goal: an independent check of the exact final commit, before Islam sees anything.
- Paths:
  - `.claude/missions/2026-11-21-pwa-attendance-pass/QA.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
  - work folder: `shots/qa/`
- Checks:
  - Run the harness at 1280, 800 and 400, in FR and AR, light and dark, for every
    state and every panel sub-state.
  - Run the upload flow: choose a file, send it, see success, and see the row's chip
    become "En attente" without a reload. Also test a bad file type, and the submit
    while offline.
  - Check every F id: pass or fail, with the measured number.
  - Record contrast, light and dark, for every colour the branch changed.
  - Exactly one `h1`. No clipped shadow. No "0" for missing data.
  - `npm run typecheck` and `npm run build` in `pwa/` both pass.
  - `git diff origin/develop --stat` touches only the Paths above. The dashboard,
    `model.ts`, `useReducedMotion.ts`, `segmented/`, `panel/`, `schedule/`, `grades/`,
    the locales, `package.json` and the backend are all untouched, and no harness file
    is committed.
- Done when: every F id passes, and the verdict is recorded against the exact commit
  id. A fail goes back to the Builder with its F id and number.

### 10. Screenshots: DROPPED in r2 (Islam: no screenshots needed)
Kept below for the record only.
- Goal: Islam's set in `shots/final/`, taken from the passed commit.
- Paths: `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md` only.
- The set:
  - side by side, ours and the prototype, at 1280, 800 and 400 (FR light);
  - ours at 1280, FR dark and AR light;
  - the panel at 1280, ours next to the prototype, for "none" and "rejected";
  - before and after at 1280.
- Done when: PROGRESS.md lists every path.

### 11. Report, cleanup and push request (Lead)
- Goal: Islam gets the report in chat, and one push request carrying the same report.
- Paths:
  - `.claude/missions/2026-11-21-pwa-attendance-pass/REPORT.md`
  - `.claude/missions/2026-11-21-pwa-attendance-pass/PROGRESS.md`
- The report, in plain words:
  - Fixed;
  - Needs your decision: at most 5 items, each with options and a recommendation;
  - Smaller decisions for later;
  - Divergence rows for you to add (from DIVERGENCES.md);
  - Couldn't check;
  - Details for review.
- Cleanup: delete the work folder's `harness/`. The shots and the inventory stay.
- Done when:
  - the r2 success check passes;
  - the report is sent in chat;
  - the push request for `agent/lead/pwa-attendance-pass` into `develop` is filed, with
    the report as its description.

## Flags
- **Branch name.** Islam asked for `feature/pwa-attendance-pass`. The push helper only
  accepts `agent/lead/*`, so the branch is `agent/lead/pwa-attendance-pass`.
- **Divergence rows.** The guard blocks agents from
  `.claude/design-known-divergences.md`. Rows are collected in DIVERGENCES.md for
  Islam to add. The Notes pass's rows 1-4 (its F14) may also still be waiting. The
  Lead checks this and mentions it in the report.
- **Subject percentage 0 from the server** (`student.ts:696`, `?? 0`). Missing data
  arrives as 0%, which breaks decision 7, and only an API change can fix it. This is
  for Islam, as a separate backend task.
- **Prototype words the PWA lacks.** "Taux de présence", "Régulier", "Validées /
  Limite / À risque", "Mes absences", the quick chips, "Envoyer". Copy is a product
  decision. None is added. Each becomes an ASK item, or is covered by decision 8.
- **Truncated brief.** The message stops at "(pro…". Anything Islam wrote after that is
  not in this plan.

## Schema
No.
