# Progress

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
