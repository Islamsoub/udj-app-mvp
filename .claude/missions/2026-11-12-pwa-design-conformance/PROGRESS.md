# PROGRESS — pwa-design-conformance

## M0 — Capture harness and baseline (2026-11-12) — DONE, except 19 spec reference renders (see "Reference")

No branch, no PR, no file under `pwa/` touched (D2). Everything below is
untracked in the main checkout's mission folder.

### Worktree used
`C:/Users/urohe/Documents/udj-wt-dc-m0`, detached at `origin/develop`
**a783a08** (`git worktree add --detach`). `pwa/` installed with
`npm ci --legacy-peer-deps`; its `.next` is a build made by the harness with the
safe env. It has no `.env.local`. Left in place: it is the M1 "before" tree
(M1's base is origin/develop). Remove with `git worktree remove` when done.

### What was built
- `capture/capture.mjs` — one script, three subcommands:
  - `shoot` (default): builds and serves a `pwa/` (`--pwa`), or uses a running
    local server (`--base-url`), and captures screens × themes × langs × widths
    × scenarios, with optional click / hover / press / focus / scroll / hook.
    `--plan` runs several jobs in one server lifetime.
  - `reference`: serves `design/spec-pack` on 127.0.0.1 and renders the
    dashboard spec, the login source and prototype-v1's views; copies the
    pack's own PNGs under harness names.
  - `index`: writes the D6 `index.html` (before | after | pack screenshot |
    M0 spec render).
- `capture/fixtures/default/*.json`, `capture/fixtures/empty/*.json`,
  `capture/fixtures/assets/*` (two generated gradient PNGs for news heroes,
  two one-page PDFs for justification links).
- `capture/plans/baseline.json` — the M0 baseline as a plan.
- `capture/README.md` — build/serve/run commands, flags, fixture map.

D3 implemented as written: Chrome channel, Playwright from
`$PLAYWRIGHT_MODULE` or the npx cache (else it prints
`npx -y playwright@1.65.0 --version`), `serviceWorkers: 'block'`, theme/lang
cookies before first navigation, `clock.setFixedTime('2026-11-10T09:15:00+03:00')`
with `timezoneId: 'Africa/Djibouti'`, 1440×900 DPR 1, settle on
`document.fonts.ready` + every finite animation finished, `next build` +
`next start` (never `next dev`) with `NEXT_PUBLIC_API_URL=http://127.0.0.1:9
PWA_PROXY_SECRET=` in the process env, unanswered `/api/**` → 599 + non-zero
exit, other origins aborted (and fail the run for PWA pages).

### Command for milestone N
```sh
MISSION=C:/Users/urohe/documents/udj-app-mvp/.claude/missions/2026-11-12-pwa-design-conformance
# before: worktree at the base branch, before the first edit
node $MISSION/capture/capture.mjs --pwa <base worktree>/pwa --out $MISSION/screenshots/mN/before --screens <screens> [--widths 1440,834,390] [--scenario default,loading,...]
# after: milestone worktree
node $MISSION/capture/capture.mjs --pwa <milestone worktree>/pwa --out $MISSION/screenshots/mN/after --screens <same> [same flags]
node $MISSION/capture/capture.mjs index --dir $MISSION/screenshots/mN
```
Themes default to light,dark and langs to fr,ar, so each line covers all four
combinations. The command builds, starts on 127.0.0.1:3199, captures and stops
the server. Exit code 0 = every capture clean. Full flag list in
`capture/README.md`.

### Checks
- Grep of `capture/` for `scheme://host` other than localhost/127.0.0.1: none
  (the PNG and PDF assets contain no URL either). No `.env` file is read
  (`capture.mjs` only `existsSync`s `pwa/.env.local` to print a note). No
  credential: the access token is an unsigned fake JWT
  `{"studentId":"fixture-student"}`; the login scenarios type `UDJ-2024-0451`
  / `xxxxxxxx` into a form whose request the harness answers itself.
- Fail-closed: `--omit student-attendance.json` on the dashboard →
  `no fixture for GET /api/backend/student/attendance (student-attendance.json)`,
  `FAILURES:`, **exit 1**.
- Interaction flags verified on the dashboard: `--click` collapse button
  (collapsed rail), `--click '[aria-haspopup="menu"]'` (avatar menu, AR),
  `--hover`, `--focus` (ring visible), `--press` on a quick link.
- `pwa/` typecheck/build: `next build` ran clean twice from the harness
  (TypeScript step included). No `pwa/` file changed, so nothing else to check.

### Baseline — `screenshots/baseline/` (76 PNGs, + `index.html`)
All from origin/develop a783a08, run exit 0, no unanswered request.
- Every screen at 1440, light/dark × FR/AR, `default` (40): `login`,
  `dashboard`, `schedule-week`, `schedule-day`, `grades`, `attendance`, `news`,
  `news-article` (`/news?article=news-exams-s2`), `profile`, `offline-page`
  (`/offline.html`).
- `dashboard` at 834 and 390, four combinations (8).
- `dashboard` in `loading`, `empty`, `error`, `offline`, four combinations (16).
- `login` in `error-credentials`, `rate-limit`, `locked`, four combinations
  (12). See Flagged #1: `rate-limit` and `locked` show no error card.

Every fixture-backed screen renders populated. No card is stuck in its error
state.

### Reference — `screenshots/reference/`
- `reference/pack/` — 12 PNGs, the pack's own pwa-dashboard and pwa-login
  renders, copied under harness names. Complete.
- `reference/render/` — **97 of 116**. The run was stopped by Claude Code
  for low system memory (not a harness failure) and was not restarted, per
  that instruction. Present: all 24 dashboard-spec renders (light/dark × FR/AR ×
  1440/834/390, plain and `--collapsed`), the 12 login-source renders
  (`default` at 1440 and 390, `offline-switch` at 1440), and 61 of 72
  prototype-v1 views.
  **Missing (19):**
  - `login--{light,dark}--{fr,ar}--{error-credentials,rate-limit}.png` (8).
    These failed in that run because the sim buttons sit in the collapsed demo
    rail and Playwright refused to click them. Fixed afterwards (clicked
    through the DOM), not yet re-rendered. The pack's own
    `light-fr` error-credentials and rate-limit PNGs are in `reference/pack/`.
  - `{schedule-day,grades,attendance,news,profile}--dark--ar--834.png` and
    `{schedule-week,schedule-day,grades,attendance,news,profile}--dark--ar--390.png`
    (11), not reached.
  To finish, when memory allows (it also re-renders 3 existing files):
  ```sh
  node $MISSION/capture/capture.mjs reference --spec-pack C:/Users/urohe/Documents/udj-wt-dc-m0/design/spec-pack --out $MISSION/screenshots/reference --only "^login--.*--(error-credentials|rate-limit)\.png$|--dark--ar--(834|390)\.png$"
  node $MISSION/capture/capture.mjs index --dir $MISSION/screenshots/baseline
  ```
- The dashboard-spec AR render matches the pack's `dark-ar.png` almost pixel
  for pixel, which is a check that the harness renders the pack correctly.
- Prototype renders show a faint shadow at the inline-end edge. That is the
  prototype's own off-canvas detail panel, not a harness artefact.

`screenshots/baseline/index.html` is written (76 rows; pack and render
reference columns are filled where a matching name exists).

### Fixture values I invented (not in any spec)
Sample student, courses, grades, attendance rates, absences, news and
notification titles come from the spec (dashboard spec, prototype-v1
`COURSES`/`GRADES`/`ATTEND`/`ABSENCES`/`ARTICLES`, schedule-print). Invented:
- Email `amina.moussa@example.invalid` (spec: `amina.moussa@univ.dj`, replaced
  per D3); faculty contact `scolarite.sciences@example.invalid`,
  `+253 00 00 00 00`, `Campus universitaire, Djibouti`, hours `08:00 – 12:30`.
- Programme code `LINFO`, faculty code `FS`, all ids (`sem-s4`, `sub-inf305`,
  …), durationSemesters 6 / totalCredits 180, totalCredits earned 85,
  status ACTIVE, preferences (grades on, courses on, attendance off).
- Semester labels/years: current `S4` 2026-2027, previous `S3` (spec says
  "Semestre 4"; prototype's S1/S2 grade sets reused as S3/S4).
- Course types CM/TD/TP per slot; Réseaux informatiques given code `INF305`
  (prototype reuses `INF303`, which is Algorithmique avancée).
- Weekday placement: the dashboard spec's "today" classes (Réseaux 08:00,
  Systèmes 10:00, Stats 13:00) put on Tuesday so the fixed time gives the
  spec's "Prochain cours dans 45 min"; the prototype's other slots kept on
  their days.
- Algorithmique avancée S4 marks 15 / 14.3 / 14.5 (prototype 14 / 13 / 13.3)
  so the S4 average is the spec's 12.3 with NF = 0.3·CC + 0.7·CF.
  S3 GPA 12.2, credits 13/19; S4 credits 18/21.
- Attendance: per-subject totals/present/absent, bands (Stats `below` 72 %,
  Bases de données `near` 79 %, others `ok`), absencesLeft, absence dates in
  Oct–Nov 2026 on the course's weekday, `canSubmitJustification`, threshold 75,
  deadline 7 days. Overall 87 % is the spec's.
- Notification bodies = titles (spec gives titles only); unreadCount 2;
  types GRADES / ATTENDANCE / SCHEDULE; timestamps.
- News: category slugs mapped officiel→`official`, evenement→`events`,
  academique→`scolarite`; dates moved to Oct–Nov 2026; two hero images
  (generated gradients, no content), two articles without one; ids.
- Login 401 body `attemptsLeft: 2` (spec render says 3; backend locks after
  3, so 2 is what a first failure returns). 423 `lockedUntil` = fixed time
  + 5 min. 429 `RateLimit-Reset: 47` (spec's 47 s).
- `empty` scenario: no entries / no grades (`gpa: null`, not published) /
  attendance overall with zero sessions and `percentage: null` / no
  notifications / no news. `/student/me` has no empty variant.

### Flagged
1. **Product bug: the login 423 and 429 states never show.**
   `pwa/components/login/LoginForm.tsx`: on the commit where `error` becomes
   `locked`/`rateLimited`, `useCountdown` has only *queued* `setRemaining(n)`;
   the self-clearing effect (`error !== null && deadlineOf(error) !== null &&
   waitSeconds === 0`) runs in the same commit with the stale `waitSeconds = 0`
   and calls `setError(null)` + `setPulsing(true)`. A MutationObserver probe
   saw the "Réseau très sollicité" card mount and disappear in one tick, with a
   real clock too (not a harness artefact). The button never shows its
   countdown. Baseline `login--*--rate-limit.png` and `login--*--locked.png`
   therefore look like the default screen. This is behaviour, so it is out of
   this mission (D5) and blocks M10's rate-limit/locked "after" captures until
   fixed. Needs a decision: separate fix branch, or allow it in M10?
2. **Harness page error, expected.** Every PWA capture logs `Cannot read
   properties of undefined (reading 'waiting')`: Playwright's
   `serviceWorkers: 'block'` stub resolves `register()` to `undefined`, and
   `components/pwa/service-worker.ts` reads `.waiting` on it. No visible effect;
   a real browser never resolves `register()` to undefined. Not a product bug.
3. **Spec's AR dashboard renders Latin text in a serif fallback** (course
   names, "juin 10"): `--font-ar` has no Latin glyphs. The pack's own
   `dark-ar.png` shows the same, so the M0 render is faithful. For builders:
   do not copy that look.
4. Observed in the baseline, for M2: with the sidebar collapsed at 1440 the
   `auto-fit minmax(280px)` grid goes to 4 columns and leaves a hole in row 2.
5. Flag 13 (should the harness become permanent) stands; nothing here commits it.

### Could not do
- 19 of 116 spec reference renders are missing (the run was stopped for low
  memory; see "Reference" above for the list and the one command that
  finishes them). Baseline, harness, fixtures, README and the fail-closed
  proof are complete.
- I added `locked` login captures beyond the brief. Because of Flag 1's bug
  they look the same as `rate-limit`.

### Servers
None left running (harness stops `next start` with `taskkill /T /F`; checked
`netstat` for :3199 and :3198 after the last run).

---

## M1 — Dashboard: type (2026-11-12) — DONE

- Branch `feature/pwa-dc-01-dashboard-type`, cut from `origin/develop` a783a08
  (D1), commit **b1d865d**, pushed. PR **#5** →
  https://github.com/Islamsoub/udj-app-mvp/pull/5 (base `develop`). Not merged.
- Worktree `C:/Users/urohe/Documents/udj-wt-dc-m1` (fresh; `npm ci
  --legacy-peer-deps` in `pwa/`; `.next` is a harness build with the safe env).
  M2 branches from this branch and can reuse this worktree's checkout.
- Diff: `<MISSION>/diff-1.patch` (`git diff origin/develop...feature/pwa-dc-01-dashboard-type`).
- Files: `pwa/components/dashboard/dashboard.module.css` (type declarations +
  countdown padding), `pwa/components/dashboard/NextClassCard.tsx` (`.num` →
  `.mono` on the time range, comment updated). NotificationsCard.tsx unchanged:
  it renders no time (the notification time is "specified, not built"), and its
  only `.num` is the unread count, which has no spec value.

### Audit items re-verified against a783a08
| Item | Status | Action |
|---|---|---|
| Card title 12/700 uppercase ls .04em `--ink2` | holds | 14/700 `--ink`, no uppercase, no tracking. Icon kept (M2). |
| Heading 24/800 ls -0.3 | holds | 24 → 28 at `(min-width: 1024px)`, ls -0.4px, AR reset kept |
| Next-class subject 15/700 | holds | 13.5/700 lh 1.3 |
| Next-class meta 12.5 Jakarta, time `.num` | holds | 12/400; time `.mono` (DM Mono 12/400) |
| Ring label 17/800 | holds | 18/800 |
| Notification item 12.5 lh 1.4 | holds | 13 lh 1.35 |
| Unread count 34/800 | holds, no spec value | left, logged (Flagged 1) |
| Quick link 12.5/600 | holds | 13/700 |
| News title 13/600, meta 11.5 | holds | 14.5/700 lh 1.35; meta 12 |
| Countdown pill padding 4 10 | holds | 5 11 |
None was already fixed. Line numbers had drifted as MISSION says; items re-found by selector.

### getComputedStyle, before vs after vs §5 (light FR, 1440)
"Before" = a783a08. Per the lead's memory instruction the before tree was not
rebuilt or re-served, so before values are the declared px of a783a08's CSS
(every property is a plain px/keyword declaration, line-height inherits the
body's 1.5 unless declared, so computed = declared). "After" values are
measured with getComputedStyle in the after run (hook dumps:
`screenshots/m1/computed-after--<theme>--<lang>--<width>.json`, all 12 combos).
Colours: `--ink` light rgb(30,35,31) / dark rgb(237,242,237); `--ink2` light rgb(101,107,96).

| Element | Before | After (measured) | §5 |
|---|---|---|---|
| Heading h1 | Jakarta 24/800, lh 36px, ls -0.3px, `--ink` | Jakarta 28/800, lh 42px, ls -0.4px; 24px at 834 and 390; AR ls normal | 28/800 (24 <1024), ls -0.4px |
| Card title h2 | 12/700, lh 18px, ls 0.48px, uppercase, `--ink2` | 14/700, lh 21px, ls normal, none, `--ink` | 14/700 |
| Card icon | 16×16 `--ink3` | 16×16 `--ink3` (unchanged) | M2 removes |
| Subject | 15/700, lh 19.5px | 13.5/700, lh 17.55px | 13.5/700 lh 1.3 |
| Meta (room, lecturer) | 12.5/400, lh 18.75px, `--ink2` | 12/400, lh 18px, `--ink2` | room 12/400 ink2 |
| Meta time | Jakarta 12.5/400 | **DM Mono** 12/400, `--ink2` | DM Mono 12/400 ink2 lh 1.5 |
| Countdown pill | 12/700, padding 4px 10px | 12/700, padding 5px 11px | 12/700, padding 5 11 |
| Ring label (SVG) | Jakarta 17/800 | Jakarta 18/800 | 18/800 |
| Notification item | 12.5/400 lh 17.5px `--ink2` | 13/400 lh 17.55px `--ink2` | 13/600 lh 1.35 |
| Notification title (unread) | 12.5/600 `--ink` | 13/600 lh 17.55px `--ink` | 13/600 |
| Quick link | 12.5/600 lh 18.75px | 13/700 lh 19.5px | 13/700 |
| News title | 13/600 lh 17.55px | 14.5/700 lh 19.575px | 14.5/700 lh 1.35 |
| News meta | 11.5/400 `--ink2` | 12/400 `--ink2` | 12 (ink3 → ink2 per C4) |
| Unread count | Jakarta 34/800 ls -1.02px | unchanged | not in spec |
In AR every non-number element computes to Noto Naskh Arabic; the time stays
DM Mono and the ring label Jakarta in both languages.

No layout or spacing property changed except the countdown padding the
milestone lists. Heights move only because font sizes do.

### Checks
- `npm run typecheck` (pwa/): `> tsc --noEmit`, no output, clean.
- `npm run build` (run by the harness, safe env): `✓ Compiled successfully in
  16.5s`, `Finished TypeScript in 10.4s`, `✓ Generating static pages (12/12)`,
  all 12 routes listed, no warning.

### Screenshots — `screenshots/m1/` + `index.html` (12 rows)
- `before/`: copied from `screenshots/baseline/` (a783a08), not re-captured:
  `dashboard--{light,dark}--{fr,ar}.png`, `…--834.png`, `…--390.png` (12).
- `after/`: same 12 names, from b1d865d. Run exit 0, 12 screenshots, 0
  failures, no unanswered request (only the expected `'waiting'` page error).
- Done-when asked for 1440 only; 834 and 390 were added to show the 24 px
  heading below 1024 and line up with M2's widths.

### Flagged
1. **Unread count (34/800 Jakarta)** has no value in Dashboard Spec §5, and the
   spec's card has no count at all. Left as built. For Design: keep, restyle,
   or drop (dropping is content, D5)?
2. **Read notification rows.** §5 gives one style, 13/600 `--ink`, for every
   notification title; the dashboard spec draws no read state. The build dims
   read rows (400, `--ink2`). I kept that distinction and applied 13 / lh 1.35
   to both. The bell spec (`bell-states.html`) uses unread 700 `--ink` / read
   500 `--ink2`. Question for Design which applies to the card.
3. **Course-time line height 1.5** (§5) belongs to the spec's two-line time
   column. The build's time sits inline in a one-line meta row, and the
   milestone allows only a class swap in the TSX, so no lh was set. M3 (rows,
   rail) can revisit with the layout.
4. **DM Mono draws the en dash in "10:00 – 11:30" at full mono width**, so the
   range reads wider than in Jakarta. Faithful to the font, noted for M3.
5. **Another process on port 3199.** During this run a `next dev -p 3199` from
   the main checkout (`C:/Users/urohe/Documents/udj-app-mvp/pwa`, PID 2996,
   parent 27696, started 18:19, before this run) held `0.0.0.0:3199`. It is
   not mine and I did not stop it. The captures are from the M1 build, not
   from it: the measured values carry this milestone's edits (28 px heading,
   DM Mono time), which no other tree has, and there is no dev badge. Later
   milestones should check `netstat` first or pass `--port`.

### Could not do
- Nothing in scope left undone. Before values are from source, not measured,
  by instruction (no before rebuild).

### Servers
The harness's `next start` and Chrome are stopped (no listener of mine on
3199 after the run). PID 2996 above is someone else's and is still running.

