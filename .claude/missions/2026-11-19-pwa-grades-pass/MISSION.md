# PWA Notes screen (/grades): first-pass design review, end to end

## Goal
The PWA Notes screen (`/grades`) and its grade calculator panel have been measured
against the prototype's `view-grades` and `#calc-panel` at 1280, 800 and 400px. The
measurements were taken in French, light theme, with realistic sample data. Every
difference is accounted for in one of three ways:
- fixed, in small commits on ONE branch, `agent/lead/pwa-grades-pass`, which goes out
  as ONE push request;
- listed for Islam to decide;
- covered by a standing decision.

Nothing is silently left out. A reviewer has re-checked the result at three widths,
FR/AR, light/dark, all six states and the calculator. What is left for Islam is a
short decision list, and nothing he has to point at.

## Product
pwa

## Revision r2, 2026-11-19 (Islam's command 30, the tail of the brief)
This revision replaces r1 (e60f1bc). Changes:
- The FIX / ASK classification rules now come from Islam, verbatim. See "Classification".
- **No harness file is committed, ever.** The harness, the inventory and the screenshots
  all live in the work folder OUTSIDE the repo,
  `/home/agents/rooms/unipocket/reports/pwa-grades-pass/`. The harness is deleted at the
  end; the screenshots stay.
- The Builder records intentional differences from the prototype in
  `.claude/design-known-divergences.md` (product owner, 2026-11-19).
- The QA pass is widened: FR and AR, light and dark, six states including session
  expired, the calculator's keyboard round trip, and contrast numbers.
- New milestones for screenshots and for the report in Islam's format.
- Stop rules: browser failure, and scope growth.
- Islam's message was cut off again, after "7. One branch ag…". This plan reads it as
  "one branch `agent/lead/pwa-grades-pass`, one push request".

## Revision r3, 2026-11-19 (Lead, after milestones 1-2)
Design worked from r1, before r2 reached it. Its inventory and lists are good, and
they stand. Corrections:
- **Harness out of the repo.** r1 had the harness committed in the mission folder
  (fdb3105). Islam's rule is that harness files are never committed, so the branch was
  rebuilt without that commit. The harness is still in the object store as fdb3105:
  `git show fdb3105:.claude/missions/2026-11-19-pwa-grades-pass/harness/<file>`. Design
  restores it into the work folder's `harness/`, outside the repo, and every later run
  uses that copy. PROGRESS.md's milestone 1 entry still names the old in-repo path; the
  work folder copy replaces it.
- **Screenshot location.** The milestone 1-2 shots are in `/tmp/pwa-grades-pass/`, and
  they ARE the "before" set: no code had changed yet. Design copies the 1280 FR light
  set to the work folder's `shots/before/` before the Builder's first commit lands. If
  /tmp is gone by then, re-shoot from commit e60f1bc.
- **The question list is `DECIDE.md`** (ids D1-D16), not `ASK.md`. Read "ASK" anywhere
  in this plan as DECIDE.md.
- **D15 is not a question.** Islam ordered intentional differences to be recorded in
  `.claude/design-known-divergences.md`. D15 rows 1-4 are added by the Builder in the
  milestone that touches each element:
  - row 1, the `--ink2` labels: milestones 5 and 6;
  - row 2, the 44px hit areas: milestones 3 and 5;
  - row 3, the `--danger-ink` pill: milestone 5;
  - row 4, the extra copy: milestones 5 and 6.
  Row 5 depends on Islam's answers to D3 and D4, so it waits for them.
- **D9 (one-semester strip).** It is a dead control, so it is FIX by rule. But fixing it
  removes an element, and anything on both lists is DECIDE. So it stays DECIDE: no
  change until Islam answers.
