# Progress

## Milestone 1: Submit button and drop zone: hover, press, easing

Branch: `feature/pwa-justification-submit-dropzone-states`, cut from `origin/develop` at 5e10463.
Status: built, checked, pushed. **Not merged.** No PR opened, because `gh` is not installed. The ready-to-paste PR is below.

### What was done
Only `pwa/components/attendance/attendance.module.css` changed, and only the rules the milestone lists. I re-checked the line numbers against 5e10463 before editing, and they matched the planner's table: `.dropZone` 783-795, `.submit` 878-895, reduced-motion block 1202-1243.
- `.dropZone`: the transition went from `var(--dur-instant) linear` to `var(--dur-fast) var(--ease-out)` on both border-color and background-color. This fixes the audit's Medium `linear` finding. The comment now explains why the duration is split.
- New `.dropZoneLive:not(.dropZoneBusy):hover`: `--jade` border and `--jade-faint` fill, the same values as dragover. It sits between `.dropZoneLive` and `.dropZoneDragging`.
- `.dropZoneDragging`: added `transition-duration: var(--dur-instant)` (§5 dragover).
- `.submit`: added `transition: background var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out)`.
- New `.submit:hover:not(:disabled) { background: var(--jade-hover) }` and `.submit:active:not(:disabled) { transform: scale(0.97) }`. These mirror login's `.submit`. `.submit:disabled` is unchanged.
- Reduced-motion block:
  - `.submit` is added to the list that collapses to `--dur-instant` linear.
  - `.submit:active:not(:disabled)` is added to the list whose transform is `none`.
  - **Deviation from the mission's wording.** The mission says to add `.submit:active`. A bare `.submit:active` is (0,2,0) and loses to the new `.submit:active:not(:disabled)` (0,3,0), because a media query adds no specificity. The override has to repeat the full selector to win. I verified it in the browser with `reducedMotion: 'reduce'`: the pressed transform is `none`, and the transition is `0.1s linear`.
- No TSX change.

### Test data: what was real and what was stubbed
- **Upload: stubbed.** `page.route('**/api/backend/student/attendance/*/justification')` was registered before any page loaded. It was always fulfilled with a fake 200 PENDING body and never continued.
  - In the screenshot run it received 0 requests. The press was released off the button, so no click fired.
  - In the reduced-motion/busy run it received 1 request on purpose, held 4s so the busy state could be observed. That request was fulfilled by the stub and never reached the server.
- **GET attendance: stubbed.** The test account has 9 records, and `canSubmitJustification` is false on every one, so no form was reachable.
  - The stub calls `route.fetch()` for the live GET response. It sets `canSubmitJustification: true` on the 4 records that are `ABSENT` with `justificationStatus: null`, then fulfils the request with that body.
  - Everything else is the server's real data, so `band`, `absencesLeft` and the rest of the `lib/attendance-contract.ts` shape are genuine.
- The login was real. Language and theme were set through the app's own Profile → device controls.
- Scripts live outside the repo, in the session scratchpad. No credential is in any file.

### Computed values (Playwright, `getComputedStyle`)
The rows below are the same in FR and AR. Each pair of values is light / dark.

| State | Background | Border | Transform |
|---|---|---|---|
| submit, rest | rgb(29,158,117) / rgb(43,185,137) | n/a | none |
| submit, hover | rgb(34,176,131) / rgb(63,203,154), the `--jade-hover` values #22B083 / #3FCB9A | n/a | none |
| submit, pressed | `--jade-hover` | n/a | `matrix(0.97,…)` |
| submit, no file, hover | identical to rest: `--jade`, opacity 0.5, `not-allowed` | n/a | none |
| drop zone, rest | `--surface2` | `--hair2` | n/a |
| drop zone, hover | rgba(29,158,117,.10) / rgba(43,185,137,.16) | `--jade` | n/a |
| drop zone, busy, hovered | rest values | rest values | n/a |

Transitions:
- drop zone: `0.18s cubic-bezier(0.16, 1, 0.3, 1)`.
- submit: background 0.18s and transform 0.1s, both on that curve.

Reduced motion: both controls run `0.1s linear`, and the pressed submit has transform `none`.

In the built CSS, `.dropZoneDragging` carries `transition-duration:var(--dur-instant)`, confirmed in `.next/static/chunks/*.css`. I did not drive a real drag-and-drop in Playwright.

### Screenshots (`screenshots/m1/`)
For each of `fr-light`, `fr-dark`, `ar-light` and `ar-dark`:
- `-nofile-submit-rest`, `-nofile-submit-hover`: these two must be identical, and they are;
- `-file-rest`: drop zone and submit at rest, with a valid file selected;
- `-file-dropzone-hover`;
- `-file-submit-hover`;
- `-file-submit-pressed`.

There is also `fr-light-busy-dropzone-hover.png`, taken under reduced motion: a busy zone does not hover.

### Checks
`grep -n linear pwa/components/attendance/attendance.module.css`:
```
1090:  background-image: linear-gradient(
1100:  animation: shimmer 900ms linear infinite;
1239:    animation-timing-function: linear;
1246:    transition-timing-function: linear;
1256:    transition-timing-function: linear;
```
1090 and 1100 are the shimmer. 1239, 1246 and 1256 are inside the reduced-motion block, which starts at 1226. No other `linear` remains.

`npm run typecheck` (exit 0):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```

`npm run build`:
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 7.2s

  Creating an optimized production build ...
✓ Compiled successfully in 32.3s
  Running TypeScript ...
✓ Finished writing to filesystem cache in 12.0s
  Finished TypeScript in 32.2s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 2.0s
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule

ƒ  (Dynamic)  server-rendered on demand
```

