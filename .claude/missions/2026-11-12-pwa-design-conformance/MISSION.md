# PWA design conformance: make the PWA look like Design's work

## Goal
The PWA's dashboard, app shell and login match their current specs closely:
type, spacing, layout, radii, states and motion, including the jade GPA hero
card and the U mark in the sidebar. Schedule, grades, news and profile take
their composition from `prototype-v1` and their finish from the current tokens
and the foundations spec. Foundations rules (hover, press, focus, input errors,
toasts, skeletons, easing) hold on every page. Nothing the product can do
changes. Every milestone leaves before and after screenshots, light and dark,
FR and AR, in this mission's `screenshots/` folder, rendered by a repeatable
harness that needs no backend, no database and no credential. Every milestone
ends as a pushed branch in a stack with a PR. Nothing is merged.

## Product
pwa

## How to read this file
- "Spec" means the current authority for the element, in INDEX.md's order:
  `ROUND2-CLOSEOUT.md` > Round 2 Spec > screen spec > prototype > screenshots,
  with `OVERRIDES.json` applied first. All paths below `design/spec-pack/`.
- The audit is `.claude/reports/2026-11-09-pwa-design-audit.md`. It is a
  starting list, not the spec. Its line numbers have drifted (see "Audit
  staleness").
- `M` = milestone. `<MISSION>` = `.claude/missions/2026-11-12-pwa-design-conformance`.

---

## Decisions (lead, 2026-11-12)

### D1. Run shape: stacked branches, one PR per milestone
Each milestone's branch is cut from the previous milestone's branch, not from
develop. M1 is cut from `origin/develop`. Each PR targets the previous
milestone's branch (M1's PR targets `develop`).

Why:
- Independent branches would conflict. `dashboard.module.css` is edited by
  M1, M2, M3, M4 and M7. `shell.module.css` by M5, M6, M7 and M8.
  `app/globals.css` by M4 and M5.
- One branch with one commit per milestone is what the feature-parity mission
  did, and Islam decided that. This mission would put 15 commits across every
  PWA page into one PR, which nobody can review or accept in part. Overriding
  "one milestone, one PR" needs Islam's decision, and this run is not to stop
  for one.
- A stack keeps "one milestone, one PR" literally. Each PR's diff is just its
  own milestone. Islam can merge any prefix of the stack and stop where he
  disagrees.

What it overrides: builder.md says "Branch from develop". For this mission
that holds for M1 only. README step 2b's diff command changes to:
`git diff feature/<previous>...feature/<this> > <MISSION>/diff-N.patch`.

Rules that follow from it:
- **A blocked milestone leaves the stack.** The next milestone branches from
  the last milestone that finished. Record this in PROGRESS.md.
- **A fix after the next branch exists** is committed on the earlier branch,
  then `git merge`d forward into every later branch. Never rebase a pushed
  branch, because that needs a force push and force pushes are denied.
- **Merge order** is bottom-up. GitHub retargets the next PR when its base
  branch is merged and deleted.
- **One milestone per run (Islam, 2026-11-13).** Stop after each milestone
  and its review, and say it is ready to look at. On 2026-11-12 M1–M3 ran back
  to back, so M3 was built on M1 and M2 before anyone had seen either.
- **Paused before M4 (2026-11-13).** Islam is running and inspecting the PWA
  himself first. Do not start M4 until he says so.
- **Captures from M4 on** use the 2026-11-13 harness (capture/README.md
  "Memory": memory check, resume, Chrome flags). Its flags are
  pixel-identical to earlier captures; `--disable-gpu` was tried and removed
  because it changed anti-aliasing (Islam, 2026-11-13). Every capture in this
  mission is on one renderer.

Branch names:

| M | Branch | Base |
|---|---|---|
| 0 | none (tooling in the mission folder) | n/a |
| 1 | `feature/pwa-dc-01-dashboard-type` | `origin/develop` |
| 2 | `feature/pwa-dc-02-dashboard-grid` | M1 |
| 3 | `feature/pwa-dc-03-dashboard-card-internals` | M2 |
| 4 | `feature/pwa-dc-04-gpa-hero` | M3 |
| 5 | `feature/pwa-dc-05-sidebar-u-mark` | M4 |
| 6 | `feature/pwa-dc-06-topbar-frame-tabbar` | M5 |
| 7 | `feature/pwa-dc-07-states-dashboard-shell` | M6 |
| 8 | `feature/pwa-dc-08-toast-stack` | M7 |
| 9 | `feature/pwa-dc-09-states-pages` | M8 |
| 10 | `feature/pwa-dc-10-login` | M9 |
| 11 | `feature/pwa-dc-11-schedule-week` | M10 |
| 12 | `feature/pwa-dc-12-schedule-day` | M11 |
| 13 | `feature/pwa-dc-13-grades` | M12 |
| 14 | `feature/pwa-dc-14-news` | M13 |
| 15 | `feature/pwa-dc-15-profile` | M14 |

### D2. The mission folder is not committed
Everything under `<MISSION>/` stays untracked in the main checkout at
`C:/Users/urohe/documents/udj-app-mvp/<MISSION>/`, the same as the
feature-parity and pwa-ci-job missions. That covers MISSION.md, PROGRESS.md,
the capture harness, the diff patches and the screenshots. Builders working in
another worktree still write there, by absolute path.

Why: every milestone writes PROGRESS.md. Committing it would put the same file
in all 15 PRs. Committing the screenshots would also put about 400 PNGs, some
50 MB, into git history. Branches carry `pwa/` changes only. Each milestone's
"Paths" list names the mission-folder paths it may write, but those paths are
never part of the PR diff.

### D3. How to capture (this replaces README's "Known gap", for this mission)
The lead tested this on this machine on 2026-11-12. With `next dev`, every
request under `/api/**` was intercepted in the browser, and the dashboard
rendered past auth with no backend and no credential.

- **Browser.** Google Chrome 156 is installed at
  `C:/Program Files/Google/Chrome/Application/chrome.exe`. Playwright 1.65.0 is
  already in the npx cache at
  `C:/Users/urohe/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright`.
  Launch it with `chromium.launch({ channel: 'chrome', headless: true })`. No
  `playwright install` download is needed.