---

## M2 — Dashboard: grid and card structure (2026-11-12) — Done, with the skeleton-matching item moved to M3 (Notifications, À la une) and M4 (GPA) by a MISSION.md amendment

- Branch `feature/pwa-dc-02-dashboard-grid`, cut from `feature/pwa-dc-01-dashboard-type`
  b1d865d (D1). Commits **e79dde4** (the milestone) and **a30ee28** (review fix round:
  the `Card.tsx` `@deprecated` comment now names M3; comment only). Pushed. PR **#6** →
  https://github.com/Islamsoub/udj-app-mvp/pull/6 (base `feature/pwa-dc-01-dashboard-type`). Not merged.
- Worktree `C:/Users/urohe/Documents/udj-wt-dc-m2` (fresh; `npm ci --legacy-peer-deps
  --prefer-offline` in `pwa/`; `.next` is a harness build with the safe env). M3 can
  branch from this branch and reuse this worktree.
- Diff: `<MISSION>/diff-2.patch` (`git diff feature/pwa-dc-01-dashboard-type...feature/pwa-dc-02-dashboard-grid`).
- Files, all in declared paths: `pwa/components/dashboard/Dashboard.tsx` (placement
  slots), `Card.tsx` (icon no longer rendered), `dashboard.module.css` (grid, slot,
  card, header rules; `.cardIcon` deleted).

