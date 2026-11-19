# PWA Notes screen (/grades): first-pass design review, end to end

## Goal
The PWA Notes screen (`/grades`) and its grade calculator panel have been measured
against the prototype's `view-grades` and `#calc-panel` at 1280, 800 and 400px. The
measurements were taken in French, light theme, with realistic sample data. Every
objective visual fault is fixed on ONE branch, `agent/lead/pwa-grades-pass`, which goes
out as ONE push request: things touching, overlapping, cut off, misaligned or repeated;
dead controls; size, spacing, type or colour that differs from the prototype with no
standing decision against it. A reviewer has re-measured every fix. What remains for
Islam is a short DECIDE list of product and taste questions, and nothing he has to
point at.

## Product
pwa

## Standing decisions (from Islam, command 29). Apply them; do not ask again
Every entry in `.claude/design-known-divergences.md` stands as well. Never report
anything listed there.
1. One page title. The topbar shows it. There is no visible in-page title. The page
   keeps exactly one h1, visually hidden, as Planning does (PR #16,
   `pwa/components/schedule/Schedule.tsx:62`, `styles.srOnly`).
2. Subject colours: wherever a subject is coloured, use `pwa/lib/subject-colors.ts`.
   Never colour by type or position. This does NOT mean adding colour where the
   prototype has none; that would be a taste call for the DECIDE list.
3. A switch that looks like the prototype's `.segmented` uses the compact 34px variant,
   `SegmentedControl size="compact"` (`pwa/components/segmented/`).
4. Cards use the dashboard card style: 20px padding, `--r-lg`, 1px `--hair`,
   `--shadow-card`, headings 14px/700 with 14px below. The exception is where the
   prototype clearly specifies otherwise for this screen.
5. Breathing room. A heading sits at least 14px above the next element. Cards never
   touch lines, headers or each other. Content inside a row slot is inset.
6. A grade that does not exist is never shown as 0. Use the existing wording,
   `grades.*.pending` = "non publiée" / "En attente" (`pwa/locales/fr.json:232,238`).
7. Every feature and data field stays. Changes are visual only, unless something is
   broken. A missing screen state counts as broken.
8. Topbar, sidebar and dashboard are finished. Do not touch them.
9. Do not touch the 0.4 / 0.6 weighting (`pwa/components/grades/calculator.ts`).

## Verified facts (planner, 2026-11-19)
- **Tools.** Playwright is installed globally, outside the repo, at
  `/home/agents/.nvm/versions/node/v26.13.1/lib/node_modules/playwright`. Chromium
  159.0.8154.6 launches headless. Nothing is added to `pwa/package.json`.
- **How to render without logging in.** Nothing gates the session on the server. There
  is no `pwa/middleware.ts`, and `(app)/layout.tsx` only wraps `AppShell`. The browser
  reaches only same-origin `/api/auth/*` and `/api/backend/*`
  (`pwa/lib/api-client.ts`). So the harness runs `npm run dev` in `pwa/` with no
  backend configured. Playwright's `page.route()` then answers `/api/auth/refresh` and
  `/api/backend/**` with fixture JSON. No repo file is stubbed and no real account is
  touched.
  - The guard blocks agents from reading `pwa/lib/auth-token.ts`. Infer the refresh
    response shape from `pwa/app/api/auth/refresh/route.ts` and `pwa/lib/api-types.ts`.
    If that is not enough, mark milestone 1 blocked and say so.
- **Endpoints the screen calls.** `GET /student/grades` and
  `GET /student/grades?allSemesters=true`, together on open (`Grades.tsx:28`). Then
  `GET /student/grades?semesterId=…` for each other tab
  (`useSemesterDetail.ts`). The shell also calls its own endpoints (profile,
  notifications); stub them with minimal valid bodies.