### Flagged
- **Arabic file size renders as "KB 1"** in the drop zone. You can see it in `ar-*-file-*.png`. `formatSize` output in `.dropFileSize` is not wrapped with `lib/bidi.tsx` `fmtLtr`, so the bidi algorithm reorders the figure and the unit. This existed before this milestone and is out of scope here. It needs its own ticket, and it touches `JustificationForm.tsx`.
- **The reduced-motion selector differs from the mission's wording.** The mission says `.submit:active`; I used `.submit:active:not(:disabled)`. The reason is under "What was done".
- No user-facing copy was added.

### Could not do
- Open the PR: `gh` is not installed. The branch is pushed, and the title and description are below.
- A real drag-and-drop gesture in Playwright. The dragover duration is verified in the built CSS only.

### PR (ready to paste)
Title: `fix(pwa): justification submit and drop zone hover, press and easing`

Body:
```
Milestone 1 of .claude/missions/2026-11-11-pwa-justification-form-arabic-tracking.
Does not touch backend/prisma/schema.prisma (PWA CSS only).

CSS only, in pwa/components/attendance/attendance.module.css:

- .submit: §5 button states, mirroring login's .submit. The background eases
  over --dur-fast and the transform over --dur-instant, both on --ease-out.
  :hover:not(:disabled) goes to --jade-hover, :active:not(:disabled) presses to
  scale(0.97). .submit:disabled is unchanged, so a disabled button neither
  hovers nor presses.
- .dropZone: the transition moves off `linear` (audit, Medium) to --ease-out,
  over --dur-fast for the §3 hover.
- New .dropZoneLive:not(.dropZoneBusy):hover: --jade border and --jade-faint
  fill, the same signal as dragover. A busy zone has no hover.
- .dropZoneDragging keeps §5's --dur-instant through its own
  transition-duration.
- Reduced motion: .submit collapses to --dur-instant linear, and the pressed
  .submit has no transform. The override repeats `:active:not(:disabled)`
  because a bare `.submit:active` would lose on specificity.

No TSX change.

Checks: `npm run typecheck` and `npm run build` pass in pwa/ (pwa has no CI
job). Outputs, computed-style values and FR/AR × light/dark screenshots are in
the mission's PROGRESS.md and screenshots/m1/. The upload was stubbed and
never reached the server. GET attendance was stubbed from the live response
with canSubmitJustification flipped on, because the test account has no
justifiable absence.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Milestone 3 — Arabic: no tracking on translated labels

Branch `feature/pwa-arabic-label-tracking`, cut from `origin/develop` at 5e10463.

### What was done
- I re-checked every line number in the mission's label table against 5e10463. All of them were correct.
- I added 12 reset rules, each `html[lang="ar"] .<rule> { letter-spacing: normal; }`, placed directly after the rule it overrides. No existing line was changed (`git diff` has zero `-` lines).
  - `attendance.module.css`: `.heroLabel` (full comment), `.panelDateLabel`, `.noteLabel`, `.formLabel` (pointers)
  - `dashboard.module.css`: `.cardTitle` (full comment)
  - `grades.module.css`: `.heroLabel` (full comment), `.sortButton`, `.cardLabel`, `.calcLabel` (pointers)
  - `schedule.module.css`: `.dayName` (full comment), `.detailType .typePill` (pointer), `.detailLabel` (pointer)
- `.blockType` was not touched. The DayList `.typePill` is not matched, because the reset is scoped to `.detailType`.
- `globals.css`: comment only, placed after `html[lang="ar"] body`. It states the convention and the three reasons, and carries the verbatim sentence.
- One small departure: the `.detailType .typePill` pointer has two extra lines explaining why it is scoped (DayList's pill shows the Latin code). Without that, the next author is likely to "simplify" the selector to `.typePill`.
- `git diff` contains no `dir=` selector. The only `[dir="rtl"]` text is inside the verbatim mission comment.
- The built CSS (`.next/static/chunks/*.css`) contains all 12 rules, hashed. `html[lang="ar"]` worked inside CSS Modules without `:global()`.

### Typecheck and build (pwa/)
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit

> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 7.0s
  Creating an optimized production build ...
✓ Compiled successfully in 24.0s
  Running TypeScript ...
  Finished TypeScript in 13.8s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 2.0s
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule
```
Both exited 0, and typecheck printed no errors.

Rules found in the built CSS:
```
html[lang=ar] .attendance-module__x3Sz0G__formLabel{letter-spacing:normal}
html[lang=ar] .attendance-module__x3Sz0G__heroLabel{letter-spacing:normal}
html[lang=ar] .attendance-module__x3Sz0G__noteLabel{letter-spacing:normal}
html[lang=ar] .attendance-module__x3Sz0G__panelDateLabel{letter-spacing:normal}
html[lang=ar] .dashboard-module__TLbDmW__cardTitle{letter-spacing:normal}
html[lang=ar] .grades-module__gHKvdW__calcLabel{letter-spacing:normal}
html[lang=ar] .grades-module__gHKvdW__cardLabel{letter-spacing:normal}
html[lang=ar] .grades-module__gHKvdW__heroLabel{letter-spacing:normal}
html[lang=ar] .grades-module__gHKvdW__sortButton{letter-spacing:normal}
html[lang=ar] .schedule-module__Z3P5OW__dayName{letter-spacing:normal}
html[lang=ar] .schedule-module__Z3P5OW__detailLabel{letter-spacing:normal}
html[lang=ar] .schedule-module__Z3P5OW__detailType .schedule-module__Z3P5OW__typePill{letter-spacing:normal}
```

### Computed letter-spacing (`getComputedStyle(el).letterSpacing`)
These are from the production build (`next start -p 3103`), Chrome, real test account, language set by the `unipocket_lang` cookie. `document.documentElement.lang` was confirmed as `fr` or `ar` for each reading. Origin key:
- **live**: read from the rendered page with real data.
- **live, stubbed data**: read from the rendered page, with GET responses stubbed by Playwright (see "Real vs stubbed"). These rows were first verified against the built CSS only; the fix round re-read them live.
- **built CSS**: a cross-check, not a substitute. Its value was read in Chrome from a synthetic `<html lang>` page that loads the built `.next/static/chunks/*.css` and carries the hashed class names. The live-reachable classes in the "control" rows were measured both ways, and the two methods agreed.

| # | Rule | FR | AR | Expected AR | Origin |
|---|---|---|---|---|---|
| 1 | attendance `.heroLabel` | 0.48px | normal | normal | live (control: built CSS agrees) |
| 2 | attendance `.panelDateLabel` | 0.6px | normal | normal | live |
| 3 | attendance `.noteLabel` | 0.6px | normal | normal | live |
| 4 | attendance `.formLabel` | 0.6px | normal | normal | live, stubbed data (built CSS agrees) |
| 5 | dashboard `.cardTitle` | 0.48px | normal | normal | live (control: built CSS agrees) |
| 6 | grades `.heroLabel` | 0.48px | normal | normal | live, stubbed data (built CSS agrees) |
| 7 | grades `.sortButton` | 0.345px | normal | normal | live, stubbed data (built CSS agrees) |
| 8 | grades `.cardLabel` | 0.6px | normal | normal | live, stubbed data, 390px (built CSS agrees) |
| 9 | grades `.calcLabel` | 0.66px | normal | normal | live, stubbed data (built CSS agrees) |
| 10 | schedule `.dayName` | 0.44px | normal | normal | live |
| 11 | schedule `.detailLabel` | 0.66px | normal | normal | live |
| 12 | schedule `.typePill` in CourseDetail (`.detailType`) | 0.72px | normal | normal | live (built CSS agrees) |
| 13 | schedule `.blockType` | 0.76px | 0.76px | unchanged | live (control: built CSS agrees) |
| — | schedule `.typePill` in DayList (bare) | 0.72px | 0.72px | unchanged | live at 390px (built CSS agrees) |

The FR values equal the original em values at each font size (for example 0.04em × 12px = 0.48px, and 0.03em × 11.5px = 0.345px).

### Screenshots (`screenshots/m3/`, all AR, light)
- `ar-attendance-hero.png`
- `ar-attendance-panel-panelDateLabel.png`
- `ar-attendance-panel-noteLabel.png`: the justification panel
- `ar-dashboard-card-title.png`
- `ar-grades-hero-table-header.png`: the grades hero and the desktop table header (`.sortButton`), with stubbed data
- `ar-grades-phone-cards.png`: the phone cards (`.cardLabel`) at 390px, with stubbed data
- `ar-grades-calculator.png`: the calculator labels (`.calcLabel`), with stubbed data
- `ar-attendance-upload-form.png`: the open upload form (`.formLabel` on the file label and the note label), with stubbed data
- The round-1 grades screenshots, which showed only the "not published yet" empty state under misleading names, were overwritten by the first two files above. No empty-state screenshot is kept.
- `ar-schedule-week-header.png`, `ar-schedule-course-detail.png`, `ar-schedule-daylist.png`

### Real vs stubbed
Round 1 (`scratchpad/m3/check.js`): nothing stubbed. This covers rows 1-3, 5 and 10-13, the DayList pill, and screenshots `ar-attendance-hero`, `ar-attendance-panel-*`, `ar-dashboard-card-title` and `ar-schedule-*`.

Fix round (`scratchpad/m3/check2.js`): rows 4 and 6-9, and the four screenshots marked "stubbed data". The routes were registered on the browser context before anything was opened:
- **`**/api/backend/student/attendance/*/justification`**: fulfilled locally with a 500 and never continued to the server. It was never hit, because nothing was submitted.
- **GET `**/api/backend/student/attendance`**: the **live** response, fetched through `route.fetch()`. One field was changed: the first `ABSENT` record with `justificationStatus: null` and no `justificationUrl` got `canSubmitJustification: true`. Everything else, including `band` and `absencesLeft`, is real, so `checkAttendanceContract` passes unchanged.
- **GET `**/api/backend/student/grades`** (single semester): the **live** response's `semester` and `credits` were kept. Changed: `ccPublished` and `nfPublished` set to true, `gpa` 12.4, `mention` null, and `grades` replaced by a **fixture** of four rows. The rows use the account's own schedule subjects (INF301, PHY301, INF303, INF302, with their FR/AR names) and invented marks. The live API returns `grades: []` while nothing is published. Credits stay live, which is why the hero reads "0 / 32".
- **GET `**/api/backend/student/grades?allSemesters=true`**: the live response with each semester's `gpa` set to 12.4.
- **Real**: login, the session, all other endpoints, and every string on screen (all from locales).

Nothing was submitted and nothing on the account changed.

### Flagged
- **Test data gap.** The test account has no published grades (S1 or S2) and no absence that can still be justified. The five classes that need them were checked live against stubbed GET responses (see "Real vs stubbed"). A test account with published grades and a recent absence would remove the need for stubs.
- **Port note.** In round 1 my "stop the server" step filtered netstat on `LISTENING`, but the state column is localized on this machine, so the 3103 server kept running until the fix round. That process was mine (`udj-wt-m3/pwa`, same build). It has been stopped; 3101 was not touched.
- Mission Flag 2 (the CLAUDE.md wording for `html[lang="ar"]`) still stands. I did not edit CLAUDE.md.

### Could not do
- Open the PR: `gh` is not installed. The branch is pushed, and the PR text is below.

### PR
**Title:** `fix(pwa): no letter-spacing on translated labels in Arabic`

**Description:**
```
Does not touch backend/prisma/schema.prisma.