### Audit items re-verified against b1d865d
| Item (audit "Layout", MISSION "Audit staleness") | Status | Action |
|---|---|---|
| Grid: six equal `auto-fit minmax(280px)` cards | holds | `minmax(0,1fr)` × 1 / 2 / 3 at <640 / 640 / ≥1024, gap 16, `align-items: start` |
| GPA stacked over Assiduité | holds (was separate cells) | `.slotColumn` flex column gap 16; Assiduité slot and card `flex: 1` |
| Notifications column 3, both columns on tablet | holds | `.slotNotifications` `grid-column: 1 / -1` at 640–1023 |
| Accès rapide + news span all | holds (were single cells) | `.slotSpanAll` `grid-column: 1 / -1` from 640 |
| Card padding 16 everywhere | holds | 20; GPA 18; Assiduité 16 |
| Header gap 12 | holds | `.cardHeader` mb 14, `space-between`; Accès rapide mb 12 (§6 ④ "h3 mb 12") |
| Card title icon | holds | removed from `Card`; prop deprecated (Flagged 2) |
| §9 hardening | partly | `minmax(0,1fr)` tracks; `min-width: 0` on `.cardTitle` and `.slotColumn` (other §9 text columns are card internals, M3) |
| M0 Flagged 4: collapsed 1440 → 4 columns, hole in row 2 | holds | fixed: the track count is per viewport breakpoint now, so collapsing widens tracks (373 → 429 px) and keeps 3 |