- **Today's screen.**
  - `Grades.tsx:62` renders a VISIBLE `<h1 className={styles.heading}>`. That breaks
    standing decision 1.
  - `SemesterTabs.tsx` is its own tablist, not `SegmentedControl`. Both already
    implement the same §10 tablist and keyboard contract.
  - The calculator opens in the shared `SlidePanel` (`pwa/components/panel/`), which
    schedule and attendance also use.
- **What the prototype shows.**
  - The head (`grades-head`) has a `.segmented` S1/S2 switch and two `.btn-ghost`
    buttons: "Calculatrice" and "Exporter PDF".
  - Then a `grid-cards` row: the jade GPA hero (`span-2`) and an "Historique GPA" card
    with a line chart.
  - Then a `.card` holding a sortable `data-table`: Matière, CC, CF, NF, Coef, Crédits,
    Statut pill. Under a breakpoint the table becomes `subject-card`s.
  - The calculator is `#calc-panel` (lines 944-958): a subject select, the current CC
    in a read-only row, a target input, a "Calculer" button and a result block.
  - Prototype CSS lives at lines 324-331 and 447-452 of the prototype HTML. Section 9
    of the Interaction Spec covers this screen; sections 3, 5 and 10 cover global
    rules.
- **Branch mechanics.** All worktrees share one repo, so a branch can be checked out in
  only one of them at a time. The lead commits this plan on `agent/lead/pwa-grades-pass`
  and then returns its own worktree to `agent/lead/base`. Every agent that commits
  checks out this branch, commits, and returns to its own base branch before handing
  off. No `agent/builder/*` branch is used: Islam asked for one branch and one push, and
  the push helper accepts only `agent/lead/*`.

## Milestones
Every milestone appends a dated section to PROGRESS.md: what was done, the commit id,
and for any code change the output of `npm run typecheck` and `npm run build` run in
`pwa/`. `pwa/` has no CI job, so this is the only compile check it gets.

Screenshots go to `/tmp/pwa-grades-pass/`, never into the repo.