Milestone 3 of .claude/missions/2026-11-11-pwa-justification-form-arabic-tracking.

Arabic letters join, and the positive tracking on our uppercase labels pulls
them apart. This adds 12 `html[lang="ar"] .<rule> { letter-spacing: normal; }`
resets, each directly after the rule it overrides, in the attendance, dashboard,
grades and schedule modules. No existing line changes; French is unchanged.

- Kept: `.blockType` and the DayList `.typePill` (both show the Latin course
  code). The schedule reset is scoped to `.detailType .typePill`, where the pill
  carries the translated label.
- globals.css: comment only, stating the convention (resets live beside their
  rule, not globally) and why a `lang` selector is not a `[dir="rtl"]` selector.

Checks (pwa/ has no CI job): `npm run typecheck` and `npm run build` pass.
Computed letter-spacing in FR and AR for all 13 rules, plus the DayList pill,
is in PROGRESS.md. The grades labels and `.formLabel` were read live against
stubbed GET responses, because the test account has no published grades and no
justifiable absence. The stubs are listed in PROGRESS.md; nothing was submitted.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Milestone 4 — Arabic: no negative tracking on translated headings

Branch `feature/pwa-arabic-heading-tracking`, cut from `origin/develop` at 5e10463.

### What was done
- I re-checked every line in the mission's heading table against 5e10463. All of them matched.
- I added 11 `letter-spacing: normal` resets keyed on `html[lang="ar"]`. Each sits directly after the rule it overrides. No existing line changed: the diff is additions only.
  - `attendance.module.css` `.heading`
  - `dashboard.module.css` `.heading`
  - `grades.module.css` `.heading`
  - `schedule.module.css` `.heading`
  - `news.module.css` `.heading` and `.readerTitle`
  - `profile.module.css` `.heading`
  - `shell.module.css` `.title` and `.pageHeading`
  - `login.module.css` `.brand`
  - `public/offline.html` `.brand`, in the inline `<style>`, beside its existing `html[lang="ar"]` rules