None was already fixed.

§4 stagger re-checked. The DOM order is unchanged (next class 0, GPA 1, Assiduité 2,
notifications 3, quick links 4, news 5). The slots only wrap the cards.
- At ≥1024 the order runs column 1, column 2 top then bottom, column 3, row 2, row 3.
  That is the reading order.
- At tablet it runs row 1 (next class, then the column), the notifications row, quick
  links, news. That is also the reading order.
- Both mirror in AR.

### getComputedStyle / rects, before vs after (light FR; full dumps in `screenshots/m2/computed-{before,after}--*.json`)
Before = M1 tree b1d865d, served with `--no-build` (no rebuild). After = e79dde4.

| | Before | After | Spec |
|---|---|---|---|
| grid-template-columns 1440 | 373.3 × 3 (auto-fit) | 373.3 × 3 | 3 tracks |
| … 1440 collapsed | **318 × 4** (hole) | 429.3 × 3 | 3 tracks |
| … 834 | 349 × 2 | 349 × 2 | 2 tracks |
| … 390 | 342 | 342 | 1 track |
| gap / align-items | 16 / start | 16 / start | 16 / start |
| Placement 1440 | NC, GPA, Att / Notif, Quick, News (3+3) | NC c1; GPA+Att c2 (Att y = GPA bottom + 16); Notif c3; Quick, News full width (1152) | §2 ①–⑤ |
| Placement 834 | 2+2+2 | NC c1, GPA+Att c2; Notif 714 wide; Quick, News 714 wide | §1 tablet |
| Card padding | 16 all | 20; GPA 18; Att 16 | 20 / 18 / 16 |
| Header margin-bottom | 12 | 14; Quick 12 | 14; ④ 12 |
| Title icon | 16 px present | none | none |
| Heights (loaded, 1440) | NC 148, GPA 160.8, Att 151, Notif 225.9, Quick 163, News 287.7 | NC 148, GPA 166.8, Att 153, Notif 235.9, Quick 171, News 297.7 | (padding change only) |