### 1. Harness (Design)
- Goal: our `/grades` and the prototype's Notes view both render headless at 1280, 800
  and 400px, in FR light, from fixtures, with no login and no change to repo code.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/harness/**`: the Playwright script,
    the fixtures and a README saying how to run it
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Fixtures must cover:
  - at least three semesters, so the switch has more than two options, plus one
    single-semester case;
  - at least six subjects, including long French names and Arabic names
    (`nameAr`/`subject_name_ar` as the API types define them);
  - published, partly published (CC only) and wholly unpublished grades, and a
    semester with a null GPA;
  - a semester with no rows.
- States, each simulated by the route handler:
  - loading (delayed response)
  - error (500 on the bundle, and 500 on a single semester tab)
  - offline (context `setOffline`, no cache)
  - empty
  - calculator open, both with a subject that has CC and one without
- Done when: a reviewer runs the README's one command and gets the PNG set for every
  width × state, for our screen and the prototype. `git diff develop --stat` shows
  nothing outside the mission folder.

### 2. Inventory and classification (Design)
- Goal: every visible element of both screens is written down top to bottom, with
  measured box size, spacing to its neighbours, font size and weight, and colour (token
  name where one matches), at all three widths. The calculator panel is included.
  Every difference sits on exactly one of two lists.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/INVENTORY.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/DECIDE.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Rules:
  - Measure with `getBoundingClientRect` and `getComputedStyle` in the harness. Do not
    eyeball.
  - FIX items get ids F1, F2, … Each one states the element, ours vs prototype (numbers),
    which standing decision or prototype line backs it, and which of milestones 3-7 owns
    it.
  - DECIDE items get ids D1, D2, … Each one is a question Islam can answer in one line,
    with the options.
  - Nothing already in `.claude/design-known-divergences.md` appears on either list.
  - A difference that would need new user-facing copy is always DECIDE, never FIX.
- Done when: every row in INVENTORY.md that differs maps to exactly one F or D id, and
  every F id names its owning milestone.

### 3. Page title and semester switch (Builder)
- Goal: the visible in-page title is gone, one visually hidden h1 remains, and the
  semester switch has the compact 34px segmented look. Behaviour stays the same:
  tablist roles, arrow keys, `aria-controls` to `grades-panel`, and the selected tab
  surviving a reconnect.
- Paths:
  - `pwa/components/grades/Grades.tsx`
  - `pwa/components/grades/SemesterTabs.tsx`
  - `pwa/components/grades/skeletons.tsx`
  - `pwa/components/grades/grades.module.css`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Notes:
  - Reuse `SegmentedControl size="compact"` if it can take the semester ids/labels and
    the panel id without modification. If it would need changes, restyle SemesterTabs
    to the same measurements instead, and record that in PROGRESS.md.
    `pwa/components/segmented/` is NOT in Paths, because Planning uses it.
  - With many semesters at 400px the strip must not be cut off or wrap into a mess. If
    the prototype says nothing about overflow, use horizontal scroll inside the strip
    and log it as a D item for Islam to confirm.
  - The skeleton mirrors the new layout: no title block, a 34px strip.
- Done when: at all three widths, FR and AR, the page has exactly one `h1` and it is
  not visible. The strip measures 34px per option plus the 3px track, as on `/schedule`.
  Arrow keys still move the selection. Every F id this milestone owns is checked off in
  FIX.md.

### 4. Hero, cards and spacing (Builder)
- Goal: the GPA hero and every card follow standing decision 4 or the prototype, with
  the breathing room of decision 5 between head, hero, cards and table. Every F id this
  milestone owns is fixed.
- Paths:
  - `pwa/components/grades/GpaHero.tsx`
  - `pwa/components/grades/GpaRing.tsx`
  - `pwa/components/grades/GradesView.tsx`
  - `pwa/components/grades/grades.module.css`
  - `pwa/components/grades/skeletons.tsx`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Done when: the reviewer's measurements match FIX.md's targets for each owned F id at
  1280, 800 and 400px. No two cards, or a card and a heading or line, are closer than
  decision 5 allows.

### 5. Grades table and grade values (Builder)
- Goal: the table (and its narrow-width form) has no cut-off, overlapping or misaligned
  cells. No missing grade renders as 0. Arabic subject names render in the Arabic face,
  and numbers in the Latin face through `lib/bidi.tsx`. Every F id this milestone owns is
  fixed.
- Paths:
  - `pwa/components/grades/GradesTable.tsx`
  - `pwa/components/grades/model.ts`: display helpers only; no change to sorting
    semantics or to what is counted
  - `pwa/components/grades/useRowFlip.ts`
  - `pwa/components/grades/grades.module.css`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Done when: with the partly and wholly unpublished fixtures, no cell anywhere on the
  screen shows `0` or `0,00` for a grade the server sent as null. At 400px no text is
  clipped (`scrollWidth <= clientWidth` on every cell, or the table scrolls inside its
  card by design). Sorting still works on every sortable column.

### 6. Calculator panel (Builder)
- Goal: the calculator trigger and the panel body match the prototype's `#btn-calc` and
  `#calc-panel` measurements, or a standing decision, at all three widths. No control in
  it is dead: with no CC, the target field is disabled and says why with existing copy.
- Paths:
  - `pwa/components/grades/GradeCalculator.tsx`
  - `pwa/components/grades/icons.tsx`
  - `pwa/components/grades/grades.module.css`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Not in Paths: `calculator.ts` (decision 9) and `pwa/components/panel/` (shared with
  schedule and attendance). A fault inside SlidePanel itself goes on DECIDE as a
  separate follow-up. It is not fixed here.
- Done when: the panel opens, closes with Escape and the close button, and returns focus
  to the trigger. Its measurements match the owned F ids. Both fixture subjects, with
  and without CC, render without anything touching or cut off at 400px.

### 7. Missing screen states (Builder), only if FIX.md names any
- Goal: every state the inventory found missing renders: loading, empty, error, offline,
  single semester, and the calculator with no subjects. Each uses existing copy and the
  screen's existing `stateBox` pattern.
- Paths:
  - `pwa/components/grades/Grades.tsx`
  - `pwa/components/grades/GradesView.tsx`
  - `pwa/components/grades/StateLayers.tsx`
  - `pwa/components/grades/grades.module.css`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- A state that needs words the locale files do not already have is NOT built. It goes
  on DECIDE with the place the copy would appear. `pwa/locales/*` is deliberately not in
  Paths.
- Done when: each owned F id has a harness screenshot of the state at 1280 and 400px.
  If FIX.md names no missing state, this milestone is recorded as "not needed" in
  PROGRESS.md.

### 8. QA pass (Reviewer)
- Goal: an independent re-measure of the final commit. Every F id is verified fixed,
  nothing new is touching or cut off, Arabic is not broken, and the diff stays inside
  the declared Paths.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/QA.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Checks:
  - Run the harness on the exact commit at 1280, 800 and 400px, FR light (the full set),
    plus AR light at 1280 and 400, and FR dark at 1280. AR and dark are there to catch
    regressions. They do not widen the inventory.
  - For each F id: pass or fail, with the measured number.
  - `git diff develop --stat` contains only paths from milestones 1-8.
  - `npm run typecheck` and `npm run build` in `pwa/` both pass.
  - Exactly one `h1`. No topbar, sidebar or dashboard file is changed. `calculator.ts`
    is unchanged.
- Done when: QA.md lists every F id as pass, and the verdict is recorded against the
  exact commit id with the review command. A fail goes back to the Builder with the F id
  and the number.

### 9. Report and push request (Lead)
- Goal: Islam gets one short report and one push request.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/REPORT.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- REPORT.md has a summary of the inventory, the count of fixes with one line each, the
  DECIDE list verbatim, and which way the work was split: through the room's agents, or
  in one session.
- Done when: the reviewer's pass is on the final commit and the push request is filed
  for `agent/lead/pwa-grades-pass`.

## Flags
- **Islam's message was cut off.** It ends at "any button, tab or li…" inside the FIX
  criteria. This plan assumes the rest says "…link that does nothing" and that the
  workflow continues with fix, QA and report. Anything else in the missing part is
  unknown. Ask Islam to resend the tail.
- **"Exporter PDF" button.** It is in the prototype head, and the PWA has no PDF export.
  Building one is a feature, and leaving the button out is a product decision. Goes to
  DECIDE. Precedent: the schedule's print button was replaced, not built.
- **"Historique GPA" card.** It is in the prototype. Check whether the PWA has an
  equivalent. If not, adding one is a feature: DECIDE. Note feature-parity row D3: the
  app invents history points. Whatever the PWA does must not copy that.
- **Subject colours in the table.** The prototype does not colour subjects on this
  screen. Adding the subject palette here would be a taste call: DECIDE, not FIX.
- **Status pill wording and level thresholds** ("Validé", "Sous la moyenne",
  `lvl-risque`). These are copy and product rules. If ours differ from the prototype,
  DECIDE.
- **Divergence entries.** A fix where the code knowingly keeps a value against the
  prototype (an AA contrast reason, say) needs a row in
  `.claude/design-known-divergences.md`. That file is outside `.claude/missions/`, and
  the guard may block agents from it. Proposed rows go in DECIDE.md, and Islam (or a
  human) adds them.
- **Semester strip overflow at 400px.** See milestone 3. If the prototype is silent,
  the chosen behaviour is logged for confirmation.
- **Feature parity.** No milestone changes what the product can do. Decision 7 forbids
  it, and milestone 7 only adds missing states of an existing screen. So
  `.claude/feature-parity.md` is not in any Paths. If a fix turns out to need a
  capability change, stop and raise it.

## Schema
No.