- **Milestone 7 is not needed.** Every state renders (PROGRESS.md, milestone 2).
- **F3 root cause.** Design did not isolate it. The Builder finds the real cause (which
  element's min-content forces 989.5px) and records it in PROGRESS.md before changing
  anything. No `overflow: hidden` or fixed width to hide the symptom.
- **F6 hit area.** The web has no `hitSlop`. Keep the 34px box and extend the target
  with a transparent `::before` inset of -5px. Do not add padding.
- **Order.** 3 → 4 → 5 → 6, one or more commits each, all on
  `agent/lead/pwa-grades-pass`. Each commit message lists its F ids.

## Standing decisions (from Islam, command 29). Apply them; do not ask again
Every entry in `.claude/design-known-divergences.md` stands as well. Never report
anything listed there.
1. One page title. The topbar shows it. There is no visible in-page title. The page
   keeps exactly one h1, visually hidden, as Planning does (PR #16,
   `pwa/components/schedule/Schedule.tsx:62`, `styles.srOnly`).
2. Subject colours: wherever a subject is coloured, use `pwa/lib/subject-colors.ts`.
   Never colour by type or position. This does NOT mean adding colour where the
   prototype has none; that would be ASK.
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
8. Sidebar labels stay "Accueil" and "Planning". Topbar, sidebar and dashboard are
   finished. Do not touch them.
9. Do not touch the 0.4 / 0.6 weighting (`pwa/components/grades/calculator.ts`).

## Classification (Islam's rules, command 30)
**FIX** (the team does it):
- size, spacing, alignment, typography or colour differs from the prototype, and no
  standing decision says otherwise;
- anything touching, overlapping, cut off or misaligned;
- anything repeated (titles, labels, data);
- any button, tab or link that does nothing;
- inconsistent with Planning or the dashboard (the same element styled differently);
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
- Never log in to a real account. Never point the harness at a real backend.
- Harness and test files live only in the work folder. They are never committed, and
  they are deleted at the end (milestone 10). `git status` in every worktree shows
  nothing from the harness.
- No new dependency in `pwa/package.json`. No backend, API or schema change.
- **Browser failure.** If the headless browser crashes or shows a blank page twice in a
  row, stop browser work. Finish what can be done in code. Record it for "Couldn't
  check". Do not loop.
- **Scope.** This one screen only. If FIX grows past roughly 25 items, or a fix needs a
  file outside the Paths below, stop and tell the Lead. The Lead tells Islam before
  going on.
- One logical group per commit, so any one commit can be reverted alone. Messages are
  `fix(pwa): …` with the F ids in the body.

## Verified facts (planner, 2026-11-19)
- **Tools.** Playwright is installed globally, outside the repo, at
  `/home/agents/.nvm/versions/node/v26.13.1/lib/node_modules/playwright`. Chromium
  159.0.8154.6 launches headless.
- **How to render without logging in.** Nothing gates the session on the server. There
  is no `pwa/middleware.ts`, and `(app)/layout.tsx` only wraps `AppShell`. The browser
  reaches only same-origin `/api/auth/*` and `/api/backend/*`
  (`pwa/lib/api-client.ts`). So the harness runs `npm run dev` in `pwa/` with no
  backend configured. Playwright's `page.route()` then answers `/api/auth/refresh` and
  `/api/backend/**` with fixture JSON. Session expired is simulated by answering 401
  and then failing the refresh, which raises the shell's modal.
  - The guard blocks agents from reading `pwa/lib/auth-token.ts`. Infer the refresh
    response shape from `pwa/app/api/auth/refresh/route.ts` and `pwa/lib/api-types.ts`.
    If that is not enough, report blocked.
- **Endpoints the screen calls.** `GET /student/grades` and
  `GET /student/grades?allSemesters=true`, together on open (`Grades.tsx:28`). Then
  `GET /student/grades?semesterId=…` for each other tab (`useSemesterDetail.ts`). The
  shell's own endpoints (profile, notifications) get minimal valid bodies.
- **Today's screen.**
  - `Grades.tsx:62` renders a VISIBLE `<h1 className={styles.heading}>`. That breaks
    standing decision 1.
  - `SemesterTabs.tsx` is its own tablist, not `SegmentedControl`. Both implement the
    same §10 tablist and keyboard contract.
  - The calculator opens in the shared `SlidePanel` (`pwa/components/panel/`), which
    schedule and attendance also use.
- **What the prototype shows.**
  - The head (`grades-head`) has a `.segmented` S1/S2 switch and two `.btn-ghost`
    buttons: "Calculatrice" and "Exporter PDF".
  - Then a `grid-cards` row: the jade GPA hero (`span-2`) and an "Historique GPA" card
    with a line chart.
  - Then a `.card` holding a sortable `data-table`: Matière, CC, CF, NF, Coef, Crédits,
    Statut pill. At narrow widths the table becomes `subject-card`s.
  - The calculator is `#calc-panel` (lines 944-958): a subject select, the current CC
    in a read-only row, a target input, a "Calculer" button and a result block.
  - Prototype CSS lives at lines 324-331 and 447-452 of the prototype HTML. Section 9
    of the Interaction Spec covers this screen; sections 3, 5 and 10 cover global
    rules.
- **Branch mechanics.** All worktrees share one repo, so a branch can be checked out in
  only one of them at a time. Whoever commits checks out `agent/lead/pwa-grades-pass`,
  commits, and returns to their own base branch before handing off. No `agent/builder/*`
  branch is used: Islam asked for one branch and one push, and the push helper accepts
  only `agent/lead/*`. This r2 plan is commit-picked onto that branch by the first
  agent who next commits there.

## Work folder (outside the repo, never committed)
`/home/agents/rooms/unipocket/reports/pwa-grades-pass/`
- `harness/`: the Playwright script, the fixtures and a README. Deleted at the end.
- `INVENTORY.md`: the full inventory. Kept.
- `shots/`: every screenshot. Kept. Names follow `<who>-<width>-<lang>-<theme>-<state>.png`,
  with `who` = `ours` | `proto` | `side`.
- `shots/before/`: our screen at 1280 FR light, taken before any fix, in every state.

The FIX and ASK lists are planning notes and live in the mission folder, so the
Builder reads them from the branch.

## Milestones
Every milestone appends a dated section to PROGRESS.md: what was done and the commit
id. For any code change it also records the output of `npm run typecheck` and
`npm run build`, run in `pwa/`. `pwa/` has no CI job, so this is the only compile
check it gets.

### 1. Harness and "before" shots (Design)
- Goal: our `/grades` and the prototype's Notes view both render headless from fixtures,
  with no login and no repo change, in every state. The "before" set is saved.
- Paths (repo): `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md` only.
  Everything else goes in the work folder.
- Fixtures must cover:
  - at least three semesters, so the switch has more than two options, plus one
    single-semester case;
  - at least six subjects, including long French names and Arabic names;
  - published, partly published (CC only) and wholly unpublished grades, and a semester
    with a null GPA;
  - a semester with no rows.
- The six states, simulated inside the page by the route handler:
  - loaded;
  - loading (delayed response);
  - empty;
  - error (500 on the bundle, and 500 on one semester tab);
  - offline (`context.setOffline`, no cache);
  - session expired (401, then a failed refresh).
  Plus the calculator open, both for a subject with CC and one without.
- Done when: one README command produces the full PNG set into `shots/`, and
  `shots/before/` holds 1280 FR light for every state and the calculator.
  `git status` in the worktree is clean apart from PROGRESS.md.

### 2. Inventory and classification (Design)
- Goal: every visible element of both screens is written down top to bottom, with
  measured box size, spacing to its neighbours, font size and weight, and colour (token
  name where one matches), at 1280, 800 and 400px, FR light. The calculator panel is
  included. Every difference sits on exactly one list.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/ASK.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
  - work folder: `INVENTORY.md`
- Rules:
  - Measure with `getBoundingClientRect` and `getComputedStyle`. Do not eyeball.
  - Also sweep for the FIX rules that are not prototype comparisons:
    - contrast of every text and icon colour on its actual background;
    - consistency with `/schedule` and the dashboard: cards, segmented control, ghost
      buttons, state boxes;
    - Arabic mirroring and dark theme, at 1280 and 400.
  - FIX items are F1, F2, … Each one gives the element, ours vs target (numbers), the
    rule or prototype line that backs it, and its owning milestone (3-7).
  - ASK items are A1, A2, … Each one gives what differs in one sentence, two or three
    options in plain words, and a recommendation with a one-line reason. Rank them, most
    important first.
  - Nothing already in `.claude/design-known-divergences.md` appears on either list.
- Done when: every differing row in INVENTORY.md maps to one F or A id, every F id
  names its milestone, and the count is under the scope limit.

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
  - `.claude/design-known-divergences.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Notes:
  - Reuse `SegmentedControl size="compact"` if it can take the semester ids and labels
    and the panel id without modification. If it would need changes, restyle
    SemesterTabs to the same measurements instead, and say so in PROGRESS.md.
    `pwa/components/segmented/` is NOT in Paths, because Planning uses it.
  - With many semesters at 400px the strip must not be cut off. If the prototype is
    silent on overflow, scroll inside the strip and add an A item for Islam to confirm.
  - The skeleton mirrors the new layout.
- Done when: at all widths, FR and AR, there is exactly one `h1` and it is not visible.
  The strip matches `/schedule`'s compact strip in measured height. Arrow keys still
  move the selection. Every owned F id is ticked in FIX.md with its commit id.

### 4. Hero, cards and spacing (Builder)
- Goal: the GPA hero and every card follow standing decision 4 or the prototype, with
  decision 5's breathing room between head, hero, cards and table. Every owned F id is
  fixed.
- Paths:
  - `pwa/components/grades/GpaHero.tsx`
  - `pwa/components/grades/GpaRing.tsx`
  - `pwa/components/grades/GradesView.tsx`
  - `pwa/components/grades/grades.module.css`
  - `pwa/components/grades/skeletons.tsx`
  - `.claude/design-known-divergences.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Done when: measurements match FIX.md's targets for each owned F id at 1280, 800 and
  400px, in light and dark.

### 5. Grades table and grade values (Builder)
- Goal: the table, and its narrow-width form, has no cut-off, overlapping or misaligned
  cells. No missing grade renders as 0. Arabic subject names render in the Arabic face.
  Numbers are isolated through `lib/bidi.tsx`. Every owned F id is fixed.
- Paths:
  - `pwa/components/grades/GradesTable.tsx`
  - `pwa/components/grades/model.ts`: display helpers only; no change to sort semantics
    or to what is counted
  - `pwa/components/grades/useRowFlip.ts`
  - `pwa/components/grades/grades.module.css`
  - `.claude/design-known-divergences.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Done when:
  - With the partly and wholly unpublished fixtures, no grade the server sent as null
    shows as `0` or `0,00`.
  - At 400px no text is clipped. Either `scrollWidth <= clientWidth` on every cell, or
    the table scrolls inside its card on purpose.
  - Sorting still works on every sortable column.

### 6. Calculator panel (Builder)
- Goal: the calculator trigger and the panel body match the prototype's `#btn-calc`
  and `#calc-panel`, or a standing decision, at all widths. No control in it is dead.
  It opens, closes with Escape and with the close button, and focus returns to the
  trigger.
- Paths:
  - `pwa/components/grades/GradeCalculator.tsx`
  - `pwa/components/grades/icons.tsx`
  - `pwa/components/grades/grades.module.css`
  - `.claude/design-known-divergences.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- Not in Paths:
  - `calculator.ts` (decision 9);
  - `pwa/components/panel/`, shared with schedule and attendance. A fault inside
    SlidePanel itself becomes an A item, not a fix here.
- Done when: the owned F ids measure right. Both fixture subjects, with and without CC,
  render with nothing touching or cut off at 400px, FR and AR.

### 7. Missing screen states (Builder), only if FIX.md names any
- Goal: each of the six states renders, using existing copy and the screen's existing
  `stateBox` pattern. The six are loaded, loading, empty, error, offline, and session
  expired (the shell's modal over the screen).
- Paths:
  - `pwa/components/grades/Grades.tsx`
  - `pwa/components/grades/GradesView.tsx`
  - `pwa/components/grades/StateLayers.tsx`
  - `pwa/components/grades/grades.module.css`
  - `.claude/missions/2026-11-19-pwa-grades-pass/FIX.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- A state that needs words the locale files do not already have is NOT built. It
  becomes an A item. `pwa/locales/*` is deliberately not in Paths.
- Done when: each owned F id has a harness shot at 1280 and 400. If none is owned,
  PROGRESS.md records "not needed".

### Divergence rows (milestones 3-7)
Every fix that knowingly keeps a value different from the prototype adds a row to
`.claude/design-known-divergences.md` in that milestone's commit. The row follows the
file's format, says "Product owner, 2026-11-19" (or "Code wins, 2026-11-19" with the
measured ratio for contrast), and bumps "Last reviewed". If the guard blocks the edit,
report blocked to the Lead with the exact rows. Do not work around it.