### Loading vs loaded overlay (1440 FR; AR identical, mirrored)
| Card | x / width | Height loading → loaded |
|---|---|---|
| Prochain cours | match | 148 → 148 ✓ |
| Moyenne générale | match | 148 → 166.8 (+18.8) |
| Assiduité | match | 153 → 153 ✓ (y moves +18.8, from GPA) |
| Notifications | match | 155 → 235.9 (+80.9) |
| Accès rapide | match | 171 → 171 ✓ (no skeleton; y moves +18.8) |
| À la une | match | 155 → 297.7 (+142.7) |

Every card edge matches in x and width, so the skeleton has the new layout's footprint.
Three heights do not match (Flagged 1).

### Checks
- `npm run typecheck` (pwa/): `> tsc --noEmit`, no output, exit 0.
- `npm run build` (harness, safe env): `✓ Compiled successfully in 22.6s`, `Finished
  TypeScript in 12.1s`, `✓ Generating static pages using 7 workers (12/12) in 1063ms`, no warning.

### Screenshots — `screenshots/m2/` + `index.html` (20 rows)
- `before/` (20):
  - `dashboard--{light,dark}--{fr,ar}.png`, `…--834.png`, `…--390.png` (12): copied
    from `screenshots/m1/after/`, not re-captured.
  - `…--loading.png` and `…--collapsed.png` at 1440 (8): captured from the M1 worktree with
    `--no-build --port 3299`. The collapsed captures show the hole.
- `after/` (20): the same names, from e79dde4. Default at 1440, 834 and 390; loading at
  1440; collapsed at 1440. Every capture is light and dark, in FR and AR.
- Both runs: exit 0, 0 failures, and no unanswered request. The only page error was
  the expected `'waiting'` one.
- Layout dumps were made with a scratch hook outside the repo (`layout-hook.mjs`, not
  kept in `capture/`). The before 834 and 390 dumps came from 6 extra light captures
  written to scratch, not to `m2/before/`.

### Flagged
1. **Skeleton heights for GPA, Notifications and news.** The values are in the overlay table
   above. Each card's skeleton blocks are declared in its own TSX file:
   - `GpaCard.tsx` draws 2 blocks. The loaded card has 3: value, mention and caption.
   - `NotificationsCard.tsx` draws 3 blocks. The loaded card has the count, the caption
     and 3 rows.
   - `NewsCard.tsx` draws 4 lines. The loaded card has 3 items, each with a tag, a title
     and a meta line.

   Those files are M3's and M4's paths, not M2's. Any CSS-only height tuning would fit
   these fixtures and nothing else, so I did not add any.

   **Correction (review fix round).** My first version said the short Notifications and
   news skeletons move nothing else. That holds only at ≥1024. Below 1024 it is false:
   - At 640–1023, `.slotNotifications` takes its own full-width row
     (`dashboard.module.css:88-92`), so its height pushes Accès rapide and news down.
   - Below 640 every card stacks, so every short skeleton pushes everything below it.
     At 390, GPA's shortfall adds to Notifications'.

   I measured it in `loading` at 834 and 390 on e79dde4 (`--no-build --port 3299`,
   all four combinations, in `after/`). The table is "Reflow, loading → default"
   below. The item now belongs to M3 (Notifications, À la une) and M4 (GPA) under the
   lead's MISSION.md amendment.

### Reflow, loading → default (px; Δy = how far the card's top moves when data arrives)
Heights are loading → default. FR and AR differ because Arabic lines are taller; light
and dark are identical.

| Width / lang | Prochain cours h | GPA h | Assiduité Δy | Notifications h (Δy) | Accès rapide Δy | À la une h (Δy) |
|---|---|---|---|---|---|---|
| 1440 FR | 148 → 148 | 148 → 166.8 | +18.8 | 155 → 235.9 (0) | **+18.8** | 155 → 297.7 (+18.8) |
| 834 FR | 148 → 157 | 148 → 166.8 | +18.8 | 155 → 218.4 (+18.8) | **+82.1** | 155 → 297.7 (+82.1) |
| 834 AR | 148 → 159 | 148 → 169.8 | +21.8 | 155 → 221.4 (+22.8) | **+89.1** | 155 → 303.7 (+89.1) |
| 390 FR | 148 → 157 | 148 → 166.8 (Δy +9.0) | +27.8 | 155 → 235.9 (+27.8) | **+108.7** | 155 → 356.4 (+108.7) |
| 390 AR | 148 → 159 | 148 → 169.8 (Δy +11.0) | +32.8 | 155 → 238.9 (+33.8) | **+117.7** | 155 → 303.7 (+117.7) |

Notes:
- At 834 the shift of row 3 and later is the column-2 shortfall (+18.8 FR) plus
  Notifications' (+63.4 FR).
- At 390 it is the sum of every card above. That includes Prochain cours, which is also
  9–11 px short below 1024 because its meta row wraps at narrow widths. At 1440 it
  matched. Its skeleton is in `NextClassCard.tsx`, an M3 path, so M3 should match it too.