- Comments follow the Decision section:
  - the full verbatim sentence goes on the first reset in each module; *(superseded after the rebase in attendance, dashboard, grades and schedule — see "rebase onto develop" below)*
  - the second reset in news and shell carries the pointer (`see the note at .heading` / `.title`);
  - offline.html has one line.
- Unchanged: `.brandName`, `.heroNumber`, `.subjectValue`, `.unreadCount`, `.calcCurrentValue`, `.calcResultValue`, `.langCode`, `.inputId`. sw.js and globals.css are not touched either.
- `git diff | grep 'dir='`: the only hits are the verbatim comment text `[dir="rtl"]`, which the mission requires. There is no `dir=` selector.
- The build emitted all 10 module resets as pure local selectors, without `:global()`. From `.next/static`:
  ```
  html[lang=ar] .attendance-module__x3Sz0G__heading{letter-spacing:normal}
  html[lang=ar] .dashboard-module__TLbDmW__heading{letter-spacing:normal}
  html[lang=ar] .grades-module__gHKvdW__heading{letter-spacing:normal}
  html[lang=ar] .login-module__r9bFSG__brand{letter-spacing:normal}
  html[lang=ar] .news-module__fX7sZa__heading{letter-spacing:normal}
  html[lang=ar] .news-module__fX7sZa__readerTitle{letter-spacing:normal}
  html[lang=ar] .profile-module__rFBM0W__heading{letter-spacing:normal}
  html[lang=ar] .schedule-module__Z3P5OW__heading{letter-spacing:normal}
  html[lang=ar] .shell-module___5GqhW__pageHeading{letter-spacing:normal}
  html[lang=ar] .shell-module___5GqhW__title{letter-spacing:normal}
  ```

### Service worker (sw.js read, not touched)
`public/sw.js` ~62-106: the page registers the worker as `/sw.js?build=<NEXT_PUBLIC_BUILD_ID>` (`components/pwa/service-worker.ts:23`).
- `VERSION = unipocket-v${CACHE_SCHEMA}-${BUILD}`, and `STATIC_CACHE` is derived from it.
- `/offline.html` is in `PRECACHE_URLS` (line 133), fetched with `cache: 'reload'` on install (line 161).
- `activate` deletes every cache not in `CURRENT_CACHES` (line 186).

So a deploy installs a new worker, which caches a fresh `offline.html` under a new per-build cache name and drops the old one once the student accepts the update. **No `CACHE_SCHEMA` bump is needed**, and sw.js is unchanged.

### Checks (pwa/)
`npm run typecheck`:
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit

EXIT 0
```
`npm run build` (env value lines omitted; none were printed):
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 2.3s

  Creating an optimized production build ...
✓ Compiled successfully in 25.6s
  Running TypeScript ...
  Finished TypeScript in 28.2s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/12) ...
✓ Generating static pages using 7 workers (12/12) in 1447ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule

ƒ  (Dynamic)  server-rendered on demand

EXIT 0
```

### Computed letter-spacing (Playwright, `next start -p 3104`, real test account, read-only)
Language is set with the `unipocket_lang` cookie. Values are `getComputedStyle(el).letterSpacing`, and the element's `<html lang>` was confirmed for each row. **Everything is real data. Nothing is stubbed.** No form was submitted, apart from the login.