- **Never** add Playwright, or anything else, to `pwa/package.json`. The
  harness lives outside the product tree, so the three-runtime-dependency rule
  is untouched and nothing ships.
- **Auth.** There is no middleware, and no page fetches on the server. The
  session is restored in the browser by `POST /api/auth/refresh`
  (`lib/api-client.ts` `refreshAccessToken`). The harness answers it with
  `{ accessToken: <unsigned fake JWT whose payload is {"studentId":"fixture-student"}> }`.
  `lib/auth-token.ts` `tokenStudentId` only decodes the token, it never
  verifies it. Every `GET /api/backend/**` is answered from a fixture file.
- **Fail closed.**
  - Any `/api/**` request with no fixture is answered with 599 and logged, and
    the run exits non-zero.
  - Any request to a host other than the local server is aborted.
  - Start both `next build` and `next start` with
    `NEXT_PUBLIC_API_URL=http://127.0.0.1:9 PWA_PROXY_SECRET=` in the process
    environment. A process env var beats `.env.local` in Next, so even a leaked
    server-side call would hit a dead port. Never read, print or copy
    `pwa/.env.local`.
- **Service worker.** Create the context with `serviceWorkers: 'block'`.
  Otherwise Playwright's routing can miss requests the worker handles.
- **Theme and language.** Use the cookies `unipocket_theme=light|dark` and
  `unipocket_lang=fr|ar`, set with `context.addCookies` before the first
  navigation (`lib/theme-shared.ts`, `lib/i18n-shared.ts`). The server renders
  both into the first byte (`app/layout.tsx`).
- **Clock.** `page.clock.setFixedTime('2026-11-10T09:15:00+03:00')` with
  `timezoneId: 'Africa/Djibouti'`. That is a Tuesday, a teaching day (the week
  runs Sunday to Thursday). Use `setFixedTime`, not `install`, because
  `install` fakes timers and would freeze the entrance animations and the
  400 ms skeleton minimum.
- **Viewport.** 1440×900, DPR 1, the same as the spec pack's reference
  renders. Add 834 (tablet rail) and 390 (phone) where a milestone asks.
- **Settle before capturing.** Wait for `document.fonts.ready`. Then wait until
  every finite `document.getAnimations()` has finished.
- **Serve.** In `pwa/`: `npm run build`, then `npx next start -p <port>`. Do
  not capture from `next dev`: it double-invokes effects and draws its own
  overlay badge.
- **States.** A scenario switch selects the fixture set:
  - `default`: every card populated.
  - `empty`: valid empty payloads.
  - `error`: 500 on data routes.
  - `loading`: data routes never answered, which shows the skeletons.
  - `offline`: `context.setOffline(true)` after the first load.
  - Login scenarios: refresh answers 401; login answers 401, 423 or 429.
- **Fixture data.** Use the spec's own sample student, "Amina", Licence
  Informatique, with the spec's course names, in FR and AR. Use
  `example.invalid` addresses. Nothing real. Every payload must satisfy
  `lib/api-types.ts`, and attendance must pass `lib/attendance-contract.ts`
  (it is validated, and an invalid payload renders the error state).

### D4. Precedence rulings the lead made
- **Type and spacing on schedule, grades, news and profile.** Neither
  `tokens/pwa/` nor the foundations spec has a type or spacing scale (audit,
  "Three things to know", item 1). The rule for those pages is:
  - Built values stay unless they break a token or foundations rule.
  - A new element that composition adds takes the values the PWA already uses
    for the same role, for example an existing section header style.
  - No prototype size is copied.
  - Every remaining type or spacing question goes into PROGRESS.md as a
    question for Islam (Flag 9).
- **Sidebar collapse timing.** The Dashboard Spec says `.18s ease`. Foundations
  §7 says `--dur-base --ease-in-out`. The screen spec outranks foundations, and
  180 ms is exactly `--dur-fast`. `ease` has no token, so the easing comes from
  §2's rule for resizing in place. Result: `--dur-fast var(--ease-in-out)`.
  This settles audit question "sidebar collapse timing".
- **`linear`.** It is allowed only where the foundations spec says "no easing":
  - the reduced-motion collapse (§2);
  - the shimmer loop (§5);
  - the spinner (§5);
  - exits that §5 or §9 describe as reversing with no easing.

  Everywhere else it is replaced with an easing token. No `--ease-linear`
  token is added, because a new token is Design's call.
- **DM Mono.** The dashboard and the shell use DM Mono where the Dashboard
  Spec §5 says so: course times, the GPA value, notification times. Every
  other page keeps the PWA's `.num` (Plus Jakarta Sans) rule.
- **The sidebar U tile's colour.** `assets/brand/unipocket-u-tile.svg` and
  `unipocket-sidebar-mark.png` are CURRENT. They are a white U on
  `#1D9E75 → #0F6E56`.
  - Build the tile from those values as a new token, the same in both themes,
    with a measured-ratio comment.
  - Do not use `var(--jade)`. Dark `--jade` is `#2BB989`, which would put
    the white mark under 3:1.
  - White on `#1D9E75` is 3.39:1. The mark is a graphic, so 3:1 applies.

### D5. Appearance only: where the line is
Each of the following is a capability or a data change. None is in this
mission, and each is a Flag:
- A new request.
- A new route or link target.
- A new control.
- Different data shown, for example every one of today's classes instead of
  the next one.
- New copy that the spec does not give in both FR and AR.

Copy that a current spec gives verbatim in both languages may be added to
both locale files, with its source cited in PROGRESS.md. M3's "TAUX" /
"النسبة" is the only planned case.

### D6. Screenshots (applies to every milestone)
- **Folder.** `<MISSION>/screenshots/mN/before/` and `<MISSION>/screenshots/mN/after/`.
- **File name.** `<screen>--<theme>--<lang>[--<width>][--<state>].png`. For
  example: `dashboard--dark--ar.png`, `dashboard--light--fr--390.png`,
  `login--light--fr--error-credentials.png`.
- **Before** is the base branch tip: `origin/develop` for M1, the previous
  milestone's branch after that. Capture it before the first edit.
- **After** is the milestone's tip.
- **Coverage.** Every screen the milestone touches, in light and dark × FR and
  AR, at 1440, plus any widths and states the milestone lists.