- Assiduité is 1 px taller in AR (153 → 154).
2. **`Card`'s `icon` prop is `@deprecated`, not removed.** The six call sites in
   `NextClassCard`, `GpaCard`, `AttendanceCard`, `NotificationsCard`, `QuickLinksCard`
   and `NewsCard` still pass an icon. All six files are in M3's paths. **M3:** delete the
   `icon=` props, their unused imports and the prop in `Card.tsx`. Check whether
   `icons.tsx` exports are then unused (`ClockIcon` and `PinIcon` are still used in
   NextClassCard's meta).
3. **The Assiduité `flex: 1` has no effect.** §6 ② says "padding 16 and flex:1, so its bottom
   lines up with card ①". But under the grid's `align-items: start`, which is in §1 and
   §2, column 2 is only as tall as its two cards, so there is no free space to fill. The
   reference render shows the same thing: Assiduité ends about 5 px above card ①. I built
   it as the reference does, with `flex: 1` declared and no stretch. Question for Design:
   if the bottoms are meant to line up, column 2 needs `align-self: stretch`, and then it
   lines up with the tallest card in the row, not with card ①.
4. **Quick-link tile columns.** §1 says Accès rapide tiles use 2 columns below 640 and 3
   from 640, with gap 12. The built `.quickGrid` has 2 columns at every width. M3's item
   list covers "grid gap 12" but not the column count, and 3 columns with the 4 built
   links leaves a 3+1 row. Lead: put it in M3, or leave it with Flag 2 (the spec's 3
   tiles)?
5. **`.card { min-height: 148px }` is kept.** It is not in the spec, but it is harmless at
   the reference sizes. It is also why the GPA skeleton is 148 tall. Leave it for M3/M4
   to revisit with the skeletons.
6. **Content width is not the spec's.** It is 1152 at 1440 and 1320 collapsed. The spec
   caps it at 1200 with 48 padding, which gives 1104. That is M6's content frame, so the
   tracks are 373 / 429 px here, not 357.3.

### Could not do
- Matching skeleton heights to the loaded cards (Flagged 1). This needs card TSX files
  outside M2's paths, so it moves to M3 and M4 by amendment. Below 1024, Prochain cours
  is short as well.

### Review fix round (2026-11-12)
- The status line now says the item moved by amendment. It no longer says DONE.
- Flagged 1's claim that nothing else moves is corrected, and the reflow is measured
  at 834 and 390 (table above).
- `after/` gains `dashboard--{light,dark}--{fr,ar}--{834,390}--loading.png` (8). That run
  was `--no-build --port 3299` on e79dde4: exit 0, 8 screenshots, 0 failures. The
  layout dumps are `computed-after--dashboard--*--{834,390}--loading.json`.
  `index.html` is regenerated with 28 rows.
- Commit a30ee28 on `feature/pwa-dc-02-dashboard-grid` is a comment-only change in
  `Card.tsx` (the `@deprecated` note names M3). Typecheck is clean. The branch is
  pushed, and `diff-2.patch` was rewritten from the branch tip (234 lines). No other
  product code changed.
- No server or headless Chrome is left running.

### Servers
Each harness run stopped its own `next start` on 3299 and its own headless Chrome. I
checked with `Get-CimInstance` that no `headless`, `next start` or 3299 process was
left. PID 2996 on 3199 is not mine and was not touched.

---

## M3 — Dashboard: card internals (2026-11-12) — not DONE: two items unmet, two captures missing (below)

- Branch `feature/pwa-dc-03-dashboard-card-internals`, cut from `feature/pwa-dc-02-dashboard-grid` a30ee28. Commit **3b634de**, pushed. PR **#7** → https://github.com/Islamsoub/udj-app-mvp/pull/7, base `feature/pwa-dc-02-dashboard-grid`. Not merged.
- Worktree `C:/Users/urohe/Documents/udj-wt-dc-m3`. It is fresh, installed with `npm ci --legacy-peer-deps --prefer-offline`. Its `.next` is a harness build with the safe env. M4 can branch from here.
- Diff: `<MISSION>/diff-3.patch` (`git diff feature/pwa-dc-02-dashboard-grid...feature/pwa-dc-03-dashboard-card-internals`, 1277 lines).
- Files, all in the declared paths:
  - `Ring.tsx`, `AttendanceCard.tsx`, `QuickLinksCard.tsx`, `NotificationsCard.tsx`, `NextClassCard.tsx`, `NewsCard.tsx`, `icons.tsx`.
  - `Card.tsx`: the `icon` prop is deleted.
  - `GpaCard.tsx`: only `icon={<GpaIcon />}` and its import are removed.
  - `dashboard.module.css`: card-internal rules and the new card-specific skeleton rules only.
  - `locales/{fr,ar}.json`: one key.
- `.card { min-height: 148px }` is **unchanged**. Every loaded card M3 matches is taller than 148, so the rule plays no part in matching. GPA's 148 px skeleton is M4's.

### §6 items re-verified against a30ee28
Before values were measured on the M2 build, served with `--no-build --port 3299`. The dumps are `screenshots/m3/computed-before--*.json`.

| Item | Before | Status | After (measured, light FR 1440) |
|---|---|---|---|
| Ring size / stroke | 84 / 8 | holds | 88 / 9; hole inset 9 → 70×70 |
| "TAUX" caption | absent | holds | 9.5/600 lh 1.2 `--ink2` (rgb 101,107,96). New key `dashboard.attendance.rate_caption`: FR "TAUX", AR "النسبة", verbatim from Dashboard Spec §8 (D5) |
| Gauge gap | 16 | already 16 | 16; plus 12 below 380 (§9) |
| Quick tile | `--surface2`, no border, r8, padding 0 10, gap 8, 16 px icon, no tile | holds | `--surface`, 1px `--hair`, r16, padding 13 14, gap 11, 36×36 icon tile, 18 px icon; tile 64 tall |
| Quick grid gap | 8, `repeat(2,1fr)` | holds | 12, `repeat(2,minmax(0,1fr))`, 1 column below 380 |
| Quick hover | `--jade-faint` bg, lift, shadow | holds | adds border `--jade` and text `--jade-text`. The lift and shadow are kept (M7); the press scale is left for M7 |
| Notification rows | gap 8, no padding, no border, no chip | holds | gap 10, padding 10 0, 1px `--hair` top on every row, 32×32 r8 chip, 15 px icon. List gap 2, as in the reference markup |
| Next-class rail / gap | no rail; subject and pill in one row, gap 12 | holds | pill (13 px clock, gap 6, mb 14) over one row: 4×38 rail, gap 12, body with ellipsis, DM Mono time column on 2 lines, lh 1.5, end-aligned. This closes M1 Flagged 3 and 4 |
| News list gap | 12 | holds | 10 |
| Category pill 11/700, padding 4 10 | 12/700, padding 3 10 | holds, **unmet** | unchanged. The payload does carry the category, but the pill is `ArticleTags` in `components/news/ArticleMeta.tsx` + `news.module.css`, outside M3's paths |
| `icon` prop + 6 call sites | deprecated; 6 cards pass it | holds | gone. No `icon=` is left under `components/dashboard`. `GpaIcon` and `GridIcon` are deleted from `icons.tsx` (unused) |

None of these was already fixed.

### Skeleton edges: loaded (default) against loading
x and width match everywhere. The table gives heights in px. Measured on 3b634de's code. Light and dark are identical wherever both were captured.

| Card | 1440 FR | 1440 AR | 834 FR | 834 AR | 390 FR | 390 AR |
|---|---|---|---|---|---|---|
| Prochain cours | 169 / 169 ✓ | 171 / 171 ✓ | 169 / 169 ✓ | 171 / 171 ✓ | 169 / 169 ✓ | 171 / 171 ✓ |
| Notifications | 315.84 / 312.75 (−3.09) | 318.84 / 315.75 (−3.09) | 312.75 / 312.75 ✓ | 315.75 / 315.75 ✓ | 315.84 / 312.75 (−3.09) | 318.84 / 315.75 (−3.09) |
| À la une | 293.69 / 293.69 ✓ | 299.69 / 299.69 ✓ | 293.69 / 293.69 ✓ | 299.69 / 299.69 ✓ | 352.38 / 293.69 (**−58.69**) | 299.69 / 299.69 ✓ |

- Before M3 (from M2's table): Notifications went 155 → 218–239, À la une 155 → 298–356, and Prochain cours 148 → 157/159 below 1024.
- The Δy that remains on the cards below comes from GPA (148 against 166.75 / 169.75). That is M4's.

How the skeletons match:
- Each skeleton is built from its loaded card's own boxes: the pill, the row, rail and chip, and the list items with their padding, gap and hairline.
- Each text line is a `.skeletonTextLine` combined with the loaded line's own class. It holds invisible ghost text in the same font mix: a no-break space, plus a `.num` "0" where the loaded line has a figure.
- Run 1 used fixed `1lh` boxes instead, and Arabic came out 2–6 px short.
  - The cause: a Plus Jakarta `.num` inside a Noto Naskh line sits at a different baseline offset, which makes the line box taller than its line-height.
  - Lines affected: the countdown pill (+2), the unread caption (+3) and the news meta (+2 per item).
  - The ghost text reproduces this exactly.

**Unmet: the remaining mismatches all come from wrapping text, not from skeleton boxes.**
- Notifications −3.09: the long attendance title wraps to 2 lines at 1440 and 390. Its text is then 35.1 px tall, more than the 32 px chip.
- À la une −58.69 at 390 FR: all three titles wrap. In AR at 390 they do not.

A skeleton cannot know how many lines a title will take. Options for the lead or Design:
- (a) Accept it.
- (b) Clamp the dashboard preview titles. That is a new truncation.
- (c) Reserve two lines in the notification text column. That is the spec's row height (title + time ≈ 35), but the time is not built.

I applied none of them. (b) and (c) would change the loaded card to fit a skeleton.

### Checks
- `npm run typecheck` (pwa/): `> tsc --noEmit`, no output, clean. Run after every edit round.
- `npm run build` (harness, safe env):
  - Run 1: `✓ Compiled successfully in 22.4s`, `Finished TypeScript in 14.3s`, `✓ Generating static pages using 7 workers (12/12) in 780ms`.
  - Run 2 (final code): `✓ Compiled successfully in 2.8s` (warm cache), `Finished TypeScript in 4.6s`.
  - Run 2's log was cut off by the memory kill, so it does not show the static-pages line. The build had finished: the server served 22 captures from it.

### Screenshots — `screenshots/m3/` + `index.html` (24 rows)
- `before/` (24): copied from `screenshots/m2/after/`, not re-captured. a30ee28 is comment-only over e79dde4. Default and loading at 1440, 834 and 390, all four combinations.
- `after/` (22 of 24): from the final code, default and loading at 1440, 834 and 390, all four combinations. **Missing: `dashboard--dark--{fr,ar}--390--loading.png`** (see Could not do).
- Dumps: `computed-after--<theme>--<lang>--<width>--<scenario>.json` (22) and `computed-before--light--{fr,ar}--1440--default.json`. They were made with a scratch hook outside `capture/`.

### Flagged
1. **Category pill size (M3 item, unmet).**
   - The spec gives 11/700 with padding 4 10. The pill is 12/700 with padding 3 10.
   - The rule lives in `news.module.css` `.pill` and in `ArticleMeta.tsx`, which are M14's paths.
   - Options: restyle it in M14, which also changes the news page, or allow M3 a `className` prop on `ArticleTags`.
   - The news skeleton reads `news.module.css`'s `.tags` / `.pill` classes so its pill frame follows the real one. It does not change that file.
2. **Course rail colour.**
   - The spec gives each course its own colour: #2E9E5B, #2F7DD1, #E08A1E.
   - The payload has no course colour, and there are no tokens for these, so the rail is `--jade` for every course.
   - A per-course colour needs a data field or a token set. That needs Design and the backend.
3. **Notification chips for GENERAL and NEWS.** The spec draws three chips: grades, attendance and exam. SCHEDULE maps to the exam/calendar chip. GENERAL, NEWS and any unknown type get the base jade chip with the bell glyph from bell-states.html. Question for Design.
4. **Attendance chip icon colour.** The spec's `--warning` is 1.93:1 on its chip in light, under the 3:1 a graphic needs. I used `--warning-ink` (5.73 light / 6.05 dark), as R2-near-ring does for the ring. `--exam` is 3.64 / 4.19 and is kept.
5. **Icon tile radius.** The spec says r10, and there is no 10 px radius token, so I used `--r-sm` (8). A new token is Design's call. M5's 34×34 r10 sidebar tile has the same gap. The rail's r4 is drawn with the pill radius, which looks identical on a 4 px bar.
6. **Quick-tile colours.** All four tiles are jade-faint / jade-text. The spec's warning, info and jade tints belong to its three action tiles (Flag 2), not to these four destinations. The column count stays at 2: §1's 3 columns from 640 is still M2 Flagged 4, which is open.
7. **Unread dot.** The chip now holds the row's start, so the dot sits at the row's inline-end, centred on the first line. The spec draws no unread mark on the card (M1 Flagged 2). Question for Design.
8. **Next-class time column.** It now shows two lines and no dash, as the spec does. A screen reader therefore reads "10:00 11:30" with no "to". The lecturer stays on the room line and is the part that truncates.
9. **Quick-link hover lift kept.** MISSION says the hover "becomes" the spec's border, fill and text change. I added those and kept the 1 px lift and the shadow, because M7's goal requires them. If "becomes" means "replaces", M7 adds them back anyway.
10. **No shared skeleton helper.** Each card's skeleton markup is written inline. A shared helper would belong in Card.tsx, and M3 may only edit that file to delete `icon`.

### Could not do
- **Category pill** (Flagged 1): unmet, because the files are outside M3's paths.
- **Skeleton heights where titles wrap**: unmet. The measurements and options are above.
- **Two after captures are missing**: `dashboard--dark--fr--390--loading.png` and `dashboard--dark--ar--390--loading.png`.
  - Claude Code stopped capture run 2 for low system memory after 22 of its 24 captures.
  - The kill notice said not to restart it unattended, so I did not retry it.
  - The light 390 loading captures exist, and light and dark heights matched in every other pair.
  - To finish when memory allows (the build exists, so no rebuild):
  ```sh
  node $MISSION/capture/capture.mjs --pwa C:/Users/urohe/Documents/udj-wt-dc-m3/pwa --no-build --port 3299 --out $MISSION/screenshots/m3/after --screens dashboard --themes dark --widths 390 --scenario loading
  node $MISSION/capture/capture.mjs index --dir $MISSION/screenshots/m3
  ```

### Servers
Each harness run stopped its own `next start` and Chrome. After the memory kill I checked with `netstat` and `Get-CimInstance`: nothing listens on 3299, and no headless Chrome or `next` process from this run is left. The `next dev` on 3199 (PID 2996) was not touched.

---

## 2026-11-13: decisions, harness memory fixes, M3 captures completed (orchestrator, no product code)

### Decisions (Islam)
- **M3/M4 skeleton matching: option (a).** Done-when now reads "matching edges for single-line content" (MISSION.md, M3 and M4). The two remaining gaps come from cards that are incomplete against the spec (notification time line; news category pill and thumbnail). The skeletons are re-matched when those cards are completed. No clamping, no tuning against content about to change.
- **One milestone per run**, stop after each for a look. **Paused before M4**: Islam is inspecting the PWA himself first.

### M3 open items closed
- The two missing captures were taken: `m3/after/dashboard--dark--{fr,ar}--390--loading.png` (resume of the 2026-11-12 command, M3 build `tmwdsepxa`, unchanged).
  - These two use the new Chrome flags. The other 22 M3 after shots do not, so anti-aliasing differs slightly between them. Layout is unaffected.
- **Dark measured, not inferred.** Card heights at 390, loaded/loading, are identical in dark and light in both languages:
  - FR: Prochain cours 169/169, Assiduité 157/157, Accès rapide 218/218, Notifications 315.84/312.75, À la une 352.38/293.69, GPA 166.75/148 (M4's).
  - AR: 171/171, 157/157, 218/218, 318.84/315.75, 299.69/299.69, GPA 169.75/148.
  - The remaining differences are the accepted wrapped-text ones and GPA, which is M4's.
- M3's Done-when is met under the amended wording.
- The reviewer's minor item stays open and undecided: the next-class time reads "10:00 11:30" with no "to".

### Harness (capture/capture.mjs, README "Memory")
- Free memory is checked before the build, the server, Chrome and every shot, with `--min-free-mb`, default 300. Below it the run stops cleanly with exit 3 and lists the shots not taken.
- A resume manifest skips shots already taken with the same build and options. A rebuild invalidates it. `--overwrite` retakes everything.
- Chrome low-memory flags. `--disable-gpu` changes anti-aliasing (layout unchanged), so from M4 on "before" is retaken, not copied.
- Index pages: the pack-screenshot column is removed. The spec column is the harness's own render of the spec page at the capture's width, never another width. baseline, m1, m2 and m3 index pages were regenerated.
- Measured, one variant: peak 625–631 MB working set and 385–389 MB private with the flags, against 696–707 / 532–582 before. Full table in README "Memory".

### Servers
Every run stopped its own `next start` and Chrome. After the last run nothing listens on 3299 and no headless Chrome is left.

### Later on 2026-11-13 (Islam's follow-up)
- **`--disable-gpu` removed from the harness.** It changed anti-aliasing on 5–15% of pixels, which is the wrong cost for judging small visual differences, and the headroom is there without it. The other flags stay: they change no pixel and save ~20–30 MB. The measured peak for one variant with the current flags is 667–680 MB working set and 523–566 MB private (README "Memory").
- **One renderer again.** The only captures ever taken with `--disable-gpu` were the two `m3/after/dashboard--dark--{fr,ar}--390--loading.png` shots from earlier today, and both were retaken. No other capture or reference render used the flag. With the current flags, a 12-shot recapture matches the existing captures pixel for pixel, within 1–2 px of run-to-run noise.
- **M3 fix round: screen-reader connector** (commit `914041c` on `feature/pwa-dc-03-dashboard-card-internals`, pushed, PR #7). A visually hidden "à" / "إلى" sits between the next-class start and end times. It added the key `dashboard.next_class.time_to` in both locales; the M3 paths were amended in MISSION.md.
  - Accessibility tree, all 8 combinations at 1440 and 390: "10:00 à 11:30" in French and "10:00 إلى 11:30" in Arabic.
  - Visual: 12 of 12 dashboard captures (1440/834/390 × light/dark × FR/AR) are identical to the previous M3 build, within 1–2 px of noise.
  - Typecheck passes, and the build passes as part of the harness run.
  - Diff: `diff-3-fix-sr-connector.patch`. Reviewer: no findings. It meets the goal, stays inside the declared paths and breaks no CLAUDE.md rule. It noted this is the PWA's third copy of the same `.srOnly` rule, which follows the one-module-per-folder pattern.
- M3 has no open items left. M4 is not started and stays paused.