| Rule | Where | FR | AR | Expected |
|---|---|---|---|---|
| attendance `.heading` | /attendance | -0.3px | normal | reset |
| dashboard `.heading` | / | -0.3px | normal | reset |
| grades `.heading` | /grades | -0.3px | normal | reset |
| schedule `.heading` | /schedule | -0.3px | normal | reset |
| news `.heading` | /news | -0.3px | normal | reset |
| news `.readerTitle` | /news?article=… | -0.3px | normal | reset |
| profile `.heading` | /profile | -0.3px | normal | reset |
| shell `.title` (topbar) | every page, at 1280 and 390 | -0.2px | normal | reset |
| shell `.pageHeading` | not rendered: `RoutePlaceholder` is imported nowhere now | n/a | n/a | checked in the build CSS (above): `html[lang=ar] .shell-module___5GqhW__pageHeading{letter-spacing:normal}` |
| login `.brand` | /login | -0.3px | normal | reset |
| offline.html `.brand` | /offline.html, `lang` set by Playwright | -0.3px | normal | reset |
| shell `.brandName` "Unipocket" | / @1280 (the sidebar is hidden at 390) | -0.2px | -0.2px | keep |
| attendance `.heroNumber` | /attendance | -1.32px | -1.32px | keep |
| attendance `.subjectValue` | /attendance | -0.34px | -0.34px | keep |
| dashboard `.unreadCount` | / | -1.02px | -1.02px | keep |
| login `.langCode` | /login | 0.22px | 0.22px | keep |
| login `.inputId` | /login | 0.29px | 0.29px | keep |
| dashboard / grades `.heroNumber` | not rendered: the test account has no published GPA ("results not published") | n/a | n/a | unchanged by the diff |

### Screenshots (`screenshots/m4/`, AR, light, 1280 unless noted)
- `ar-attendance.png`, `ar-dashboard.png`, `ar-grades.png`, `ar-schedule.png`, `ar-news.png`, `ar-profile.png`: page headings, with the topbar title also visible at 1280.
- `ar-news-article.png`: an article title.
- `ar-topbar-title-390.png`: the topbar title at phone width.
- `ar-login-brand.png`: "جامعة جيبوتي".
- `ar-offline.png`: offline.html.