### 8. QA pass (Reviewer)
- Goal: an independent check of the final commit, before Islam sees anything.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/QA.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
  - work folder: `shots/qa/`
- Checks:
  - Run the harness on the exact commit for 1280, 800 and 400 × FR, AR × light, dark ×
    the six states.
  - Calculator: open it, pick a subject, type a target, read the result, then close it
    with Escape and again with the close button. Focus returns to the trigger both
    times. Test with and without CC.
  - Nothing touching, cut off, overlapping or repeated. Every clickable thing does
    something.
  - Every F id: pass or fail, with the measured number.
  - A contrast ratio, light and dark, for every text colour the branch changed.
  - `npm run typecheck` and `npm run build` in `pwa/` both pass.
  - Exactly one `h1`. `git diff develop --stat` touches only the Paths above. No
    topbar, sidebar, dashboard, `segmented/`, `panel/`, `calculator.ts`, locale,
    `package.json` or backend file changed. No harness file committed.
- Done when: every F id passes and the verdict is recorded against the exact commit id.
  Any fail goes to the Builder with the F id and the number. Islam is not asked
  anything while a fail is open.

### 9. Screenshots (Design, after the QA pass)
- Goal: Islam's set, in `shots/final/` in the work folder, taken from the passed commit.
- Paths (repo): `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md` only.
- The set:
  - side by side, ours left and the prototype right: 1280, 800, 400 (FR light);
  - ours at 1280: FR dark, and AR light;
  - the calculator open at 1280, ours next to the prototype;
  - before and after at 1280 (FR light), from `shots/before/`.