- **Index page.** The harness writes `screenshots/mN/index.html`. It shows
  before | after | reference side by side, using the matching
  `design/spec-pack/screenshots/` render or an M0 spec render where one exists.
- **A milestone with no after screenshots is not done.**

---

## Spec conflicts seen by the lead (tokens win; each is a ruling, not a question)
| # | Source says | Current tokens / rules say | Ruling |
|---|---|---|---|
| C1 | `--ink2 #6C7267`, `--ink3 #9CA396` (prototype-v1, Dashboard Spec §3) | `#656B60`, `#80867A` | Tokens. Already in `design-known-divergences.md` |
| C2 | `--jade-hover #0F6E56` in light: hover darkens (prototype, Dashboard Spec §3) | `#22B083`, background only. Text hover uses `--jade-text` | Tokens |
| C3 | White text on jade fills (prototype `.btn-primary`, foundations §5 "white text") | `--on-jade` dark ink (white was 3.39:1) | Tokens |
| C4 | `--ink3` on text: notification times, "TAUX", news date, tab bar labels (Dashboard Spec §5/§6, prototype) | CLAUDE.md: `--ink3` is non-text only | `--ink2` for text. `--ink3` stays on icons and chevrons |
| C5 | GPA gradient `var(--jade) → var(--jade-hover)` (Dashboard Spec §4, prototype) | `tokens.json` `gpaCardGradient`: `linear-gradient(150deg, #168666, #0F6E56)`, both themes. Not yet a custom property | Tokens. M4 adds the custom properties |
| C6 | GPA label 78% white, "/20" 70% white, mention badge `rgba(255,255,255,.18)` | OVERRIDES `R2-on-green-text`: solid white, badge `rgba(0,0,0,.16)` | Overrides |
| C7 | GPA value 32 (`dashboard.html` inline) vs 42 (`app.css .hj-value`) | none | 32 on the dashboard (inline wins on that screen). 42 is the class default used by other heroes. This settles the audit's "the spec contradicts itself" |
| C8 | Prototype motion literals: `.15s .18s .2s .25s .3s`, `ease` | `--dur-*`, `--ease-*` | Tokens (D4) |
| C9 | `#9A5B06` Justifier tile icon; prototype status-text hexes | OVERRIDES `R2-text-colours`: `--warning-ink`, `--danger-ink` | Tokens |
| C10 | "Seuil" and gauge in `--warning` (Dashboard Spec §3) | OVERRIDES `R2-band`, `R2-near-ring` | Overrides (already built) |
| C11 | Tab bar default `--ink3` (Dashboard Spec §6) | C4 | `--ink2` (the audit already accepted this) |
| C12 | Mention dot `#FFD27D` (Dashboard Spec §3 fixed colours). Prototype-v1 `MENTIONS` map: TB `#7DF3C4`, B `#9CC7F5`, AB `#FFD27D`, P `#C7D2DB`, the rest truncated | No token | M4 adds the dots as tokens from that map. Decorative, because the label carries the meaning. If a mention has no colour in the map, its dot is omitted and listed in PROGRESS.md |
| C13 | Prototype schedule week: 7 columns, Sunday to Saturday | Djibouti week Sunday to Thursday, built as 5 | Keep 5. Flag 6 |
| C14 | Avatar menu item 40 tall (Dashboard Spec §6) | No PWA touch-target rule (44 is the native app's) | Spec: 40. It is still above WCAG 2.2's 24 px minimum. Flag 10 |

Also seen: `dashboard/css/app.css` carries rules for schedule, grades, news and
profile (`.week-grid`, `.subject-card`, `.profile-hero` and others), but
`dashboard.html` renders only the dashboard view. Those rules are not treated
as a spec for those pages. Prototype-v1 is, for composition only (Flag 8).

---

## Audit staleness (lead spot-check against origin/develop a783a08, 2026-11-12)
- **Fixed since the audit:**
  - Justification submit and drop-zone hover, press and easing (c474baf).
  - File and note field errors (52dc3af).
  - Arabic letter-spacing on labels and headings (1748341, 715d00e).
  - The attendance band items marked "pending".
- **Still holds, confirmed in code:**
  - Dashboard `.cardTitle` is 12/700 uppercase `--ink2`.
  - `.heading` is 24/800, margin 20.
  - `.grid` is `auto-fit minmax(280px)`.
  - `.card` padding is 16.
  - `.heroNumber` is 34/800 `--ink`.
  - `.quickLink:active` scales 0.97 (now line ~627).
  - `.logoMark` masks `/logo.svg` at 99/143. It is the mortarboard.
  - `segmented .option:hover` still outranks `.optionSelected`.
  - The profile switch runs at `--dur-fast`.
  - 4 px focus offsets: `attendance.module.css:438`, `grades.module.css:45`,
    and `schedule.module.css:46`. The schedule one is new and not in the audit.
- **Confirmed by rendering** (lead's fixture capture of the current dashboard):
  - The heading is "Accueil", not a greeting.
  - There are six equal cards with uppercase titles and icons.
  - The quick-link tiles are four nav links.
  - There is no GPA hero.
  - The sidebar shows the mortarboard.
  - The topbar shows a 44 px generic avatar icon.
- **Line numbers have drifted.** `dashboard.module.css` is now 721 lines. Every
  milestone re-finds its items by selector, not by line.

---

## Rules for every milestone
- **Re-verify first.** Before editing, check each audit item the milestone
  names against its base branch. Mark each one in PROGRESS.md as holds, fixed
  already, or changed. Fix only what holds.
- **CSS.**
  - CSS Modules only.
  - Colours, radii, shadows and motion come from tokens in `app/globals.css`.
    Never a raw hex in a module.
  - A new token goes in both `[data-theme]` blocks.
  - Any colour change re-measures contrast and updates the comment in the same
    edit (WCAG 2.x, sRGB, state the pair and the ratio).
  - The same new tokens are mirrored into `design/spec-pack/tokens/pwa/` only
    if a human asks. That is out of scope here.
- **RTL and bidi.**
  - No `[dir="rtl"]` selector anywhere. Use logical properties only.
  - Every number, time range or percentage goes through `lib/bidi.tsx`.
- **Locales.** Any string goes into both `locales/fr.json` and
  `locales/ar.json`, and only from a spec (D5). No invented copy: put the gap
  in PROGRESS.md under "Flagged" and leave the UI unchanged.
- **Reduced motion.** Anything that moves gets a `prefers-reduced-motion`
  entry that follows the module's existing block.
- **Checks.** In `pwa/`, run `npm run typecheck` and `npm run build`. Paste both
  outputs into PROGRESS.md. The `pwa` CI job also runs them on the PR.
- **No behaviour change (D5).** If a fix would change behaviour, stop that
  item, log it, and carry on with the rest.
- **PR.** Target the base branch from D1. The PR body says "Does not touch
  backend/prisma/schema.prisma", lists the screenshots folder, and ends with the
  attribution line. `gh` is at `C:/Program Files/GitHub CLI/gh.exe` and is not
  on the Bash PATH (Flag 11). If it cannot run, push the branch and paste the
  PR title and body into PROGRESS.md.
- **PROGRESS.md.** Append what was done, what was flagged, what could not be
  done, and the screenshot list.

---

## Milestones

### 0. Capture harness and baseline
- Goal: one command renders any PWA screen with fixture data, in any theme, language, width and scenario, and the baseline plus spec reference renders exist.
- Paths:
  - `<MISSION>/capture/**`: `capture.mjs`, `fixtures/**`, `README.md`
  - `<MISSION>/screenshots/baseline/**`
  - `<MISSION>/screenshots/reference/**`
  - `<MISSION>/PROGRESS.md`
  - No file under `pwa/`, and no branch or PR.
- Notes:
  - Implement D3 exactly.
  - **Resolving Playwright.** The harness resolves Playwright from the
    `PLAYWRIGHT_MODULE` env var, falling back to the npx-cache path in D3. If
    neither exists, it says to run `npx -y playwright@1.65.0 --version` to
    repopulate the cache.
  - **Inputs.** `--base-url`, `--out`, `--screens`, `--themes`, `--langs`,
    `--widths`, `--scenario`, `--full-page`.
  - **Screens.** `/login`, `/`, `/schedule` (week and day), `/grades`,
    `/attendance`, `/news`, a news article, `/profile`, `/offline.html`.
  - **Interaction states.** Hover, press and focus by selector. Matching on
    `[class*="name"]` is acceptable, because the class names are hashed.
  - **Offline banner.** `context.setOffline` after load.
  - **Index pages.** The harness writes the D6 `index.html`.
  - **Spec reference renders** go into `screenshots/reference/`:
    - `specs/pwa/dashboard/dashboard.html?theme=&lang=` (and `&collapsed=1`)
      at 1440, 834 and 390;
    - `specs/pwa/login/source/login-screen.html`;
    - each prototype-v1 view: schedule, grades, news, profile. The prototype
      has a demo login button and `data-view` nav buttons.
- Done when:
  - `README.md` says how to build, serve and run it, in commands a builder can
    paste.
  - A grep of `capture/` finds no URL other than `localhost` / `127.0.0.1`, no
    `.env` read and no credential.
  - `screenshots/baseline/` holds every screen at 1440 in light/dark × FR/AR,
    in the `default` scenario. The dashboard is also captured at 834 and 390,
    and in `loading`, `empty`, `error` and `offline`. Login is also captured in
    `error-credentials` and `rate-limit`.
  - Every fixture-backed screen renders populated, not in its error state.
    PROGRESS.md names any card that will not.
  - A run with a deliberately missing fixture exits non-zero.

### 1. Dashboard: type
- Goal: every dashboard text element the built UI already has uses the Dashboard Spec §5 size, weight, line height, tracking, colour and family.
- Paths:
  - `pwa/components/dashboard/dashboard.module.css`: type declarations only
  - `pwa/components/dashboard/NextClassCard.tsx`, `NotificationsCard.tsx`:
    `.num` → mono class swaps only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m1/**`
- Items:
  - The audit's dashboard type table: card title, heading, next-class subject,
    meta, ring label, notification item, quick link, news title and meta.
  - The countdown pill padding (5 11).
  - The unread count, which has no spec value. Leave it and log it.
  - The card title drops uppercase and its icon size stays, but the icon is
    not removed. Removing it is layout and belongs to M2.
  - The heading is 28/800 at ≥1024 and 24 below, ls −0.4px, with the Arabic
    reset kept.
  - Times use DM Mono (D4).
- Done when:
  - `getComputedStyle` values for each item, before and after, are tabled in
    PROGRESS.md against §5.
  - No layout or spacing property changed.
  - Screenshots: `dashboard` at 1440, all four combinations.

### 2. Dashboard: grid and card structure
- Goal: the dashboard grid matches Dashboard Spec §1, §2 and §6:
  - 1, 2 and 3 columns at <640, 640 and ≥1024, gap 16, `align-items: start`;
  - the GPA and Assiduité cards stacked in column 2, with Assiduité at
    `flex: 1`;
  - Notifications in column 3, spanning both columns on tablet;
  - Accès rapide and the news card spanning every column;
  - cards with padding 20 (16 on Assiduité, 18 on GPA) and a 14px header gap;
  - card titles without their leading icon.
- Amended 2026-11-12, after the M2 review: skeleton matching moved to M3
  (Prochain cours, Notifications, À la une) and M4 (GPA). The reviewer ruled
  that M2 cannot make skeleton heights match within its paths without
  fixture-fitted CSS numbers, because the skeleton block markup is in
  `NextClassCard.tsx`, `GpaCard.tsx`, `NotificationsCard.tsx` and
  `NewsCard.tsx`. M2's Done-when is met without
  it. M2 still owns the shared skeleton CSS rules in `dashboard.module.css`.
- Paths:
  - `pwa/components/dashboard/Dashboard.tsx`, `Card.tsx`
  - `pwa/components/dashboard/dashboard.module.css`: grid, card, header and
    skeleton rules only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m2/**`
- Notes:
  - The §4 entrance stagger order stays in reading order. Re-check it after
    the reorder.
  - Card content stays. The next-class card stays a single next class (Flag 1).
  - Hardening §9: `minmax(0, 1fr)` tracks, `min-width: 0` on text columns.
- Done when:
  - Screenshots in `default` at 1440, 834 and 390, and in `loading` at 1440,
    all four combinations.
  - Typecheck and build pass.
  - (Loading and loaded captures matching edges: moved to M3 and M4 by the
    2026-11-12 amendment. Not required here.)

### 3. Dashboard: card internals
- Goal: inside each card, sizes and spacing match Dashboard Spec §6:
  - the ring at 88 px with a 9 px stroke and gap 16, with the "TAUX" caption
    (9.5/600, `--ink2` per C4);
  - quick-link tiles: `--surface`, 1 px `--hair`, r16, padding 13 14, gap 11,
    a 36 px r10 icon tile with an 18 px icon, and grid gap 12;
  - notification rows: gap 10, padding 10 0, a hairline on every row, and a
    32 px r8 chip with a 15 px icon, coloured per type;
  - next-class rows: the 4×38 rail and gap 12;
  - the news list with gap 10, plus the category pill (11/700, padding 4 10)
    if the list payload already carries the category.
- Paths:
  - `pwa/components/dashboard/Ring.tsx`, `AttendanceCard.tsx`,
    `QuickLinksCard.tsx`, `NotificationsCard.tsx`, `NextClassCard.tsx`,
    `NewsCard.tsx`, `icons.tsx`. This includes the skeleton block markup in
    `NextClassCard.tsx`, `NotificationsCard.tsx` and `NewsCard.tsx` (amended 2026-11-12).
  - `pwa/components/dashboard/Card.tsx`: only to delete the deprecated `icon`
    prop that M2 left. M3 also removes the six `icon=` call sites and their
    imports (amended 2026-11-12).
  - `pwa/components/dashboard/GpaCard.tsx`: only to remove its `icon=` prop
    (`icon={<GpaIcon />}`, ~:58) and that icon's import (~:9). It is one of
    the six call sites, and Card.tsx's prop cannot be deleted while it remains,
    because typecheck would fail. Everything else in GpaCard.tsx stays M4's
    (amended 2026-11-12, M2 re-review).
  - `pwa/components/dashboard/dashboard.module.css`: card-internal rules only.
    New card-specific skeleton block rules for Prochain cours, Notifications and
    À la une count as card-internal. M3 may also change or remove the base
    `.card { min-height: 148px }`, an M2 rule the spec does not have, if
    matching the loaded footprints requires it, and records why in
    PROGRESS.md (amended 2026-11-12, M2 re-review).
  - `pwa/locales/fr.json`, `pwa/locales/ar.json`: the "TAUX" key only, and
    `dashboard.next_class.time_to` (amended 2026-11-13, Islam: the
    screen-reader connector between the next-class start and end times,
    "à" / "إلى", from the M3 reviewer's minor finding)
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m3/**`
- Notes:
  - The quick-link set stays the built four nav links. The spec's three action
    tiles and their subtitles are Flag 2.
  - The quick-link hover becomes the spec's border, fill and text change. The
    press scale is removed in M7, not here.
  - The ring arc colour stays band-driven.
  - The news thumbnail stays as built if the payload has no image field
    (Flag 4).
- Done when:
  - Screenshots in `default` and `loading` at 1440, plus `default` at 390,
    all four combinations.
  - The new string is in both locale files.
  - Card.tsx's `icon` prop, its six call sites and their imports are gone.
  - Prochain cours, Notifications and À la une skeletons overlay their loaded
    cards with matching edges at 1440, 834 and 390 (captured as loading against
    default at all three widths, light/dark × FR/AR). Amended 2026-11-12;
    Prochain cours added the same day after the M2 builder measured its
    skeleton 9-11 px short below 1024 (148 vs 157/159, meta row wraps).
    **Amended 2026-11-13 (Islam's decision, option a): matching edges for
    single-line content.** A difference caused only by a title wrapping to
    more lines is accepted. Why: both remaining gaps (Notifications −3.09,
    À la une −58.69 at 390 FR) come from loaded cards that are incomplete
    against the spec, not from the skeletons. The spec's notification row is
    title plus time and the time line is not built; the news card lacks its
    category pill and thumbnail. When those cards are completed in their
    milestone, the skeletons are re-matched against the complete card, with no
    clamping. Do not tune a skeleton against content that is about to change.
  - Typecheck and build pass.

### 4. Dashboard: jade GPA hero card
- Goal: the GPA card is the spec's jade hero in both themes:
  - `linear-gradient(150deg, #168666, #0F6E56)` (C5), radius 22, padding 18;
  - shadow `0 14px 30px rgba(15,110,86,.30)`;
  - a 160 px depth circle at `rgba(255,255,255,.07)`, top −48 / inline-end
    −48, clipped;
  - white label 12.5/700 uppercase ls .4px (Arabic reset kept);
  - value in DM Mono 32/500 lh 1 with mt 6, and "/20" at 17/400;
  - mention badge 13/700, padding 5 12, gap 7, `rgba(0,0,0,.16)`, mt 10,
    with a 6 px dot (C12).
- Paths:
  - `pwa/app/globals.css`: new tokens only, both theme blocks, with
    contrast-ratio comments
  - `pwa/components/dashboard/GpaCard.tsx`, including its skeleton block
    markup (amended 2026-11-12)
  - `pwa/components/dashboard/dashboard.module.css`: GPA card rules only.
    New card-specific skeleton block rules for the GPA card count as GPA rules
    (amended 2026-11-12, M2 re-review).
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m4/**`
- Notes:
  - Every colour above becomes a custom property:
    - the gradient stops, or one `--gpa-bg`;
    - the shadow;
    - the circle wash;
    - the badge wash;
    - the white ink;
    - the five mention dots.
  - Comment each one with its measured ratio.
  - **Measure white text in both directions** (the circle sits at inline-end,
    so it covers the top-left corner in AR). For each text element, measure at
    its lightest backdrop: the gradient at its position plus the circle, if
    the circle covers it. The pairs are the label, the value, "/20" and the
    badge text on the badge wash.
  - Composite the 8-bit blends as the login hero comments do.
  - Small text needs 4.5:1. The 32 px value is large text and needs 3:1.
  - **If any small text falls under 4.5:1 anywhere it sits, in either
    language, stop this milestone as blocked.** Record every ratio and do not
    ship a compromise. The login hero needed the same kind of decision
    (accepted by Islam on 2026-11-09).
  - Loading, empty ("no published GPA") and error states keep their built
    composition, on the hero background. Each text in them is measured the
    same way.
- Done when:
  - The ratios table is in PROGRESS.md and in the token comments.
  - Screenshots in `default`, `empty`, `loading` and `error` at 1440, plus
    `default` at 390, all four combinations.
  - The hero's edges and circle mirror correctly in AR.
  - (Amended 2026-11-13, same ruling as M3: matching edges for single-line
    content; a difference caused only by wrapped text is accepted.)
  - The GPA skeleton overlays the loaded GPA card with matching edges at 1440,
    834 and 390. Amended 2026-11-12.
  - Typecheck and build pass.

### 5. Shell: sidebar and the U mark
- Goal:
  - `public/logo.svg` is the U mark from `assets/brand/unipocket-u-mark.svg`.
  - The sidebar head shows it as the spec's 34×34 r10 tile: white U on the D4
    tile gradient, head padding 18 16, gap 10, brand 15/800.
  - Nav items are 44 tall, padding 0 12, gap 12, r12 (`--r-md`), 14/600, with
    19 px icons.
  - The foot has padding 12 and a 1 px `--hair` top border.
  - The collapse button is 38 tall, r12, `--surface2`, 12/600, with a 14 px
    chevron.
  - The collapse runs at `--dur-fast var(--ease-in-out)` (D4).
- Paths:
  - `pwa/public/logo.svg`
  - `pwa/app/globals.css`: the tile token only
  - `pwa/components/shell/Sidebar.tsx`, `pwa/components/shell/icons.tsx`
  - `pwa/components/shell/shell.module.css`: sidebar, brand, `.logoMark`,
    nav, foot, collapse and booting-mark rules only
  - `pwa/components/login/login.module.css`: the hero-mark aspect-ratio
    declaration only
  - `pwa/public/offline.html`: the mark rule only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m5/**`
- Notes:
  - Copy the path only. The brand SVG carries an ~8 KB C2PA `<metadata>` block,
    which is dropped. Use its viewBox `15.06 7.89 74.15 79.88`.
  - `logo.svg` is also masked by the login hero (`login.module.css`, 92 px per
    OVERRIDES `login-prototype-code-wins`), by `offline.html` and by the boot
    mark. Every `aspect-ratio: 99 / 143` changes to the new viewBox.
  - That the login and offline marks change too is intended: "the U replaces
    the mortarboard everywhere" (INDEX, Brand).
  - `sw.js` needs no change: VERSION includes the build id.
  - The manifest icons are generated from the repo-root `assets/icons/Logo.svg`
    and are not touched (Flag 5).
  - Collapsed rail: per spec, the logo sits at x16 and nav items are 48×44.
- Done when:
  - Screenshots at 1440 expanded and collapsed, and at 834:
    - the sidebar, all four combinations;
    - `login` and `offline.html` at 1440, all four combinations.
  - No mortarboard path is left in `pwa/public/logo.svg`.
  - Typecheck and build pass.

### 6. Shell: topbar, content frame, tab bar, avatar menu
- Goal:
  - The topbar is sticky, `color-mix(in oklab, var(--bg) 88%, transparent)`
    with blur 10, a hairline bottom, padding 16/24 → 18/32 → 20/48, and title
    19/800 ls −0.3px.
  - Content padding is 24 (bottom 88), 32, then 48 with `max-width: 1200px`,
    centred.
  - The tab bar is 64 tall, label 10.5/600, icon 21, gap 3, with `--ink2` per
    C11.
  - The avatar menu: min-width 220, r16, padding 8, items 40 tall, 16 px icons
    in `--ink3`, separator margin 6 4, 8 px below the trigger.
  - The countdown and menu-item audit items.
- Paths:
  - `pwa/components/shell/Topbar.tsx`, `TabBar.tsx`, `AppShell.tsx` (frame
    markup only), `icons.tsx`
  - `pwa/components/shell/shell.module.css`: topbar, content frame, tab bar
    and menu rules only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m6/**`
- Notes:
  - The avatar button keeps its built icon. The spec's initials need the
    student's name, which the shell does not hold (Flag 3).
  - The bell is out of scope. Leave its space empty and do not add a
    placeholder.
  - The `color-mix` background must not break text contrast under the sticky
    bar. Check the title over scrolled content.
  - The offline banner stays full-width (audit question, Flag 7).
- Done when:
  - Screenshots of `dashboard` and `grades`:
    - at 1440, 834 and 390, all four combinations;
    - one scrolled capture at 1440 showing the sticky blur;
    - the menu open at 1440 in FR and AR.
  - Typecheck and build pass.

### 7. Interaction states: dashboard and shell
- Goal: foundations §3 and §5 hold on the dashboard and the shell:
  - Clickable cards and quick-link tiles lift 1 px and deepen to
    `--shadow-lg` over `--dur-fast`, with no press scale.
  - Buttons press at 0.97 over `--dur-instant`.
  - Each card's focus ring covers its whole click target. The `::after`
    overlay owns the ring, not the title link.
  - Nav, menu and collapse hovers run over `--dur-fast`.
  - The popover enter and exit follow §5.
  - Every hover is guarded by `:not(:disabled)`.
- Paths:
  - `pwa/components/dashboard/dashboard.module.css`,
    `pwa/components/shell/shell.module.css`: state rules (`:hover`, `:active`,
    `:focus-visible`, transitions, the reduced-motion block) only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m7/**`
- Done when:
  - PROGRESS.md has a computed-style table, rest / hover / pressed / focus,
    for each control.
  - Screenshots of hover, press and focus on one card, one quick link, a nav
    item and a menu item at 1440, all four combinations.
  - The reduced-motion check is recorded.
  - Typecheck and build pass.

### 8. Toast stacking
- Goal: toasts stack per foundations §5:
  - new toasts above existing ones, with an 8 px gap;
  - at most 2 visible, so a third dismisses the oldest early;
  - enter over `--dur-fast --ease-out` from translateY(8px);
  - auto-dismiss at 2200 ms except action toasts;
  - non-modal, below panels.
- Paths:
  - `pwa/components/shell/Toast.tsx`
  - `pwa/components/shell/AppShell.tsx`, `pwa/components/pwa/PwaLayer.tsx`:
    toast call sites only
  - `pwa/components/shell/shell.module.css`, `pwa/components/pwa/pwa.module.css`:
    toast rules only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m8/**`
- Notes:
  - There are two toast hosts, AppShell and PwaLayer. If one stack needs a
    shared host, that is the change. Which toasts fire, and when, does not
    change.
  - The visual form follows the Dashboard Spec's `.toast`: `--ink` on `--bg`,
    13.5/600, padding 11 18, pill, `--shadow-lg`. Re-measure the contrast
    comment if colours move.
  - A toast's `role="status"` and `aria-live` stay.
- Done when:
  - Screenshots of one toast and of two stacked toasts at 1440 and 390, all
    four combinations. Trigger them by a harness hook or by forcing the
    `offline` → online transition, not by adding a debug control to the
    product.
  - A three-toast run shows two.
  - Typecheck and build pass.

### 9. Interaction states: every other page
- Goal: foundations §2, §3 and §5 hold on attendance, grades, schedule, news,
  profile and the shared segmented control and panel.
- Paths:
  - The state rules only (`:hover`, `:active`, `:focus-visible`, transitions,
    the reduced-motion blocks) in:
    - `pwa/components/attendance/attendance.module.css`
    - `pwa/components/grades/grades.module.css`
    - `pwa/components/schedule/schedule.module.css`
    - `pwa/components/news/news.module.css`
    - `pwa/components/profile/profile.module.css`
    - `pwa/components/segmented/segmented.module.css`
    - `pwa/components/panel/panel.module.css`
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m9/**`
- Items:
  - **Focus offsets.** 4 → 2 px at `attendance:438`, `grades:45` and
    `schedule:46`.
  - **Segmented control.** The selected option keeps `--jade-text` on hover.
  - **Profile switch.** The thumb and track move over `--dur-instant`. The
    overshoot stays declined, as the built comment says: there is no easing
    token for it (Flag 9).
  - **Profile switch, select and logout.** Add hover. Add press where they are
    buttons. Guard logout `:hover` with `:not(:disabled)`.
  - **Grades calculator select.** Add hover.
  - **Profile reduced motion.** Make it consistent: both the thumb and the
    track collapse to `--dur-instant`.
  - **`linear` audit (D4).** Review every remaining `linear`. Keep it where
    D4 allows it, replace it elsewhere, and list each one in PROGRESS.md.
  - **Audit questions left as questions.** Whether chips and segmented options
    press, and the hovered chip that looks selected. Log them, do not change
    them.
- Done when:
  - Every item is marked holds / fixed / left as a question in PROGRESS.md,
    with computed values.
  - Screenshots of the changed states, all four combinations.
  - Typecheck and build pass.

### 10. Login
- Goal: the login screen matches `screenshots/pwa-login/*` and the Login
  Screen Spec with its overrides applied:
  - `R2-hero-gradient`;
  - `R2-on-green-text`;
  - `login-switch`;
  - `login-prototype-code-wins`, whose items are not defects.

  This covers the default, error-credentials, rate-limit and offline-switch
  states and the input focus and error states (foundations §5).
- Paths:
  - `pwa/components/login/login.module.css`
  - `pwa/components/login/*.tsx`: markup or class changes only
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m10/**`
- Notes:
  - Start with a side-by-side of the build against the eight reference renders
    at 1440×900. Make a difference list in PROGRESS.md, then fix the ones that
    hold.
  - Earlier missions already did the hero tokens (2026-11-09). Re-verify, do
    not redo.
  - Stub `/api/auth/login` with 401, 423 and 429. Refresh answers 401.
- Done when:
  - The difference list is closed: each entry fixed, ruled by an override, or
    flagged.
  - Screenshots of each state at 1440, all four combinations, plus `default`
    at 390.
  - Typecheck and build pass.

### 11. Schedule: toolbar and week view composition
- Goal: the schedule toolbar and week grid take prototype-v1's composition:
  - toolbar order: segmented control at start, week navigation centred,
    actions at end;
  - day headers with the name over the date;
  - an hour gutter;
  - course blocks with an inline-start accent bar, subject over room.

  The finish follows D4.
- Paths:
  - `pwa/components/schedule/ScheduleView.tsx`, `WeekGrid.tsx`, `Schedule.tsx`,
    `skeletons.tsx`
  - `pwa/components/schedule/schedule.module.css`: toolbar, week grid and
    skeleton rules
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m11/**`
- Notes:
  - Five days stay (C13).
  - No print button (Flag 2).
  - **Phone skeleton.** It must match the phone layout: no toggle, and the day
    list (audit, Medium). Fix it here.
  - **Composition list first.** Start with a composition difference list,
    prototype against build, in PROGRESS.md. If it runs past what ten minutes
    of review can hold, ship the toolbar and grid and log the rest for a
    follow-up.
- Done when:
  - Screenshots of week view at 1440 and 834, and of `loading` at 1440 and
    390, all four combinations.
  - The phone loading and loaded captures share a footprint.
  - Typecheck and build pass.

### 12. Schedule: day view composition
- Goal: the day view takes prototype-v1's timeline composition:
  - a time gutter;
  - a connector column;
  - cards.

  It replaces the built card list, and the day-view skeleton matches it.
- Paths:
  - `pwa/components/schedule/DayList.tsx`, `skeletons.tsx`
  - `pwa/components/schedule/schedule.module.css`: day view and skeleton rules
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m12/**`
- Notes: the "today" pill and the course-detail panel trigger stay as built.
- Done when:
  - Screenshots of day view at 1440 and 390, in `default`, `empty` and
    `loading`, all four combinations.
  - Typecheck and build pass.

### 13. Grades: composition
- Goal: the grades page takes prototype-v1's composition:
  - the toolbar (semester tabs at start, actions at end);
  - the GPA hero as the jade hero card, reusing M4's tokens, with the
    prototype's credits line and track where the data exists;
  - the table as one surface card with a header row and hairline rows;
  - status pills at the row end.

  The skeleton matches.
- Paths:
  - `pwa/components/grades/GpaHero.tsx`, `GradesView.tsx`, `GradesTable.tsx`,
    `SemesterTabs.tsx`, `skeletons.tsx`
  - `pwa/components/grades/grades.module.css`
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m13/**`
- Notes:
  - No GPA history card: it is a feature (audit, "Specified, not built").
  - No "Exporter PDF".
  - The "Calculatrice" action stays the built calculator trigger.
  - Every hero text is measured against M4's ratios. If any falls under AA,
    this milestone stops as blocked, as M4 does.
- Done when:
  - Screenshots at 1440 and 390, in `default`, `empty` ("not published") and
    `loading`, all four combinations.
  - Typecheck and build pass.

### 14. News: list composition
- Goal: the news list takes prototype-v1's composition:
  - the category chip row;
  - a two-column card grid at desktop;
  - each card with its image on top, then the category pill, the title, and
    the meta line.

  The skeleton matches.
- Paths:
  - `pwa/components/news/NewsList.tsx`, `News.tsx`, `ArticleMeta.tsx`,
    `HeroImage.tsx`, `skeletons.tsx`
  - `pwa/components/news/news.module.css`: list, card and skeleton rules
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m14/**`
- Notes:
  - No search field and no "Enregistrés" tab unless already built, because
    bookmarks are a feature.
  - The reader has no reference, so it is untouched.
  - Fix the stale "11px text" comment in `ArticleMeta.tsx`.
- Done when:
  - Screenshots at 1440 and 390, in `default`, `empty` and `loading`, all four
    combinations.
  - Typecheck and build pass.

### 15. Profile: composition
- Goal: the profile page takes prototype-v1's composition:
  - the identity card (avatar, name, programme, student ID);
  - sectioned settings cards with headed groups;
  - settings rows with a label and hint at start and the control at end;
  - the sign-out action placed as in the prototype.

  The skeleton matches.
- Paths:
  - `pwa/components/profile/Profile.tsx`, `StudentCard.tsx`,
    `DeviceSettings.tsx`, `NotificationPrefs.tsx`, `OfflineDataRow.tsx`,
    `AccountActions.tsx`, `skeletons.tsx`
  - `pwa/components/profile/profile.module.css`
  - `<MISSION>/PROGRESS.md`, `<MISSION>/screenshots/m15/**`
- Notes:
  - No "Sécurité" / change-password block and no "Vider le cache" (audit, open
    decisions).
  - The offline hint stays where it is (audit question, Flag 9).
- Done when:
  - Screenshots at 1440 and 390, in `default`, `loading` and `offline`, all
    four combinations.
  - Typecheck and build pass.

---

## Flags
None blocks the start. M4 and M13 may block themselves on contrast (see their
notes).

1. **Next-class card vs "Aujourd'hui".** The spec's card lists every class
   today, under a dated title with a countdown. The build shows the next class
   only. Showing more classes is a content change, so it is out (D5). Build it
   in a later mission?
2. **Quick-access tiles.** The spec has three action tiles with subtitles:
   - "Justifier une absence / 1 en attente";
   - "Simuler ma moyenne / Calculatrice";
   - "Imprimer mon planning / Semaine en cours".

   The build has four nav links. "Imprimer" needs the schedule print sheet,
   which is not built, and "1 en attente" needs a count. Both are out. The
   prototype's schedule "Imprimer" and grades "Exporter PDF" buttons are out
   for the same reason.
3. **Greeting, programme line and avatar initials.**
   - The spec's heading is "Bonjour, Amina" with "Licence Informatique ·
     Semestre 4" under it.
   - The avatar is the student's initials.
   - The built heading is "Accueil", and the shell holds no name.

   All three need `/student/me` on the dashboard and shell, which is a new
   request. Out. The page title "Accueil" vs the spec's "Tableau de bord" is a
   copy question for Design.
4. **Dashboard news thumbnails and the card links.** "Voir tout" on the
   Aujourd'hui and Actualités cards are new navigation. "Tout voir" on
   Notifications opens the bell, which is out of scope. The news thumbnail
   needs an image field. All are out unless already present.
5. **Manifest icons still show the mortarboard.** `pwa/scripts/generate-icons.mjs`
   reads the repo-root `assets/icons/Logo.svg`, which the native app shares.
   Regenerating the icons from the U means touching the app's asset, a
   different product. Separate decision.
6. **Schedule week: 5 days or 7?** Prototype-v1 draws Sunday to Saturday. The
   Djibouti week is Sunday to Thursday, and the build shows five. Kept at five.
7. **Offline banner.** It stays full-width. The dashboard CSS draws it as a
   card that `dashboard.html` never shows, and its icon and border use
   `--warning` at 2.15:1 (audit questions). Left for Design.
8. **The other screens' rules in `dashboard/css/app.css`.** The file has rules
   for schedule, grades, news and profile that no reference page renders.
   They may be newer than prototype-v1. Not used here. Should Design say
   whether they are current?
9. **Type and spacing on the four prototype-only pages.** D4 keeps the built
   values. Each milestone logs its remaining type and spacing questions, along
   with the declined switch overshoot and the offline-hint placement. Should
   Design specify these pages, or should the built values become the spec?
10. **Avatar menu items at 40 px.** The spec says 40 (C14). The build chose 44
    as a touch target. Following the spec. Revert if 44 was a product rule.
11. **`gh` is not on the Bash PATH.** It is at
    `C:/Program Files/GitHub CLI/gh.exe`. The settings allow-list matches
    `gh pr create:*` only, so a full-path call may prompt. If a builder cannot
    open PRs, the branches are pushed and the PR text is in PROGRESS.md.
12. **Attendance page composition.** Attendance is not in the brief's page
    list. Prototype-v1 draws a jade Présence hero, and `app.css` styles it
    `.hero-jade`. Only M9's foundations fixes touch attendance here. Its own
    composition pass?
13. **Should the harness become permanent?** It lives untracked in this mission
    folder (D2). Committing it, for example as a dev-only tool outside `pwa/`,
    would close README's "design checker cannot screenshot" gap for good.
    That is a human decision.
14. **Mention dot for "Insuffisant" and others.** Prototype-v1's `MENTIONS`
    map is the only source for the dot colours. Any mention it does not cover
    gets no dot (C12).

## Schema
No. No file under `backend/` is touched.