### Flagged
- **Comment collision with milestone 3 (for whoever merges second).** *(Done after the rebase — see "rebase onto develop" below.)*
  - In attendance, dashboard, grades and schedule, this branch's `.heading` reset is the first `html[lang="ar"]` rule in the file, so it carries the full verbatim comment.
  - Milestone 3 also puts the full comment on *its* first reset in those four files.
  - After both merge, each of those files has the full sentence twice. Taken literally, the Decision section wants the later one (milestone 3's, lower in the file) reduced to `/* Arabic: no tracking — see the note at .heading. */`.
  - This is a one-line follow-up for whoever merges second. I did not do it, because it is outside this milestone's paths.
- **`.pageHeading` is dead in practice.** `RoutePlaceholder.tsx` is not imported anywhere, so the reset is verified only in the built CSS. That is not in scope here.
- No user-facing copy was added.

### Could not do
- **No PR opened.** `gh` is not installed. The branch is pushed, and the PR text is below.
- **Dashboard and grades `.heroNumber` not read live.** The test account has no published GPA. The attendance `.heroNumber` stands in, and the diff does not touch any figure rule.

### PR (ready to paste)
**Title:** `fix(pwa): no negative letter-spacing on Arabic headings`

**Description:**
```
Does not touch backend/prisma/schema.prisma.

Mission 2026-11-11-pwa-justification-form-arabic-tracking, milestone 4.

In Arabic (`<html lang="ar">`), the 11 translated headings no longer apply negative letter-spacing. Tracking pulls apart Arabic letters, which join. French is unchanged.

- Each reset is `html[lang="ar"] .<rule> { letter-spacing: normal; }`, placed directly after the rule it overrides. The diff is additions only.
- Files: attendance, dashboard, grades, schedule and profile `.heading`; news `.heading` and `.readerTitle`; shell `.title` (topbar) and `.pageHeading`; login `.brand`; `public/offline.html` `.brand`.
- The selectors are keyed on language, not direction. They are not `[dir="rtl"]` selectors, and the comment beside each one says why. Do not remove them as a breach of the no-`[dir="rtl"]` rule.
- Kept, because the text is always Latin: `.brandName` ("Unipocket"), the `.num` figures, `.langCode` and `.inputId`.
- sw.js is unchanged. The offline cache is per build (`?build=` drives VERSION), so a deploy refreshes offline.html.

Checks, by hand, since pwa/ has no CI:
- `npm run typecheck` and `npm run build` pass.
- Computed letter-spacing was read with Playwright in FR and AR. The table and screenshots are in the mission's PROGRESS.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Milestone 4: rebase onto develop after 1 and 3 merged (orchestrator, 2026-11-11)
- Rebased onto `origin/develop` at bd64f1d (milestones 1 and 3 merged). The only conflict was this file. It was resolved by keeping develop's Milestone 1 and 3 sections and appending the Milestone 4 section. The CSS merged cleanly.
- **Comment de-duplication, as Islam directed.** In attendance, dashboard, grades and schedule, milestone 3's reset already carries the full "Keyed on language…" comment. Milestone 4's copy above `.heading` is replaced with a pointer to that rule:
  - attendance: `.heroLabel`
  - dashboard: `.cardTitle`
  - grades: `.heroLabel`
  - schedule: `.dayName`
  
  Each of those files now has the full comment exactly once.
- **Departure from the mission.** The mission puts the full comment on the *first* reset in each file. In these four files, the pointer at `.heading` now sits above the rule that carries the full comment, and points down to it. news, profile, shell and login are unchanged and keep the full comment on their first reset.
- **Checks.** `npm run typecheck` exits 0 (`tsc --noEmit`, no output). `npm run build` exits 0, and all 12 routes compile.
- **Built CSS.** The built CSS has 22 distinct `html[lang=ar] … {letter-spacing:normal}` rules: the 12 from milestone 3 and the 10 module rules from milestone 4. The 11th milestone 4 rule is in `public/offline.html`, outside the build.
- **Not re-run.** The browser screenshots and the computed-style table were not re-taken. The rebase changed no selector or declaration, only comments.

## Milestone 2: Field errors: on the drop zone, on the note, and the rest kept apart

Branch: `feature/pwa-justification-field-errors`, cut from `origin/develop` at bd64f1d (milestones 1 and 3 merged).
Status: built, checked, pushed. **Not merged.** No PR opened, because `gh` is not installed. The ready-to-paste PR is below.

### What was done
I re-checked the line numbers first. Milestones 1 and 3 had moved them: at bd64f1d `.dropZone` was at 806, `.noteInput` at 951, `.formError` at 985 and the reduced-motion block at 1249. In the TSX, the drop zone was at 230-279, the error box at 292-296, the note at 298-308 and `errorKey` at 372-423. The backend note sentences are at `backend/src/routes/student.ts:1032` ("Invalid note") and `:1036` ("Note must be 80 characters or fewer").

**`pwa/components/attendance/JustificationForm.tsx`**
- The single `error` state is replaced by three: `fileError`, `noteError` and `formError`.
- `errorKey` now returns `{ field: 'file' | 'note' | 'form', key }`. The submit `catch` switches on `field`.
- In `case 400`, the note test (`/note/i`) comes first. The comment beside "STILL BY SENTENCE" names both backend sentences.
- Clearing:
  - `fileError` and `formError` clear when a new file is accepted.
  - `noteError` clears in the note's `onChange`.
  - All three clear on submit.
  - `accept()` still refuses a bad file with `setFile(null)`.
- Drop zone:
  - `.dropZoneError` is applied while `fileError` is set.
  - The hidden input gets `aria-invalid`. `aria-describedby` is still the hint plus the error.
- File message: a `<p class=fieldError role="alert">` directly beneath the zone, above the formats hint.
- Note:
  - The label `<p>` has an id, and the input has `aria-labelledby`. It had no accessible name before.
  - `aria-describedby` points at the hint, or at the error while one is shown.
  - In error, the input gets `aria-invalid` and `.noteInputError`. The hint is replaced by a `fieldError` message with `role="alert"`.
- Form errors: the existing `.formError` box moved to sit immediately above the submit button, after the progress bar. That bar only renders while uploading, and every error clears on submit, so the two never show together. `role="alert"` and the `Interpolated` call are unchanged.

**`pwa/components/attendance/attendance.module.css`**
- The hover rule is now `.dropZoneLive:not(.dropZoneBusy):not(.dropZoneError):hover`, so hover never repaints an errored zone.
- New `.dropZoneError`: `--danger` border and `--danger-bg` fill. It sits **before** `.dropZoneDragging` at the same specificity, so dragging wins. The resulting order, highest first, is busy, dragging, error, hover, rest. Busy and error never coexist, because every error clears on submit.
- `.noteInput`: `background` added to its transition, as login's `.input` has it.
- New `.noteInputError`: the same fill and border. It is weaker than `:focus-visible` (0,1,0 against 0,2,0), so a focused errored field gets the jade border and ring over the danger fill. That is login's behaviour.
- New `.fieldError` and `@keyframes fieldErrorIn`:
  - plain `--danger-ink` text at 12.5px / 1.5, which matches `.formHint`;
  - `max-height` 0 → 240px and `opacity` 0 → 1, over `--dur-fast` `--ease-out`, with no forwards fill. This is login's `errorCardIn` technique, and the comment cites it.
  - One addition: `margin-block-start` goes from -8px to 0. It takes back the form's flex `gap`, so the content below slides down instead of jumping 8px on the first frame. Login animates its `margin-bottom` for the same reason.
- `.formError`: the comment is rewritten for its new role. Its declarations are unchanged.
- Reduced motion: `.fieldError` joins `.confirmChipEntering` (`--dur-instant`, linear).

**`pwa/app/globals.css`**: the `--danger-ink` comment, in both theme blocks, now names this use and its measured ratio. No value changed.

No change to `upload.ts`, the locales, or any other file. `grep -n linear` in attendance.module.css still shows only the shimmer and the reduced-motion block.

### Classification: every error key and the field it lands on
There are 13 `attendance.upload.error.*` keys. A 14th, `attendance.panel.none.note_hint`, is now used as the note error (Flag 1). Some keys are reached from more than one path, so the table has one row per path. All rows were verified live, except where marked.

| Source | Key | Field | Verified |
|---|---|---|---|
| client `validateFile`: type | `error.type` | file | live (`.txt` through `setInputFiles`, 0 requests) |
| client `validateFile`: size | `error.too_large` | file | live (5 MB file at 390px) |
| client `validateFile`: empty | `error.empty` | file | live (0-byte file) |
| client `onDrop`: more than one file | `error.multiple` | file | live (synthetic `drop` with 2 files) |
| 400 matching `/note/i` ("Note must be 80…", "Invalid note") | `panel.none.note_hint` | **note** | live, both sentences |
| 400 matching `/type/i` | `error.type` | file | live |
| 400 matching `/large\|size\|5\s*mb/i` | `error.too_large` | file | live |
| 400, anything else | `error.rejected` | **form** | live ("Missing file field…") |
| 404 | `error.not_found` | form | live |
| 409 `DEADLINE_PASSED` | `error.deadline` | form | live |
| 409 `NOT_ABSENT` | `error.not_absent` | form | live |
| 409, no known code | `error.conflict` | form | live |
| 413 | `error.too_large` | file | live |
| 429 | `error.rate_limited` | form | live |
| 500 | `error.storage` | form | live |
| 502, 504 | `error.unavailable` | form | live, both |
| any other status (403, 422…) | `error.rejected` | **form** | live (403) |
| not an `ApiError` (network) | `error.network` | form | live (request aborted at the stub) |

On every "form" row neither field was red. On every "file" row the note was not red and no box was shown. On every "note" row the drop zone was not red and no box was shown.

The orchestrator's brief mentions 16 error keys. I count 13 keys plus the note hint, or 18 paths, as in the table above. I could not reconcile the number 16. The table is the complete list.

### Done-when checks (Playwright, production build on :3102, Chrome)
For each of fr-light, fr-dark, ar-light and ar-dark, the results were the same:
- **Wrong-type file** through `setInputFiles` (0 network requests):
  - the zone has `.dropZoneError`, with border `--danger` and fill `--danger-bg`;
  - the input has `aria-invalid="true"`, and `aria-describedby` reads the hint and then the error;
  - the message has `role="alert"`, sits directly under the zone, and is followed by the formats hint;
  - the note is not red, and no box is shown.
- **Hovered errored zone:** the computed border and fill are still `--danger` and `--danger-bg`.
- **Synthetic `dragenter` on an errored zone:** jade border and `--jade-faint` fill. Dragging beats the error.
- **A valid file** clears the zone error and `aria-invalid`.
- **Stubbed `400 {"error":"Note must be 80 characters or fewer"}`:**
  - the note has `.noteInputError` and `aria-invalid="true"`;
  - the message is "80 caractères maximum." / "80 حرفاً كحد أقصى.", and it replaces the hint;
  - `aria-describedby` points at the message;
  - the zone is not red, no box is shown, and no text on the form contains "autre fichier".
- **Typing in the note** clears the error, restores the hint, and points `aria-describedby` back at the hint.
- **Stubbed 502:**
  - one box, "Le service est momentanément indisponible…" / "الخدمة غير متاحة مؤقتاً…", with `role="alert"`;
  - its next sibling is the submit button;
  - both fields are at their rest colours.
- **A new valid file** clears the box.
- **Long message that wraps:** see "Fix round: a long form error that wraps" below. The first round's Arabic shot did not wrap, so it proved nothing about clipping. The too-large file message at 390px is not clipped either.
- **Animation:**
  - normal motion: `fieldErrorIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)`, fill `none`;
  - with `reducedMotion: 'reduce'`: `0.1s linear`, fill `none`.
- **Accessible name:** the note's `aria-labelledby` resolves to "Motif (facultatif)" / "السبب (اختياري)".

### `--danger-ink` contrast (hard gate: passed)
The panel background was measured live: the first opaque ancestor of the message is `panel-module__…__panel`, computed `--surface`. Ratios are WCAG 2.x, sRGB:

| Theme | `--danger-ink` | Panel background | Ratio |
|---|---|---|---|
| light | #B3261E | #FFFFFF | **6.54:1** |
| dark | #FF9B8F | #1C2721 | **7.59:1** |

Both are above 4.5:1. The browser measurement matches the hand computation. For reference, the other surfaces the form touches also pass: light `--surface2` 6.01, `--bg` 5.95; dark `--surface2` 6.78, `--bg` 8.25. The token comments in both theme blocks now name this use and its ratio.

### Test data: what was real and what was stubbed
- **Upload: stubbed.** `context.route('**/api/backend/student/attendance/*/justification')` was registered before any page opened, and every request was fulfilled with the status and body each check needed. It was never continued. Across the runs it took 27 requests, all fulfilled locally. For the network case, the stub aborted the request instead, which still never reached the server.
- **GET attendance: stubbed from live**, as in milestone 1. `route.fetch()` returned the real response, and `canSubmitJustification: true` was set on the 4 `ABSENT` records with no justification. Everything else, including `band` and `absencesLeft`, is real.
- **Real:** the login, the session, the other endpoints, and every string on screen.
- Language and theme were set through Profile's own controls.
- The credentials were passed as environment variables at run time and are in no file.
- The scripts are in the session scratchpad, under `m2/`.
- Nothing on the account changed.

### Screenshots (`screenshots/m2/`)
For each of `fr-light`, `fr-dark`, `ar-light` and `ar-dark`:
- `-file-error`
- `-file-error-hover`: still reads as the error
- `-note-error`
- `-form-error`: the 502 box above the submit button

Long form error that wraps to 2 lines (fix round):
- `fr-light-form-error-long-390.png`, `fr-dark-form-error-long-390.png`: `deadline` at 390px.
- `ar-light-form-error-long-360.png`, `ar-dark-form-error-long-360.png`: `conflict` at 360px. The old `ar-*-form-error-long-390.png` files are deleted. They showed a single line, and their names claimed more than they showed.

### Fix round: a long form error that wraps
The reviewer found that `ar-*-form-error-long-390.png` used `error.deadline`, which fits on one line in Arabic, so wrapping was never tested.

**Survey at 390px.** Every form-level key was stubbed in turn (`rejected` through an unrecognised 400, then `not_found`, `deadline`, `not_absent`, `conflict`, `rate_limited`, `storage`, `unavailable`). Each `.formError` box was measured after its transition:
- **AR: none of the eight keys wraps at 390px.** Every box is 39px (`clientHeight` = 20px padding + one 18.75px line). That includes `conflict`, the longest Arabic string: "لم يعد بالإمكان إرسال مبرر لهذا الغياب. أغلق اللوحة وأعد فتح القائمة."
- FR: all eight keys wrap to 2 lines (58px) at 390px.

So no mapped Arabic form error can show a wrapping box at 390px. I did not edit copy or force a longer string. I measured `conflict` at 360px instead, which is the commonest Android phone width, and it wraps there. All other Arabic keys are still one line at 360px.

**Results.** Lines are counted two ways: distinct line boxes from `Range.getClientRects()`, and (clientHeight − padding) ÷ line-height. The two agree.

| Shot | Key | Width | clientHeight | scrollHeight | Lines | Clipped |
|---|---|---|---|---|---|---|
| ar-light | `conflict` (409, no code) | 360 | 58 | 58 | 2 | no |
| ar-dark | `conflict` (409, no code) | 360 | 58 | 58 | 2 | no |
| fr-light | `deadline` (409 DEADLINE_PASSED) | 390 | 58 | 58 | 2 | no |
| fr-dark | `deadline` (409 DEADLINE_PASSED) | 390 | 58 | 58 | 2 | no |

In every shot the box's next sibling is the submit button. `.formError` has no `overflow` or `max-height`, so its own height governs and the second line is fully shown. The screenshots confirm it.

**Stubs.** These were the same as the first round. The upload stub fulfilled every request locally and never continued any of them (30 requests across the survey and the shots). GET attendance was live, with `canSubmitJustification` flipped on. The credentials were environment variables only.

**Server.** I served on :3102 and stopped it afterwards. Before killing anything, I checked that the listener's command line was this worktree's `next start -p 3102` (PID 21648). Afterwards, `Get-NetTCPConnection -LocalPort 3102` showed no owning process, and `curl` was refused.

**Flag for Design.** Every Arabic form error fits on one line at 390px. The "long Arabic message" in the done-when list exists at 360px (only `conflict`) but not at 390px. Above that, it needs copy longer than what ships today. I did not measure the exact width where it starts to wrap.

### Checks
`npm run typecheck` (exit 0):
```
> unipocket-pwa@1.0.0 typecheck
> tsc --noEmit
```

`npm run build` (exit 0, final tree):
```
> unipocket-pwa@1.0.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 167ms

  Creating an optimized production build ...