- Done when: every file above exists, and PROGRESS.md lists each path.

### 10. Report, cleanup and push request (Lead)
- Goal: Islam gets the report in chat and one push request carrying the same report.
- Paths:
  - `.claude/missions/2026-11-19-pwa-grades-pass/REPORT.md`
  - `.claude/missions/2026-11-19-pwa-grades-pass/PROGRESS.md`
- The report, in plain English with no code terms and short sentences:
  - **Fixed**: one line per fix, as a student sees it.
  - **Needs your decision**: at most 5, numbered, from ASK.md's top 5. Each has the
    difference in one sentence, 2 or 3 options, and a recommendation with its reason in
    one line.
  - **Smaller decisions for later**: the rest of ASK, one line each.
  - **Couldn't check**: anything not verified, and why.
  - **How the work was split**: through the room's agents.
  - **Details for review**: commits, measurements, contrast numbers and screenshot
    paths.
- Cleanup: the work folder's `harness/` is deleted, and the cleanup is confirmed in
  PROGRESS.md. Shots and INVENTORY stay.
- Done when: the report is sent in chat, and the push request for
  `agent/lead/pwa-grades-pass` is filed with the report as its description.

## Flags
- **Islam's brief was cut off twice.** It ended after "any button, tab or li…" (command
  29) and after "7. One branch ag…" (command 30). The first gap is filled by command 30.
  The second is read as one branch and one push request.
- **Likely ASK items, so the Design agent expects them:**
  - **"Exporter PDF".** The prototype has it; the PWA has no PDF export. The precedent:
    the schedule's print button was replaced, not built.
  - **"Historique GPA" card.** If the PWA has no equivalent, adding one is a feature.
    Feature-parity row D3: the app invents history points; the PWA must not copy that.
  - **Subject colours in the table.** The prototype has none here.
  - **Status pill wording and thresholds.** These are wording and product rules.
- **Divergence file.** Islam asked for rows there. It is outside `.claude/missions/`,
  and the guard may block agents from it. If it does, the rows go into the report for
  Islam to add, and the Builder reports blocked rather than working around the guard.
- **Feature parity.** No milestone changes what the product can do (decision 7), so
  `.claude/feature-parity.md` is in no Paths. If a fix turns out to need a capability
  change, stop and raise it.

## Schema
No.