✓ Compiled successfully in 2.1s
  Running TypeScript ...
  Finished TypeScript in 3.6s ...
  Collecting page data using 7 workers ...
✓ Generating static pages using 7 workers (12/12) in 688ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/refresh
├ ƒ /api/backend/[...path]
├ ƒ /attendance
├ ƒ /grades
├ ƒ /login
├ ƒ /news
├ ƒ /profile
└ ƒ /schedule

ƒ  (Dynamic)  server-rendered on demand
```

### Flagged
- **Flag 1 stands. Copy for Design.** The note error shows `attendance.panel.none.note_hint` ("80 caractères maximum." / "80 حرفاً كحد أقصى."). No new string was added. The reviewer should not treat that text as final. Open question: keep it, or supply `attendance.upload.error.note` in FR and AR?
- **New, copy for Design: `rejected` now has a mismatched sentence.** `rejected` is a form error by design (Flag 3), but its text still says "Réessayez avec un autre fichier" / "حاول بملف آخر". For an unrecognised 400 or an unmapped status, it tells the student to change the file without marking the file. The copy was not touched (no locale changes in scope). Design may want a neutral wording.
- **Error count.** The brief says 16 error keys. I count 13 keys plus the note hint, or 18 paths, all in the table above.
- **Server-side file errors keep the file selected.** A 400 type/size or a 413 marks the zone while it still shows the filename. That was already the behaviour: only `accept()` clears the file, and the mission keeps it that way. Resubmitting the same file will fail the same way. Possible follow-up: clear the file on a server file error.
- **Already flagged by milestone 1, still open:** the Arabic file size renders as "KB 1". It is visible in the `ar-*` screenshots and was not touched here.
- **My own mistake, no harm done.** While stopping the server, my first netstat parse picked PID 0 from a TIME_WAIT row, and `taskkill /T /F` was run against it. Windows refused every process ("access denied" / "critical system process"), and nothing was terminated. I then found the real listener with `Get-NetTCPConnection`: PID 23560, my own `next start` from `udj-wt-m2/pwa`. I stopped it and verified that no process owns 3102 and that the port refuses connections. Next time, filter on owning PID ≠ 0.

### Could not do
- Open the PR, because `gh` is not installed. The branch is pushed, and the text is below.
- A real OS drag-and-drop gesture. Dragging over an errored zone was checked with synthetic `dragenter`/`drop` events carrying a `DataTransfer`.

### PR (ready to paste)
Title: `fix(pwa): justification form field errors — file, note and form kept apart`

Body:
```
Does not touch backend/prisma/schema.prisma.

Milestone 2 of .claude/missions/2026-11-11-pwa-justification-form-arabic-tracking.

The upload form had one error state that held both file problems and request
failures, all shown in one box under the drop zone, and a refused note was
reported as "try another file". It now splits errors by what they are about:

- File (client type/too_large/empty/multiple, a 400 recognised as type or size,
  the 413): the drop zone itself is marked (--danger border, --danger-bg fill,
  aria-invalid on the input), with a --danger-ink message sliding down beneath
  it (login's errorCardIn max-height technique, no forwards fill).
- Note (a 400 matching /note/i, tested first; both backend sentences named in
  the comment): the note input is marked and the message replaces its hint.
  The note input is now labelled (aria-labelledby) and described
  (aria-describedby). The message text is the existing note hint, pending
  Design (mission flag 1).
- Form (everything else, including `rejected` and unmapped statuses): one box,
  moved to sit immediately above the submit button. Neither field is marked.

errorKey returns { field, key }; the table of every path is in PROGRESS.md.
Precedence on the zone: busy > dragging > error > hover > rest — hover does not
repaint an errored zone.

globals.css: comment only. --danger-ink now also carries the inline field
messages on the panel's --surface. Measured 6.54:1 light and 7.59:1 dark.

Checks (pwa/ has no CI job): `npm run typecheck` and `npm run build` pass.
Every path was exercised in Chrome against stubbed upload responses, in FR/AR ×
light/dark. Screenshots are in screenshots/m2/. The upload was always fulfilled
by the stub and never reached the server. GET attendance was stubbed from the
live response with canSubmitJustification flipped on.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
